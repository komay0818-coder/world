const assert=require('node:assert/strict'),P=require('../offline-settlement-policy'),F=require('./offline-skill-fixture');
function fixture(size=1,ms=60000,options={}){
  const members=Array.from({length:size},(_,i)=>F.member(i===1?'mage':'warrior',{id:'m'+i,isMain:!i,...options}));
  members[0].progress.potions=options.potions||0;members[0].progress.manaPotions=options.manaPotions||0;
  members.forEach(m=>{m.level=options.level||30;});
  const snapshot=F.snapshot(members,{id:'plainsGoblinYoung',maxHp:100,attack:0,attackSpeed:1,...options.monster});
  snapshot.mapId='plains-entrance';snapshot.map={id:'plains-entrance',chapter:1,min:1,max:5};
  const slots=members.map(m=>({character:m.character,progress:{level:options.level||30,xp:0,gold:20,potions:options.potions||0,manaPotions:options.manaPotions||0,inventory:[{id:'healing-potion',kind:'consumable',quantity:options.potions||0},{id:'mana-potion',kind:'consumable',quantity:options.manaPotions||0}],lastActiveAt:1000,selectedMapId:'plains-entrance'}}));
  snapshot.consumables.gold=20;
  return P.createJob({accountId:'fixture',characterId:'m0',revision:0,slots,snapshot,map:{id:'plains-entrance',chapter:1,min:1,max:5,normalXp:10},now:1000+ms,seed:12345});
}
let cases=0;
for(let size=1;size<=3;size++){
  const job=fixture(size),before=JSON.stringify(job),a=P.calculate(job),b=P.calculate(job);
  assert.deepEqual(a,b);assert.equal(JSON.stringify(job),before);assert.equal(a.report.gainedGold,a.report.defeated*2);assert.ok(a.report.defeated>0);assert.equal(a.report.claimed,false);cases++;
  const no=P.calculate(fixture(size,59999));assert.equal(no.report.defeated,0);assert.equal(no.slots[0].progress.gold,20);cases++;
}
{
 const j=fixture(1,60000,{level:1});j.slots[0].progress.xp=require('../map-exp-policy').requiredXp(1)-1;assert.throws(()=>P.calculate(j),/stats calculator/);const result=P.calculate(j,{statsAfterLevel:()=>({hp:100000})});assert.ok(result.report.levelsGained>0);assert.equal(j.snapshot.members[0].level,1);assert.equal(result.slots[0].progress.offlinePartyRuntime.member.level,1,'frozen combat level');cases++;
 const advanced=fixture(1,60000,{level:45});assert.equal(P.calculate(advanced).slots[0].progress.level,45,'never downgrade advanced saves');cases++;
}
for(const stock of [0,1,3]){
 const j=fixture(3,60000,{hp:100,currentHp:20,potions:stock,manaPotions:stock});
 const result=P.calculate(j);assert.equal(result.slots[0].progress.potions,stock-result.report.potionsUsed);assert.ok(result.report.potionsUsed<=stock);cases++;
}
{
 const j=fixture(1,60000,{hp:100,monster:{attack:10000,maxHp:1000000}}),r=P.calculate(j);
 assert.equal(r.report.died,true);assert.equal(r.report.gainedGold,0);assert.equal(r.slots[0].progress.requiresMapSelectionAfterDefeat,true);assert.equal(r.slots[0].progress.partyMemberState.currentHp,100);cases++;
}
{
 const j=fixture(1);j.snapshot.monsters[0].maxHp=1e12;assert.equal(P.calculate(j).report.defeated,0);cases++;
 const mismatch=fixture(1);mismatch.snapshot.members[0].id='wrong';assert.throws(()=>P.createJob({...mismatch,characterId:'m0'}));cases++;
}
{
 const j=fixture(1);j.snapshot.monsters[0].lootConfig=require('../equipment-drop-policy').getDefaultLootConfig(j.snapshot.monsters[0]);
 // Force a real configured equipment drop using the actual public policy, then restore its rate.
 j.snapshot.monsters[0].lootConfig={equipmentDropRate:1,rarityWeights:{common:1},equipmentPools:['chapter_one_weapons'],chapter:1};
 const policy=require('../equipment-drop-policy');j.snapshot.monsters[0].lootConfig=policy.TEST_LOOT_CONFIGS?.normal||policy.getDefaultLootConfig({});
 assert.ok(j.snapshot.monsters[0].lootConfig);{j.snapshot.monsters[0].lootConfig={...j.snapshot.monsters[0].lootConfig,equipmentDropRate:1};const r=P.calculate(j);assert.ok(r.report.equipmentFound>0);assert.deepEqual(r,P.calculate(j));cases++;}
}
{
 const legacy={character:JSON.stringify({name:'old',job:'warrior'}),progress:JSON.stringify({level:5,gold:7,potions:2,partyMemberState:{currentHp:8}})};
 const slots=P.migrateLegacy(legacy);assert.equal(slots[0].character.id,'character-slot-1');assert.equal(slots[0].progress.gold,7);assert.equal(slots[0].progress.partyMemberState.currentHp,8);assert.equal(typeof legacy.character,'string');cases++;
 const existing=P.migrateLegacy({slots:JSON.stringify([null,{character:{id:'stable'},progress:{inventory:[{id:'kept'}],offlineOld:{gold:10}}}])});assert.equal(existing[0],null);assert.equal(existing[1].progress.offlineOld.gold,10);cases++;
}
{
 const j=fixture(2,60000,{hp:100,currentHp:100,potions:1});j.snapshot.members[1].alive=false;j.snapshot.members[1].currentHp=0;j.snapshot.members[1].reviveInMs=10000;
 const r=P.calculate(j);assert.equal(r.report.potionsUsed,1);assert.equal(r.slots[1].progress.partyMemberState.alive,true);assert.equal(r.slots[1].progress.xp,0);cases++;
 const empty=structuredClone(j);empty.snapshot.consumables.potions=0;empty.slots[0].progress.potions=0;const dead=P.calculate(empty);assert.equal(dead.slots[1].progress.partyMemberState.alive,false);cases++;
}
{
 const j=fixture(1),r=P.calculate(j,{statsAfterLevel:()=>({hp:200000})});assert.equal(r.slots[0].progress.partyMemberState.maxHp,200000);assert.equal(j.snapshot.members[0].maxHp,100000);cases++;
}
{
 const j=fixture(2,60000,{hp:100,potions:0});j.snapshot.members[1].alive=false;j.snapshot.members[1].currentHp=0;j.snapshot.members[1].reviveInMs=10000;
 const r=P.calculate(j),restored=P.restoreRuntime({slots:r.slots,characterId:'m0',now:100000});assert.equal(restored.length,2);assert.equal(restored[1].alive,false);assert.equal(restored[1].currentHp,0);assert.equal(restored[1].reviveAt,50000);cases++;
 assert.throws(()=>P.restoreRuntime({slots:r.slots,characterId:'m1',now:100000}),/owner/);cases++;
 const fatal=P.calculate(fixture(1,60000,{hp:100,monster:{attack:10000,maxHp:1000000}}));assert.equal(P.restoreRuntime({slots:fatal.slots,characterId:'m0',now:100000}),null);cases++;
}
for(const [mapId,chapter,itemId] of [['wolf-den',1,'wolf-fur'],['black-forest-entrance',2,'rune-life'],['redrock-wastes-entrance',3,'redrock-ore']]){
 const j=fixture(1,600000);if(chapter===3)j.snapshot.monsters[0].id='redrock-giant-lizard';j.map={id:mapId,chapter,min:1,max:45,normalXp:10};j.snapshot.mapId=mapId;j.snapshot.map={...j.map};j.snapshot.members[0].stats.attack=1e6;
 if(chapter<3)j.snapshot.monsters[0].lootConfig=require('../equipment-drop-policy').getDefaultLootConfig({chapter});else delete j.snapshot.monsters[0].lootConfig;
 const a=P.calculate(j),b=P.calculate(j);assert.deepEqual(a,b,mapId+' all reward rolls reproduce');
 if(chapter<3)assert.ok(a.slots[0].progress.inventory.some(item=>item.id===itemId),mapId+' material/rune reaches inventory');
 else assert.ok(a.report.materials.length>0,'chapter three material reaches inventory');
 cases++;
}
{
 const j=fixture(1,13*3600000);assert.equal(j.durationMs,43200000);cases++;
 const bad=fixture(1);bad.snapshot.members[0].level=2;assert.throws(()=>P.createJob({...bad}),/level snapshot/);cases++;
}
{
 const m=F.member('warrior',{id:'m0'}),j=fixture(1);
 const captured=P.captureDeparture({slots:j.slots,members:[m],map:j.map,monsters:j.snapshot.monsters,fighting:false,now:5000,characterId:'m0'});
 assert.equal(j.slots[0].progress.lastActiveAt,1000);assert.equal(captured.slots[0].progress.lastActiveAt,5000);assert.equal(captured.snapshot.eligible,false);cases++;
 const idle=P.createJob({...j,...captured,now:3605000});assert.equal(P.calculate(idle).report.gainedGold,0);cases++;
}
{
 const j=fixture(1,600000);j.map={id:'plains-depths',chapter:1,min:1,max:15,normalXp:10};j.snapshot.mapId=j.map.id;j.snapshot.map={...j.map};j.snapshot.monsters[0].id='blackstoneScout';j.snapshot.members[0].stats.attack=1e6;
 const a=P.calculate(j);assert.deepEqual(a,P.calculate(j));assert.ok(a.slots[0].progress.inventory.some(i=>i.slot==='offhand'&&i.quality==='rare'),'plains depths offline rewards use blue offhands');cases++;
 const early=fixture(1,600000);early.snapshot.members[0].stats.attack=1e6;const earlyResult=P.calculate(early);assert.ok(earlyResult.slots[0].progress.inventory.some(i=>i.slot==='offhand'&&i.quality==='uncommon'),'early chapter-one offline rewards include green offhands');cases++;
}
console.log('Offline settlement reward cases passed:',cases);
module.exports={fixture};
