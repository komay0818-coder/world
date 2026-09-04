const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /warrior-resource-policy\.js[\s\S]*warrior-advancement-policy\.js[\s\S]*script\.js/);
assert.match(source, /WarriorAdvancementPolicy\.canAdvance[\s\S]*data-warrior-advance/);
assert.match(source, /getKnownSkills[\s\S]*WarriorAdvancementPolicy\.getSkills/);
assert.match(source, /WarriorAdvancementPolicy\.canEquipTwoHandedOffhand[\s\S]*slots\.push\('offhand'\)/);
assert.match(source, /WarriorAdvancementPolicy\.getTitanAttackContribution/);
assert.match(source, /skill\.id === 'weapon-stance'[\s\S]*applyWeaponStance/);
assert.match(source, /skill\.id === 'blood-rage'[\s\S]*applyBloodRage/);
assert.match(source, /skill\.id === 'berserker-slash'[\s\S]*getBerserkerSlash/);
assert.match(source, /getShieldCounter[\s\S]*attackKind: 'shield-counter'/);
assert.match(source, /crossUnyielding\(target, hpBeforeEnemyHit, now\)/);
assert.match(source, /rollTitanStrike[\s\S]*attackKind: 'offhand'/);
assert.match(source, /advancedSkillUpgradePending[\s\S]*升級需求待定/, 'unset advanced-skill costs cannot consume base-skill materials');

console.log('warrior-advancement-integration: assertions passed');
