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

drop trigger if exists trg_user_app_data_updated_at on public.user_app_data;

create trigger trg_user_app_data_updated_at
before update on public.user_app_data
for each row
execute function public.set_user_app_data_updated_at();

alter table public.user_app_data enable row level security;
