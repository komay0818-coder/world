const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /chapter-three-map-policy\.js[\s\S]*chapter-three-material-drop-policy\.js[\s\S]*script\.js/);
assert.match(script, /function grantCraftingMaterialDrops\([\s\S]*ChapterOneMaterialDropPolicy[\s\S]*ChapterTwoMaterialDropPolicy[\s\S]*ChapterThreeMaterialDropPolicy[\s\S]*VillageUpgradePolicy/);
assert.match(script, /function claimOfflineRewards\(\)[\s\S]*grantCraftingMaterialDrops\(progress, activeMap, defeatedMonster\)/);
assert.match(script, /function rewardVictory\(index\)[\s\S]*grantCraftingMaterialDrops\(progress, currentMap, enemy/);
assert.match(script, /materialPolicies: \[ChapterOneMaterialDropPolicy, ChapterTwoMaterialDropPolicy, ChapterThreeMaterialDropPolicy\]/);
console.log('chapter-three-material-drop-integration: assertions passed');
