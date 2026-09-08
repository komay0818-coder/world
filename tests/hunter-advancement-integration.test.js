const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const arrows = fs.readFileSync(path.join(__dirname, '..', 'hunter-arrow-policy.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /hunter-arrow-policy\.js[\s\S]*hunter-advancement-policy\.js[\s\S]*script\.js/);
assert.match(arrows, /'sniper-shot': 2[\s\S]*'gale-rapid-fire': 3/);
assert.match(source, /getKnownSkills[\s\S]*HunterAdvancementPolicy\.getSkills/);
assert.match(source, /getShootingBonuses[\s\S]*shootingBonuses\.criticalDamage[\s\S]*shootingBonuses\.armorIgnore/);
assert.match(source, /completeShootingSkill[\s\S]*applySniperCritical/);
assert.match(source, /getBasicExecution\(member, now\)[\s\S]*hunterExecution\.sniper[\s\S]*hunterExecution\.eagle[\s\S]*consumeBasic/);
assert.match(source, /resolveGaleBasicHit[\s\S]*attackKind: 'wind-arrow'/);
assert.match(source, /function ensureHunterCompanions[\s\S]*pet:\$\{member\.companions\.length \+ 1\}/);
assert.match(source, /function processHunterCompanionAttacks[\s\S]*for \(const pet of ensureHunterCompanions/);
assert.match(source, /pet\.furyHitCount[\s\S]*attackKind: 'pet-bite'/);
assert.match(source, /`pet-bleed:\$\{pet\.id\}`[\s\S]*tickIntervalMs: 2000/);
assert.match(source, /pet\.wildAwakeningUntil[\s\S]*attackKind: 'beast-slam'/);
assert.match(source, /HunterAdvancementPolicy\.tryStun[\s\S]*getEnemySkillState/);
assert.match(source, /applyGuardDamage\(target, damage, now, Math\.random\)[\s\S]*damage = guard\.hunterDamage/);
assert.match(source, /kind: 'pet-guard'[\s\S]*usesRemaining: guard\.petUsesRemaining/);
assert.match(source, /petGuardCooldownSkips/);
assert.match(source, /guardReadyAt: guard\.guardReadyAt/);
assert.match(source, /pet\.alive === false[\s\S]*kind: 'pet-revive'/);
assert.match(source, /advancedSkillUpgradePending[\s\S]*HunterAdvancementPolicy\.getSkill[\s\S]*升級需求待定/);

console.log('hunter-advancement-integration: assertions passed');
