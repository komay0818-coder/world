const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
assert.match(script, /damageBonus: stats\.damageBonus \+ effectiveEquipmentStat\(item, 'damageBonus'\)/, 'equipped universal damage is accumulated');
assert.match(script, /damageBonus: Math\.max\(0, equipment\.damageBonus\)/, 'universal equipment damage reaches every character profile without duplicating dynamic advancement damage');
assert.match(script, /magicAdjustedDamage \* \(1 \+ warriorRuntime\.attack\) \* \(1 \+ \(attackerStats\.damageBonus \|\| 0\) \+ warriorAdvancement\.damage \+ warriorRuntime\.damage\) \* rankMultiplier \* attackKindMultiplier/, 'universal damage multiplies all direct hit types before specialized multipliers');
assert.match(script, /if \(item\.damageBonus\) parts\.push\(`傷害 \+\$\{Math\.round\(effectiveEquipmentStat\(item, 'damageBonus'\) \* 100\)\}%`\)/, 'equipment UI displays universal damage');

console.log('chapter-one crafted stats integration: assertions passed');
