import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_REQUIRED_QUERY_KEY = "auth";
const AUTH_REQUIRED_QUERY_VALUE = "required";
const NEXT_PATH_QUERY_KEY = "next";
const SLOW_REQUEST_THRESHOLD_MS = 3000;

const protectedExactPaths = new Set([
  "/dashboard",
  "/vendas",
  "/estoque",
  "/ficha-tecnica",
  "/meu-negocio",
]);

function isProtectedPath(pathname: string) {
  return (
    protectedExactPaths.has(pathname) ||
    pathname === "/assinatura" ||
    pathname.startsWith("/assinatura/")
  );
}

function shouldRedirectToHttps(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  return forwardedProto !== "https" && request.nextUrl.protocol !== "https:";
}

function withResponseTimeHeader(input: {
  request: NextRequest;
  response: NextResponse;
  start: number;
}) {
  const duration = Date.now() - input.start;

  input.response.headers.set("X-Response-Time", `${duration}ms`);

  if (duration > SLOW_REQUEST_THRESHOLD_MS) {
    console.warn(
      `[performance:slow-proxy-request] ${input.request.nextUrl.pathname} (${duration}ms)`,
    );
  }

  return input.response;
}

export async function proxy(request: NextRequest) {
  const start = Date.now();

  if (shouldRedirectToHttps(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = "https:";

    return withResponseTimeHeader({
      request,
      response: NextResponse.redirect(redirectUrl, { status: 301 }),
      start,
    });
  }

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return withResponseTimeHeader({
      request,
      response: NextResponse.next(),
      start,
    });
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token) {
    return withResponseTimeHeader({
      request,
      response: NextResponse.next(),
      start,
    });
  }

  const loginUrl = new URL("/", request.url);
  loginUrl.searchParams.set(AUTH_REQUIRED_QUERY_KEY, AUTH_REQUIRED_QUERY_VALUE);
  loginUrl.searchParams.set(
    NEXT_PATH_QUERY_KEY,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return withResponseTimeHeader({
    request,
    response: NextResponse.redirect(loginUrl),
    start,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring).*)",
  ],
};
