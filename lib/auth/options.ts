import "server-only";

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { verifyPassword } from "@/lib/auth/password";
import {
  findUserByEmail,
  findUserById,
  getSessionUserFromStoredUser,
  upsertOAuthUser,
} from "@/lib/auth/user-store";

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email e senha",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "seu@email.com" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim();
      const password = credentials?.password;

      if (!email || !password) {
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

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? undefined,
      };
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
  },
  pages: {
    signIn: "/",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
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
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (user?.email) {
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      const storedUser = token.sub
        ? await findUserById(token.sub)
        : token.email
          ? await findUserByEmail(token.email)
          : null;

      if (!storedUser) {
        return session;
      }

      const sessionUser = getSessionUserFromStoredUser(storedUser);

      session.user = {
        ...session.user,
        ...sessionUser,
      };

      return session;
    },
  },
};
