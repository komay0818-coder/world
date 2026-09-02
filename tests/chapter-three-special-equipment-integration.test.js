const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(html, /chapter-two-special-equipment-policy\.js[\s\S]*chapter-three-special-equipment-policy\.js[\s\S]*script\.js/);
assert.match(script, /function grantChapterThreeSpecialEquipmentDrop\([\s\S]*ChapterThreeSpecialEquipmentPolicy\.grantSpecialDrop/);
assert.match(script, /function rewardVictory\(index\)[\s\S]*EquipmentDropPolicy\.grantEquipmentDrop[\s\S]*ChapterTwoSpecialEquipmentPolicy\.grantSpecialDrop[\s\S]*grantChapterThreeSpecialEquipmentDrop\(progress, currentMap, enemy\)/, 'normal and both chapter-specific equipment rolls coexist online');
assert.match(script, /function rewardVictory\(index\)[\s\S]*grantCraftingMaterialDrops\(progress, currentMap, enemy[\s\S]*grantChapterThreeSpecialEquipmentDrop\(progress, currentMap, enemy\)/, 'material and special equipment rolls coexist online');
assert.match(script, /function claimOfflineRewards\(\)[\s\S]*grantChapterThreeSpecialEquipmentDrop\(progress, activeMap, defeatedMonster\)/, 'offline kills use the same special-drop entry point');
assert.match(script, /let equipmentFound = 0[\s\S]*equipmentFound \+= 1[\s\S]*pendingOfflineReport = \{[\s\S]*equipmentFound/, 'offline report counts generated equipment instances');
console.log('chapter-three-special-equipment-integration: assertions passed');
