import "server-only";

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

import {
  normalizeEmailInput,
  validateEmailAddress,
  validatePasswordForLogin,
} from "@/lib/auth/input-validation";
import { verifyPassword } from "@/lib/auth/password";
import { clearAuthRateLimit, consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import {
  findUserByEmail,
  findUserById,
  getSessionUserFromStoredUser,
  upsertOAuthUser,
} from "@/lib/auth/user-store";

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
const useSecureCookies =
  process.env.NODE_ENV === "production" ||
  Boolean(nextAuthUrl?.startsWith("https://"));

function logAuthError(context: string, error: unknown) {
  console.error(`[auth:${context}]`, error);
}

function buildMinimalJwt(token: JWT, user?: { id?: string; email?: string | null }) {
  return {
    sub: user?.id ?? token.sub,
    email:
      typeof user?.email === "string"
        ? user.email
        : typeof token.email === "string"
          ? token.email
          : undefined,
    iat: token.iat,
    exp: token.exp,
    jti: token.jti,
  };
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email e senha",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "seu@email.com" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials, req) {
      try {
        const email = normalizeEmailInput(credentials?.email);
        const password = credentials?.password ?? "";

        if (validateEmailAddress(email) || validatePasswordForLogin(password)) {
          return null;
        }

        const rateLimitResult = await consumeAuthRateLimit({
          action: "login",
          email,
          headers: req.headers,
        });

        if (!rateLimitResult.ok) {
          logAuthError("credentials-rate-limit", {
            email,
            retryAfterSeconds: rateLimitResult.retryAfterSeconds,
          });
          return null;
        }

        const user = await findUserByEmail(email);

        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await verifyPassword(password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        await clearAuthRateLimit({
          action: "login",
          email,
          headers: req.headers,
        });

        return {
          id: user.id,
          email: user.email,
        };
      } catch (error) {
        logAuthError("credentials-authorize", error);
        return null;
      }
    },
  }),
];

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 12,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 14,
  },
  useSecureCookies,
  pages: {
    signIn: "/",
    error: "/",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google" && user.email) {
          const storedUser = await upsertOAuthUser({
            email: user.email,
            name: user.name,
            image: user.image,
            provider: "google",
          });

          user.id = storedUser.id;
        }

        return true;
      } catch (error) {
        logAuthError("sign-in", error);
        return "/?error=Storage";
      }
    },
    async jwt({ token, user }) {
      return buildMinimalJwt(token, user);
    },
    async session({ session, token }) {
      try {
        if (!session.user) {
          return session;
        }

        const storedUser = token.sub
          ? await findUserById(token.sub)
          : token.email
            ? await findUserByEmail(token.email)
            : null;

        if (!storedUser) {
          if (token.sub) {
            session.user.id = token.sub;
          }

          return session;
        }

        const sessionUser = getSessionUserFromStoredUser(storedUser);

        session.user = {
          ...session.user,
          ...sessionUser,
        };

        return session;
      } catch (error) {
        logAuthError("session", error);

        if (session.user && token.sub) {
          session.user.id = token.sub;
        }

        return session;
      }
    },
  },
};
