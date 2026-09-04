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
assert.match(source, /skill\.id === 'poison-blade'[\s\S]*stats\.attack \* \.12[\s\S]*tickIntervalMs: 2000/);
assert.match(source, /skill\.id === 'backstab'[\s\S]*stats\.attack \* \.18[\s\S]*tickIntervalMs: 2000/);
assert.match(source, /skill\.id === 'corrosive-strike'[\s\S]*dotVulnerabilityUntil/);
assert.match(source, /skill\.id === 'blood-venom-rend'[\s\S]*ruptureTick/);
assert.match(source, /processEnemyDots[\s\S]*venom-mastery[\s\S]*getTargetBonuses/);
assert.match(source, /resolveMarkedKill[\s\S]*resolvePlagueDeath/);
assert.match(source, /consumePlague[\s\S]*applyDot\(index, 'poison'/);
assert.match(source, /advancedSkillUpgradePending[\s\S]*升級需求待定/);

console.log('rogue-advancement-integration: assertions passed');
