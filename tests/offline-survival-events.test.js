const assert=require('node:assert/strict');
const {member,snapshot}=require('./offline-skill-fixture');
const P=require('../offline-party-policy');
function quiet(job,options={}){
  const m=member(job,options);m.stats.attack=0;m.nextAttackAt=100000000;
  m.skillCooldowns=Object.fromEntries(Object.keys(m.progress.skillLevels).map(k=>[k.split(':')[1],100000000]));
  return m;
}
function run(party,ms=100,options={},monster={}){
  return P.simulate({snapshot:snapshot(party,{attackInterval:100000000,...monster}),durationMs:ms,
    skills:true,survival:true,random:()=>.5,trace:true,...options});
}
for(let count=1;count<=3;count++){
  const party=Array.from({length:count},(_,i)=>quiet('warrior',{id:'m'+i,isMain:!i,hp:100,currentHp:20}));
  party[0].progress.potions=count;
  const result=run(party);assert.deepEqual(result.members.map(m=>m.currentHp),Array(count).fill(50));
  assert.equal(result.consumables.hpUsed,count);assert.equal(result.consumables.potions,0);
  assert.deepEqual(result.events.filter(e=>e.type==='hp-potion').map(e=>e.memberId),party.map(m=>m.id));
}
{
  const party=[quiet('warrior',{hp:100,currentHp:20}),quiet('warrior',{id:'ally',isMain:false,hp:100,currentHp:20})];
  party[0].progress.potions=1;
  assert.deepEqual(run(party).members.map(m=>m.currentHp),[50,20],'same-time main gets last HP potion');
  party[0].progress.potions=0;party[0].progress.gold=50;
  const result=run(party);assert.equal(result.consumables.purchased,0);assert.equal(result.consumables.goldSpent,0);
  assert.equal(result.consumables.potions,0);assert.equal(result.consumables.gold,50);
  assert.deepEqual(result.members.map(m=>m.currentHp),[20,20],'offline cannot purchase even with sufficient gold');
}
{
  const party=[quiet('mage',{resource:100,stats:{manaRegen:0}}),quiet('priest',{id:'ally',isMain:false,resource:100,stats:{manaRegen:0}})];
  party[0].progress.manaPotions=1;
  const result=run(party,1000);assert.deepEqual(result.members.map(m=>m.resourceCurrent),[300,100]);
  assert.ok(result.members.every(m=>m.manaExhausted));assert.equal(result.consumables.mpUsed,1);
  assert.equal(result.members[0].combatTelemetry?.skillCasts&&Object.keys(result.members[0].combatTelemetry.skillCasts).length||0,0);
  assert.equal(party[0].progress.manaPotions,1,'simulation cannot mutate original inventory');
}
{
  const main=quiet('warrior',{hp:100}),ally=quiet('warrior',{id:'ally',isMain:false,hp:100,currentHp:0});
  ally.alive=false;ally.reviveAt=11000;main.progress.potions=1;
  const before=run([main,ally],9900);assert.equal(before.members[1].alive,false);
  const at=run([main,ally],10000);assert.equal(at.members[1].currentHp,30);assert.equal(at.members[1].alive,true);
  assert.equal(at.members[1].nextAttackAt,12000);assert.equal(at.consumables.reviveUsed,1);
  const attack=run([main,ally],11000);assert.equal(attack.members[1].combatTelemetry.basicEvents[0].atMs,12000);
  const noStock=run([quiet('warrior'),ally],12000);assert.equal(noStock.members[1].alive,false);
}
{
  const main=quiet('warrior'),dead=quiet('warrior',{id:'first',isMain:false,hp:100,currentHp:0}),hurt=quiet('warrior',{id:'second',isMain:false,hp:100,currentHp:20});
  main.progress.potions=1;dead.alive=false;dead.reviveAt=1000;
  const r=run([main,dead,hurt]);assert.equal(r.members[1].alive,true);assert.equal(r.members[2].currentHp,20);
  assert.equal(r.consumables.reviveUsed,1,'earlier party position wins revive/heal tie');
}
{
  const main=quiet('warrior',{hp:100});main.progress.potions=10;
  main.bleed={tickDamage:1000,nextTickAt:1100,expiresAt:10000};
  main.pendingClassHeals=[{id:'late',targetId:'main',dueAt:1100,amount:100}];
  const r=run([main],1000);assert.equal(r.died,true);assert.equal(r.deathAtMs,100);
  assert.equal(r.members[0].currentHp,0);assert.equal(r.consumables.hpUsed,0);
}
{
  const main=quiet('warrior'),ally=quiet('warrior',{id:'undead',isMain:false,hp:100});
  ally.character.race='undead';ally.bleed={tickDamage:1000,nextTickAt:1100,expiresAt:10000};
  const r=run([main,ally],100,{random:()=>.1});assert.equal(r.members[1].undeadRevived,true);assert.equal(r.members[1].currentHp,35);
}
{
  const main=quiet('warrior',{hp:100}),priest=quiet('priest',{id:'priest',isMain:false,advancedClass:'holy-priest',tier:6,hp:100});
  main.bleed={tickDamage:1000,nextTickAt:1100,expiresAt:130000,tickMs:1000};
  const first=run([main,priest],100);assert.equal(first.died,false);assert.equal(first.members[0].currentHp,16);
  assert.equal(first.members[1].priestTelemetry.guardianTriggers,1);
  const second=run([main,priest],1100);assert.equal(second.died,true);assert.equal(second.deathAtMs,1100);
  assert.equal(second.members[1].priestTelemetry.guardianTriggers,1,'120s shared protection cannot repeat');
  const departure=snapshot([main,priest]);departure.sacredGuardianInMs=120000;
  const blocked=P.simulate({snapshot:departure,durationMs:100,skills:true,survival:true,random:()=>.1});
  assert.equal(blocked.died,true,'departure shared cooldown must persist');
}
{
  const main=quiet('warrior'),priest=quiet('priest',{id:'priest',isMain:false,advancedClass:'holy-priest',tier:6}),undead=quiet('warrior',{id:'undead',isMain:false,hp:100});
  undead.character.race='undead';undead.bleed={tickDamage:1000,nextTickAt:1100,expiresAt:10000};
  const r=run([main,priest,undead],100,{random:()=>.1});
  assert.equal(r.members[2].currentHp,16);assert.equal(r.members[2].undeadRevived,false,'priest precedes undead');
}
{
  const m=quiet('mage',{resource:0,stats:{manaRegen:0}});m.nextAttackAt=1000;
  const r=run([m],3000);assert.deepEqual(r.members[0].combatTelemetry.basicEvents.map(e=>e.atMs),[1000,2300,3600]);
  assert.equal(r.consumables.mpUsed,0,'empty stock cannot become negative or buy mana potions');
}
console.log('offline survival: 1–3 party/shared potions/exhaustion/death/undead/priest/revival passed');
{
  const {seeded}=require('./offline-optimization-reference');
  for(const job of ['warrior','assassin','hunter','mage','priest']){
    const party=[member(job),member('priest',{id:'priest',isMain:false}),member('hunter',{id:'hunter',isMain:false})];
    party[0].progress.potions=10;party[0].progress.manaPotions=10;
    const departure=snapshot(party,{attack:100}),copy=JSON.stringify(departure);
    const simulate=()=>P.simulate({snapshot:departure,durationMs:30000,skills:true,survival:true,random:seeded(813),trace:true});
    const first=simulate();assert.deepEqual(first,simulate(),job+' uses fixed seed with every survival/skill event');
    assert.equal(JSON.stringify(departure),copy,'snapshot is immutable');
  }
  const original=global.setTimeout;
  global.setTimeout=()=>{throw new Error('Real timer used during offline survival');};
  try{run([quiet('warrior')],1000);}finally{global.setTimeout=original;}
  const m=quiet('warrior');m.progress.chapterThreeFacilities={'test':{'supply-station':0}};
  const unchanged=run([m],1000);m.progress.chapterThreeFacilities={'test':{'supply-station':10000}};
  assert.deepEqual(unchanged,run([m],1000),'facility progress/debuffs are excluded from stage A');
  const empty=P.capture({members:[m],monsters:[],mapId:'test',now:1000,fighting:true});
  assert.equal(P.simulate({snapshot:empty,skills:true,survival:true,durationMs:1000}).effectiveMs,0);
}
console.log('offline survival: five jobs seeded/no real timers/no save writes/no facility effects passed');
