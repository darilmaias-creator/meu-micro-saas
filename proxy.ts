import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_REQUIRED_QUERY_KEY = "auth";
const AUTH_REQUIRED_QUERY_VALUE = "required";
const NEXT_PATH_QUERY_KEY = "next";

export async function proxy(request: NextRequest) {
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
    "/assinatura/:path*",
    "/dashboard",
    "/vendas",
    "/estoque",
    "/ficha-tecnica",
    "/meu-negocio",
  ],
};
