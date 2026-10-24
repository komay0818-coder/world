import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Database, DatabaseTransaction } from './database.js';

export const PLAY_LEASE_TTL_MS = 45_000;
export const leaseAcquireSchema = z.object({ deviceId: z.string().uuid(), resumeLeaseId: z.string().uuid().nullable().optional() }).strict();
export const leaseIdentitySchema = z.object({ deviceId: z.string().uuid(), leaseId: z.string().uuid() }).strict();
export const leaseReleaseSchema = leaseIdentitySchema.extend({ cloudRevision: z.number().int().nonnegative() }).strict();
export type LeaseIdentity = z.infer<typeof leaseIdentitySchema>;

type AccountRow={id:string;status:'active'|'suspended'|'closed'};
type LeaseRow={account_id:string;lease_id:string;device_id:string;state:'active'|'released';base_revision:string;last_committed_revision:string;acquired_at:Date|string;renewed_at:Date|string;expires_at:Date|string;released_at:Date|string|null};
export type PlayLease={leaseId:string;deviceId:string;state:'active'|'released';baseRevision:number;lastCommittedRevision:number;acquiredAt:string;renewedAt:string;expiresAt:string};

export class PlayLeaseError extends Error{constructor(public readonly code:string,public readonly statusCode:number,message:string){super(message);}}
const iso=(value:Date|string)=>new Date(value).toISOString();
const mapLease=(row:LeaseRow):PlayLease=>({leaseId:row.lease_id,deviceId:row.device_id,state:row.state,baseRevision:Number(row.base_revision),lastCommittedRevision:Number(row.last_committed_revision),acquiredAt:iso(row.acquired_at),renewedAt:iso(row.renewed_at),expiresAt:iso(row.expires_at)});
const requiredLease=(row:LeaseRow|undefined)=>{if(!row)throw new PlayLeaseError('PLAY_LEASE_WRITE_FAILED',500,'Play lease write did not return a record');return row;};
async function accountForSubject(database:DatabaseTransaction,authUserId:string):Promise<AccountRow>{const result=await database.query<AccountRow>('select id, status from player_accounts where auth_user_id = $1 for update',[authUserId]);const account=result.rows[0];if(!account)throw new PlayLeaseError('ACCOUNT_NOT_FOUND',404,'Player account has not been created');if(account.status!=='active')throw new PlayLeaseError('ACCOUNT_UNAVAILABLE',403,'Player account is not active');return account;}
async function cloudRevision(database:DatabaseTransaction,accountId:string){const result=await database.query<{revision:string}>('select revision from player_game_saves where account_id = $1',[accountId]);return result.rows[0]?Number(result.rows[0].revision):0;}
async function leaseForUpdate(database:DatabaseTransaction,accountId:string){const result=await database.query<LeaseRow>('select account_id, lease_id, device_id, state, base_revision, last_committed_revision, acquired_at, renewed_at, expires_at, released_at from player_game_leases where account_id = $1 for update',[accountId]);return result.rows[0]||null;}

export async function acquirePlayLease(database:Database,authUserId:string,input:z.infer<typeof leaseAcquireSchema>,now=new Date()):Promise<{lease:PlayLease;resumed:boolean}>{return database.transaction(async transaction=>{
 const account=await accountForSubject(transaction,authUserId),revision=await cloudRevision(transaction,account.id),existing=await leaseForUpdate(transaction,account.id),expiresAt=new Date(now.getTime()+PLAY_LEASE_TTL_MS);
 if(existing?.state==='active'){
  const same=existing.device_id===input.deviceId&&existing.lease_id===input.resumeLeaseId;
  if(new Date(existing.expires_at).getTime()>now.getTime()&&!same)throw new PlayLeaseError('PLAY_LEASE_ACTIVE',409,'This account is active on another device');
  if(!same)throw new PlayLeaseError('PLAY_LEASE_RECOVERY_REQUIRED',409,'The previous device may have unsynced progress; reopen it to finish synchronization');
  if(Number(existing.last_committed_revision)!==revision)throw new PlayLeaseError('PLAY_LEASE_CLOUD_CHANGED',409,'Cloud revision changed while the device lease was inactive');
  const renewed=await transaction.query<LeaseRow>(`update player_game_leases set renewed_at=$2, expires_at=$3 where account_id=$1 returning account_id, lease_id, device_id, state, base_revision, last_committed_revision, acquired_at, renewed_at, expires_at, released_at`,[account.id,now,expiresAt]);
  return {lease:mapLease(requiredLease(renewed.rows[0])),resumed:true};
 }
 const leaseId=randomUUID();
 const saved=await transaction.query<LeaseRow>(`insert into player_game_leases (account_id,lease_id,device_id,state,base_revision,last_committed_revision,acquired_at,renewed_at,expires_at,released_at) values ($1,$2,$3,'active',$4,$4,$5,$5,$6,null) on conflict (account_id) do update set lease_id=excluded.lease_id,device_id=excluded.device_id,state='active',base_revision=excluded.base_revision,last_committed_revision=excluded.last_committed_revision,acquired_at=excluded.acquired_at,renewed_at=excluded.renewed_at,expires_at=excluded.expires_at,released_at=null returning account_id, lease_id, device_id, state, base_revision, last_committed_revision, acquired_at, renewed_at, expires_at, released_at`,[account.id,leaseId,input.deviceId,revision,now,expiresAt]);
 return {lease:mapLease(requiredLease(saved.rows[0])),resumed:false};
});}

