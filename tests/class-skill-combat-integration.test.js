const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(source, /function applyEnemySkillState\(/, 'active skill states share one battle integration');
assert.match(source, /stunnedUntil[\s\S]*frozenUntil[\s\S]*continue;/, 'stun and freeze prevent enemy actions');
assert.match(source, /armorIgnore: skillEffect\.armorIgnore/, 'piercing shot forwards defense ignore');
assert.match(source, /chainMultiplier[\s\S]*piercingMultiplier/, 'chain and piercing target scaling are applied independently');
assert.match(source, /attackKind: 'counter'/, 'counter attacks have a non-recursive attack source');
assert.match(source, /attackKind: 'offhand'/, 'offhand attacks have a non-recursive attack source');
assert.match(source, /target\.job === 'mage'[\s\S]*blinkReadyAt/, 'blink uses an internal cooldown');
assert.match(source, /target\.manaShieldReadyAt[\s\S]*target\.resourceCurrent -= manaCost/, 'mana shield consumes mana and uses an internal cooldown');
assert.match(source, /member\.effectiveHealCount[\s\S]*graceTriggered/, 'divine grace uses deterministic effective-heal counting');
assert.match(source, /blessing\.party[\s\S]*lightGraceCooldownSpeed/, 'Light Grace can buff the whole party and cooldown speed');

console.log('class-skill-combat-integration: assertions passed');
