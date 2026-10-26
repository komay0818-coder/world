create extension if not exists pgcrypto;

create table if not exists player_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  data_version bigint not null default 0 check (data_version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column player_accounts.auth_user_id is
  'Logical reference to Supabase auth.users.id. Game APIs derive it only from a verified JWT.';

alter table player_accounts enable row level security;
revoke all on table player_accounts from public;

do $$
begin
  if to_regrole('anon') is not null then
    revoke all on table player_accounts from anon;
  end if;
  if to_regrole('authenticated') is not null then
    revoke all on table player_accounts from authenticated;
  end if;
end
$$;
