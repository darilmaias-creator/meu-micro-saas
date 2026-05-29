create table if not exists public.comment_authors (
  id uuid primary key default gen_random_uuid(),
  google_sub_hash text not null unique,
  email_hash text null,
  display_name text not null,
  avatar_url text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.page_comments (
  id uuid primary key default gen_random_uuid(),
  page_path text not null,
  author_id uuid not null references public.comment_authors (id) on delete cascade,
  author_display_name text not null,
  author_avatar_url text null,
  content text not null check (char_length(content) between 3 and 500),
  status text not null default 'approved' check (status in ('approved', 'pending', 'rejected')),
  report_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists page_comments_page_status_created_idx
  on public.page_comments (page_path, status, created_at desc);

create index if not exists page_comments_author_idx
  on public.page_comments (author_id);

create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.page_comments (id) on delete cascade,
  reporter_ip_hash text not null,
  reason text not null default 'user_report',
  created_at timestamptz not null default timezone('utc', now()),
  unique (comment_id, reporter_ip_hash)
);

create index if not exists comment_reports_comment_idx
  on public.comment_reports (comment_id);

create table if not exists public.comment_rate_limits (
  key text primary key,
  action text not null check (action in ('create_comment')),
  attempts integer not null default 0,
  window_started_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists comment_rate_limits_action_idx
  on public.comment_rate_limits (action);

alter table public.comment_authors enable row level security;
alter table public.page_comments enable row level security;
alter table public.comment_reports enable row level security;
alter table public.comment_rate_limits enable row level security;
