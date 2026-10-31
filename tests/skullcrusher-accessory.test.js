'use strict';
const assert=require('node:assert/strict');
const D=require('../skullcrusher-accessory-policy'),A=require('../equipment-affix-policy'),E=require('../equipment-policy');
const P=require('../permanent-party-policy'),Sale=require('../inventory-sale-policy'),O=require('../permanent-online-policy');
const Store=require('../permanent-party-store'),Offline=require('../offline-settlement-store'),Runtime=require('../permanent-party-runtime');
const memoryDB=require('./helpers/memory-indexeddb'),{loadGame}=require('../tools/headless-game-runtime');
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;},copy=x=>JSON.parse(JSON.stringify(x));
function chosen(key,stats,uniqueId='chosen') {
 const t=D.TEMPLATES[key],fixed=t.fixedAffixDefinitions.map(a=>a.stat),available=D.AFFIXES.filter(a=>!fixed.includes(a.stat)),rolls=[0,0];
 for(const stat of stats){const index=available.findIndex(a=>a.stat===stat);assert.ok(index>=0,'available '+stat);rolls.push((index+.5)/available.length);available.splice(index,1);}
 return D.createEquipment(t.id,{uniqueId,random:()=>rolls.shift()??0});
}
const basic=Object.values(D.TEMPLATES).map(t=>D.createEquipment(t.id,{uniqueId:'basic-'+t.id,random:()=>0}));
for(const item of basic){
 check(item.quality==='rare'&&item.fixedAffixes.length===2&&item.randomAffixes.length===3&&item.affixes.length===5,'rare structure '+item.name);
 check(item.instanceId===item.id&&item.baseItemId!==item.id&&!item.dropEnabled,'instance and unreleased drop gate');
 check(E.isPreservedEquipment(item)&&E.removeLegacyEquipmentFromInventory([item]).length===1,'old migration preserves accessory');
 check(JSON.stringify(A.normalizeEquipment(copy(item)))===JSON.stringify(item),'normalize preserves complete instance exactly');
 const bad=copy(item);bad.randomAffixes[0].value++;bad.randomAffixes[0].components[0].value++;bad.affixes[2]=copy(bad.randomAffixes[0]);assert.throws(()=>A.normalizeEquipment(bad),/fixed/);checks++;
 const candidates=D.AFFIXES.filter(a=>!item.fixedAffixes.some(f=>f.stat===a.stat));
 for(let i=0;i<candidates.length;i++){
  let n=0;const selected=D.createEquipment(item.baseItemId,{uniqueId:'uniform-'+i,random:()=>++n<=2?0:n===3?(i+.5)/candidates.length:0});
  check(selected.randomAffixes[0].id===candidates[i].id,'uniform first-draw interval');
 }
}
let seed=7;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
for(const t of Object.values(D.TEMPLATES))for(let n=0;n<50;n++){
 const item=D.createEquipment(t.id,{uniqueId:'sample-'+n,random});
 check(new Set(item.affixes.map(a=>a.stat)).size===5&&item.randomAffixes.every(a=>D.AFFIXES.some(d=>a.id===d.id&&a.value===d.value)),'distinct stats and exclusive fixed values');
 check(A.normalizeEquipment(copy(item)).randomAffixes.every((a,i)=>a.value===item.randomAffixes[i].value),'sample restore is stable');
}
const allJobs=['warrior','assassin','hunter','mage','priest'];
for(const t of Object.values(D.TEMPLATES))for(const job of allJobs) {
 const slots=E.getEquipSlots(t,job),allowed=t.allowedJobs.includes(job);
 check(allowed?JSON.stringify(slots)===JSON.stringify(t.slot==='ring'?['ring1','ring2']:['necklace']):slots.length===0,'job and slot '+t.name+'/'+job);
}
for(const slot of ['ring','ring1','ring2','necklace']){
 const jewel={kind:'equipment',slot,quality:'rare',affixSchemaVersion:4,fixedAffixes:[],randomAffixes:[]};
 check(!A.canReforgeEquipment(jewel),'all jewelry rejects reforge capability');
 assert.throws(()=>A.convertEquipmentForReforge(jewel),/cannot be reforged/);checks++;
}
for(const chapter of [1,2,3]){
 const offhand={...E.OFFHAND_CATALOG.crudeQuiver,kind:'equipment',slot:'offhand',quality:'rare',allowedJobs:['hunter']};
 check(A.getAvailableAffixes(offhand,[],{chapter,quality:'rare'}).every(a=>!a.id.startsWith('skullcrusher-jewel-')),'shared offhand pool excludes dungeon whitelist');
}
const mixed=chosen('guardianNecklace',['criticalChance','criticalDamagePercent','skillDamagePercent']);
check(mixed.randomAffixes.length===3,'exclusive pool allows critical chance alongside critical damage');
const war=chosen('warSoulRing',['maxHp','attackFlat','hpRegeneration'],'war-a');
const war2=chosen('warSoulRing',['maxHp','attackFlat','hpRegeneration'],'war-b');
const fury=chosen('furyRing',['eliteDamagePercent','attackFlat','killHealthRecoveryPercent'],'fury');
const arcane=chosen('arcaneNecklace',['maxHp','attackFlat','hpRegeneration'],'arcane');
const sums=A.getEquippedAffixStats({ring1:war,ring2:war2,necklace:mixed});
check(sums.attackFlat===20&&sums.criticalChance===18&&sums.criticalDamagePercent===32&&sums.defenseFlat===15&&sums.damageReductionPercent===3,'dual ring and necklace affix sums');

