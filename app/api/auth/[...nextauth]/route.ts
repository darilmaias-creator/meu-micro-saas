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

function getRequestOrigin(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host") ?? req.nextUrl.host;
  const protocol =
    forwardedProto ?? req.nextUrl.protocol.replace(/:$/, "") ?? "http";

  return `${protocol}://${host}`;
}

async function handler(req: NextRequest, context: RouteHandlerContext) {
  const previousNextAuthUrl = process.env.NEXTAUTH_URL;
  const canonicalOrigin = getRequestOrigin(req);

  try {
    process.env.NEXTAUTH_URL = canonicalOrigin;

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
    if (previousNextAuthUrl === undefined) {
      delete process.env.NEXTAUTH_URL;
    } else {
      process.env.NEXTAUTH_URL = previousNextAuthUrl;
    }
  }
}

export { handler as GET, handler as POST };
