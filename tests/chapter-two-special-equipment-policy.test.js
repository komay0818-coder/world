const assert = require('node:assert/strict');
const policy = require('../chapter-two-special-equipment-policy.js');

assert.equal(Object.keys(policy.TEMPLATES).length, 4);
assert.deepEqual(Object.values(policy.TEMPLATES).map(({ name }) => name), ['黑石督軍戰盔', '腐化守護者皮靴', '幽森魔珠', '墮落荊棘魔杖']);
assert.ok(Object.values(policy.TEMPLATES).every((item) => item.quality === 'epic' && item.directDrop && item.image === null && item.implementationStatus === 'pending-balance'));
assert.deepEqual(policy.TEMPLATES.blackstoneWarlordHelm.allowedJobs, ['warrior']);
assert.deepEqual(policy.TEMPLATES.corruptedGuardianLeatherBoots.allowedJobs, ['hunter', 'assassin']);
assert.deepEqual(policy.TEMPLATES.deepForestMagicOrb.allowedJobs, ['mage', 'priest']);
assert.deepEqual(policy.TEMPLATES.fallenThornWand.allowedJobs, ['mage', 'priest']);
assert.equal(Object.keys(policy.DROP_SOURCES).length, 4);
assert.ok(Object.values(policy.DROP_SOURCES).every((source) => source.dropRate === null && source.enabled === false), '未擅自設定紫裝最終掉落率');
assert.equal(policy.grantSpecialDrop({}, { id: 'blackstoneStrongholdWarlord' }), null, '平衡資料未完成前不將零數值紫裝加入背包');

console.log('chapter-two-special-equipment-policy: assertions passed');