const g=loadGame();g.context.jewels={war,war2,fury,arcane,guardian:mixed};g.context.testAssert=assert;
g.evaluate(`
 requestAnimationFrame=()=>0;
 const testCharacter={id:'jewel-warrior',job:'warrior',race:'human',faction:'light',name:'test'};
 const jewelProgress={level:45,xp:0,equipment:{},skillLevels:{},currentHpRatio:1};
 localStorage.setItem('stardust-character',JSON.stringify(testCharacter));localStorage.setItem('stardust-progress',JSON.stringify(jewelProgress));
 localStorage.setItem('stardust-character-slots',JSON.stringify([{character:testCharacter,progress:jewelProgress}]));setActiveCharacterSlotIndex(0);
 const naked=getCharacterStats(45,jewelProgress,testCharacter);
 jewelProgress.equipment={ring1:jewels.war,ring2:jewels.war2,necklace:jewels.guardian};
 const decorated=getCharacterStats(45,jewelProgress,testCharacter),flat=getEquipmentStats(jewelProgress,testCharacter);
 testAssert.equal(flat.attack,30);testAssert.equal(flat.attackFlat,20);testAssert.equal(flat.defense,15);testAssert.equal(flat.hp,100);testAssert.equal(flat.maxHp,120);
 testAssert.equal(flat.hpRegeneration,20);testAssert.ok(Math.abs(decorated.crit-naked.crit-.18)<1e-9);testAssert.ok(Math.abs(decorated.criticalDamageMultiplier-naked.criticalDamageMultiplier-.32)<1e-9);
 testAssert.equal(decorated.damageReduction,.03);testAssert.ok(decorated.defense>naked.defense&&decorated.hp>naked.hp&&decorated.attack>naked.attack);
 jewelProgress.equipment.extra={kind:'equipment',damageReduction:.49};testAssert.equal(getCharacterStats(45,jewelProgress,testCharacter).damageReduction,.5);
 jewelProgress.equipment={};testAssert.deepEqual(getCharacterStats(45,jewelProgress,testCharacter),naked);
 const mageCharacter={...testCharacter,id:'jewel-mage',job:'mage'},mp={...jewelProgress,equipment:{necklace:jewels.arcane}};
 const mageBase=getCharacterStats(45,jewelProgress,mageCharacter),mageStats=getCharacterStats(45,mp,mageCharacter);
 testAssert.equal(mageStats.mana-mageBase.mana,84);testAssert.equal(mageStats.manaRegen,1.2);testAssert.equal(mageStats.cooldownSpeed,1.08);
 const regenMember=createBattlePartyMember({character:mageCharacter,progress:mp},0,mageCharacter.id);regenMember.currentHp=1;regenMember.resourceCurrent=regenMember.resourceMax/2;regenMember.lastManaRegenAt=1000;regenMember.lastHpRegenerationAt=1000;
 updatePartyMemberResource(regenMember,2000);updatePartyMemberHealthRegeneration(regenMember,2000);
 testAssert.ok(regenMember.resourceCurrent>regenMember.resourceMax/2&&regenMember.currentHp>1);
 testAssert.ok(itemStatsText({kind:'equipment',criticalChance:.05,criticalDamageBonus:.10}).includes('5%'));testAssert.ok(itemStatsText(jewels.guardian).includes('防禦 +15'));
`);checks+=16;
// Exercise the live outgoing-damage and kill-recovery paths with controlled randomness.
g.evaluate(`
 Math.random=()=>0;
 function damageProbe(item,type='skullcrusher-great-chieftain',kind='skill'){
  const p={...jewelProgress,equipment:item?{ring1:item}:{}},member=createBattlePartyMember({character:testCharacter,progress:p},0,testCharacter.id);
  battle={sessionId:1,dungeonId:'skullcrusher-war-camp',partyMembers:[member],enemyTypes:[type],enemyLevels:[30],enemyHps:[20000],enemyRespawns:[null],enemySpawnedAt:[1000],enemyDots:[[]],enemySkillStates:[],enemyDamages:[[]],enemyAffixes:[[]],enemyNextAttackAt:[999999],targetIndexes:[],damageTimers:[]};fighting=true;
  const value=applyDamageToMonster(0,1000,{damageType:'physical',attackRange:'ranged'},{attacker:member,attackKind:kind,canEvade:false,canParry:false,showDamage:false}).finalDamage;
  return {value,member};
 }
 const baseBoss=damageProbe(null).value,affixBoss=damageProbe(jewels.fury).value;
 testAssert.ok(affixBoss>baseBoss*1.18&&affixBoss<baseBoss*1.20);
 const baseElite=damageProbe(null,'skullcrusher-champion').value,affixElite=damageProbe(jewels.fury,'skullcrusher-champion').value;
 testAssert.ok(affixElite>baseElite*1.23&&affixElite<baseElite*1.25);
 const kill=damageProbe(jewels.fury,'skullcrusher-berserker');kill.member.currentHp=1;battle.enemyHps[0]=1;applyDamageToMonster(0,1e6,{damageType:'physical',attackRange:'ranged'},{attacker:kill.member,attackKind:'skill',canEvade:false,canParry:false,showDamage:false});testAssert.equal(kill.member.currentHp,1+Math.ceil(kill.member.maxHp*.04));
 fighting=false;
`);checks+=3;
g.evaluate(`
 function incomingProbe(item){
  const p={...jewelProgress,equipment:item?{necklace:item}:{}},member=createBattlePartyMember({character:testCharacter,progress:p},0,testCharacter.id);
  member.currentHp=member.maxHp=20000;
  battle={sessionId:1,dungeonId:'skullcrusher-war-camp',partyMembers:[member],enemyTypes:['skullcrusher-berserker'],enemyLevels:[30],enemyHps:[1180],enemyRespawns:[null],enemySpawnedAt:[Date.now()],enemyDots:[[]],enemySkillStates:[],enemyDamages:[[]],enemyAffixes:[[]],enemyNextAttackAt:[0],targetIndexes:[],damageTimers:[]};fighting=true;
  Math.random=()=>.5;enemyAttackTick();return 20000-member.currentHp;
 }
 const guardianNoReduction={...jewels.guardian,affixes:jewels.guardian.affixes.filter(a=>a.stat!=='damageReductionPercent')};
 const unarmoredHit=incomingProbe(null),defenseHit=incomingProbe(guardianNoReduction),reducedHit=incomingProbe(jewels.guardian);
 testAssert.ok(defenseHit<unarmoredHit&&reducedHit<defenseHit);
 function cooldownProbe(item){
  const p={level:1,xp:0,equipment:item?{necklace:item}:{},skillLevels:{'mage:fireball':1}},mage=createBattlePartyMember({character:mageCharacter,progress:p},0,mageCharacter.id,1000);
  battle={sessionId:1,dungeonId:'skullcrusher-war-camp',partyMembers:[mage],enemyTypes:['skullcrusher-shaman'],enemyLevels:[30],enemyHps:[100000],enemyRespawns:[null],enemySpawnedAt:[1000],enemyDots:[[]],enemySkillStates:[],enemyDamages:[[]],enemyAffixes:[[]],enemyNextAttackAt:[999999],targetIndexes:[],damageTimers:[]};fighting=true;Math.random=()=>0;
  useAutoSkillForMember(mage,2000);return mage.skillCooldowns.fireball-2000;
 }
 const normalCooldown=cooldownProbe(null),fasterCooldown=cooldownProbe(jewels.arcane);
 testAssert.ok(normalCooldown>fasterCooldown&&Math.abs(normalCooldown/fasterCooldown-1.08)<1e-8);
 fighting=false;
`);checks+=2;

