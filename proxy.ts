import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_REQUIRED_QUERY_KEY = "auth";
const AUTH_REQUIRED_QUERY_VALUE = "required";
const NEXT_PATH_QUERY_KEY = "next";

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

export async function proxy(request: NextRequest) {
  if (shouldRedirectToHttps(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = "https:";

    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/", request.url);
  loginUrl.searchParams.set(AUTH_REQUIRED_QUERY_KEY, AUTH_REQUIRED_QUERY_VALUE);
  loginUrl.searchParams.set(
    NEXT_PATH_QUERY_KEY,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring).*)",
  ],
};
