const assert = require('node:assert/strict');
const policy = require('../recipe-image-policy.js');

assert.deepEqual(Object.keys(policy.IMAGES), ['uncommon', 'rare', 'epic', 'legendary']);
assert.equal(policy.getImage('uncommon').split('?')[0], 'assets/recipe-uncommon.png');
assert.equal(policy.getImage('rare').split('?')[0], 'assets/recipe-rare.png');
assert.equal(policy.getImage('epic').split('?')[0], 'assets/recipe-epic.png');
assert.equal(policy.getImage('legendary').split('?')[0], 'assets/recipe-legendary.png');
assert.equal(policy.getImage('unknown'), null);

console.log('recipe-image-policy: assertions passed');
