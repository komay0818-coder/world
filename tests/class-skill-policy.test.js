const assert = require('node:assert/strict');
const policy = require('../class-skill-policy.js');

assert.equal(policy.FIRST_JOB_CHANGE_LEVEL, 45);
assert.deepEqual(Object.keys(policy.SKILLS), ['warrior', 'hunter', 'assassin', 'mage', 'priest']);
Object.entries(policy.SKILLS).forEach(([job, skills]) => {
  assert.equal(skills.filter((skill) => skill.type === 'active').length, 3, `${job} has three active skills`);
  assert.equal(skills.filter((skill) => skill.type === 'passive').length, 4, `${job} has four passive skills`);
  skills.forEach((skill) => assert.equal(skill.levels.length, 6, `${job}:${skill.id} has six independent levels`));
});
assert.deepEqual(policy.getSkills('hunter').filter((skill) => skill.type === 'active').map((skill) => skill.id), ['power-shot', 'multi-shot', 'piercing-shot']);
assert.equal(policy.getEffect('hunter', 'power-shot', 1).power, 1.6);
assert.equal(policy.getEffect('hunter', 'piercing-shot', 6).singleTargetBonus, .25);
assert.equal(policy.getEffect('priest', 'heal', 6).afterglow, .2);

const levels = { 'warrior:heavy-strike': 6, 'warrior:whirlwind': 5, 'warrior:weapon-mastery': 6 };
assert.equal(policy.canSpecialize(levels, 'warrior', 'whirlwind').reason, 'specialization-occupied');
assert.equal(policy.canSpecialize(levels, 'warrior', 'weapon-mastery').ok, true, 'active and passive specialization slots are independent');
const normalized = policy.normalizeSkillLevels({ 'mage:fireball': 6, 'mage:blizzard': 6, 'mage:blink': 6, 'mage:mana-shield': 6 });
assert.equal(normalized['mage:fireball'], 6);
assert.equal(normalized['mage:blizzard'], 5);
assert.equal(normalized['mage:blink'], 6);
assert.equal(normalized['mage:mana-shield'], 5);

console.log('class-skill-policy: assertions passed');
