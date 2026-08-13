const assert = require('node:assert/strict');
const policy = require('../magic-tower-policy.js');
const skillPolicy = require('../skill-upgrade-policy.js');

assert.deepEqual(policy.CONFIG, { pageCost: 10, successChance: .4, rewardAmount: 1 });
assert.deepEqual(policy.getAvailableRecipes(1).map((recipe) => recipe.id), ['beginner']);
assert.deepEqual(policy.getAvailableRecipes(2).map((recipe) => recipe.id), ['beginner', 'intermediate']);
assert.equal(policy.canSynthesize({ inventory: [{ id: 'beginner_skill_page', quantity: 9 }] }, 'beginner', 1).ok, false);
assert.equal(policy.canSynthesize({ inventory: [{ id: 'beginner_skill_page', quantity: 10 }] }, 'beginner', 1).ok, true);
assert.equal(policy.canSynthesize({ inventory: [{ id: 'intermediate_skill_page', quantity: 10 }] }, 'intermediate', 1).reason, 'tower-level');

const success = { inventory: [{ ...skillPolicy.MATERIALS.beginner_skill_page, quantity: 15 }] };
assert.equal(policy.synthesize(success, 'beginner', 1, { random: () => .3999, materialDefinitions: skillPolicy.MATERIALS }).success, true);
assert.equal(policy.getQuantity(success.inventory, 'beginner_skill_page'), 5);
assert.equal(policy.getQuantity(success.inventory, 'beginner_skill_book'), 1);

const failure = { inventory: [{ ...skillPolicy.MATERIALS.intermediate_skill_page, quantity: 10 }] };
assert.equal(policy.synthesize(failure, 'intermediate', 2, { random: () => .4, materialDefinitions: skillPolicy.MATERIALS }).success, false);
assert.equal(policy.getQuantity(failure.inventory, 'intermediate_skill_page'), 0);
assert.equal(policy.getQuantity(failure.inventory, 'intermediate_skill_book'), 0);

console.log('magic-tower-policy: assertions passed');
