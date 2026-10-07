const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const trailPolicy = require('../black-forest-trail-policy.js');
const spiderPolicy = require('../spider-nest-policy.js');

assert.equal(
  trailPolicy.getCombatMonster('blackstonePoisonSpider').image,
  spiderPolicy.getCombatMonster('spiderNestBlackstonePoisonSpider').image,
  '2-2 and 2-3 blackstone poison spiders share the same artwork'
);
assert.equal(
  trailPolicy.getCombatMonster('blackstoneBeastmaster').image,
  spiderPolicy.getCombatMonster('spiderNestBlackstoneBeastmaster').image,
  '2-2 and 2-3 blackstone beastmasters share the same artwork'
);
assert.match(script, /blackstonePoisonSpider: \.81,[\s\S]*?spiderNestBlackstonePoisonSpider: \.81,/, 'both blackstone poison spiders use the approved 81% scale');
assert.match(script, /blackstoneBeastmaster: 1\.08,[\s\S]*?spiderNestBlackstoneBeastmaster: 1\.08,/, 'both blackstone beastmasters use the approved 108% scale');

console.log('chapter-two-23-shared-monster-visual-size: assertions passed');
