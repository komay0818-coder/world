const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /assassin-offhand-policy\.js[\s\S]*rogue-advancement-policy\.js[\s\S]*script\.js/);
assert.match(source, /character\.job === 'assassin' \? RogueAdvancementPolicy/);
assert.match(source, /getKnownSkills[\s\S]*RogueAdvancementPolicy\.getSkills/);
assert.match(source, /skill\.id === 'death-mark'[\s\S]*markTarget/);
assert.match(source, /shadow-assassination'[\s\S]*offhandOnCrit[\s\S]*AssassinOffhandPolicy\.calculateOffhandStrike/);
assert.match(source, /resolveBackstabCrit[\s\S]*getBasicExecution[\s\S]*consumeBasic/);
assert.match(source, /masteryChance = \(mastery\.offhandChance \|\| 0\) \+ \(lethalExecution\?\.extraOffhandChance \|\| 0\)/);
assert.match(source, /skill\.id === 'poison-blade'[\s\S]*stats\.attack \* \.20 \* stats\.dotMultiplier[\s\S]*tickIntervalMs: 2000/);
assert.match(source, /function applyRoguePoison[\s\S]*const added[\s\S]*applyRogueDotEntryDamage/, 'only newly added poison stacks deal entry damage');
assert.match(source, /ruptureDamage[\s\S]*applyRogueDotEntryDamage\(target\.index, member, 'rupture'/, 'rupture deals its separate entry damage');
assert.match(source, /skill\.id === 'backstab'[\s\S]*stats\.attack \* \.18[\s\S]*tickIntervalMs: 2000/);
assert.match(source, /skill\.id === 'corrosive-strike'[\s\S]*applyCoating/);
assert.match(source, /getAutoSkillPriority\(progress, unlocked\)/, 'advanced rogues use their formal specialization priority');
assert.match(source, /getCoatingExecution[\s\S]*coating-poison[\s\S]*applyRoguePoison/, 'coating bonus uses pre-hit stacks before adding one poison layer');
assert.match(source, /skill\.id === 'blood-venom-rend'[\s\S]*ruptureDuration[\s\S]*ruptureTickInterval/);
assert.match(source, /processEnemyDots[\s\S]*getPoisonDamageBonus[\s\S]*getTargetBonuses/);
assert.match(source, /deathMarkMultiplier = RogueAdvancementPolicy\.getDeathMarkDamageMultiplier[\s\S]*adjustedBaseDamage[\s\S]*deathMarkMultiplier/, 'all owned damage uses the common death-mark multiplier');
assert.match(source, /const damageBySource = new Map\(\)[\s\S]*damageBySource\.forEach/, 'DOT damage keeps its source owner through common damage resolution');
assert.match(source, /rogueDefenseMultiplier = 1 - RogueAdvancementPolicy\.getTargetDefenseReduction/, 'toxic blood defense reduction is target-owned');
assert.match(source, /shadowBleedingMultiplier[\s\S]*hasBleedingStatus/, 'shadow assassination uses the shared bleed classification');
assert.match(source, /advancedSkillUpgradePending[\s\S]*升級需求待定/);

console.log('rogue-advancement-integration: assertions passed');
