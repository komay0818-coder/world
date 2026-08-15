const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(index, /skill-upgrade-policy\.js[\s\S]*script\.js/, 'chapter policy loads before the game integration');
assert.match(script, /SkillUpgradePolicy\.getUpgradeRequirement/, 'skill details use the data-driven upgrade requirement');
assert.match(script, /SkillUpgradePolicy\.attemptUpgrade/, 'upgrade actions use the shared policy');
assert.match(script, /SkillUpgradePolicy\.grantChapterDrops\(progress, currentMap\.chapter, enemy\)/, 'drops are selected by the active map chapter');
assert.match(script, /const skillEffect = getSkillEffect\(progress, member\.job, skill\)/, 'active skill damage applies the saved skill level');
assert.match(script, /const healEffect = getSkillEffect\(progress, member\.job, healSkill\)/, 'healing applies the saved skill level');
assert.match(script, /function removeLegacySkillUpgradeMaterials\(/, 'obsolete global materials remain filtered for save compatibility');

console.log('Chapter skill upgrade integration checks passed.');
