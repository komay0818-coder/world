const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(script, /getEnemySkillState\(healerIndex\)\.natureEchoReadyAt = now \+ BlackForestDepthsPolicy\.SKILLS\.forestSpirit\.cooldownMs;/, 'a successful heal starts cooldown on that forest spirit');
assert.match(script, /canUseNatureEcho: now >= \(getEnemySkillState\(enemyIndex\)\.natureEchoReadyAt \|\| 0\)/, 'each forest spirit checks its own cooldown before rolling');
assert.match(script, /if \(battle\.enemySkillStates\) battle\.enemySkillStates\[index\] = null;/, 'a respawned enemy receives fresh independent skill state');
assert.doesNotMatch(script, /battle\.natureEchoReadyAt/, 'nature echo cooldown is not shared globally');

console.log('black-forest-depths-nature-echo-cooldown-integration: assertions passed');
