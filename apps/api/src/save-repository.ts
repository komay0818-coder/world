import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Database, DatabaseTransaction } from './database.js';
import { advancePlayLeaseRevision, assertActivePlayLease } from './play-lease-repository.js';

export const MAX_SAVE_SNAPSHOT_BYTES = 2 * 1024 * 1024;

const permanentModelSchema = z.object({
  version: z.number().int().positive(),
  activeMainId: z.string().min(1).nullable(),
  accountResources: z.record(z.string(), z.unknown()),
  characters: z.record(z.string(), z.unknown()),
  slotOrder: z.array(z.string().min(1).nullable()).max(4),
  parties: z.record(z.string(), z.unknown()),
  bag: z.object({ items: z.array(z.unknown()) }).passthrough(),
  retiredIds: z.array(z.string()),
  deletedCharacters: z.record(z.string(), z.unknown()),
  equipmentOwners: z.record(z.string(), z.unknown())
}).passthrough();

const snapshotSchema = z.object({
  permanent: permanentModelSchema,
  farming: z.record(z.string(), z.unknown()),
  cutover: z.record(z.string(), z.unknown()),
  commands: z.record(z.string(), z.unknown())
}).passthrough();

export const saveCommitSchema = z.object({
  leaseId: z.string().uuid(),
  deviceId: z.string().uuid(),
  commandId: z.string().uuid(),
  baseRevision: z.number().int().nonnegative(),
  schemaVersion: z.number().int().positive().max(1_000_000),
  snapshot: snapshotSchema,
  contentHash: z.string().regex(/^[0-9a-f]{64}$/)
}).strict();

export type SaveCommitInput = z.infer<typeof saveCommitSchema>;

export type GameSave = {
  schemaVersion: number;
  revision: number;
  snapshot: z.infer<typeof snapshotSchema>;
  contentHash: string;
  updatedAt: string;
};

type SaveRow = {
  schema_version: number;
  revision: string;
  snapshot: GameSave['snapshot'];
  content_hash: string;
  updated_at: Date | string;
};

type CommandRow = {
  request_hash: string;
  resulting_revision: string;
  resulting_schema_version: number;
  resulting_content_hash: string;
  resulting_updated_at: Date | string;
};

type AccountRow = { id: string; status: 'active' | 'suspended' | 'closed' };

