const assert = require('node:assert/strict');
const policy = require('../chapter-three-weapon-recipe-fragment-policy.js');

assert.equal(policy.FRAGMENT.id, 'epic-weapon-recipe-fragment');
assert.equal(policy.FORGING_RECIPE.id, 'epic-weapon-forging-recipe');
assert.equal(policy.ARMORY_FRAGMENT_DROP_RATE, .05);
assert.equal(policy.FRAGMENTS_PER_RECIPE, 7);
assert.equal(policy.FRAGMENT.stackable, true);
assert.equal(policy.FRAGMENT.isCompleteRecipe, false);
assert.equal(policy.FRAGMENT.weaponCore, false);
assert.equal(policy.FORGING_RECIPE.stackable, true);
assert.equal(policy.FORGING_RECIPE.consumeOnCraft, true);
assert.equal(policy.FORGING_RECIPE.permanentUnlock, false);

assert.equal(policy.rollArmoryFragmentDrop('armory', () => .049999)[0].id, policy.FRAGMENT.id);
assert.deepEqual(policy.rollArmoryFragmentDrop('armory', () => .05), []);
assert.deepEqual(policy.rollArmoryFragmentDrop('supply-station', () => 0), []);
assert.deepEqual(policy.rollArmoryFragmentDrop('shaman-altar', () => 0), []);

const stacked = { inventory: [] };
policy.grantArmoryFragmentDrop(stacked, 'armory', { random: () => 0 });
policy.grantArmoryFragmentDrop(stacked, 'armory', { random: () => 0 });
assert.equal(stacked.inventory.length, 1);
assert.equal(stacked.inventory[0].quantity, 2);

const six = { inventory: [{ ...policy.FRAGMENT, quantity: 6 }] };
const sixSnapshot = JSON.stringify(six);
assert.equal(policy.assembleForgingRecipe(six).code, 'insufficient-fragments');
assert.equal(JSON.stringify(six), sixSnapshot);

const seven = { inventory: [{ ...policy.FRAGMENT, quantity: 7 }] };
assert.equal(policy.assembleForgingRecipe(seven).ok, true);
assert.equal(policy.getQuantity(seven.inventory, policy.FRAGMENT.id), 0);
assert.equal(policy.getQuantity(seven.inventory, policy.FORGING_RECIPE.id), 1);

const fourteen = { inventory: [{ ...policy.FRAGMENT, quantity: 14 }] };
assert.equal(policy.assembleForgingRecipe(fourteen).ok, true);
assert.equal(policy.assembleForgingRecipe(fourteen).ok, true);
assert.equal(policy.getQuantity(fourteen.inventory, policy.FRAGMENT.id), 0);
assert.equal(policy.getQuantity(fourteen.inventory, policy.FORGING_RECIPE.id), 2, 'forging recipes stack as physical items');

for (const options of [
  { itemFactory: () => null },
  { inventoryCapacity: 1 }
]) {
  const progress = { inventory: [{ ...policy.FRAGMENT, quantity: 8 }] };
  const snapshot = JSON.stringify(progress);
  const result = policy.assembleForgingRecipe(progress, options);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(progress), snapshot, `${result.code} deducts no fragments`);
}
console.log('chapter-three-weapon-recipe-fragment-policy: assertions passed');
