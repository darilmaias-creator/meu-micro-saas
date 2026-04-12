create table if not exists public.auth_users (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text null,
  image text null,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  free_name_changes_used integer not null default 0,
  auth_providers text[] not null default '{}'::text[],
  backup_email text null,
  backup_frequency text not null default 'off' check (backup_frequency in ('off', 'daily', 'weekly', 'monthly')),
  backup_last_sent_at timestamptz null,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  stripe_subscription_status text null,
  stripe_price_id text null,
  stripe_current_period_end timestamptz null,
  founder_offer_applied boolean not null default false,
  password_reset_token_hash text null,
  password_reset_expires_at timestamptz null,
  password_reset_requested_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.auth_users
  add column if not exists backup_email text null;

alter table public.auth_users
  add column if not exists backup_frequency text not null default 'off';

alter table public.auth_users
  add column if not exists backup_last_sent_at timestamptz null;

alter table public.auth_users
  add column if not exists stripe_customer_id text null;

alter table public.auth_users
  add column if not exists stripe_subscription_id text null;

alter table public.auth_users
  add column if not exists stripe_subscription_status text null;

alter table public.auth_users
  add column if not exists stripe_price_id text null;

alter table public.auth_users
  add column if not exists stripe_current_period_end timestamptz null;

alter table public.auth_users
  add column if not exists founder_offer_applied boolean not null default false;

alter table public.auth_users
  add column if not exists password_reset_token_hash text null;

alter table public.auth_users
  add column if not exists password_reset_expires_at timestamptz null;

alter table public.auth_users
  add column if not exists password_reset_requested_at timestamptz null;

alter table public.auth_users
  drop constraint if exists auth_users_backup_frequency_check;

alter table public.auth_users
  add constraint auth_users_backup_frequency_check
  check (backup_frequency in ('off', 'daily', 'weekly', 'monthly'));

create unique index if not exists auth_users_stripe_customer_id_idx
  on public.auth_users (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists auth_users_stripe_subscription_id_idx
  on public.auth_users (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.user_app_data (
  user_id text primary key,
  config jsonb not null default '{}'::jsonb,
  insumos jsonb not null default '[]'::jsonb,
  saved_products jsonb not null default '[]'::jsonb,
  sales jsonb not null default '[]'::jsonb,
  quotes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_user_app_data_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_auth_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_auth_users_updated_at on public.auth_users;

create trigger trg_auth_users_updated_at
before update on public.auth_users
for each row
execute function public.set_auth_users_updated_at();

drop trigger if exists trg_user_app_data_updated_at on public.user_app_data;

create trigger trg_user_app_data_updated_at
before update on public.user_app_data
for each row
execute function public.set_user_app_data_updated_at();

alter table public.auth_users enable row level security;
alter table public.user_app_data enable row level security;
