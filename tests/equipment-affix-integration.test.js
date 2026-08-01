const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const gameCss = fs.readFileSync(path.join(__dirname, '..', 'styles', 'game.css'), 'utf8');

assert.match(html, /equipment-affix-policy\.js/, 'affix policy loads before the main game script');
assert.match(source, /equipmentAffixMigrationVersion !== 'green-affix-v1'/, 'legacy saves receive the affix compatibility migration');
assert.match(source, /EquipmentAffixPolicy\.normalizeEquipment\(item\)/, 'inventory and equipped items are normalized on load');
assert.match(source, /EquipmentAffixPolicy\.getEquippedAffixStats\(progress\.equipment\)/, 'stats read only the equipped item collection');
assert.match(source, /equipment\.maxHpPercent/, 'maximum-health affixes feed the character calculation');
assert.match(source, /equipment\.defensePercent/, 'defense affixes feed the character calculation');
assert.match(source, /equipment\.criticalChance/, 'critical chance affixes feed the character calculation');
assert.match(source, /equipment\.attackSpeedPercent/, 'attack-speed affixes feed the character calculation');
assert.match(source, /EquipmentAffixPolicy\.formatAffix\(entry\)/, 'inventory, comparison and worn views share the affix text renderer');
assert.match(source, /affixes: item\.affixes \|\| \[\]/, 'stacking distinguishes equipment with different affixes');
assert.doesNotMatch(source, /equipmentScore|equipmentValue|評分/, 'inventory and comparison no longer expose equipment scores');
assert.doesNotMatch(gameCss, /equipment-score|score-difference/, 'removed score UI has no stale styles');

console.log('equipment-affix-integration: assertions passed');
