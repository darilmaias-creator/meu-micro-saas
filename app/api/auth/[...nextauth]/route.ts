import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { captureServerException } from "@/lib/observability/server-monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteHandlerContext = {
  params: Promise<{
    nextauth: string[];
  }>;
};

async function handler(req: NextRequest, context: RouteHandlerContext) {
  const previousVercel = process.env.VERCEL;
  const previousTrustHost = process.env.AUTH_TRUST_HOST;
  const canonicalOrigin =
    process.env.NEXTAUTH_URL?.trim() || new URL(req.url).origin;

  try {
    // Force NextAuth to honor NEXTAUTH_URL as the canonical host.
    delete process.env.VERCEL;
    delete process.env.AUTH_TRUST_HOST;

    return await NextAuth(req, context, authOptions);
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : "unexpected-auth-route-error";

    captureServerException({
      scope: "auth:route-handler",
      error,
      context: {
        pathname: req.nextUrl.pathname,
      },
    });

    return Response.json(
      {
        url: `${canonicalOrigin}/?error=${encodeURIComponent(`RouteHandler:${errorMessage}`)}`,
      },
      { status: 500 },
    );
  } finally {
    if (previousVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = previousVercel;
    }

    if (previousTrustHost === undefined) {
      delete process.env.AUTH_TRUST_HOST;
    } else {
      process.env.AUTH_TRUST_HOST = previousTrustHost;
    }
  }
}

export { handler as GET, handler as POST };
