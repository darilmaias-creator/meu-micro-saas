create table if not exists public.user_activity (
  user_id uuid not null references public.auth_users(id) on delete cascade,
  activity_date date not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  active_seconds integer not null default 0 check (active_seconds >= 0),
  page_views integer not null default 0 check (page_views >= 0),
  last_path text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create index if not exists user_activity_activity_date_idx
  on public.user_activity(activity_date desc);

create index if not exists user_activity_last_seen_at_idx
  on public.user_activity(last_seen_at desc);

create or replace function public.set_user_activity_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_activity_updated_at on public.user_activity;

create trigger set_user_activity_updated_at
before update on public.user_activity
for each row
execute function public.set_user_activity_updated_at();
