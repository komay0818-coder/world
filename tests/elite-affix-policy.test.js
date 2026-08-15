const assert = require('assert');
const policy = require('../elite-affix-policy.js');

function sequence(values) { let index = 0; return () => values[index++] ?? values[values.length - 1]; }
const elite = { id: 'blackstoneCaptain', isElite: true, isBoss: false, chapter: 2, name: '黑石隊長', maxHp: 1000, defense: 100, attackSpeed: 1 };

assert.equal(policy.CHAPTER_CONFIGS[2].affixChance, .40);
assert.equal(policy.CHAPTER_CONFIGS[2].maxAffixes, 1);
assert.equal(policy.rollAffixes(elite, 1, () => 0).length, 0, '第一章不啟用');
assert.equal(policy.rollAffixes({ ...elite, isElite: false }, 2, () => 0).length, 0, '普通怪不啟用');
assert.equal(policy.rollAffixes({ ...elite, isBoss: true }, 2, () => 0).length, 0, 'Boss 不啟用');
assert.equal(policy.rollAffixes(elite, 2, () => .40).length, 0, '40% 邊界不產生詞綴');
assert.equal(policy.rollAffixes(elite, 2, sequence([.399, 0])).length, 1, '第二章菁英可產生一條詞綴');
assert(!policy.getAllowedAffixIds({ ...elite, id: 'blackstoneVenombladeAssassin' }, 2).includes('executioner'));
assert(!policy.getAllowedAffixIds({ ...elite, id: 'altarGuard' }, 2).includes('ironWall'));

const strengthened = policy.applyAffixes(elite, [policy.AFFIXES.tenacious]);
assert.equal(strengthened.maxHp, 1300);
assert.equal(strengthened.name, '黑石隊長【強韌】');
assert.equal(policy.applyAffixes(elite, [policy.AFFIXES.ironWall]).defense, 120);
assert.equal(policy.applyAffixes(elite, [policy.AFFIXES.frenzy]).attackSpeed, 1.2);
assert.equal(policy.getDirectDamageLeech([policy.AFFIXES.bloodthirst]), .10);
assert.equal(policy.getDamageMultiplier([policy.AFFIXES.executioner], .349), 1.2);
assert.equal(policy.getDamageMultiplier([policy.AFFIXES.executioner], .35), 1);
assert.equal(policy.getRegeneration([policy.AFFIXES.regeneration]).regenerationRatio, .03);
assert.deepEqual(policy.getDropBonus([policy.AFFIXES.frenzy], 2), { equipmentMultiplier: 1.1, materialMultiplier: 1.1 });

console.log('elite-affix-policy: assertions passed');
