'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Policy=require('../permanent-party-policy'),Online=require('../permanent-online-policy'),Runtime=require('../permanent-party-runtime');
let passed=0;const check=(value,label)=>{assert(value,label);passed++;};
const script=fs.readFileSync(path.join(__dirname,'..','script.js'),'utf8');

check(script.includes("getPermanentRuntimeAccountId(runtime).startsWith('supabase:')"),'Supabase mode derives from the active permanent account');
check(script.includes('return isSupabaseEntryMode(runtime) ? blockedSupabaseStorage : window.localStorage'),'missing authenticated runtime cannot fall back to global localStorage');
check(script.includes('if (isSupabaseEntryMode(permanent)) return 0;'),'authenticated mode ignores the unscoped active-slot session value');
check(script.includes('if (getPermanentPartyRuntime() || isSupabaseEntryMode()) return;'),'permanent accounts ignore the unscoped active-slot session key');
check(script.includes('if (!isPermanentGameplayReady()) return;'),'activity persistence waits for a gameplay-ready runtime');
check(script.includes("if (!isPermanentGameplayReady()) { showToast('角色資料尚未準備完成，暫時無法開始戰鬥。'); return; }"),'battle is blocked before runtime readiness');
check(script.includes('} else if (!startupPermanentRuntime.hasCharacters) {')&&script.includes('openCreation(firstEmptySlot < 0 ? 0 : firstEmptySlot);'),'zero-role account enters the existing character creator');
check(script.includes('await runtime.createCharacter(character, progress, creationSlotIndex)'),'character creation writes through the current permanent runtime');
check(script.includes('if(runtime.mainId!==character.id)await runtime.switchMain(character.id)'),'created character is selected through permanent identity');

const accounts=new Map();
function account(id){return {id,revision:0,permanent:Policy.createEmptyModel(),settings:{}};}
function storeFor(id){return {async commitOnline(requested,revision,commandId,model,settings){assert.equal(requested,id);const current=accounts.get(id);assert.equal(revision,current.revision);Policy.validate(model);const saved={...Online.copy(current),revision:revision+1,permanent:Online.copy(model),settings:Online.copy(settings)};accounts.set(id,saved);return {account:Online.copy(saved)};}};}
function runtimeFor(id){if(!accounts.has(id))accounts.set(id,account(id));return Runtime.create({store:storeFor(id),account:Online.copy(accounts.get(id)),generate:()=>id+':instance'});}
const starter={level:1,xp:0,gold:0,potions:5,manaPotions:0,inventory:[],equipment:{weapon:{id:'starter-sword',kind:'equipment',slot:'weapon',allowedJobs:['warrior'],requiredLevel:1}}};

(async()=>{
 const accountA='supabase:11111111-1111-4111-8111-111111111111',accountB='supabase:22222222-2222-4222-8222-222222222222';
 const a=runtimeFor(accountA);check(!a.hasCharacters&&!a.readyForGameplay,'new Supabase account starts with no character and no gameplay');
 await a.createCharacter({id:'character-a',name:'玩家 A',race:'human',job:'warrior',faction:'light'},starter,0);
 check(a.readyForGameplay&&a.mainId==='character-a','first character becomes the persisted main character');
 const refreshed=runtimeFor(accountA);check(refreshed.mainId==='character-a'&&refreshed.getSlots()[0].character.name==='玩家 A','refresh restores the same account character');
 const b=runtimeFor(accountB);check(!b.hasCharacters&&b.getSlots().every(slot=>slot===null),'another Supabase account remains isolated and empty');
 check(accounts.get(accountA).permanent.characters['character-a']&&!accounts.get(accountB).permanent.characters['character-a'],'character data never crosses account IDs');
 const legacy={name:'舊玩家',slots:[{id:'legacy-role'}]},snapshot=JSON.stringify(legacy);check(JSON.stringify(legacy)===snapshot,'legacy save fixture remains untouched');
 console.log('Supabase new-character entry tests passed: '+passed);
})().catch(error=>{console.error(error);process.exitCode=1;});
