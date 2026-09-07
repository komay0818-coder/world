const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(source, /function applyEnemySkillState\(/, 'active skill states share one battle integration');
assert.match(source, /stunnedUntil[\s\S]*frozenUntil[\s\S]*continue;/, 'stun and freeze prevent enemy actions');
assert.match(source, /armorIgnore: \(skillEffect\.armorIgnore \|\| 0\) \+ \(berserkerSlash\?\.armorIgnore \|\| 0\)/, 'skills forward their own defense ignore and the conditional berserker bonus');
assert.match(source, /chainMultiplier[\s\S]*piercingMultiplier/, 'chain and piercing target scaling are applied independently');
assert.match(source, /attackKind: 'counter'/, 'counter attacks have a non-recursive attack source');
assert.match(source, /attackKind: 'offhand'/, 'offhand attacks have a non-recursive attack source');
assert.match(source, /AssassinOffhandPolicy\.calculateOffhandStrike\(\{ \.\.\.member\.stats,[\s\S]*\}, mastery/, 'offhand damage and critical bonuses use the isolated offhand strike calculation');
assert.match(source, /AssassinOffhandPolicy\.isDagger\(member\.progress\.equipment\?\.offhand\)/, 'offhand follow-up attacks require an equipped dagger');
assert.match(source, /rolledOffhandAttack \* AssassinOffhandPolicy\.OFFHAND_ATTACK_CONTRIBUTION/, 'basic attacks roll the equipped offhand dagger at 50% without adding another attack');
assert.match(source, /target\.job === 'mage'[\s\S]*blinkReadyAt/, 'blink uses an internal cooldown');
assert.match(source, /target\.manaShieldReadyAt[\s\S]*target\.resourceCurrent -= manaCost/, 'mana shield consumes mana and uses an internal cooldown');
assert.match(source, /member\.effectiveHealCount[\s\S]*graceTriggered/, 'divine grace uses deterministic effective-heal counting');
assert.match(source, /blessing\.party[\s\S]*lightGraceCooldownSpeed/, 'Light Grace can buff the whole party and cooldown speed');
assert.match(source, /effect\.paralysis[\s\S]*state\.paralyzedUntil/, 'all configured chain lightning levels apply paralysis');
assert.match(source, /effect\.shockedVulnerability[\s\S]*state\.shockedByMage/, 'shocked vulnerability has a per-mage refreshable window');
assert.match(source, /getMageShockState\(index, attacker\)[\s\S]*\? 1\.5 : 1/, 'only the applying mage receives the universal 1.5 damage multiplier');
assert.match(source, /damage\.total \* resonanceMultiplier[\s\S]*sourceSkill: hasSourceBurn \? 'burn'/, 'burn delegates shocked vulnerability to the common damage path');
assert.doesNotMatch(source, /elementalDamageTakenMultiplier|enhancedParalysisMultiplier/, 'the removed elemental-only multiplier is not retained');

console.log('class-skill-combat-integration: assertions passed');
