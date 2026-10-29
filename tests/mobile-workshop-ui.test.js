const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'village.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(html, /styles\/village\.css\?v=20261025-mobile-village-fixed-window-v3/);
assert.match(html, /script\.js\?v=20261029-chapter-one-offhand-drops-v1/);
assert.match(script, /function isMobileWorkshopLayout\(\)/);
assert.match(script, /data-view-workshop-recipe="\$\{recipe\.recipeId\}"/);
assert.match(script, /data-view-workshop-weapon="\$\{weapon\.id\}"/);
assert.match(script, /visibleRecipes\.filter\(\(recipe\) => CraftingPolicy\.getRecipeQuantity\(progress, recipe\.recipeId\) > 0\)\.map/, 'mobile list only renders recipes held in the account inventory');
assert.match(script, /workshopSlot === 'all' && forgingRecipeCount > 0/, 'mobile epic weapon recipes require the owned forging recipe');
assert.match(script, /目前沒有符合條件的配方。/, 'empty mobile filters explain that no owned recipe matches');
assert.match(script, /class="workshop-detail-backdrop" role="dialog"/);
assert.match(script, /data-confirm-workshop-craft="\$\{recipe\.recipeId\}"/);
assert.match(script, /data-cancel-workshop-detail/);
assert.match(script, /CraftingPolicy\.canCraft\(progress, recipe\.recipeId, building\.level\)/, 'detail revalidates the existing crafting policy');
assert.match(script, /await commitEconomyProgress\('裝備製作'/, 'crafting still waits for the existing atomic save path');
assert.match(script, /if \(workshopCraftBusy\) return \{ ok: false, code: 'busy' \}/, 'duplicate craft requests are blocked');
assert.match(css, /\.workshop-recipes\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/, 'mobile recipes use three equal columns');
assert.match(css, /\.workshop-recipe-tile\{position:relative;display:flex;height:137px/, 'mobile recipe cells have a stable height');
assert.match(css, /\.workshop-detail-backdrop\{position:fixed/, 'mobile detail uses an independent modal');
assert.match(css, /\.workshop-requirement-ready[^}]*color:#78dfa0/, 'sufficient requirements are green');
assert.match(css, /\.workshop-insufficient[^}]*color:#ff7777/, 'insufficient requirements remain red');
assert.match(css, /@media\(max-width:700px\) and \(orientation:portrait\)/, 'workshop overrides remain mobile portrait scoped');

console.log('mobile-workshop-ui: assertions passed');