export class SaveApiError extends Error {
  constructor(public readonly code: string, public readonly statusCode: number, message: string) {
    super(message);
  }
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashSaveSnapshot(snapshot: unknown): { canonical: string; hash: string; bytes: number } {
  const canonical = canonicalJson(snapshot);
  return { canonical, hash: sha256(canonical), bytes: Buffer.byteLength(canonical, 'utf8') };
}

function requestHash(input: SaveCommitInput, calculatedContentHash: string): string {
  return sha256(canonicalJson({
    baseRevision: input.baseRevision,
    contentHash: calculatedContentHash,
    schemaVersion: input.schemaVersion,
    snapshot: input.snapshot
  }));
}

function mapSave(row: SaveRow): GameSave {
  return {
    schemaVersion: Number(row.schema_version),
    revision: Number(row.revision),
    snapshot: row.snapshot,
    contentHash: row.content_hash,
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

async function accountForSubject(database: DatabaseTransaction, authUserId: string, lock = false): Promise<AccountRow> {
  const result = await database.query<AccountRow>(
    `select id, status from player_accounts where auth_user_id = $1${lock ? ' for update' : ''}`,
    [authUserId]
  );
  const account = result.rows[0];
  if (!account) throw new SaveApiError('ACCOUNT_NOT_FOUND', 404, 'Player account has not been created');
  if (account.status !== 'active') throw new SaveApiError('ACCOUNT_UNAVAILABLE', 403, 'Player account is not active');
  return account;
}

export async function findGameSaveByAuthUserId(database: Database, authUserId: string): Promise<GameSave | null> {
  const account = await accountForSubject(database, authUserId);
  const result = await database.query<SaveRow>(
    `select schema_version, revision, snapshot, content_hash, updated_at
       from player_game_saves
      where account_id = $1`,
    [account.id]
  );
  return result.rows[0] ? mapSave(result.rows[0]) : null;
}

export async function commitGameSave(database: Database, authUserId: string, input: SaveCommitInput): Promise<{ save: Omit<GameSave, 'snapshot'>; duplicate: boolean }> {
  const calculated = hashSaveSnapshot(input.snapshot);
  if (calculated.bytes > MAX_SAVE_SNAPSHOT_BYTES) throw new SaveApiError('SAVE_TOO_LARGE', 413, 'Save snapshot exceeds the 2 MiB limit');
  if (input.contentHash !== calculated.hash) throw new SaveApiError('CONTENT_HASH_MISMATCH', 400, 'Save content hash does not match the snapshot');
  const digest = requestHash(input, calculated.hash);

  return database.transaction(async (transaction) => {
    const account = await accountForSubject(transaction, authUserId, true);
    const lease = await assertActivePlayLease(transaction, account.id, { leaseId: input.leaseId, deviceId: input.deviceId });
    const priorCommand = await transaction.query<CommandRow>(
      `select request_hash, resulting_revision, resulting_schema_version, resulting_content_hash, resulting_updated_at
         from player_save_commands
        where account_id = $1 and command_id = $2`,
      [account.id, input.commandId]
    );
    const receipt = priorCommand.rows[0];
    if (receipt) {
      if (receipt.request_hash !== digest) throw new SaveApiError('COMMAND_ID_REUSED', 409, 'commandId was already used for different save content');
      return {
        save: {
          schemaVersion: Number(receipt.resulting_schema_version),
          revision: Number(receipt.resulting_revision),
          contentHash: receipt.resulting_content_hash,
          updatedAt: new Date(receipt.resulting_updated_at).toISOString()
        },
        duplicate: true
      };
    }

    const current = await transaction.query<{ revision: string }>(
      'select revision from player_game_saves where account_id = $1',
      [account.id]
    );
    const currentRevision = current.rows[0] ? Number(current.rows[0].revision) : 0;
    if (currentRevision !== input.baseRevision) throw new SaveApiError('REVISION_CONFLICT', 409, 'Save revision is stale');
    if (Number(lease.last_committed_revision) !== input.baseRevision) throw new SaveApiError('LEASE_REVISION_MISMATCH', 409, 'Play lease revision does not match the save base revision');

    const nextRevision = currentRevision + 1;
    const saved = currentRevision === 0
      ? await transaction.query<SaveRow>(
          `insert into player_game_saves (account_id, schema_version, revision, snapshot, content_hash)
           values ($1, $2, $3, $4::jsonb, $5)
           on conflict (account_id) do nothing
           returning schema_version, revision, snapshot, content_hash, updated_at`,
          [account.id, input.schemaVersion, nextRevision, calculated.canonical, calculated.hash]
        )
      : await transaction.query<SaveRow>(
          `update player_game_saves
              set schema_version = $2, revision = $3, snapshot = $4::jsonb, content_hash = $5, updated_at = now()
            where account_id = $1 and revision = $6
          returning schema_version, revision, snapshot, content_hash, updated_at`,
          [account.id, input.schemaVersion, nextRevision, calculated.canonical, calculated.hash, input.baseRevision]
        );
    const savedRow = saved.rows[0];
    if (!savedRow) throw new SaveApiError('REVISION_CONFLICT', 409, 'Save revision changed during commit');

    await transaction.query(
      `insert into player_save_commands
        (account_id, command_id, request_hash, resulting_revision, resulting_schema_version, resulting_content_hash, resulting_updated_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [account.id, input.commandId, digest, nextRevision, input.schemaVersion, calculated.hash, savedRow.updated_at]
    );
    await advancePlayLeaseRevision(transaction, account.id, input.leaseId, nextRevision);

    const save = mapSave(savedRow);
    return {
      save: {
        schemaVersion: save.schemaVersion,
        revision: save.revision,
        contentHash: save.contentHash,
        updatedAt: save.updatedAt
      },
      duplicate: false
    };
  });
}

