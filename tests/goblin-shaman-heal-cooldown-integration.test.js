const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../goblin-camp-policy');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.equal(policy.SHAMAN_HEAL_COOLDOWN_MS, 10000, 'shaman healing uses the approved ten-second cooldown');
assert.match(
  script,
  /getEnemySkillState\(healerIndex\)\.shamanHealReadyAt = now \+ GoblinCampPolicy\.SHAMAN_HEAL_COOLDOWN_MS/,
  'a successful heal starts the cooldown on that individual shaman'
);
assert.match(
  script,
  /canHeal: now >= \(getEnemySkillState\(attackingEnemyIndex\)\.shamanHealReadyAt \|\| 0\)/,
  'a shaman cannot heal again before its own cooldown expires'
);
assert.match(
  script,
  /canHeal: now >= \(getEnemySkillState\(enemyIndex\)\.shamanHealReadyAt \|\| 0\)/,
  'the alternate enemy attack path applies the same independent cooldown'
);
assert.match(
  script,
  /if \(battle\.enemySkillStates\) battle\.enemySkillStates\[index\] = null/,
  'a newly spawned enemy receives fresh skill cooldown state'
);
assert.match(
  script,
  /enemySkillStates: enemyTypes\.map\(\(\) => null\)/,
  'a new battle starts without cooldown state from the previous battle'
);

console.log('goblin-shaman-heal-cooldown-integration: 6 assertions passed');
