const assert = require('node:assert/strict');
const policy = require('../mage-advancement-policy.js');

assert.equal(policy.FIRST_JOB_CHANGE_LEVEL, 45);
assert.equal(policy.ELEMENTALIST_SKILLS.length, 4);
assert.equal(policy.ARCANE_SKILLS.length, 4);
assert.deepEqual(policy.getEffect('elemental-burst', 6), { power:1.6, bonus:.4, extendStatuses:1, breakthrough:'元素崩解：命中三種元素狀態齊全的目標時，各延長 1 秒' });
assert.deepEqual(policy.getElementalBurstParts(policy.getEffect('elemental-burst', 6), { burning:true, slowed:true, paralyzed:true }).map(part=>part.power), [1.6,.4,.4,.4]);
assert.equal(policy.getEffect('elemental-storm',6).power,1.6);
assert.equal(policy.getEffect('elemental-storm',6).transformPowerMultiplier,.5);
assert.equal(policy.getElementalBurstParts(policy.getEffect('elemental-burst',6),{burning:true,slowed:true,shockedVulnerability:true}).length,4);
assert.deepEqual(policy.rollStormElements(policy.getEffect('elemental-storm', 6), (()=>{const rolls=[0,.29,.99];return()=>rolls.shift();})()), ['fire','lightning']);

const elementalist={progress:{advancedClass:'elementalist',skillLevels:{'mage:elemental-marks':6,'mage:resonance-overload':6}},skillCooldowns:{fireball:9000,blizzard:12000,'chain-lightning':10000}};
assert.deepEqual([1,2,3,4,5].map(targets=>targets>=3?1+(targets-2)*policy.getEffect('elemental-storm',6).multiTargetBonusPerTarget:1),[1,1,1.08,1.16,1.24]);
assert.equal(policy.addElementMark(elementalist,'fire',1000).resonance,false);
policy.addElementMark(elementalist,'ice',1000);
assert.equal(policy.addElementMark(elementalist,'lightning',1000).resonance,true);
assert.equal(elementalist.resonanceUntil,7000);
assert.equal(policy.reduceLongestElementCooldown(elementalist,1000),'blizzard');
assert.equal(elementalist.skillCooldowns.blizzard,10000);
assert.equal(policy.useElementDuringResonance(elementalist,'fire',2000),true);
assert.equal(elementalist.resonanceUntil,8000);
assert.deepEqual(policy.getResonanceBonuses(elementalist,'fire',2000),{damage:.2,crit:.1});
assert.deepEqual(policy.finishResonance(elementalist,8000),{power:1.5,element:'fire',targets:5});

const arcane={id:'arcane-test',progress:{advancedClass:'arcane-mage',skillLevels:{'mage:arcane-missile':6,'mage:arcane-charge':6,'mage:mana-drain':6}},resourceMax:1000,resourceCurrent:900,skillCooldowns:{'arcane-missile':5000,fireball:9000}};
const missileEffect=policy.getEffect('arcane-missile',6);
assert.deepEqual({missiles:missileEffect.missiles,missilePower:missileEffect.missilePower,markDamage:missileEffect.markManaDamage,repeatChance:missileEffect.repeatChance},{missiles:4,missilePower:.4,markDamage:.015,repeatChance:undefined});
const markedEnemy={};
assert.equal(policy.addArcaneMark(markedEnemy,arcane,missileEffect,1000).stacks,1);
assert.equal(policy.addArcaneMark(markedEnemy,arcane,missileEffect,1000).stacks,3,'Lv6 resonance adds a second stack only to an already marked target');
assert.equal(policy.addArcaneMark(markedEnemy,arcane,missileEffect,1000).stacks,4);
const detonation=policy.consumeArcaneMark(markedEnemy,arcane,'arcane-torrent',2000);
assert.deepEqual(detonation,{stacks:4,power:60});
assert.equal(policy.consumeArcaneMark(markedEnemy,arcane,'arcane-torrent',2000),null,'detonation consumes all marks');
for(let i=0;i<5;i++)assert.equal(policy.castArcaneCharge(arcane,'fireball',i*1000).noCooldown,false);
assert.equal(policy.castArcaneCharge(arcane,'arcane-missile',5000).noCooldown,true);
assert.equal(arcane.arcaneChargeStacks,0);
const torrent=policy.resolveArcaneTorrentMana(arcane,policy.getEffect('arcane-torrent',6),5);
assert.deepEqual(torrent,{hits:5,base:70,manaFlow:false,manaFlowBonus:0,theoretical:70,actual:70,overflow:0});
assert.equal(arcane.resourceCurrent,970);
arcane.resourceCurrent=299;
const lowManaTorrent=policy.resolveArcaneTorrentMana(arcane,policy.getEffect('arcane-torrent',6),1);
assert.deepEqual(lowManaTorrent,{hits:1,base:30,manaFlow:true,manaFlowBonus:15,theoretical:45,actual:45,overflow:0});
arcane.resourceCurrent=300;
assert.equal(policy.resolveArcaneTorrentMana(arcane,policy.getEffect('arcane-torrent',6),1).manaFlow,false,'exactly 30% does not trigger Mana Torrent');
assert.deepEqual([1,2,3,4,5].map(hits=>{
  arcane.resourceCurrent=500;
  return policy.resolveArcaneTorrentMana(arcane,policy.getEffect('arcane-torrent',6),hits).base;
}),[30,40,50,60,70]);
arcane.resourceCurrent=100;
assert.deepEqual(policy.resolveArcaneTorrentMana(arcane,policy.getEffect('arcane-torrent',6),0),{hits:0,base:0,manaFlow:false,manaFlowBonus:0,theoretical:0,actual:0,overflow:0},'a miss-only cast restores no mana and cannot trigger Mana Torrent');
assert.equal(policy.telemetry(arcane).arcaneTorrentManaFlowTriggers,1,'Mana Torrent triggers once per eligible cast, not once per target');
arcane.resourceCurrent=900;
assert.equal(policy.resolveKill(arcane,6000),30);
assert.equal(arcane.soulDrainUntil,11000);
assert.equal(policy.getMaxManaBonus(arcane.progress),.15);
assert.equal(policy.telemetry(arcane).killMana,30);
assert.equal(policy.telemetry(arcane).arcaneMarkBonusStacks,2);
assert.equal(policy.telemetry(arcane).arcaneMarkDetonations,1);

const levels={'mage:elemental-burst':6,'mage:elemental-storm':6,'mage:elemental-marks':6,'mage:resonance-overload':6,'mage:fireball':6,'mage:mana-amplification':6};
const normalized=policy.normalizeSkillLevels(levels,'elementalist');
assert.equal(normalized['mage:elemental-burst'],6); assert.equal(normalized['mage:elemental-storm'],5);
assert.equal(normalized['mage:elemental-marks'],6); assert.equal(normalized['mage:resonance-overload'],5);
assert.equal(normalized['mage:fireball'],6, 'base Mage specialization remains independent');

console.log('mage-advancement-policy: assertions passed');
