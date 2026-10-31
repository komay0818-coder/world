'use strict';
const assert = require('node:assert/strict');
const D = require('../skullcrusher-dungeon-lifecycle');
const Store = require('../permanent-party-store');
const Offline = require('../offline-settlement-store');
const Runtime = require('../permanent-party-runtime');
const Farming = require('../permanent-farming-policy');
const memoryDB = require('./helpers/memory-indexeddb');
const {loadGame} = require('../tools/headless-game-runtime');
const accountId = 'supabase:11111111-1111-4111-8111-111111111111';
const ids = ['character-dungeon-a','character-dungeon-b','character-dungeon-c'];
const copy = x => structuredClone(x);
const states = () => ids.map(id=>({id,state:{currentHp:100,maxHp:100,resource:{type:'mana',current:80,max:80},runtime:{alive:true,skillCooldowns:{}}}}));
let checks=0;
const check=(value,message)=>{assert(value,message);checks++;};
async function fixture() {
  const db=memoryDB(), store=Store.wrap(await Offline.open({indexedDB:db,name:'skullcrusher',version:2}));
  let a=(await store.initializeSupabaseAccount(accountId,{now:1000})).account;
  for(let i=0;i<3;i++)a=(await store.execute(accountId,a.revision,'create-dungeon-'+i,{type:'create',id:ids[i],slotIndex:i,
    character:{id:ids[i],name:'test',job:['warrior','mage','hunter'][i],race:'human',faction:'light',gender:'male'},
    progress:{level:45,xp:0,gold:0,lastActiveAt:1000,equipment:{},skillLevels:{},selectedMapId:'bloodwar-wastes',chapterThreeProgress:{unlocked:{'skullcrusher-war-camp':true}}}},
    {coordinated:true,now:1000})).account;
  a=(await store.execute(accountId,a.revision,'switch-dungeon-main',{type:'switch-main',characterId:ids[0]},{coordinated:true,now:1000})).account;
  for(let i=1;i<3;i++)a=(await store.execute(accountId,a.revision,'recruit-dungeon-'+i,{type:'recruit',characterId:ids[i],mainId:ids[0]},{coordinated:true,now:1000})).account;
  const model=copy(a.permanent);model.bag.items.push({...D.TICKET,quantity:3});
  a=(await store.commitOnline(accountId,a.revision,'dungeon-seed-test-only',model)).account;
  return {store,a,db};
}
const enter=(runId='test-run-0001')=>({type:'enter',runId,leaderId:ids[0],now:5000,memberStates:states()});
(async()=>{
  const f=await fixture();
  for(const [mutate,pattern] of [
    [a=>a.permanent.characters[ids[0]].progress.chapterThreeProgress={},/3-4/],
    [a=>a.permanent.bag.items=[],/pass/],
    [a=>a.permanent.parties[ids[0]].memberIds.pop(),/Three/],
    [a=>a.farming.owners[ids[1]]='another',/conflict/]
  ]){const a=copy(f.a);mutate(a);assert.throws(()=>D.apply(a,enter()),pattern);checks++;}
  await assert.rejects(()=>f.store.skullcrusherAction(accountId,f.a.revision,enter(),{failAt:'after-account'}),/Injected/);checks++;
  let saved=await f.store.read(accountId);
  check(!saved.skullcrusherDungeon&&saved.permanent.bag.items[0].quantity===3,'failed creation rolls ticket and journal back together');
  const results=await Promise.all([f.store.skullcrusherAction(accountId,saved.revision,enter()),f.store.skullcrusherAction(accountId,saved.revision,enter())]);
  saved=await f.store.read(accountId);
  check(saved.permanent.bag.items[0].quantity===2&&Object.keys(saved.skullcrusherDungeon.runs).length===1,'parallel duplicate entry consumes one pass');
  check(results.some(x=>x.duplicate),'one duplicate request is recognized');
  check(saved.skullcrusherDungeon.runs['test-run-0001'].settlementId==='skullcrusher-settlement:test-run-0001','future settlement shares run identity');
  await assert.rejects(()=>f.store.skullcrusherAction(accountId,saved.revision,enter('test-run-other')),/active/);checks++;
  assert.throws(()=>Farming.start(copy(saved),{leaderId:ids[0],mode:'party',token:'other',now:6000}),/dungeon/);checks++;
  const end={type:'end',runId:'test-run-0001',status:'exited',reason:'player-exit',now:6000,memberStates:states()};
  await f.store.skullcrusherAction(accountId,saved.revision,end);
  saved=await f.store.read(accountId);const revision=saved.revision;
  await f.store.skullcrusherAction(accountId,0,end);
  const final=await f.store.read(accountId);
  check(final.revision===revision&&final.permanent.bag.items[0].quantity===2,'ending retries have no additional effects or refund');
  check(final.permanent.characters[ids[0]].progress.selectedMapId==='bloodwar-wastes'&&final.permanent.characters[ids[0]].progress.requiresMapSelectionAfterDefeat,'return position is saved and battle requires manual restart');
  const modelBefore=copy(final.permanent);
  const e2=await f.store.skullcrusherAction(accountId,revision,enter('test-run-0002'));
  const rt=Runtime.create({store:f.store,account:e2.account});
  let activations=0,stops=0;
  const members=()=>ids.map((id,i)=>({id,currentHp:1,maxHp:100,resourceCurrent:0,resourceMax:80,resourceType:['rage','mana','arrows'][i],alive:false,skillCooldowns:{old:999},reviveAt:3}));
  const controller=D.create({runtime:rt,prepareMembers:members,activate:()=>activations++,stop:()=>stops++,now:()=>7000});
  await controller.recover();
  check(rt.getCommitted().skullcrusherDungeon.runs['test-run-0002'].status==='aborted'&&!controller.scene,'reload aborts unfinished session without entering combat');
  check(rt.getInventorySnapshot().items[0].quantity===1,'reload does not consume another pass');
  const progress=rt.getProgress();progress.requiresMapSelectionAfterDefeat=false;rt.saveProgress(rt.mainId,progress);await rt.flush();
  const live=D.create({runtime:rt,prepareMembers:members,activate:()=>activations++,stop:()=>stops++,now:()=>8000,generate:()=> 'test-run-0003'});
  const [s1,s2]=await Promise.all([live.enter(),live.enter()]);
  check(s1===s2&&activations===1,'double click initializes one scene only');
  check(s1.members.every(m=>m.alive&&m.currentHp===100&&m.resourceCurrent===80&&Object.keys(m.skillCooldowns).length===0),'all classes enter full with cleared cooldowns');
  s1.members[0].currentHp=33;s1.members[0].resourceCurrent=7;s1.members[0].skillCooldowns.test=123;
  for(let i=0;i<5;i++)live.advance();
  check(s1.phase===3&&s1.members[0].currentHp===33&&s1.members[0].resourceCurrent===7&&s1.members[0].skillCooldowns.test===123,'test stages retain hp/resources/cooldowns');
  s1.members[0].alive=false;s1.members[0].currentHp=0;await live.checkDefeat();
  check(live.scene!==null,'main defeat alone does not fail');
  s1.members[1].alive=false;s1.members[1].currentHp=0;await live.checkDefeat();check(live.scene!==null,'two defeated members do not fail');
  s1.members[2].alive=false;s1.members[2].currentHp=0;await live.checkDefeat();
  check(!live.scene&&rt.getCommitted().skullcrusherDungeon.runs['test-run-0003'].status==='failed','all three defeated ends persisted run');
  check(rt.getInventorySnapshot().items.length===0,'failure neither refunds nor grants items');
  check(rt.getSharedGold()===0,'lifecycle never grants gold');
  check(JSON.stringify(rt.model.characters[ids[0]].progress.chapterThreeProgress)===JSON.stringify(modelBefore.characters[ids[0]].progress.chapterThreeProgress),'ordinary chapter progress unchanged');
  const again=D.create({runtime:rt,prepareMembers:members,activate:()=>activations++});await again.recover();check(activations===1,'relogin never restarts terminal run');
  await rt.deactivate();
  // Exercise actual death/auto-revival/potion code in the isolated game runtime.
  const g=loadGame();g.context.testAssert=assert;g.context.lifecycleRoles=require('../tools/permanent-party-fixture').create().slots;
  g.evaluate(`
    localStorage.setItem('stardust-character-slots',JSON.stringify(lifecycleRoles));
    localStorage.setItem('stardust-character',JSON.stringify(lifecycleRoles[0].character));
    localStorage.setItem('stardust-progress',JSON.stringify(lifecycleRoles[0].progress));
    setActiveCharacterSlotIndex(0);
    const roles=getCharacterSlots();
    const testMembers=roles.slice(0,3).map((slot,i)=>createBattlePartyMember(slot,i,roles[0].character.id));
    testMembers.forEach(m=>{m.character.race='human';m.currentHp=m.maxHp;m.alive=true;});
    let ended=0;
    window.skullcrusherLifecyclePreview={checkDefeat:()=>{if(testMembers.every(m=>!m.alive))ended++;return Promise.resolve();}};
    battle={skullcrusherRunId:'test-run-game',partyMembers:testMembers,enemyTypes:[],enemyHps:[]};fighting=true;
    testMembers[0].currentHp=0;defeatPartyMember(testMembers[0]);
    testAssert.equal(fighting,true);testAssert.equal(ended,0);
    testMembers[1].currentHp=0;defeatPartyMember(testMembers[1]);
    testAssert.equal(reviveDefeatedTeammates(Date.now()+20000),0);testAssert.equal(testMembers[1].alive,false);
    const p=getProgress();p.potions=2;p.inventory=p.inventory.filter(i=>i.id!=='healing-potion');p.inventory.push({id:'healing-potion',kind:'consumable',name:'治癒藥水',quantity:2});saveProgress(p);
    testMembers[2].currentHp=Math.ceil(testMembers[2].maxHp/2);
    testAssert.equal(useSharedHealingPotionForMember(testMembers[2]),true);
    testMembers[2].currentHp=0;defeatPartyMember(testMembers[2]);testAssert.equal(ended,1);
  `);checks+=5;
  // Preparing a scene is before the transaction, so initialization failure cannot charge a ticket.
  const f2=await fixture(),rt2=Runtime.create({store:f2.store,account:f2.a});
  const bad=D.create({runtime:rt2,prepareMembers:()=>{throw Error('prepare failure');}});
  await assert.rejects(()=>bad.enter(),/prepare failure/);checks++;
  check((await f2.store.read(accountId)).permanent.bag.items[0].quantity===3,'failed preparation never charges');
  await rt2.deactivate();
  const f3=await fixture();let lost=true;
  const original=f3.store.skullcrusherAction.bind(f3.store);
  f3.store.skullcrusherAction=async(...args)=>{const result=await original(...args);if(args[2].type==='enter'&&lost){lost=false;throw Error('temporary API response lost');}return result;};
  const rt3=Runtime.create({store:f3.store,account:f3.a});let starts=0;
  const retried=D.create({runtime:rt3,prepareMembers:members,activate:()=>starts++,now:()=>9000,generate:()=> 'test-run-response'});
  await assert.rejects(()=>retried.enter(),/response lost/);checks++;
  check(D.active(await f3.store.read(accountId))?.status==='active'&&!retried.scene,'temporary request failure does not abort or activate an unknown result');
  await retried.enter();
  check(starts===1&&rt3.getInventorySnapshot().items[0].quantity===2,'response-loss retry adopts original committed scene without another pass');
  rt3.onDeactivate(()=>retried.dispose());await rt3.deactivate();
  const reopened=Store.wrap(await Offline.open({indexedDB:f3.db,name:'skullcrusher',version:2}));
  const stopped=await reopened.read(accountId);
  check(stopped.skullcrusherDungeon.runs['test-run-response'].status==='aborted'&&!stopped.skullcrusherDungeon.activeRunId,'session termination persists abort before store closes');reopened.close();
  const f4=await fixture();
  const races=await Promise.allSettled([f4.store.skullcrusherAction(accountId,f4.a.revision,enter('different-run-a')),f4.store.skullcrusherAction(accountId,f4.a.revision,enter('different-run-b'))]);
  check(races.filter(r=>r.status==='fulfilled').length===1&&(await f4.store.read(accountId)).permanent.bag.items[0].quantity===2,'different parallel requests cannot create two active runs');f4.store.close();
  const f5=await fixture(),rt5=Runtime.create({store:f5.store,account:f5.a});
  const winner=D.create({runtime:rt5,prepareMembers:members,generate:()=> 'test-run-boss-race',now:()=>10000});
  const won=await winner.enter();
  check(winner.claimOutcome('succeeded','boss-defeated')&&!winner.claimOutcome('failed','party-defeated'),'first observed terminal outcome wins');
  won.members.forEach(m=>{m.currentHp=0;m.alive=false;});await winner.checkDefeat();
  check(!!winner.scene,'later death cannot replace claimed boss success');
  await winner.end('failed','party-defeated');await winner.end('exited','player-exit');
  const persisted=await f5.store.read(accountId);
  check(persisted.skullcrusherDungeon.runs['test-run-boss-race'].status==='succeeded'&&persisted.permanent.bag.items[0].quantity===2&&rt5.getSharedGold()===0,'single persisted success, one pass, no rewards despite competing end');
  await rt5.deactivate();
  // Exercise the real development installer and combat callbacks with the real
  // account transaction runtime, still using the isolated memory database.
  const f6=await fixture(),rt6=Runtime.create({store:f6.store,account:f6.a}),integrated=loadGame();
  integrated.context.realDungeonRuntime=rt6;integrated.context.crypto=require('node:crypto').webcrypto;
  integrated.evaluate(`PermanentPartyRuntime.activate(realDungeonRuntime);requestAnimationFrame=()=>0;window.location={href:'http://localhost/?skullcrusher-lifecycle=1',search:'?skullcrusher-lifecycle=1'};installSkullcrusherLifecyclePreview();`);
  await integrated.context.skullcrusherLifecyclePreview.enter();
  check(integrated.evaluate(`fighting&&battle.enemyTypes.length===3&&battle.partyMembers.length===3`),'real installer enters first combat wave through the account lifecycle');
  check(rt6.getInventorySnapshot().items[0].quantity===2,'integrated combat entry consumes exactly one pass');
  integrated.evaluate(`const controller=window.skullcrusherLifecyclePreview;while(controller.scene.step<5)controller.advance();loadSkullcrusherEncounter(controller.scene);Math.random=()=>0;applyDamageToMonster(0,1e9,{damageType:'physical',attackRange:'ranged'},{attacker:battle.partyMembers[0],canEvade:false,canParry:false});`);
  await integrated.context.skullcrusherLifecyclePreview.end('succeeded','boss-defeated');
  const integratedSave=await f6.store.read(accountId),integratedRun=Object.values(integratedSave.skullcrusherDungeon.runs)[0];
  check(integratedRun.status==='succeeded'&&!integratedSave.skullcrusherDungeon.activeRunId&&integrated.evaluate(`!fighting&&battle.enemyTypes.length===0`),'actual boss kill saves success and clears the real combat scene');
  await rt6.deactivate();
  console.log('Skullcrusher lifecycle: '+checks+' checks passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
