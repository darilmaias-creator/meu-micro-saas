import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  PREMIUM_FOUNDER_LIMIT,
  type PremiumOfferTier,
} from "@/lib/billing/plans";
import { isPremiumActiveSubscriptionStatus } from "@/lib/billing/subscription-status";
import {
  createStripeServerClient,
  getStripePriceIdForTier,
  isStripeBillingConfigured,
} from "@/lib/billing/stripe";
import { authOptions } from "@/lib/auth/options";
import {
  countFounderOfferUsers,
  findUserById,
  updateUserBillingState,
} from "@/lib/auth/user-store";
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";
import { consumeApiRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMBEDDED_CHECKOUT_UI_MODE = "embedded_page" as const;

function getBaseUrl(request: Request) {
  return request.headers.get("origin")?.trim() || new URL(request.url).origin;
}

function normalizePromotionCodeInput(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 64);
}

async function resolvePromotionCodeIdByCode(
  stripe: ReturnType<typeof createStripeServerClient>,
  promotionCode: string,
) {
  const codeCandidates = Array.from(
    new Set([promotionCode, promotionCode.toUpperCase(), promotionCode.toLowerCase()]),
  );

  for (const codeCandidate of codeCandidates) {
    const list = await stripe.promotionCodes.list({
      code: codeCandidate,
      active: true,
      limit: 1,
    });

    const [firstPromotionCode] = list.data;

    if (firstPromotionCode) {
      return firstPromotionCode.id;
    }
  }
  return null;
}

async function resolveStripeCustomerForCheckout(input: {
  stripeCustomerId?: string | null;
}) {
  const stripe = createStripeServerClient();

  if (!input.stripeCustomerId) {
    return null;
  }

  try {
    const customer = await stripe.customers.retrieve(input.stripeCustomerId);

    if ("deleted" in customer && customer.deleted) {
      return null;
    }

    return customer.id;
  } catch (error) {
    const stripeError =
      error && typeof error === "object" && "code" in error
        ? (error as { code?: string }).code
        : undefined;

    if (stripeError === "resource_missing") {
      return null;
    }

    throw error;
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Você precisa estar logado para assinar o Premium." },
      { status: 401 },
    );
  }

  const rateLimit = await consumeApiRateLimit({
    action: "billing_checkout",
    headers: request.headers,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { message: rateLimit.message },
      {
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
        status: 429,
      },
    );
  }

  if (!isStripeBillingConfigured()) {
    return NextResponse.json(
      {
        message:
          "O pagamento do Premium ainda não está configurado no servidor.",
      },
      { status: 503 },
    );
  }

  try {
    const requestPayload = (await request.json().catch(() => null)) as
      | { promotionCode?: unknown }
      | null;
    const promotionCodeInput = normalizePromotionCodeInput(
      requestPayload?.promotionCode,
    );
    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "Não foi possível localizar a conta logada." },
        { status: 404 },
      );
    }

    if (
      user.plan === "premium" &&
      user.stripeSubscriptionId &&
      isPremiumActiveSubscriptionStatus(user.stripeSubscriptionStatus)
    ) {
      return NextResponse.json(
        {
          message:
            "Sua conta ja esta com o Premium ativo. Use o gerenciamento da assinatura.",
        },
        { status: 400 },
      );
    }

    const founderCount = await countFounderOfferUsers();
    const founderOfferStillEligible =
      !user.founderOfferRevokedAt &&
      (user.founderOfferApplied || founderCount < PREMIUM_FOUNDER_LIMIT);
    const offerTier: PremiumOfferTier =
      founderOfferStillEligible ? "founder" : "standard";

    const stripe = createStripeServerClient();
    let stripeCustomerId = await resolveStripeCustomerForCheckout({
      stripeCustomerId: user.stripeCustomerId,
    });

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          appUserId: user.id,
        },
      });

      stripeCustomerId = customer.id;
      await updateUserBillingState({
        userId: user.id,
        stripeCustomerId,
      });
    }

    const founderOfferApplied =
      user.founderOfferApplied || offerTier === "founder";
    const baseUrl = getBaseUrl(request);
    const checkoutSessionInput: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      // The Stripe account/API version used in this project expects
      // `embedded_page` for the in-app Checkout flow.
      ui_mode: EMBEDDED_CHECKOUT_UI_MODE,
      customer: stripeCustomerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: getStripePriceIdForTier(offerTier),
          quantity: 1,
        },
      ],
      // Always return to the app success page so the client can confirm
      // the subscription with the Checkout Session id.
      redirect_on_completion: "always",
      return_url: `${baseUrl}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        appUserId: user.id,
        offerTier,
        founderOfferApplied: String(founderOfferApplied),
      },
      subscription_data: {
        metadata: {
          appUserId: user.id,
          offerTier,
          founderOfferApplied: String(founderOfferApplied),
        },
      },
    };

    if (promotionCodeInput) {
      const promotionCodeId = await resolvePromotionCodeIdByCode(
        stripe,
        promotionCodeInput,
      );

      if (!promotionCodeId) {
        return NextResponse.json(
          { message: "Esse cupom não existe ou não está ativo." },
          { status: 400 },
        );
      }

      checkoutSessionInput.discounts = [{ promotion_code: promotionCodeId }];
      checkoutSessionInput.metadata = {
        ...checkoutSessionInput.metadata,
        promotionCodeInput,
      };
      checkoutSessionInput.subscription_data = {
        ...checkoutSessionInput.subscription_data,
        metadata: {
          ...checkoutSessionInput.subscription_data?.metadata,
          promotionCodeInput,
        },
      };
    } else {
      checkoutSessionInput.allow_promotion_codes = true;
    }

    const checkoutSession = await stripe.checkout.sessions.create(
      checkoutSessionInput,
    );

    if (!checkoutSession.client_secret) {
      throw new Error("A Stripe não retornou o client secret do checkout.");
    }

    logServerEvent({
      scope: "billing:checkout",
      message: "checkout session created",
      context: {
        userId: user.id,
        offerTier,
        promotionCodeInput,
        checkoutSessionId: checkoutSession.id,
        stripeCustomerId,
      },
    });

    return NextResponse.json({
      clientSecret: checkoutSession.client_secret,
      checkoutSessionId: checkoutSession.id,
      offerTier,
    });
  } catch (error) {
    captureServerException({
      scope: "billing:checkout",
      error,
      context: {
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      { message: "Não foi possível iniciar a assinatura agora." },
      { status: 500 },
    );
  }
}
