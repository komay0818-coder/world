const assert = require('node:assert/strict');
const policy = require('../equipment-affix-policy.js');

const weapon = { id: 'chapter-weapon', kind: 'equipment', slot: 'weapon', allowedJobs: ['mage'] };
const ids = (chapter, quality = 'rare', item = weapon) => policy.getAvailableAffixes(item, [], { chapter, quality }).map((entry) => entry.id);

assert.equal(ids(1).includes('chapter2_berserker'), false, 'chapter two affixes stay locked in chapter one');
assert.equal(ids(2).includes('chapter2_berserker'), true, 'chapter two unlocks composite affixes');
assert.equal(ids(2, 'epic').includes('chapter3_berserker_master'), false);
assert.equal(ids(3, 'epic').includes('chapter3_berserker_master'), true, 'chapter three unlocks three-component affixes');
assert.equal(policy.EQUIPMENT_AFFIXES.chapter2_berserker.components.length, 2);
assert.equal(policy.EQUIPMENT_AFFIXES.chapter3_berserker_master.components.length, 3);

assert.equal(ids(1, 'uncommon').includes('mage_fireball_damage'), false, 'future skill affix stays locked in chapter one');
assert.equal(ids(2, 'uncommon').includes('mage_fireball_damage'), true, 'skill affix can roll on matching job equipment after its chapter unlock');
assert.equal(ids(2, 'uncommon', { ...weapon, allowedJobs: ['hunter'] }).includes('mage_fireball_damage'), false, 'skill affix cannot roll for another job');
assert.equal(ids(2, 'legendary').includes('mage_fireball_damage'), false, 'quality restrictions are data-driven');
const skillDefinition = policy.EQUIPMENT_AFFIXES.mage_fireball_damage;
assert.equal(skillDefinition.type, policy.AFFIX_TYPES.SKILL);
assert.equal(skillDefinition.jobId, 'mage');
assert.equal(skillDefinition.skillId, 'fireball');
assert.equal(skillDefinition.isSpecialAbility, false);

const composite = policy.normalizeAffix({ id: 'chapter2_berserker' });
const stats = policy.getEquippedAffixStats({ weapon: { affixes: [composite] } });
assert.equal(stats.attackFlat, 4);
assert.equal(stats.attackSpeedPercent, 5, 'all composite components contribute stats');

const specialTemplate = { ...weapon, specialAbilityIds: ['mage_fireball_burn'] };
assert.equal(policy.rollSpecialAbility(specialTemplate, 'epic', () => 0, 1, { chapter: 1, quality: 'epic', jobId: 'mage' }), null);
const special = policy.rollSpecialAbility(specialTemplate, 'epic', () => 0, 1, { chapter: 2, quality: 'epic', jobId: 'mage' });
assert.equal(special.id, 'mage_fireball_burn');
assert.equal(special.isSpecialAbility, true);
assert.equal(special.isSpecialSkillEffect, true);
assert.equal(special.jobId, 'mage');
assert.equal(special.skillId, 'fireball');
assert.equal(policy.rollSpecialAbility({ ...specialTemplate, allowedJobs: ['hunter'] }, 'epic', () => 0, 1, { chapter: 2, quality: 'epic' }), null);

const purple = policy.createEquipmentInstance(specialTemplate, { quality: 'epic', chapter: 2, jobId: 'mage', specialChance: 1, random: () => 0 });
assert.equal(purple.specialAbility.id, 'mage_fireball_burn');
assert.equal(purple.affixes.length, policy.QUALITY_AFFIX_RULES.epic.fixedCount + policy.QUALITY_AFFIX_RULES.epic.randomCount, 'special ability does not consume a normal affix slot');
assert.equal(purple.affixChapter, 2);

console.log('chapter-affix-system: assertions passed');
