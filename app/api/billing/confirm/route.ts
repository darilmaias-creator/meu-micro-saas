import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { authOptions } from "@/lib/auth/options";
import { createStripeServerClient } from "@/lib/billing/stripe";
import { syncSubscriptionState } from "@/lib/billing/subscription-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ConfirmCheckoutPayload = {
  sessionId?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para confirmar a assinatura." },
      { status: 401 },
    );
  }

  let body: ConfirmCheckoutPayload;

  try {
    body = (await request.json()) as ConfirmCheckoutPayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler os dados da confirmacao de compra." },
      { status: 400 },
    );
  }

  const sessionId = body.sessionId?.trim();

  if (!sessionId) {
    return NextResponse.json(
      { message: "O identificador da sessao de checkout nao foi informado." },
      { status: 400 },
    );
  }

  try {
    const stripe = createStripeServerClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const relatedUserId =
      checkoutSession.metadata?.appUserId ??
      checkoutSession.client_reference_id ??
      null;

    if (relatedUserId && relatedUserId !== session.user.id) {
      return NextResponse.json(
        { message: "Essa sessao de checkout nao pertence a conta logada." },
        { status: 403 },
      );
    }

    if (checkoutSession.mode !== "subscription") {
      return NextResponse.json(
        { message: "Essa sessao de checkout nao e de assinatura." },
        { status: 400 },
      );
    }

    if (checkoutSession.status !== "complete") {
      return NextResponse.json({
        confirmed: false,
        message: "A assinatura ainda esta sendo confirmada pela Stripe.",
      });
    }

    let subscription: Stripe.Subscription | null = null;

    if (typeof checkoutSession.subscription === "string") {
      subscription = await stripe.subscriptions.retrieve(
        checkoutSession.subscription,
      );
    } else if (checkoutSession.subscription) {
      subscription = checkoutSession.subscription as Stripe.Subscription;
    }

    if (!subscription) {
      return NextResponse.json({
        confirmed: false,
        message: "A assinatura ainda nao ficou disponivel para sincronizacao.",
      });
    }

    const result = await syncSubscriptionState(subscription, {
      fallbackUserId: relatedUserId ?? session.user.id,
      founderOfferApplied:
        checkoutSession.metadata?.founderOfferApplied === "true",
    });

    return NextResponse.json({
      confirmed: result.confirmed,
      status: result.status,
    });
  } catch (error) {
    console.error("[billing:confirm]", error);

    return NextResponse.json(
      { message: "Nao foi possivel confirmar a assinatura agora." },
      { status: 500 },
    );
  }
}
