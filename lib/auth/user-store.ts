import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/supabase/server";
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

type AuthUserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  image: string | null;
  plan: string;
  free_name_changes_used: number | null;
  auth_providers: string[] | null;
  created_at: string;
  updated_at: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const usersFilePath = path.join(dataDirectory, "users.json");

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function logUserStoreWarning(context: string, error: unknown) {
  console.warn(`[user-store:${context}]`, error);
}

function isSupabaseUserStoreEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SECRET_KEY?.trim(),
  );
}

function mapAuthUserRow(row: AuthUserRow | null | undefined) {
  if (!row) {
    return null;
  }

  return normalizeStoredUser({
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash ?? undefined,
    image: row.image ?? null,
    plan: row.plan === "premium" ? "premium" : "free",
    freeNameChangesUsed: row.free_name_changes_used ?? 0,
    authProviders: Array.isArray(row.auth_providers) ? row.auth_providers : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function buildAuthUserRow(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password_hash: user.passwordHash ?? null,
    image: user.image ?? null,
    plan: user.plan,
    free_name_changes_used: user.freeNameChangesUsed,
    auth_providers: user.authProviders,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

async function ensureUsersFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(usersFilePath, "utf8");
  } catch {
    await writeFile(usersFilePath, "[]", "utf8");
  }
}

async function readUsersFromFile() {
  try {
    await ensureUsersFile();

    const fileContents = await readFile(usersFilePath, "utf8");
    const parsed = JSON.parse(fileContents);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((user) => normalizeStoredUser(user))
      .filter((user): user is StoredUser => user !== null);
  } catch (error) {
    logUserStoreWarning("read-file-users", error);
    return [];
  }
}

async function writeUsersToFile(users: StoredUser[]) {
  await ensureUsersFile();
  await writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8");
}

async function findSupabaseUserByEmail(email: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("auth_users")
    .select(
      "id, name, email, password_hash, image, plan, free_name_changes_used, auth_providers, created_at, updated_at",
    )
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapAuthUserRow(data as AuthUserRow | null);
}

async function findSupabaseUserById(userId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("auth_users")
    .select(
      "id, name, email, password_hash, image, plan, free_name_changes_used, auth_providers, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapAuthUserRow(data as AuthUserRow | null);
}

async function upsertSupabaseUser(user: StoredUser) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("auth_users").upsert(buildAuthUserRow(user), {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
}

async function migrateFileUserToSupabase(user: StoredUser) {
  await upsertSupabaseUser(user);
  return user;
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (isSupabaseUserStoreEnabled()) {
    const supabaseUser = await findSupabaseUserByEmail(normalizedEmail);

    if (supabaseUser) {
      return supabaseUser;
    }

    const fileUsers = await readUsersFromFile();
    const fileUser =
      fileUsers.find((user) => user.email === normalizedEmail) ?? null;

    if (fileUser) {
      return migrateFileUserToSupabase(fileUser);
    }

    return null;
  }

  const users = await readUsersFromFile();
  return users.find((user) => user.email === normalizedEmail) ?? null;
}

export async function findUserById(userId: string) {
  if (isSupabaseUserStoreEnabled()) {
    const supabaseUser = await findSupabaseUserById(userId);

    if (supabaseUser) {
      return supabaseUser;
    }

    const fileUsers = await readUsersFromFile();
    const fileUser = fileUsers.find((user) => user.id === userId) ?? null;

    if (fileUser) {
      return migrateFileUserToSupabase(fileUser);
    }

    return null;
  }

  const users = await readUsersFromFile();
  return users.find((user) => user.id === userId) ?? null;
}

export async function deleteUserById(userId: string) {
  if (isSupabaseUserStoreEnabled()) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("auth_users").delete().eq("id", userId);

    if (error) {
      throw error;
    }

    return;
  }

  const users = await readUsersFromFile();
  const nextUsers = users.filter((user) => user.id !== userId);

  if (nextUsers.length === users.length) {
    return;
  }

  await writeUsersToFile(nextUsers);
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
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
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

  if (isSupabaseUserStoreEnabled()) {
    await upsertSupabaseUser(newUser);
    return newUser;
  }

  const users = await readUsersFromFile();
  users.push(newUser);
  await writeUsersToFile(users);
  return newUser;
}

export async function upsertOAuthUser(input: {
  name?: string | null;
  email: string;
  image?: string | null;
  provider: AuthProvider;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const existingUser = await findUserByEmail(normalizedEmail);
  const now = new Date().toISOString();

  if (existingUser) {
    const updatedUser: StoredUser = {
      ...existingUser,
      authProviders: existingUser.authProviders.includes(input.provider)
        ? existingUser.authProviders
        : [...existingUser.authProviders, input.provider],
      name:
        !existingUser.name && input.name?.trim()
          ? input.name.trim()
          : existingUser.name,
      image: !existingUser.image && input.image ? input.image : existingUser.image,
      updatedAt: now,
    };

    if (isSupabaseUserStoreEnabled()) {
      await upsertSupabaseUser(updatedUser);
      return updatedUser;
    }

    const users = await readUsersFromFile();
    const nextUsers = users.map((user) =>
      user.id === updatedUser.id ? updatedUser : user,
    );
    await writeUsersToFile(nextUsers);
    return updatedUser;
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

  if (isSupabaseUserStoreEnabled()) {
    await upsertSupabaseUser(newUser);
    return newUser;
  }

  const users = await readUsersFromFile();
  users.push(newUser);
  await writeUsersToFile(users);
  return newUser;
}

export async function updateUserProfile(input: {
  userId: string;
  name?: string;
  image?: string | null;
}) {
  const user = await findUserById(input.userId);

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

  const updatedUser: StoredUser = {
    ...user,
    name: isNameChanging && nextName ? nextName : user.name,
    image: isImageChanging ? nextImage : user.image,
    freeNameChangesUsed:
      isNameChanging && !isPremium
        ? user.freeNameChangesUsed + 1
        : user.freeNameChangesUsed,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseUserStoreEnabled()) {
    await upsertSupabaseUser(updatedUser);
  } else {
    const users = await readUsersFromFile();
    const nextUsers = users.map((currentUser) =>
      currentUser.id === updatedUser.id ? updatedUser : currentUser,
    );
    await writeUsersToFile(nextUsers);
  }

  return {
    ok: true as const,
    user: updatedUser,
    changed: true,
  };
}

function normalizeStoredUser(rawUser: unknown): StoredUser | null {
  if (!rawUser || typeof rawUser !== "object") {
    return null;
  }

  const candidate = rawUser as Partial<StoredUser>;
  const email =
    typeof candidate.email === "string" ? normalizeEmail(candidate.email) : "";
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
