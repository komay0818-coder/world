const assert = require('node:assert/strict');
const BalancePolicy = require('../chapter-two-balance-playtest-policy');
const EquipmentPolicy = require('../equipment-policy');
const EquipmentDropPolicy = require('../equipment-drop-policy');
const ClassSkillPolicy = require('../class-skill-policy');
const CraftingPolicy = require('../crafting-policy');
const fs = require('node:fs');
const path = require('node:path');

assert.equal(BalancePolicy.isActive({ hostname: 'example.com', search: '?playtest=chapter-two-balance' }), false);
assert.equal(BalancePolicy.isActive({ hostname: '127.0.0.1', search: '?playtest=chapter-two-balance' }), true);
assert.equal(BalancePolicy.isActive({ hostname: 'komay0818-coder.github.io', pathname: '/world/', search: '?playtest=chapter-three-31' }), false);
assert.equal(BalancePolicy.isActive({ hostname: 'raw.githack.com', pathname: '/komay0818-coder/world/main/', search: '?playtest=chapter-three-31' }), false);
assert.equal(BalancePolicy.isActive({ hostname: 'raw.githack.com', pathname: '/komay0818-coder/world/dev/index.html', search: '?playtest=chapter-three-31' }), true);
assert.equal(BalancePolicy.isActive({ hostname: 'raw.githack.com', pathname: '/komay0818-coder/world/ac852e3/index.html', search: '?playtest=chapter-three-31' }), true);
assert.equal(BalancePolicy.isChapterThreeActive({ hostname: '127.0.0.1', search: '?playtest=chapter-three-31' }), true);
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-31' }), BalancePolicy.CHAPTER_THREE_SLOT_KEY);
assert.equal(BalancePolicy.getProgressKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-31' }), BalancePolicy.CHAPTER_THREE_PROGRESS_KEY);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-three-32' }), 'brokenrock-canyon');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-32' }), BalancePolicy.CHAPTER_THREE_32_SLOT_KEY);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-three-33' }), 'bloodwar-wastes');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-33' }), BalancePolicy.CHAPTER_THREE_33_SLOT_KEY);
assert.equal(BalancePolicy.getActiveSlotIndex({ hostname: '127.0.0.1', search: '?playtest=chapter-two-balance&main=hunter' }), 1);
assert.equal(BalancePolicy.getActiveSlotIndex({ hostname: '127.0.0.1', search: '?playtest=chapter-two-balance&main=priest' }), 2);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-two-balance&map=spider-nest' }), 'spider-nest');
assert.equal(BalancePolicy.getScenario({ hostname: '127.0.0.1', search: '?playtest=chapter-two-balance&scenario=purified-heart-pressure' }), 'purified-heart-pressure');
assert.equal(BalancePolicy.getRemovedCorruptionLayers({ hostname: '127.0.0.1', search: '?playtest=chapter-two-balance&removedLayers=6' }), 6);
assert.equal(BalancePolicy.getRemovedCorruptionLayers({ hostname: '127.0.0.1', search: '?playtest=chapter-two-balance&removedLayers=99' }), 6);
assert.equal(BalancePolicy.getRemovedCorruptionLayers({ hostname: 'example.com', search: '?playtest=chapter-two-balance&removedLayers=6' }), 0);
assert.equal(BalancePolicy.getLoadout({ hostname: '127.0.0.1', search: '?playtest=chapter-two-balance&loadout=full' }), 'full');

const slots = BalancePolicy.createSlots({ EquipmentPolicy, EquipmentDropPolicy });
assert.deepEqual(slots.map((slot) => slot.character.job), ['warrior', 'hunter', 'priest']);
assert.deepEqual(slots.map((slot) => slot.progress.level), [25, 25, 25]);
assert.ok(slots.every((slot) => slot.progress.party.activeMemberIds.length === 3));
assert.ok(slots.every((slot) => slot.progress.inventory.length === 0));
assert.ok(slots.every((slot) => Object.values(slot.progress.equipment).filter(Boolean).every((item) => !(item.runes || []).length)));

const warrior = slots[0].progress.equipment;
assert.equal(warrior.weapon.baseItemId, 'forest-guard-longsword');
assert.equal(warrior.offhand.baseItemId, 'black-iron-guard-round-shield');
assert.equal(warrior.gloves.baseItemId, 'starter-recruit-iron-gauntlets');
assert.deepEqual(warrior.weapon.affixes.map((entry) => entry.id), ['accuracy_percent', 'attack_speed_percent', 'max_hp_flat']);
assert.ok(warrior.weapon.affixes.every((entry) => !['boss_damage_percent', 'elite_damage_percent'].includes(entry.id)));

const purifiedSlots = BalancePolicy.createSlots({
  EquipmentPolicy,
  EquipmentDropPolicy,
  location: {
    hostname: '127.0.0.1',
    search: '?playtest=chapter-two-balance&map=black-forest-depths&scenario=purified-heart-pressure&removedLayers=6'
  }
});
assert.ok(purifiedSlots.every((slot) => slot.progress.blackForestCorruption.removedLayers === 6));
assert.ok(purifiedSlots.every((slot) => slot.progress.selectedMapId === 'black-forest-depths'));

