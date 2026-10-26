const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(source, /function isMonsterRotationPreview\([\s\S]*?get\('monster-preview'\) === 'rotation'/, 'rotation preview is explicitly opt-in');
assert.match(source, /function getMonsterRotationPreviewGroups[\s\S]*?goblin-camp[\s\S]*?length: 7/, 'Goblin Camp exposes all seven visual waves');
assert.match(source, /function rotateMonsterPreview[\s\S]*?replaceVisualShowcaseEnemies/, 'preview swaps complete monster groups without defeating them');
assert.match(source, /if \(monsterRotationPreview\)[\s\S]*?partyAttacks: idle[\s\S]*?companions: idle[\s\S]*?queueDefeated: idle/, 'preview disables player, companion, and defeat processing');
assert.match(source, /function autoSkillTick\(\)[\s\S]*?isMonsterRotationPreview\(\)/, 'preview disables automatic skills');
assert.match(source, /function enemyAttackTick\(\)[\s\S]*?isMonsterRotationPreview\(\)/, 'preview disables monster attacks');
assert.match(source, /!isDungeon && !isMonsterRotationPreview\(\)/, 'preview does not inject live facility encounters into visual groups');

console.log('monster rotation preview: assertions passed');
