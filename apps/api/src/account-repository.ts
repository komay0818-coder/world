import type { Database } from './database.js';

export type PlayerAccount = {
  id: string;
  authUserId: string;
  status: 'active' | 'suspended' | 'closed';
  dataVersion: number;
  createdAt: string;
  updatedAt: string;
};

type AccountRow = {
  id: string;
  auth_user_id: string;
  status: PlayerAccount['status'];
  data_version: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export async function findAccountByAuthUserId(database: Database, authUserId: string): Promise<PlayerAccount | null> {
  const result = await database.query<AccountRow>(
    `select id, auth_user_id, status, data_version, created_at, updated_at
       from player_accounts
      where auth_user_id = $1`,
    [authUserId]
  );
  const row = result.rows[0];
  return row ? {
    id: row.id,
    authUserId: row.auth_user_id,
    status: row.status,
    dataVersion: Number(row.data_version),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  } : null;
}
