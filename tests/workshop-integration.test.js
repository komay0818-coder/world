const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'village.css'), 'utf8');

assert.match(html, /chapter-one-material-drop-policy\.js[\s\S]*chapter-one-recipe-drop-policy\.js[\s\S]*crafting-policy\.js[\s\S]*script\.js/, 'formal material and recipe data load before crafting integration');
assert.match(script, /function renderWorkshop\(/, 'village workshop has a dedicated renderer');
assert.match(script, /data-workshop-quality="uncommon"[\s\S]*data-workshop-quality="rare"/, 'workshop exposes green and blue quality filters');
assert.match(script, /data-workshop-slot="wrist"[\s\S]*data-workshop-slot="cloak"[\s\S]*data-workshop-slot="shoulders"/, 'workshop exposes all three chapter-one equipment slots');
assert.match(script, /workshop-insufficient/, 'missing resources receive a dedicated UI state');
assert.match(script, /CraftingPolicy\.getRecipeQuantity\(progress, recipe\.recipeId\)/, 'recipe counts come from the saved backpack');
assert.match(script, /CraftingPolicy\.craftEquipment\(progress, recipeId/, 'workshop uses the shared atomic crafting policy');
assert.match(script, /saveProgress\(progress\);[\s\S]*renderWorkshop\(workshop, result\.item\)/, 'successful craft is saved before UI refresh');
assert.doesNotMatch(script, /craftingTestDataVersion|testQuantities|craft-cloth|craft-metal/, 'loading a save no longer grants workshop test resources');
assert.match(css, /\.workshop-insufficient/, 'insufficient resources are styled red');
assert.match(css, /\.workshop-recipe\.quality-uncommon/, 'green recipe cards have a quality frame');
assert.match(css, /\.workshop-recipe\.quality-rare/, 'blue recipe cards have a quality frame');

console.log('workshop-integration: assertions passed');
