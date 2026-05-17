export type AnnouncementKind = "info" | "success" | "warning";

export type AnnouncementRecord = {
  id: string;
  title: string;
  message: string;
  kind: AnnouncementKind;
  ctaLabel: string | null;
  ctaUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  createdByUserId: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  message: string;
  kind: AnnouncementKind;
  cta_label: string | null;
  cta_url: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_by_user_id: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
};
