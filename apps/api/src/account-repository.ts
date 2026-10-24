import type { Database } from './database.js';

export type PlayerAccount = {
  id: string;
  authUserId: string;
  status: 'active' | 'suspended' | 'closed';
  dataVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type AccountInitialization = {
  account: PlayerAccount;
  created: boolean;
};

type AccountRow = {
  id: string;
  auth_user_id: string;
  status: PlayerAccount['status'];
  data_version: string;
  created_at: Date | string;
  updated_at: Date | string;
};

const accountColumns = 'id, auth_user_id, status, data_version, created_at, updated_at';

function mapAccount(row: AccountRow): PlayerAccount {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    status: row.status,
    dataVersion: Number(row.data_version),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export async function findAccountByAuthUserId(database: Database, authUserId: string): Promise<PlayerAccount | null> {
  const result = await database.query<AccountRow>(
    `select ${accountColumns}
       from player_accounts
      where auth_user_id = $1`,
    [authUserId]
  );
  const row = result.rows[0];
  return row ? mapAccount(row) : null;
}

export async function initializeAccountByAuthUserId(database: Database, authUserId: string): Promise<AccountInitialization> {
  const inserted = await database.query<AccountRow>(
    `insert into player_accounts (auth_user_id)
     values ($1)
     on conflict (auth_user_id) do nothing
     returning ${accountColumns}`,
    [authUserId]
  );
  const insertedRow = inserted.rows[0];
  if (insertedRow) return { account: mapAccount(insertedRow), created: true };

  const existing = await findAccountByAuthUserId(database, authUserId);
  if (!existing) throw new Error('Account initialization conflict did not produce an account');
  return { account: existing, created: false };
}
