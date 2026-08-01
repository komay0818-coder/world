const assert = require('assert');
const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /equipment-drop-policy\.js/, 'drop policy loads before the main game script');
assert.match(script, /const monsterTypes = EquipmentDropPolicy\.applyDefaultLootConfigs\(\{/, 'all monster definitions receive a rank-based equipment loot profile');
assert.match(script, /plainsRabbit:.*lootConfig: EquipmentDropPolicy\.TEST_LOOT_CONFIGS\.normal/, 'a normal monster has phase-one loot data');
assert.match(script, /ragingWolf:.*lootConfig: EquipmentDropPolicy\.TEST_LOOT_CONFIGS\.elite/, 'an elite monster has phase-one loot data');
assert.match(script, /greatfangWolf:.*lootConfig: EquipmentDropPolicy\.TEST_LOOT_CONFIGS\.boss/, 'a boss has phase-one loot data');
assert.match(script, /function rewardVictory\(index\)[\s\S]*EquipmentDropPolicy\.grantEquipmentDrop\(progress, enemy\)/, 'rewardVictory enters the equipment drop flow');
assert.match(script, /saveProgress\(progress\);[\s\S]*獲得裝備：/, 'the existing reward save runs before the equipment drop message');
assert.match(script, /equipmentDropMigrationVersion !== 'equipment-drop-v1'/, 'old saves initialize the new drop-system marker safely');
assert.match(script, /戰鬥獎勵將繼續結算/, 'unexpected drop errors cannot stop reward settlement');
assert.match(script, /function unequipItem\(slot\)[\s\S]*progress\.inventory\.unshift\(item\)[\s\S]*progress\.equipment\[slot\] = null[\s\S]*saveProgress\(progress\)/, 'dropped equipment can return from an equipped slot to the saved inventory');
assert.match(script, /data-unequip-slot/, 'the existing equipment screen exposes the unequip action');

console.log('equipment-drop-integration: assertions passed');
