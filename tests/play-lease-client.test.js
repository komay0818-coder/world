'use strict';
const assert=require('node:assert/strict'),Lease=require('../play-lease-client');
const userId='71111111-1111-4111-8111-111111111111',deviceId='72222222-2222-4222-8222-222222222222',leaseId='73333333-3333-4333-8333-333333333333';
function storage(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),values};}
function fixture(){
 let now=1000,requestCount=0,expiresAt=now+45000;const tasks=[];
 const verification={userId},controller={verification,isCurrent:value=>value===verification,async requestApi(_verification,path,{body}){requestCount++;if(path.endsWith('/acquire'))return {ok:true,status:200,body:{lease:{leaseId,deviceId:body.deviceId,state:'active',baseRevision:0,lastCommittedRevision:0,acquiredAt:new Date(now).toISOString(),renewedAt:new Date(now).toISOString(),expiresAt:new Date(expiresAt).toISOString()},resumed:Boolean(body.resumeLeaseId)}};if(path.endsWith('/renew'))return {ok:true,status:200,body:{lease:{leaseId,deviceId:body.deviceId,state:'active',baseRevision:0,lastCommittedRevision:0,acquiredAt:new Date(1000).toISOString(),renewedAt:new Date(now).toISOString(),expiresAt:new Date(expiresAt).toISOString()}}};if(path.endsWith('/release'))return {ok:true,status:200,body:{lease:{leaseId,deviceId:body.deviceId,state:'released',baseRevision:0,lastCommittedRevision:body.cloudRevision,acquiredAt:new Date(1000).toISOString(),renewedAt:new Date(now).toISOString(),expiresAt:new Date(now).toISOString()}}};throw Error('unexpected request');}};
 return {controller,tasks,get now(){return now;},set now(value){now=value;},set expiresAt(value){expiresAt=value;},get requestCount(){return requestCount;},options:{controller,authUserId:userId,cryptoApi:{randomUUID:()=>deviceId},now:()=>now,schedule:fn=>{tasks.push(fn);return fn;},cancel:fn=>{const index=tasks.indexOf(fn);if(index>=0)tasks.splice(index,1);}}};
}
(async()=>{
 let checks=0;const check=(value,message)=>{assert(value,message);checks++;},shared=storage(),first=fixture();
 const lease=Lease.create({...first.options,storage:shared});const acquired=await lease.acquire();check(acquired.resumed===false&&lease.active,'first browser acquires an active server lease');
 const reloaded=fixture(),sameBrowser=Lease.create({...reloaded.options,storage:shared});const resumed=await sameBrowser.acquire();check(resumed.resumed===true&&sameBrowser.deviceId===deviceId,'F5 reuses the persisted device and lease identities');
 let lost=null;sameBrowser.start(error=>{lost=error;});reloaded.now=50000;const scheduled=reloaded.tasks.shift();scheduled();await new Promise(resolve=>setImmediate(resolve));check(lost?.code==='PLAY_LEASE_EXPIRED'&&!sameBrowser.active,'missed renewal beyond expiry invalidates gameplay locally');
 const clean=fixture(),cleanStorage=storage(),releasable=Lease.create({...clean.options,storage:cleanStorage});await releasable.acquire();await releasable.release(4);check(!releasable.active&&!cleanStorage.getItem('lorn-play-lease-v1:'+userId),'clean handoff removes only the persisted lease identity');
 console.log('Play lease client: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
