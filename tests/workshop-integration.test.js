const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(html, /world\/67f5ab92db6af0eccead2ff7d5e6db5289fc1adf\/crafting-policy\.js/, 'essence crafting is loaded from its immutable commit');
assert.match(html, /world\/67f5ab92db6af0eccead2ff7d5e6db5289fc1adf\/chapter-two-recipe-drop-policy\.js/, 'chapter-two essence recipes are loaded from their immutable commit');
const css = fs.readFileSync(path.join(root, 'styles', 'village.css'), 'utf8');

assert.match(html, /chapter-one-material-drop-policy\.js[\s\S]*chapter-one-recipe-drop-policy\.js[\s\S]*crafting-policy\.js[\s\S]*script\.js/, 'formal material and recipe data load before crafting integration');
assert.match(script, /function renderWorkshop\(/, 'village workshop has a dedicated renderer');
assert.doesNotMatch(script, /recipe\.chapter === 1/, 'workshop no longer hides chapter-two recipes');
assert.match(script, /function normalizeWearableSeriesName\(item\)/, 'saved recipes and crafted equipment receive the current series names');
assert.match(script, /'crafted-green-wrist': '平原護腕'/, 'chapter-one crafted equipment migrates to the plains series');
assert.match(script, /'crafted-chapter2-green-wrist': '黑森林護腕'/, 'chapter-two crafted equipment migrates to the black-forest series');
assert.match(script, /第一、二章裝備製作/, 'workshop identifies both supported crafting chapters');
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
