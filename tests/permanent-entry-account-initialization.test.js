'use strict';
const assert=require('node:assert/strict'),Policy=require('../permanent-party-policy'),Cutover=require('../permanent-cutover-policy'),Controller=require('../account-session-controller');
const modulePath=require.resolve('../permanent-entry-bootstrap'),copy=value=>structuredClone(value);
const ids={a:'11111111-1111-4111-8111-111111111111',b:'22222222-2222-4222-8222-222222222222',c:'33333333-3333-4333-8333-333333333333'};
const accountId=id=>'supabase:'+id;
function fresh(){delete require.cache[modulePath];return require('../permanent-entry-bootstrap');}
function emptyAccount(id){return {id,revision:0,permanent:Policy.createEmptyModel(),cutover:{version:1,minimumClientVersion:2,status:'active',source:'supabase-new-account'},farming:{version:1,epoch:0,owners:{},sessions:{},eligibility:{},legacyDebts:{},teamOffline:{}}};}
function locks(){const tails=new Map();let active=0,maxActive=0;return {get maxActive(){return maxActive;},async request(name,options,work){const before=tails.get(name)||Promise.resolve();let release;const tail=new Promise(resolve=>release=resolve);tails.set(name,before.then(()=>tail));await before;active++;maxActive=Math.max(maxActive,active);try{return await work();}finally{active--;release();if(tails.get(name)===tail)tails.delete(name);}}};}
function factory(records,{delay=false,failFor}={}){let opens=0,initializes=0,migrations=0;return {get opens(){return opens;},get initializes(){return initializes;},get migrations(){return migrations;},async open(){opens++;return {async initializeSupabaseAccount(id){initializes++;if(failFor===id)throw Error('Injected initialization failure');if(delay)await new Promise(resolve=>setTimeout(resolve,5));const existing=records.get(id);if(existing)return {account:copy(existing),created:false,duplicate:true};const account=emptyAccount(id);records.set(id,copy(account));return {account:copy(account),created:true,duplicate:false};},async read(id){return copy(records.get(id));},async recoveryReport(id){const account=copy(records.get(id));return {report:Cutover.inspect({account,runs:[]}),bundle:{account,runs:[]}};},async migrate(){migrations++;throw Error('legacy migration must not run');},close(){}};}};}
async function proof(userId,token='token-'+userId){const account={id:'backend-'+userId,authUserId:userId};const controller=Controller.create({supabaseClient:{auth:{getUser:async()=>({data:{user:{id:userId}},error:null})}},fetcher:async url=>({ok:true,status:url.endsWith('/initialize')?201:200,json:async()=>({account})}),apiBaseUrl:'http://127.0.0.1:3000',view:{setAuthState(){},announce(){}},schedule:fn=>fn()});const verification=await controller.verifySession({access_token:token});return {sessionController:controller,verification};}

(async()=>{
 let checks=0;const check=(condition,message)=>{assert(condition,message);checks++;};
 const records=new Map(),lock=locks(),stores=factory(records),bootstrap=fresh(),authA=await proof(ids.a);
 const first=await bootstrap.initializeAccount({...authA,navigator:{locks:lock},storeFactory:stores});
 check(first.created&&!first.duplicate&&first.accountId===accountId(ids.a),'new verified account initialized');check(Policy.validate(first.account.permanent),'initialized account validates');check(first.account.permanent.slotOrder.every(id=>id===null),'initialized account remains empty');check(stores.migrations===0,'legacy migration never called');

 records.get(accountId(ids.a)).permanent=Policy.apply(records.get(accountId(ids.a)).permanent,{type:'create',id:'character-kept',slotIndex:0,character:{job:'warrior'}});
 records.get(accountId(ids.a)).revision=4;
 const repeated=await bootstrap.initializeAccount({...authA,navigator:{locks:lock},storeFactory:stores});
 check(repeated.duplicate&&!repeated.created,'repeat initialization reads existing account');check(repeated.account.revision===4&&repeated.account.permanent.characters['character-kept'],'repeat initialization preserves existing progress');
 const authB=await proof(ids.b);await assert.rejects(()=>bootstrap.initializeAccount({...authB,navigator:{locks:lock},storeFactory:stores}),/另一個登入帳號|已綁定另一個/);checks++;
 check(!records.has(accountId(ids.b)),'same page cannot initialize a different account');

 let unopened=0;await assert.rejects(()=>fresh().initializeAccount({verification:{verified:true,userId:ids.b},sessionController:{isCurrent:()=>true},navigator:{locks:lock},storeFactory:{open:async()=>{unopened++;}}}),/Session 核准/);checks++;
 check(unopened===0,'unverified identity never opens IndexedDB');

 const other=fresh(),second=await other.initializeAccount({...authB,navigator:{locks:lock},storeFactory:stores});
 check(second.accountId===accountId(ids.b)&&second.account.permanent.activeMainId===null,'separate page initializes account B independently');check(records.get(accountId(ids.a)).revision===4&&!records.get(accountId(ids.b)).permanent.characters['character-kept'],'accounts A and B never cross-read');

 const incomplete=fresh();records.set(accountId(ids.c),{id:accountId(ids.c),revision:0});
 const authC=await proof(ids.c);await assert.rejects(()=>incomplete.initializeAccount({...authC,navigator:{locks:lock},storeFactory:stores}),/尚未建立永久角色存檔|人工檢查/);checks++;
 check(!records.get(accountId(ids.c)).permanent,'incomplete account is not rebuilt');

 const failedId='44444444-4444-4444-8444-444444444444',failed=fresh(),failedStores=factory(records,{failFor:accountId(failedId)});
 const failedAuth=await proof(failedId);await assert.rejects(()=>failed.initializeAccount({...failedAuth,navigator:{locks:lock},storeFactory:failedStores}),/Injected/);checks++;
 check(!records.has(accountId(failedId)),'initialization failure leaves no account');

 const parallelId='55555555-5555-4555-8555-555555555555',sharedLocks=locks(),parallelStores=factory(records,{delay:true}),tabA=fresh(),tabB=fresh();
 const parallelAuth=await proof(parallelId),results=await Promise.all([tabA.initializeAccount({...parallelAuth,navigator:{locks:sharedLocks},storeFactory:parallelStores}),tabB.initializeAccount({...parallelAuth,navigator:{locks:sharedLocks},storeFactory:parallelStores})]);
 check(results.filter(result=>result.created).length===1&&results.filter(result=>result.duplicate).length===1,'parallel tabs initialize one account');check(sharedLocks.maxActive===1,'account-specific Web Lock serializes initialization');

 check(globalThis.PermanentPartyRuntime?.current==null,'standalone account initialization does not activate runtime');check(globalThis.permanentEntryReady!==true,'standalone account initialization does not start the game');
 console.log('Permanent entry account initialization: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
