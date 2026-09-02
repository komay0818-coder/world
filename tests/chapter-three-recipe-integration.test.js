const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

assert.match(html, /chapter-three-material-drop-policy\.js[\s\S]*chapter-three-recipe-drop-policy\.js[\s\S]*crafting-policy\.js[\s\S]*script\.js/);
assert.match(script, /recipePolicies: \[ChapterOneRecipeDropPolicy, ChapterTwoRecipeDropPolicy, ChapterThreeRecipeDropPolicy\]/);
assert.match(script, /ChapterThreeRecipeDropPolicy\.grantRecipeDrops\(progress, enemy, currentMap\.id\)/);
assert.match(script, /CraftingPolicy\.craftEquipment\(progress, recipeId/, 'third chapter continues through the shared workshop transaction');
assert.match(script, /第一至三章裝備製作/);
console.log('chapter-three-recipe-integration: assertions passed');