const fullLoadoutSlots = BalancePolicy.createSlots({
  EquipmentPolicy,
  EquipmentDropPolicy,
  location: { hostname: '127.0.0.1', search: '?playtest=chapter-two-balance&loadout=full' }
});
assert.deepEqual(
  fullLoadoutSlots.map((slot) => [slot.progress.equipment.gloves.baseItemId, slot.progress.equipment.pants.baseItemId, slot.progress.equipment.boots.baseItemId]),
  [
    ['blackstone-corrupted-gauntlets', 'blackstone-corrupted-legguards', 'blackstone-corrupted-warboots'],
    ['deepwood-hunter-gloves', 'deepwood-hunter-legguards', 'deepwood-hunter-boots'],
    ['spiritweave-spellgloves', 'spiritweave-pants', 'spiritweave-boots']
  ]
);
assert.ok(fullLoadoutSlots.every((slot) => Object.values(slot.progress.equipment).filter(Boolean).every((item) => !(item.runes || []).length)));

const chapterThreeSlots = BalancePolicy.createSlots({
  EquipmentPolicy,
  EquipmentDropPolicy,
  CraftingPolicy,
  ClassSkillPolicy,
  location: { hostname: 'raw.githack.com', pathname: '/komay0818-coder/world/dev/index.html', search: '?playtest=chapter-three-31' }
});
assert.deepEqual(chapterThreeSlots.map((slot) => slot.progress.level), [30, 30, 30]);
assert.ok(chapterThreeSlots.every((slot) => slot.progress.balancePlaytestLoadout === 'full'));
assert.deepEqual(
  chapterThreeSlots.map((slot) => [slot.progress.equipment.gloves.baseItemId, slot.progress.equipment.pants.baseItemId, slot.progress.equipment.boots.baseItemId]),
  [
    ['blackstone-corrupted-gauntlets', 'blackstone-corrupted-legguards', 'blackstone-corrupted-warboots'],
    ['deepwood-hunter-gloves', 'deepwood-hunter-legguards', 'deepwood-hunter-boots'],
    ['spiritweave-spellgloves', 'spiritweave-pants', 'spiritweave-boots']
  ]
);
assert.ok(chapterThreeSlots.every((slot) => Object.keys(slot.progress.skillLevels).length === ClassSkillPolicy.getSkills(slot.character.job).length));
assert.ok(chapterThreeSlots.every((slot) => Object.values(slot.progress.skillLevels).every((level) => level === 5)));
assert.deepEqual(
  chapterThreeSlots.map((slot) => [slot.progress.equipment.shoulders.baseItemId, slot.progress.equipment.cloak.baseItemId, slot.progress.equipment.wrist.baseItemId]),
  Array(3).fill(['crafted-blackstone-bullhorn-shoulders', 'crafted-corrupted-centurion-cloak', 'crafted-sturdy-guardian-wrist'])
);
assert.ok(chapterThreeSlots.every((slot) => slot.progress.selectedMapId === 'redrock-wastes-entrance'));
assert.ok(chapterThreeSlots.every((slot) => slot.progress.unlockedChapter === 3));
assert.ok(chapterThreeSlots.every((slot) => slot.progress.chapterTwoProgress.completed));
assert.ok(chapterThreeSlots.every((slot) => slot.progress.chapterThreeProgress.unlocked['redrock-wastes-entrance']));
assert.ok(chapterThreeSlots.every((slot) => !slot.progress.chapterThreeProgress.unlocked['brokenrock-canyon']));
assert.ok(chapterThreeSlots.every((slot) => !slot.progress.chapterThreeProgress.cleared['redrock-wastes-entrance']));

const chapterThree32Slots = BalancePolicy.createSlots({
  EquipmentPolicy, EquipmentDropPolicy, CraftingPolicy, ClassSkillPolicy,
  location: { hostname: 'raw.githack.com', pathname: '/komay0818-coder/world/dev/index.html', search: '?playtest=chapter-three-32' }
});
assert.ok(chapterThree32Slots.every((slot) => slot.progress.selectedMapId === 'brokenrock-canyon'));
assert.ok(chapterThree32Slots.every((slot) => slot.progress.chapterThreeProgress.cleared['redrock-wastes-entrance']));
assert.ok(chapterThree32Slots.every((slot) => slot.progress.chapterThreeProgress.unlocked['brokenrock-canyon']));
assert.ok(chapterThree32Slots.every((slot) => !slot.progress.chapterThreeProgress.unlocked['bloodwar-wastes']));

const chapterThree33Slots = BalancePolicy.createSlots({
  EquipmentPolicy, EquipmentDropPolicy, CraftingPolicy, ClassSkillPolicy,
  location: { hostname: 'raw.githack.com', pathname: '/komay0818-coder/world/dev/index.html', search: '?playtest=chapter-three-33' }
});
assert.ok(chapterThree33Slots.every((slot) => slot.progress.selectedMapId === 'bloodwar-wastes'));
assert.ok(chapterThree33Slots.every((slot) => slot.progress.chapterThreeProgress.cleared['redrock-wastes-entrance']));
assert.ok(chapterThree33Slots.every((slot) => slot.progress.chapterThreeProgress.cleared['brokenrock-canyon']));
assert.ok(chapterThree33Slots.every((slot) => slot.progress.chapterThreeProgress.unlocked['bloodwar-wastes']));
assert.ok(chapterThree33Slots.every((slot) => !slot.progress.chapterThreeProgress.unlocked['skullcrusher-war-camp']));

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
assert.match(script, /getScenario\(\) === 'purified-heart-pressure'[\s\S]*'heartOfTheBlackForest',[\s\S]*'forestSpirit',[\s\S]*'darkSporeBeast',[\s\S]*'corruptedBlackstoneCenturion'/);
assert.match(script, /sessionStorage\.setItem\(playtestProgressKey, JSON\.stringify\(progress\)\)/, 'playtest progress is session-only');
assert.match(script, /isChapterThreeActive\(\)\) setTimeout\(openBattle, 0\)/, 'chapter 3-1 playtest opens the formal battle directly');

console.log('chapter-two balance playtest policy tests passed');
