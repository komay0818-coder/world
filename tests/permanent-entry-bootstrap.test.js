'use strict';
const assert=require('node:assert/strict'),Bootstrap=require('../permanent-entry-bootstrap'),Policy=require('../permanent-party-policy'),Cutover=require('../permanent-cutover-policy'),Fixture=require('../tools/permanent-party-fixture');
let passed=0;const check=(value,label)=>{assert(value,label);passed++;},equal=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);passed++;};
function storage(values={}){const data=new Map(Object.entries(values).map(([key,value])=>[key,String(value)]));return {get length(){return data.size;},key:index=>[...data.keys()][index]??null,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key),data};}
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
const fallback=Bootstrap.readLegacy(storage({'stardust-character':JSON.stringify(legacy.slots[0].character),'stardust-progress':JSON.stringify(legacy.slots[0].progress)}));check(fallback.slots.length===1&&fallback.activeMainId===legacy.slots[0].character.id,'single-role legacy fallback preserved');
assert.throws(()=>Bootstrap.readLegacy(storage({'stardust-character-slots':'broken'})),/無法讀取/);passed++;
assert.throws(()=>Bootstrap.identity({hostname:'localhost',search:'?permanentTestAccount=bad value'}),/識別不正確/);passed++;
equal(Bootstrap.identity({hostname:'localhost',search:'?permanentTestAccount=entry_case'}),{accountId:'entry_case',database:Bootstrap.PRODUCTION_DATABASE+'-test',testing:true},'localhost test identity isolated');
check(Bootstrap.identity({hostname:'game.example',search:'?permanentTestAccount=ignored'}).accountId===Bootstrap.PRODUCTION_ACCOUNT,'production query cannot select another account');check(Bootstrap.markerKey(Bootstrap.PRODUCTION_ACCOUNT)===Bootstrap.MARKER_PREFIX,'production marker stable');check(Bootstrap.markerKey('test')!==Bootstrap.MARKER_PREFIX,'test marker isolated');
const model=Policy.migrate(legacy),account={id:'verified',revision:7,permanent:model,cutover:{version:1,status:'active',minimumClientVersion:2}},validStore={read:async()=>structuredClone(account),recoveryReport:async()=>({report:Cutover.inspect({account,runs:[]}),bundle:{account,runs:[]}})};
Bootstrap.verifiedAccount(validStore,'verified',legacy).then(result=>{check(result.revision===7,'verified authority read back');check(Policy.validate(result.permanent),'verified authority remains valid');const bad={...structuredClone(account),slots:[]},blockedStore={read:async()=>structuredClone(bad),recoveryReport:async()=>({report:Cutover.inspect({account:bad,runs:[]}),bundle:{account:bad,runs:[]}})};return assert.rejects(()=>Bootstrap.verifiedAccount(blockedStore,'verified',legacy),/人工檢查/).then(()=>{passed++;console.log('Permanent entry bootstrap: '+passed+' checks passed');});}).catch(error=>{console.error(error);process.exitCode=1;});
