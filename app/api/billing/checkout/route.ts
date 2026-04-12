import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  PREMIUM_FOUNDER_LIMIT,
  type PremiumOfferTier,
} from "@/lib/billing/plans";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBaseUrl(request: Request) {
  return request.headers.get("origin")?.trim() || new URL(request.url).origin;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para assinar o Premium." },
      { status: 401 },
    );
  }

  if (!isStripeBillingConfigured()) {
    return NextResponse.json(
      {
        message:
          "O pagamento do Premium ainda nao esta configurado no servidor.",
      },
      { status: 503 },
    );
  }

  try {
    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar a conta logada." },
        { status: 404 },
      );
    }

    if (user.plan === "premium" && user.stripeCustomerId) {
      return NextResponse.json(
        {
          message:
            "Sua conta ja esta com o Premium ativo. Use o gerenciamento da assinatura.",
        },
        { status: 400 },
      );
    }

    const founderCount = await countFounderOfferUsers();
    const offerTier: PremiumOfferTier =
      user.founderOfferApplied || founderCount < PREMIUM_FOUNDER_LIMIT
        ? "founder"
        : "standard";

    const stripe = createStripeServerClient();
    let stripeCustomerId = user.stripeCustomerId ?? null;

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
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: getStripePriceIdForTier(offerTier),
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/assinatura/sucesso`,
      cancel_url: `${baseUrl}/assinatura/cancelado`,
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
    });

    if (!checkoutSession.url) {
      throw new Error("A Stripe nao retornou a URL do checkout.");
    }

    return NextResponse.json({
      url: checkoutSession.url,
      offerTier,
    });
  } catch (error) {
    console.error("[billing:checkout]", error);

    return NextResponse.json(
      { message: "Nao foi possivel iniciar a assinatura agora." },
      { status: 500 },
    );
  }
}

