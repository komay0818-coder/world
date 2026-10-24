create table if not exists player_game_leases (
  account_id uuid primary key references player_accounts(id) on delete cascade,
  lease_id uuid not null unique,
  device_id uuid not null,
  state text not null check (state in ('active', 'released')),
  base_revision bigint not null check (base_revision >= 0),
  last_committed_revision bigint not null check (last_committed_revision >= 0),
  acquired_at timestamptz not null,
  renewed_at timestamptz not null,
  expires_at timestamptz not null,
  released_at timestamptz,
  check (expires_at > acquired_at),
  check ((state = 'active' and released_at is null) or (state = 'released' and released_at is not null))
);

create index if not exists player_game_leases_expiry_idx
  on player_game_leases (expires_at)
  where state = 'active';

alter table player_game_leases enable row level security;
revoke all on table player_game_leases from public;

do $$
begin
  if to_regrole('anon') is not null then
    revoke all on table player_game_leases from anon;
  end if;
  if to_regrole('authenticated') is not null then
    revoke all on table player_game_leases from authenticated;
  end if;
end
$$;
