const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = [
  fs.readFileSync(path.join(root, 'styles', 'game.css'), 'utf8'),
  fs.readFileSync(path.join(root, 'styles', 'mmorpg-layout.css'), 'utf8')
].join('\n');

assert.match(script, /const skillProgression = \{/,
  'base skill progression and level unlock data should remain available');
assert.match(script, /function renderSkills\(/,
  'the base skill list should still render');
assert.match(script, /function removeLegacySkillUpgradeMaterials\(/,
  'legacy upgrade materials should be hidden from the current inventory');
assert.match(script, /return \{ interval: 6, multiplier: 1\.5, extraAttack: false \};/,
  'hunter instinct should use its original baseline effect');

for (const removedToken of [
  'skillUpgradeCosts',
  'skillUpgradeSuccessRates',
  'skillUpgradeGoldCosts',
  'getSkillUpgradeLevel',
  'getSkillPowerMultiplier',
  'skill-detail-upgrade',
  '魔法結晶 ×',
  '階魔法書 ×'
]) {
  assert.doesNotMatch(script, new RegExp(removedToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `removed skill-upgrade token should not remain: ${removedToken}`);
}

assert.doesNotMatch(index, /skill-detail-upgrade/,
  'the page should not expose a skill-upgrade control');
assert.doesNotMatch(styles, /skill-upgrade|skill-detail-upgrade/,
  'obsolete skill-upgrade styles should be removed');
assert.match(index, /remove-skill-upgrades-v121/,
  'the browser cache version should include this removal');

console.log('Skill upgrade removal checks passed.');
