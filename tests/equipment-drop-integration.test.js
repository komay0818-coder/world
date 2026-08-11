const assert = require('assert');
const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.match(index, /world\/d5edf27e2a92445a308678ac85d35d3248e51a48\/script\.js/, 'the live page pins the current game UI to an immutable commit');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /equipment-drop-policy\.js/, 'drop policy loads before the main game script');
assert.match(script, /const monsterTypes = EquipmentDropPolicy\.applyDefaultLootConfigs\(\{/, 'all monster definitions receive a rank-based equipment loot profile');
assert.match(script, /plainsRabbit:.*lootConfig: EquipmentDropPolicy\.TEST_LOOT_CONFIGS\.normal/, 'a normal monster has phase-one loot data');
assert.match(script, /ragingWolf:.*lootConfig: EquipmentDropPolicy\.TEST_LOOT_CONFIGS\.elite/, 'an elite monster has phase-one loot data');
assert.match(script, /greatfangWolf:.*lootConfig: EquipmentDropPolicy\.TEST_LOOT_CONFIGS\.boss/, 'a boss has phase-one loot data');
assert.match(script, /function rewardVictory\(index\)[\s\S]*EquipmentDropPolicy\.grantEquipmentDrop\(progress, enemy\)/, 'rewardVictory enters the equipment drop flow');
assert.match(script, /const currentMap = getActiveMap\(progress\);\s*renderStrongholdObjective\(currentMap\);/, 'rewardVictory resolves the active map before rendering map objectives');
assert.match(script, /ChapterOneMaterialDropPolicy\.grantMaterialDrops\(progress, currentMap\.id, enemy\)/, 'rewardVictory grants map and monster-specific materials through the shared inventory');
assert.match(script, /materialDrops\.push\(\.\.\.VillageUpgradePolicy\.grantMapDrops\(progress, currentMap\.id\)\)/, 'independent building materials are added without replacing equipment materials');
assert.match(script, /materialDrops\.forEach[\s\S]*材料掉落/, 'material drops are shown in the battle loot log');
assert.match(html, /chapter-one-recipe-drop-policy\.js[\s\S]*script\.js/, 'recipe drop policy loads before reward integration');
assert.match(script, /ChapterOneRecipeDropPolicy\.grantRecipeDrops\(progress, enemy, currentMap\.id\)/, 'rewardVictory grants recipes for configured monsters and maps');
assert.match(script, /recipeDrops\.forEach[\s\S]*配方掉落/, 'recipe drops are shown in the battle loot log');
assert.match(script, /item\.kind === 'recipe'\) return 'consumable'/, 'recipe items appear in the existing backpack item category');
assert.match(html, /chapter-boss-drop-policy\.js[\s\S]*script\.js/, 'chapter boss drop policy loads before reward integration');
assert.match(script, /ChapterBossDropPolicy\.grantChapterBossBlueDrop\(progress, enemy/, 'boss blue drop is an independent reward roll');
assert.match(script, /chapter: currentMap\.chapter[\s\S]*finalBossId/, 'chapter and final boss metadata gate the special drop');
assert.match(script, /\[ChapterBossDrop\][\s\S]*其他戰鬥獎勵將繼續結算/, 'blue drop failures cannot stop existing rewards');
assert.match(script, /saveProgress\(progress\);[\s\S]*獲得裝備：/, 'the existing reward save runs before the equipment drop message');
assert.match(script, /equipmentDropMigrationVersion !== 'equipment-drop-v1'/, 'old saves initialize the new drop-system marker safely');
assert.match(script, /戰鬥獎勵將繼續結算/, 'unexpected drop errors cannot stop reward settlement');
assert.match(script, /function unequipItem\(slot\)[\s\S]*progress\.inventory\.unshift\(item\)[\s\S]*progress\.equipment\[slot\] = null[\s\S]*saveProgress\(progress\)/, 'dropped equipment can return from an equipped slot to the saved inventory');
assert.match(script, /data-unequip-slot/, 'the existing equipment screen exposes the unequip action');

console.log('equipment-drop-integration: assertions passed');
