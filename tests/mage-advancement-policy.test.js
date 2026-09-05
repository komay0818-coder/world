const assert = require('node:assert/strict');
const policy = require('../mage-advancement-policy.js');

assert.equal(policy.FIRST_JOB_CHANGE_LEVEL, 45);
assert.equal(policy.ELEMENTALIST_SKILLS.length, 4);
assert.equal(policy.ARCANE_SKILLS.length, 4);
assert.deepEqual(policy.getEffect('elemental-burst', 6), { power:1.6, bonus:.6, collapseBonus:.8, breakthrough:'元素崩解：三種狀態齊全時，每種追加傷害提高為 80%' });
assert.deepEqual(policy.getElementalBurstParts(policy.getEffect('elemental-burst', 6), { burning:true, slowed:true, paralyzed:true }).map(part=>part.power), [1.6,.8,.8,.8]);
assert.deepEqual(policy.rollStormElements(policy.getEffect('elemental-storm', 6), (()=>{const rolls=[0,.29,.99];return()=>rolls.shift();})()), ['fire','lightning']);

const elementalist={progress:{advancedClass:'elementalist',skillLevels:{'mage:elemental-marks':6,'mage:resonance-overload':6}},skillCooldowns:{fireball:9000,blizzard:12000,'chain-lightning':10000}};
assert.equal(policy.addElementMark(elementalist,'fire',1000).resonance,false);
policy.addElementMark(elementalist,'ice',1000);
assert.equal(policy.addElementMark(elementalist,'lightning',1000).resonance,true);
assert.equal(elementalist.resonanceUntil,7000);
assert.equal(policy.reduceLongestElementCooldown(elementalist,1000),'blizzard');
assert.equal(elementalist.skillCooldowns.blizzard,10000);
assert.equal(policy.useElementDuringResonance(elementalist,'fire',2000),true);
assert.equal(elementalist.resonanceUntil,8000);
assert.deepEqual(policy.getResonanceBonuses(elementalist,'fire',2000),{damage:.2,crit:.1});
assert.deepEqual(policy.finishResonance(elementalist,8000),{power:1.5,element:'fire'});

const arcane={progress:{advancedClass:'arcane-mage',skillLevels:{'mage:arcane-charge':6,'mage:mana-drain':6}},resourceMax:1000,resourceCurrent:900,skillCooldowns:{'arcane-missile':5000,fireball:9000}};
for(let i=0;i<5;i++)assert.equal(policy.castArcaneCharge(arcane,'fireball',i*1000).noCooldown,false);
assert.equal(policy.castArcaneCharge(arcane,'arcane-missile',5000).noCooldown,true);
assert.equal(arcane.arcaneChargeStacks,0);
assert.deepEqual(policy.advanceOtherCooldowns(arcane,'arcane-torrent',2,1000).sort(),['arcane-missile','fireball']);
assert.equal(policy.resolveKill(arcane,6000),30);
assert.equal(arcane.soulDrainUntil,11000);

const levels={'mage:elemental-burst':6,'mage:elemental-storm':6,'mage:elemental-marks':6,'mage:resonance-overload':6,'mage:fireball':6,'mage:mana-amplification':6};
const normalized=policy.normalizeSkillLevels(levels,'elementalist');
assert.equal(normalized['mage:elemental-burst'],6); assert.equal(normalized['mage:elemental-storm'],5);
assert.equal(normalized['mage:elemental-marks'],6); assert.equal(normalized['mage:resonance-overload'],5);
assert.equal(normalized['mage:fireball'],6, 'base Mage specialization remains independent');

console.log('mage-advancement-policy: assertions passed');
