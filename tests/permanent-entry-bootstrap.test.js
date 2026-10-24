'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),Bootstrap=require('../permanent-entry-bootstrap'),Controller=require('../account-session-controller'),Policy=require('../permanent-party-policy'),Cutover=require('../permanent-cutover-policy'),Fixture=require('../tools/permanent-party-fixture');
let passed=0;const check=(value,label)=>{assert(value,label);passed++;},equal=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);passed++;};
function storage(values={}){const data=new Map(Object.entries(values).map(([key,value])=>[key,String(value)]));return {get length(){return data.size;},key:index=>[...data.keys()][index]??null,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key),data};}
async function proof(userId,token='bootstrap-token'){const account={id:'account-'+userId,authUserId:userId};const controller=Controller.create({supabaseClient:{auth:{getUser:async()=>({data:{user:{id:userId}},error:null})}},fetcher:async url=>({ok:true,status:url.endsWith('/initialize')?201:200,json:async()=>({account})}),apiBaseUrl:'http://127.0.0.1:3000',view:{setAuthState(){},announce(){}},schedule:fn=>fn()});const verification=await controller.verifySession({access_token:token});return {sessionController:controller,verification};}
const legacy=Fixture.create(),source=storage({
 'stardust-character-slots':JSON.stringify(legacy.slots),
 'stardust-active-character-slot':'1',
 'stardust-account-resources':JSON.stringify(legacy.accountResources),
 'stardust-character':JSON.stringify(legacy.slots[0].character),
 'stardust-progress':JSON.stringify(legacy.slots[0].progress),
 'stardust-player-name':'正式測試',
 'stardust-battle-layout':'{"left":1}',
 'stardust-permanent-cutover-v2':'old-marker'
});
const raw=Bootstrap.readLegacy(source);equal(raw.slots,legacy.slots,'all role slots copied');check(raw.activeMainId===legacy.slots[1].character.id,'active role preserved');equal(raw.accountResources,legacy.accountResources,'account resources preserved');check(raw.settings['stardust-player-name']==='正式測試'&&raw.settings['stardust-battle-layout']==='{"left":1}','ordinary settings preserved');check(!('stardust-character-slots'in raw.settings)&&!('stardust-progress'in raw.settings),'legacy authority excluded from settings');check(!Object.keys(raw.settings).some(key=>key.startsWith(Bootstrap.MARKER_PREFIX)),'cutover marker excluded from settings');check(Cutover.legacyAudit(raw).canMigrate,'valid copied save passes ownership audit');
let browserOpened=0;const browserRoot={URLSearchParams,console,PermanentPartyPolicy:Policy,PermanentCutoverPolicy:Cutover,AccountSessionController:Controller,PermanentPartyStore:{open:async()=>{browserOpened++;}}};browserRoot.globalThis=browserRoot;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','permanent-entry-bootstrap.js'),'utf8'),browserRoot);check(typeof browserRoot.PermanentEntryBootstrap?.start==='function','browser load exposes the authenticated bootstrap API');check(typeof browserRoot.PermanentEntryBootstrap?.initializeAccount==='function','browser load exposes account initialization without starting the game');check(browserOpened===0,'browser load does not open IndexedDB automatically');
const fallback=Bootstrap.readLegacy(storage({'stardust-character':JSON.stringify(legacy.slots[0].character),'stardust-progress':JSON.stringify(legacy.slots[0].progress)}));check(fallback.slots.length===1&&fallback.activeMainId===legacy.slots[0].character.id,'single-role legacy fallback preserved');
assert.throws(()=>Bootstrap.readLegacy(storage({'stardust-character-slots':'broken'})),/無法讀取/);passed++;
const model=Policy.migrateSharedGold(Policy.migrate(legacy)).model,account={id:'verified',revision:7,permanent:model,cutover:{version:1,status:'active',minimumClientVersion:2}},validStore={read:async()=>structuredClone(account),recoveryReport:async()=>({report:Cutover.inspect({account,runs:[]}),bundle:{account,runs:[]}})};
let opened=0;
(async()=>{
 assert.throws(()=>Bootstrap.identity(),/Session 核准/);passed++;
 assert.throws(()=>Bootstrap.identity({verification:{verified:true,userId:'80e290b0-d3d4-4b30-852e-00c4a40d4f74'},sessionController:{isCurrent:()=>true}}),/Session 核准/);passed++;
 const authorization=await proof('80e290b0-d3d4-4b30-852e-00c4a40d4f74'),authenticated=Bootstrap.identity(authorization);equal(authenticated,{accountId:'supabase:80e290b0-d3d4-4b30-852e-00c4a40d4f74',authUserId:'80e290b0-d3d4-4b30-852e-00c4a40d4f74',database:Bootstrap.PRODUCTION_DATABASE,testing:false},'controller-issued current identity is namespaced and normalized');
 assert.throws(()=>Bootstrap.identity({...authorization,sessionController:{isCurrent:()=>true}}),/Session 核准/);passed++;
 check(authenticated.accountId!==Bootstrap.PRODUCTION_ACCOUNT,'authenticated account never falls back to the unclaimed local account');check(Bootstrap.markerKey(Bootstrap.PRODUCTION_ACCOUNT)===Bootstrap.MARKER_PREFIX,'legacy local marker remains stable');check(Bootstrap.markerKey(authenticated.accountId)!==Bootstrap.MARKER_PREFIX,'authenticated marker is account scoped');
 const result=await Bootstrap.verifiedAccount(validStore,'verified');check(result.revision===7,'verified authority read back');check(Policy.validate(result.permanent),'verified authority remains valid');const bad={...structuredClone(account),slots:[]},blockedStore={read:async()=>structuredClone(bad),recoveryReport:async()=>({report:Cutover.inspect({account:bad,runs:[]}),bundle:{account:bad,runs:[]}})};
 await assert.rejects(()=>Bootstrap.verifiedAccount(blockedStore,'verified'),/人工檢查/);passed++;
 await assert.rejects(()=>Bootstrap.verifiedAccount({read:async()=>null,migrate:async()=>{throw Error('legacy migration must not run');}},authenticated.accountId),/尚未建立永久角色存檔/);passed++;
 await assert.rejects(()=>Bootstrap.boot({storeFactory:{open:async()=>{opened++;throw Error('must not open');}}}),/Session 核准/);passed++;
 check(opened===0,'unauthenticated boot does not open IndexedDB');console.log('Permanent entry bootstrap: '+passed+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
