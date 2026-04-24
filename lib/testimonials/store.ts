import "server-only";

import { randomUUID } from "node:crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTestimonialEligibleAt,
  normalizeTestimonialMessage,
} from "@/lib/testimonials/rules";

export type StoredTestimonial = {
  id: string;
  userId: string;
  authorName: string;
  message: string;
  publishAfter: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserTestimonialRow = {
  id: string;
  user_id: string;
  author_name: string;
  message: string;
  publish_after: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

function mapUserTestimonialRow(
  row: UserTestimonialRow | null | undefined,
): StoredTestimonial | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    message: row.message,
    publishAfter: row.publish_after,
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isSupabaseEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SECRET_KEY?.trim(),
  );
}

const TESTIMONIAL_SELECT_COLUMNS =
  "id, user_id, author_name, message, publish_after, is_public, created_at, updated_at";

export async function findTestimonialByUserId(userId: string) {
  if (!isSupabaseEnabled()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_testimonials")
    .select(TESTIMONIAL_SELECT_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapUserTestimonialRow(data as UserTestimonialRow | null);
}

export async function upsertUserTestimonial(input: {
  userId: string;
  authorName: string;
  message: string;
  userCreatedAt: string;
}) {
  const existing = await findTestimonialByUserId(input.userId);
  const now = new Date().toISOString();
  const publishAfter = getTestimonialEligibleAt(input.userCreatedAt).toISOString();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_testimonials")
    .upsert(
      {
        id: existing?.id ?? randomUUID(),
        user_id: input.userId,
        author_name: input.authorName.trim(),
        message: normalizeTestimonialMessage(input.message),
        publish_after: publishAfter,
        is_public: true,
        created_at: existing?.createdAt ?? now,
        updated_at: now,
      },
      {
        onConflict: "user_id",
      },
    )
    .select(TESTIMONIAL_SELECT_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapUserTestimonialRow(data as UserTestimonialRow | null);
}

export async function listPublishedTestimonials(limit = 6) {
  if (!isSupabaseEnabled()) {
    return [] as StoredTestimonial[];
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_testimonials")
      .select(TESTIMONIAL_SELECT_COLUMNS)
      .eq("is_public", true)
      .lte("publish_after", new Date().toISOString())
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return ((data as UserTestimonialRow[] | null) ?? [])
      .map((row) => mapUserTestimonialRow(row))
      .filter((row): row is StoredTestimonial => row !== null);
  } catch {
    return [];
  }
}
