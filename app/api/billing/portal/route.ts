import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  createStripeServerClient,
  isStripeBillingConfigured,
} from "@/lib/billing/stripe";
import { authOptions } from "@/lib/auth/options";
import { findUserById } from "@/lib/auth/user-store";

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
      { message: "Voce precisa estar logado para gerenciar a assinatura." },
      { status: 401 },
    );
  }

  if (!isStripeBillingConfigured()) {
    return NextResponse.json(
      {
        message:
          "O gerenciamento da assinatura ainda nao esta configurado no servidor.",
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

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        {
          message:
            "Essa conta ainda nao tem uma assinatura gerenciada pela Stripe.",
        },
        { status: 400 },
      );
    }

    const stripe = createStripeServerClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getBaseUrl(request)}/`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("[billing:portal]", error);

    return NextResponse.json(
      { message: "Nao foi possivel abrir o gerenciamento da assinatura." },
      { status: 500 },
    );
  }
}

