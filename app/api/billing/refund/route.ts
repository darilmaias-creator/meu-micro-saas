import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { authOptions } from "@/lib/auth/options";
import {
  findUserById,
  updateUserBillingState,
} from "@/lib/auth/user-store";
import {
  canRequestPremiumRefund,
  PREMIUM_FULL_REFUND_WINDOW_DAYS,
} from "@/lib/billing/refund-policy";
import { syncSubscriptionState } from "@/lib/billing/subscription-sync";
import {
  createStripeServerClient,
  isStripeBillingConfigured,
} from "@/lib/billing/stripe";
import { isPremiumActiveSubscriptionStatus } from "@/lib/billing/subscription-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RefundRequestPayload = {
  confirmFounderForfeit?: boolean;
};

type RefundablePaymentTarget =
  | {
      kind: "payment_intent";
      id: string;
      paidAt: number | null;
    }
  | {
      kind: "charge";
      id: string;
      paidAt: number | null;
    };

function getStripeObjectId<T extends { id: string }>(
  value: string | T | null | undefined,
) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function toIsoStringFromUnixTimestamp(value: number | null | undefined) {
  if (typeof value !== "number") {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

async function findLatestRefundablePaymentTarget(
  stripe: Stripe,
  subscription: Stripe.Subscription,
) {
  const invoiceId = getStripeObjectId(subscription.latest_invoice);

  if (!invoiceId) {
    return null;
  }

  const invoicePayments = await stripe.invoicePayments.list({
    invoice: invoiceId,
    status: "paid",
    limit: 20,
  });

  const paymentTargets = invoicePayments.data
    .map<RefundablePaymentTarget | null>((payment) => {
      const paidAt = payment.status_transitions.paid_at ?? payment.created;

      if (
        payment.payment.type === "payment_intent" &&
        payment.payment.payment_intent
      ) {
        return {
          kind: "payment_intent",
          id: getStripeObjectId(payment.payment.payment_intent)!,
          paidAt,
        };
      }

      if (payment.payment.type === "charge" && payment.payment.charge) {
        return {
          kind: "charge",
          id: getStripeObjectId(payment.payment.charge)!,
          paidAt,
        };
      }

      return null;
    })
    .filter(
      (paymentTarget): paymentTarget is RefundablePaymentTarget =>
        paymentTarget !== null,
    )
    .sort((left, right) => (right.paidAt ?? 0) - (left.paidAt ?? 0));

  return paymentTargets[0] ?? null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para solicitar o reembolso." },
      { status: 401 },
    );
  }

  if (!isStripeBillingConfigured()) {
    return NextResponse.json(
      {
        message:
          "O reembolso do Premium ainda nao esta configurado no servidor.",
      },
      { status: 503 },
    );
  }

  let body: RefundRequestPayload;

  try {
    body = (await request.json()) as RefundRequestPayload;
  } catch {
    body = {};
  }

  try {
    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar a conta logada." },
        { status: 404 },
      );
    }

    if (
      !user.plan ||
      user.plan !== "premium" ||
      !user.stripeSubscriptionId ||
      !isPremiumActiveSubscriptionStatus(user.stripeSubscriptionStatus)
    ) {
      return NextResponse.json(
        {
          message:
            "Essa conta nao tem uma assinatura Premium ativa para reembolso.",
        },
        { status: 400 },
      );
    }

    const founderOfferWouldBeLost = Boolean(
      user.founderOfferApplied && !user.founderOfferRevokedAt,
    );

    if (founderOfferWouldBeLost && body.confirmFounderForfeit !== true) {
      return NextResponse.json(
        {
          code: "FOUNDER_REFUND_CONFIRMATION_REQUIRED",
          message:
            "Sua conta esta com o valor especial de lancamento. Se seguir com o reembolso, esse beneficio nao podera ser recuperado em futuras assinaturas.",
        },
        { status: 409 },
      );
    }

    const stripe = createStripeServerClient();
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
      {
        expand: ["latest_invoice"],
      },
    );
    const refundablePaymentTarget = await findLatestRefundablePaymentTarget(
      stripe,
      subscription,
    );

    if (!refundablePaymentTarget) {
      return NextResponse.json(
        {
          message:
            "Ainda nao encontramos um pagamento aprovado para reembolso nessa assinatura. Se voce pagou por boleto, aguarde a confirmacao total e tente novamente.",
        },
        { status: 400 },
      );
    }

    const effectivePremiumActivatedAt =
      user.premiumActivatedAt ??
      toIsoStringFromUnixTimestamp(refundablePaymentTarget.paidAt) ??
      toIsoStringFromUnixTimestamp(subscription.start_date);

    if (!canRequestPremiumRefund(effectivePremiumActivatedAt)) {
      return NextResponse.json(
        {
          message: `O reembolso integral fica disponivel somente nos primeiros ${PREMIUM_FULL_REFUND_WINDOW_DAYS} dias apos a liberacao do Premium.`,
        },
        { status: 400 },
      );
    }

    const refund = await stripe.refunds.create({
      ...(refundablePaymentTarget.kind === "payment_intent"
        ? { payment_intent: refundablePaymentTarget.id }
        : { charge: refundablePaymentTarget.id }),
      reason: "requested_by_customer",
      metadata: {
        appUserId: user.id,
        stripeSubscriptionId: subscription.id,
        founderOfferWouldBeLost: String(founderOfferWouldBeLost),
        refundPolicy: "premium_7_day_full_refund",
      },
    });

    let canceledSubscription: Stripe.Subscription;

    try {
      canceledSubscription = await stripe.subscriptions.cancel(subscription.id);
    } catch (error) {
      console.error("[billing:refund:cancel-after-refund]", error);

      return NextResponse.json(
        {
          message:
            "O reembolso foi iniciado, mas o cancelamento automatico da assinatura precisou de revisao manual. Tente novamente em instantes.",
        },
        { status: 500 },
      );
    }

    await syncSubscriptionState(canceledSubscription, {
      fallbackUserId: user.id,
      founderOfferApplied: user.founderOfferApplied,
    });

    await updateUserBillingState({
      userId: user.id,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      premiumActivatedAt: null,
      founderOfferRevokedAt: founderOfferWouldBeLost
        ? new Date().toISOString()
        : user.founderOfferRevokedAt ?? null,
    });

    return NextResponse.json({
      refunded: true,
      refundId: refund.id,
      message: founderOfferWouldBeLost
        ? "Reembolso integral solicitado com sucesso. O Premium foi encerrado e o valor especial de lancamento foi encerrado na sua conta."
        : "Reembolso integral solicitado com sucesso. O Premium foi encerrado na sua conta.",
    });
  } catch (error) {
    console.error("[billing:refund]", error);

    return NextResponse.json(
      { message: "Nao foi possivel solicitar o reembolso agora." },
      { status: 500 },
    );
  }
}
