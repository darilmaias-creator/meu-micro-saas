import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  createStripeServerClient,
  isStripeBillingConfigured,
} from "@/lib/billing/stripe";
import { isPremiumActiveSubscriptionStatus } from "@/lib/billing/subscription-status";
import { authOptions } from "@/lib/auth/options";
import { findUserById } from "@/lib/auth/user-store";
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";

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
      { message: "Você precisa estar logado para gerenciar a assinatura." },
      { status: 401 },
    );
  }

  if (!isStripeBillingConfigured()) {
    return NextResponse.json(
      {
        message:
          "O gerenciamento da assinatura ainda não está configurado no servidor.",
      },
      { status: 503 },
    );
  }

  try {
    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "Não foi possível localizar a conta logada." },
        { status: 404 },
      );
    }

    if (
      !user.stripeCustomerId ||
      !user.stripeSubscriptionId ||
      !isPremiumActiveSubscriptionStatus(user.stripeSubscriptionStatus)
    ) {
      return NextResponse.json(
        {
          message:
            "Essa conta ainda não tem uma assinatura ativa para gerenciar.",
        },
        { status: 400 },
      );
    }

    const stripe = createStripeServerClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getBaseUrl(request)}/`,
    });

    logServerEvent({
      scope: "billing:portal",
      message: "billing portal opened",
      context: {
        userId: user.id,
        stripeCustomerId: user.stripeCustomerId,
      },
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    captureServerException({
      scope: "billing:portal",
      error,
      context: {
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      { message: "Não foi possível abrir o gerenciamento da assinatura." },
      { status: 500 },
    );
  }
}
