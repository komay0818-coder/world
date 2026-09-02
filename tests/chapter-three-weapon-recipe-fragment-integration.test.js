const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const recipePolicy = require('../chapter-three-recipe-drop-policy.js');
const mapPolicy = require('../chapter-three-map-policy.js');
const fragmentPolicy = require('../chapter-three-weapon-recipe-fragment-policy.js');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

assert.match(html, /chapter-three-weapon-recipe-fragment-policy\.js[\s\S]*chapter-three-recipe-drop-policy\.js[\s\S]*script\.js/);
const normalRewards = [{ id: 'normal-armory-reward' }];
const progress = { inventory: [] };
const combined = recipePolicy.grantFacilityRewards(progress, 'armory', normalRewards, { recipeRandom: () => 0, fragmentRandom: () => 0 });
assert.equal(combined.normalRewards, normalRewards);
assert.equal(combined.recipeDrops[0].id, 'recipe-ancient-warpattern-shoulders');
assert.equal(combined.fragmentDrops[0].id, fragmentPolicy.FRAGMENT.id);
assert.ok(progress.inventory.some((item) => item.id === 'recipe-ancient-warpattern-shoulders'));
assert.ok(progress.inventory.some((item) => item.id === fragmentPolicy.FRAGMENT.id), '2% recipe and 5% fragment can succeed together');

let facilityProgress = mapPolicy.normalizeFacilityProgress();
facilityProgress = mapPolicy.recordFacilityDestroyed(facilityProgress, 'bloodwar-wastes', 'armory', 27);
assert.equal(mapPolicy.getFacilityStatus(facilityProgress, 'bloodwar-wastes', 'armory').complete, true);
const afterComplete = recipePolicy.grantFacilityRewards({ inventory: [] }, 'armory', ['normal'], { recipeRandom: () => .99, fragmentRandom: () => 0 });
assert.equal(afterComplete.fragmentDrops[0].id, fragmentPolicy.FRAGMENT.id);
assert.deepEqual(afterComplete.normalRewards, ['normal']);

assert.match(script, /const fragmentPolicy = ChapterThreeWeaponRecipeFragmentPolicy[\s\S]*fragmentPolicy\.canAssemble\(progress\)/);
assert.match(script, /ChapterThreeWeaponRecipeFragmentPolicy\.assembleForgingRecipe\(progress\)/);
assert.match(script, /data-assemble-weapon-recipe/);
assert.match(script, /item\.kind === 'recipe-fragment'/, 'fragment appears in the existing consumables inventory category');
console.log('chapter-three-weapon-recipe-fragment-integration: assertions passed');
