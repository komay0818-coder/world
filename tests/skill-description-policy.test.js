const assert = require('node:assert/strict');
const descriptions = require('../skill-description-policy.js');
const base = require('../class-skill-policy.js');
const advanced = [
  require('../warrior-advancement-policy.js'), require('../rogue-advancement-policy.js'), require('../hunter-advancement-policy.js'),
  require('../mage-advancement-policy.js'), require('../priest-advancement-policy.js')
];

for (const [job, skills] of Object.entries(base.SKILLS)) {
  for (const skill of skills) {
    const copy = descriptions.format(job, skill, skill.levels[0]);
    assert.ok(copy && copy !== skill.name && !copy.includes('undefined'), `${job}:${skill.id} has complete copy`);
  }
}
for (const policy of advanced) {
  for (const skill of policy.SKILLS) {
    const copy = descriptions.format('', skill, skill.levels[0]);
    assert.ok(copy && !copy.includes('undefined'), `${skill.id} has complete copy`);
  }
}

assert.match(descriptions.format('warrior', base.getSkill('warrior', 'iron-will'), base.getEffect('warrior', 'iron-will', 1)), /受到傷害降低 5%/);
assert.match(descriptions.format('hunter', base.getSkill('hunter', 'precision-shot'), base.getEffect('hunter', 'precision-shot', 1)), /暴擊率提高 3%/);
assert.match(descriptions.format('mage', base.getSkill('mage', 'mana-shield'), base.getEffect('mage', 'mana-shield', 1)), /護盾為最大生命 10%.*消耗最大魔力 15%.*內建冷卻 20 秒/);
assert.match(descriptions.format('priest', base.getSkill('priest', 'holy-light'), base.getEffect('priest', 'holy-light', 1)), /降低攻擊 10%.*持續 4 秒/);
assert.match(descriptions.format('', advanced[0].getSkill('weapon-stance'), advanced[0].getEffect('weapon-stance', 1)), /劍類暴擊率提高 5%.*斧類傷害提高 6%/);

console.log('Skill description policy checks passed');