(async()=>{
 const db=memoryDB(),accountId='supabase:33333333-3333-4333-8333-333333333333';
 let store=Store.wrap(await Offline.open({indexedDB:db,name:'jewelry-test',version:2}));
 let account=(await store.initializeSupabaseAccount(accountId,{now:1000})).account;
 for(let i=0;i<2;i++)account=(await store.execute(accountId,account.revision,'jewel-character-'+i,{type:'create',id:'character-jewel-'+i,slotIndex:i,character:{...{name:'test',faction:'light',race:'human',gender:'male'},id:'character-jewel-'+i,job:i?'mage':'warrior'},progress:{level:45,xp:0,gold:0,equipment:{},skillLevels:{}}},{coordinated:true,now:1000})).account;
 account=(await store.execute(accountId,account.revision,'jewel-switch',{type:'switch-main',characterId:'character-jewel-0'},{coordinated:true,now:1000})).account;
 const model=copy(account.permanent);model.bag.items.push(war,war2,mixed,arcane,fury);model.equipmentOwners=O.owners(model);
 account=(await store.commitOnline(accountId,account.revision,'dev-jewel-seed',model)).account;
 if(store.reforgeEquipment){
  for(const type of ['type','value']){
   const before=await store.read(accountId);
   await assert.rejects(()=>store.reforgeEquipment(accountId,before.revision,'jewel-deny-'+type,{type,instanceId:war.id,slotKey:'random-0',characterId:'character-jewel-0'}),/not eligible/);checks++;
   check(JSON.stringify(await store.read(accountId))===JSON.stringify(before),'reforge execution rejects jewelry before charging or mutating');
  }
 }
 const rt=Runtime.create({store,account});
 rt.command({type:'equip',characterId:rt.mainId,instanceId:war.instanceId,slot:'ring1'});await rt.flush();
 rt.command({type:'equip',characterId:rt.mainId,instanceId:war2.instanceId,slot:'ring2'});await rt.flush();
 check(rt.model.characters[rt.mainId].progress.equipment.ring1.id!==rt.model.characters[rt.mainId].progress.equipment.ring2.id,'same named ring in two slots uses distinct instances');
 assert.throws(()=>P.apply(rt.model,{type:'equip',characterId:rt.mainId,instanceId:war.instanceId,slot:'ring2'}),/not in bag/);checks++;
 assert.throws(()=>P.apply(rt.model,{type:'equip',characterId:rt.mainId,instanceId:arcane.instanceId,slot:'necklace'}),/restriction/);checks++;
 rt.command({type:'equip',characterId:rt.mainId,instanceId:mixed.instanceId,slot:'necklace'});await rt.flush();
 rt.command({type:'equip',characterId:'character-jewel-1',instanceId:fury.instanceId,slot:'ring1'});await rt.flush();
 rt.command({type:'exchange',characterId:rt.mainId,slot:'ring2',otherCharacterId:'character-jewel-1',otherSlot:'ring1'});await rt.flush();
 check(rt.model.equipmentOwners[war2.id].characterId==='character-jewel-1'&&rt.model.characters[rt.mainId].progress.equipment.ring2.id===fury.id,'cross-character exchange preserves identity and ownership');
 assert.throws(()=>Sale.applyAccountSale(rt.model,[{kind:'equipment',instanceId:war.id}],P),/missing|Equipped|already sold/);checks++;
 rt.command({type:'unequip',characterId:rt.mainId,slot:'ring1'});await rt.flush();
 const protectedModel=copy(rt.model);protectedModel.bag.items.find(i=>i.id===war.id).locked=true;
 assert.throws(()=>Sale.applyAccountSale(protectedModel,[{kind:'equipment',instanceId:war.id}],P),/Protected/);checks++;
 const sold=Sale.applyAccountSale(rt.model,[{kind:'equipment',instanceId:war.id}],P);
 check(sold.proceeds===60&&sold.model.accountResources.gold===60,'unworn rare jewelry uses shared-gold sale price');
 const savedBefore=copy(rt.getCommitted());await rt.deactivate();
 store=Store.wrap(await Offline.open({indexedDB:db,name:'jewelry-test',version:2}));const restored=await store.read(accountId);
 check(JSON.stringify(restored.permanent)===JSON.stringify(savedBefore.permanent),'database close/relogin restores complete equipment and bag');
 for(const item of [...restored.permanent.bag.items,...Object.values(restored.permanent.characters).flatMap(c=>Object.values(c.progress.equipment).filter(Boolean))])if(D.getTemplate(item))check(JSON.stringify(A.normalizeEquipment(item))===JSON.stringify(item),'restored exclusive affixes never reroll or adopt chapter values');
 const ui=loadGame(),r=Runtime.create({store,account:restored});ui.context.PermanentPartyRuntime={current:r};ui.context.crypto=require('node:crypto').webcrypto;
 ui.evaluate(`renderInventory=()=>{};logBattle=()=>{};showToast=()=>{};equipItem('${war.id}','ring1');`);await r.flush();
 check(r.model.characters[r.mainId].progress.equipment.ring1.id===war.id,'real equip button handler targets ring1');
 ui.evaluate(`unequipItem('ring1');equipItem('${war.id}','ring2');`);await r.flush();
 check(r.model.characters[r.mainId].progress.equipment.ring2.id===war.id,'real equip/unequip handler targets ring2');
 await assert.rejects(()=>ui.context.generateSkullcrusherAccessoryPreviewItems(),/Development/);checks++;
 ui.context.location={href:'http://localhost/?skullcrusher-accessories=1',search:'?skullcrusher-accessories=1'};
 const added=await ui.context.generateSkullcrusherAccessoryPreviewItems();await r.flush();
 check(added.ok&&added.items.length===4&&added.items.every(item=>r.getInventorySnapshot().items.some(i=>i.id===item.id)),'only gated development generator writes four instances to shared bag');
 await r.deactivate();
 console.log('Skullcrusher accessories: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
