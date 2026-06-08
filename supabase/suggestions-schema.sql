create table if not exists public.api_rate_limits (
  key text primary key,
  action text not null,
  attempts integer not null default 0,
  window_started_at timestamptz not null,
  blocked_until timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists api_rate_limits_action_idx
  on public.api_rate_limits (action);

alter table public.api_rate_limits
  drop constraint if exists api_rate_limits_action_check;

alter table public.api_rate_limits
  add constraint api_rate_limits_action_check
  check (action in ('ai_assistant_gemini', 'billing_checkout', 'marketing_generate', 'user_suggestion'));

create table if not exists public.user_suggestions (
  id text primary key,
  user_id text not null references public.auth_users (id) on delete cascade,
  user_name text not null default '',
  user_email text not null default '',
  user_plan text not null default 'free',
  category text not null check (category in ('ideia', 'erro', 'duvida', 'melhoria')),
  message text not null check (char_length(message) between 8 and 1000),
  active_tab text null check (active_tab in ('inventory', 'operationCosts', 'calculator', 'sales', 'dashboard')),
  status text not null default 'new' check (status in ('new', 'reviewing', 'planned', 'resolved', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_suggestions_created_at_idx
  on public.user_suggestions (created_at desc);

create index if not exists user_suggestions_status_idx
  on public.user_suggestions (status, created_at desc);

create index if not exists user_suggestions_user_id_idx
  on public.user_suggestions (user_id);

create or replace function public.set_user_suggestions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_user_suggestions_updated_at on public.user_suggestions;

create trigger trg_user_suggestions_updated_at
before update on public.user_suggestions
for each row
execute function public.set_user_suggestions_updated_at();

alter table public.user_suggestions enable row level security;