export async function renewPlayLease(database:Database,authUserId:string,input:LeaseIdentity,now=new Date()):Promise<{lease:PlayLease}>{return database.transaction(async transaction=>{const account=await accountForSubject(transaction,authUserId),existing=await leaseForUpdate(transaction,account.id);if(!existing||existing.state!=='active'||existing.lease_id!==input.leaseId||existing.device_id!==input.deviceId)throw new PlayLeaseError('PLAY_LEASE_LOST',409,'Play lease is no longer owned by this device');if(new Date(existing.expires_at).getTime()<=now.getTime())throw new PlayLeaseError('PLAY_LEASE_EXPIRED',409,'Play lease expired before renewal');const expiresAt=new Date(now.getTime()+PLAY_LEASE_TTL_MS),renewed=await transaction.query<LeaseRow>(`update player_game_leases set renewed_at=$2,expires_at=$3 where account_id=$1 returning account_id, lease_id, device_id, state, base_revision, last_committed_revision, acquired_at, renewed_at, expires_at, released_at`,[account.id,now,expiresAt]);return {lease:mapLease(requiredLease(renewed.rows[0]))};});}

export async function releasePlayLease(database:Database,authUserId:string,input:z.infer<typeof leaseReleaseSchema>,now=new Date()):Promise<{lease:PlayLease}>{return database.transaction(async transaction=>{const account=await accountForSubject(transaction,authUserId),existing=await leaseForUpdate(transaction,account.id);if(!existing||existing.lease_id!==input.leaseId||existing.device_id!==input.deviceId)throw new PlayLeaseError('PLAY_LEASE_LOST',409,'Play lease is no longer owned by this device');if(existing.state==='released')return {lease:mapLease(existing)};const revision=await cloudRevision(transaction,account.id);if(input.cloudRevision!==revision||Number(existing.last_committed_revision)!==revision)throw new PlayLeaseError('PLAY_LEASE_UNSYNCED',409,'Cloud save is not confirmed at the lease revision');const released=await transaction.query<LeaseRow>(`update player_game_leases set state='released',renewed_at=$2,expires_at=$2,released_at=$2 where account_id=$1 returning account_id, lease_id, device_id, state, base_revision, last_committed_revision, acquired_at, renewed_at, expires_at, released_at`,[account.id,now]);return {lease:mapLease(requiredLease(released.rows[0]))};});}

export async function assertActivePlayLease(transaction:DatabaseTransaction,accountId:string,input:LeaseIdentity,now=new Date()):Promise<LeaseRow>{const existing=await leaseForUpdate(transaction,accountId);if(!existing||existing.state!=='active'||existing.lease_id!==input.leaseId||existing.device_id!==input.deviceId)throw new PlayLeaseError('PLAY_LEASE_LOST',409,'Save commit does not own the active play lease');if(new Date(existing.expires_at).getTime()<=now.getTime())throw new PlayLeaseError('PLAY_LEASE_EXPIRED',409,'Save commit lease has expired');return existing;}
export async function advancePlayLeaseRevision(transaction:DatabaseTransaction,accountId:string,leaseId:string,revision:number){await transaction.query('update player_game_leases set last_committed_revision=$3 where account_id=$1 and lease_id=$2',[accountId,leaseId,revision]);}
