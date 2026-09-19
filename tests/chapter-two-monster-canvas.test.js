const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const policies = [
  require('../black-forest-entrance-policy.js'),
  require('../black-forest-trail-policy.js'),
  require('../spider-nest-policy.js'),
  require('../blackstone-stronghold-policy.js'),
  require('../forest-altar-policy.js'),
  require('../black-forest-depths-policy.js')
];

const imagePaths = new Set(
  policies.flatMap((policy) => policy.MONSTERS)
    .map((monster) => monster.image?.split('?')[0])
    .filter(Boolean)
);

assert.equal(imagePaths.size, 38, 'all chapter-two monster canvases are covered');
for (const imagePath of imagePaths) {
  const png = fs.readFileSync(path.join(__dirname, '..', imagePath));
  assert.equal(png.subarray(1, 4).toString(), 'PNG', `${imagePath} is a PNG`);
  assert.equal(png.readUInt32BE(16), 1024, `${imagePath} uses the shared canvas width`);
  assert.equal(png.readUInt32BE(20), 1024, `${imagePath} uses the shared canvas height`);
  assert.equal(png[25], 6, `${imagePath} uses an RGBA canvas`);
}

console.log('chapter-two-monster-canvas: assertions passed');
