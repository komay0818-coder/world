create table if not exists player_game_saves (
  account_id uuid primary key references player_accounts(id) on delete cascade,
  schema_version integer not null check (schema_version > 0),
  revision bigint not null check (revision > 0),
  snapshot jsonb not null,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_game_saves_snapshot_size check (octet_length(snapshot::text) <= 2097152)
);

create table if not exists player_save_commands (
  account_id uuid not null references player_accounts(id) on delete cascade,
  command_id uuid not null,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  resulting_revision bigint not null check (resulting_revision > 0),
  resulting_schema_version integer not null check (resulting_schema_version > 0),
  resulting_content_hash text not null check (resulting_content_hash ~ '^[0-9a-f]{64}$'),
  resulting_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (account_id, command_id),
  foreign key (account_id) references player_game_saves(account_id) on delete cascade
);

create index if not exists player_save_commands_created_at_idx
  on player_save_commands (account_id, created_at desc);

alter table player_game_saves enable row level security;
alter table player_save_commands enable row level security;
revoke all on table player_game_saves, player_save_commands from public;

do $$
begin
  if to_regrole('anon') is not null then
    revoke all on table player_game_saves, player_save_commands from anon;
  end if;
  if to_regrole('authenticated') is not null then
    revoke all on table player_game_saves, player_save_commands from authenticated;
  end if;
end
$$;

