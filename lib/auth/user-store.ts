import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getRemainingFreeNameChanges,
  isPremiumPlan,
  type UserPlan,
} from "@/lib/auth/profile-rules";

export type AuthProvider = "credentials" | "google";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  image?: string | null;
  plan: UserPlan;
  freeNameChangesUsed: number;
  authProviders: AuthProvider[];
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  plan: UserPlan;
  isPremium: boolean;
  canChangeName: boolean;
  canChangePhoto: boolean;
  freeNameChangesUsed: number;
  freeNameChangesRemaining: number;
};

const dataDirectory = path.join(process.cwd(), "data");
const usersFilePath = path.join(dataDirectory, "users.json");

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensureUsersFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(usersFilePath, "utf8");
  } catch {
    await writeFile(usersFilePath, "[]", "utf8");
  }
}

async function readUsers() {
  await ensureUsersFile();

  try {
    const fileContents = await readFile(usersFilePath, "utf8");
    const parsed = JSON.parse(fileContents);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((user) => normalizeStoredUser(user))
      .filter((user): user is StoredUser => user !== null);
  } catch {
    return [];
  }
}

async function writeUsers(users: StoredUser[]) {
  await ensureUsersFile();
  await writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8");
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = await readUsers();

  return users.find((user) => user.email === normalizedEmail) ?? null;
}

export async function findUserById(userId: string) {
  const users = await readUsers();

  return users.find((user) => user.id === userId) ?? null;
}

export function getSessionUserFromStoredUser(user: StoredUser): SessionUser {
  const isPremium = isPremiumPlan(user.plan);
  const freeNameChangesRemaining = getRemainingFreeNameChanges(
    user.freeNameChangesUsed,
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    plan: user.plan,
    isPremium,
    canChangeName: isPremium || freeNameChangesRemaining > 0,
    canChangePhoto: isPremium,
    freeNameChangesUsed: user.freeNameChangesUsed,
    freeNameChangesRemaining,
  };
}

export async function createCredentialsUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const users = await readUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    return null;
  }

  const now = new Date().toISOString();
  const newUser: StoredUser = {
    id: randomUUID(),
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    image: null,
    plan: "free",
    freeNameChangesUsed: 0,
    authProviders: ["credentials"],
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  await writeUsers(users);

  return newUser;
}

export async function upsertOAuthUser(input: {
  name?: string | null;
  email: string;
  image?: string | null;
  provider: AuthProvider;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const users = await readUsers();
  const existingUser = users.find((user) => user.email === normalizedEmail);
  const now = new Date().toISOString();

  if (existingUser) {
    if (!existingUser.authProviders.includes(input.provider)) {
      existingUser.authProviders.push(input.provider);
    }

    if (!existingUser.name && input.name?.trim()) {
      existingUser.name = input.name.trim();
    }

    if (!existingUser.image && input.image) {
      existingUser.image = input.image;
    }

    existingUser.updatedAt = now;

    await writeUsers(users);
    return existingUser;
  }

  const newUser: StoredUser = {
    id: randomUUID(),
    name: input.name?.trim() || normalizedEmail.split("@")[0] || "Usuario",
    email: normalizedEmail,
    image: input.image ?? null,
    plan: "free",
    freeNameChangesUsed: 0,
    authProviders: [input.provider],
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  await writeUsers(users);

  return newUser;
}

export async function updateUserProfile(input: {
  userId: string;
  name?: string;
  image?: string | null;
}) {
  const users = await readUsers();
  const user = users.find((currentUser) => currentUser.id === input.userId);

  if (!user) {
    return {
      ok: false as const,
      code: "USER_NOT_FOUND" as const,
    };
  }

  const nextName = input.name?.trim();
  const nextImage =
    input.image === undefined ? undefined : input.image?.trim() || null;

  if (nextName !== undefined && nextName.length < 2) {
    return {
      ok: false as const,
      code: "INVALID_NAME" as const,
    };
  }

  const isPremium = isPremiumPlan(user.plan);
  const isNameChanging =
    nextName !== undefined && nextName.length > 0 && nextName !== user.name;
  const isImageChanging = nextImage !== undefined && nextImage !== user.image;

  if (isNameChanging && !isPremium && user.freeNameChangesUsed >= 1) {
    return {
      ok: false as const,
      code: "FREE_NAME_CHANGE_LIMIT" as const,
    };
  }

  if (isImageChanging && !isPremium) {
    return {
      ok: false as const,
      code: "PREMIUM_PHOTO_REQUIRED" as const,
    };
  }

  if (!isNameChanging && !isImageChanging) {
    return {
      ok: true as const,
      user,
      changed: false,
    };
  }

  if (isNameChanging && nextName) {
    user.name = nextName;

    if (!isPremium) {
      user.freeNameChangesUsed += 1;
    }
  }

  if (isImageChanging) {
    user.image = nextImage;
  }

  user.updatedAt = new Date().toISOString();
  await writeUsers(users);

  return {
    ok: true as const,
    user,
    changed: true,
  };
}

function normalizeStoredUser(rawUser: unknown): StoredUser | null {
  if (!rawUser || typeof rawUser !== "object") {
    return null;
  }

  const candidate = rawUser as Partial<StoredUser>;
  const email = typeof candidate.email === "string" ? normalizeEmail(candidate.email) : "";
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";

  if (!email || !name) {
    return null;
  }

  const plan = candidate.plan === "premium" ? "premium" : "free";
  const createdAt =
    typeof candidate.createdAt === "string"
      ? candidate.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof candidate.updatedAt === "string" ? candidate.updatedAt : createdAt;

  return {
    id:
      typeof candidate.id === "string" && candidate.id
        ? candidate.id
        : randomUUID(),
    name,
    email,
    passwordHash:
      typeof candidate.passwordHash === "string"
        ? candidate.passwordHash
        : undefined,
    image:
      typeof candidate.image === "string" && candidate.image.trim()
        ? candidate.image
        : null,
    plan,
    freeNameChangesUsed:
      typeof candidate.freeNameChangesUsed === "number"
        ? candidate.freeNameChangesUsed
        : 0,
    authProviders: Array.isArray(candidate.authProviders)
      ? candidate.authProviders.filter(
          (provider): provider is AuthProvider =>
            provider === "credentials" || provider === "google",
        )
      : [],
    createdAt,
    updatedAt,
  };
}
