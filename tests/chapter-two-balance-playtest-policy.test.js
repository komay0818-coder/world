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
assert.equal(BalancePolicy.isChapterOne11Active({ hostname: '127.0.0.1', search: '?playtest=chapter-one-11' }), true);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-one-11' }), 'plains-entrance');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-one-11' }), BalancePolicy.CHAPTER_ONE_11_SLOT_KEY);
assert.equal(BalancePolicy.isChapterOne12Active({ hostname: '127.0.0.1', search: '?playtest=chapter-one-12' }), true);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-one-12' }), 'wolf-den');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-one-12' }), BalancePolicy.CHAPTER_ONE_12_SLOT_KEY);
assert.equal(BalancePolicy.isChapterOne13Active({ hostname: '127.0.0.1', search: '?playtest=chapter-one-13' }), true);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-one-13' }), 'boar-woods');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-one-13' }), BalancePolicy.CHAPTER_ONE_13_SLOT_KEY);
assert.equal(BalancePolicy.isChapterOne14Active({ hostname: '127.0.0.1', search: '?playtest=chapter-one-14' }), true);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-one-14' }), 'goblin-camp');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-one-14' }), BalancePolicy.CHAPTER_ONE_14_SLOT_KEY);
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-31' }), BalancePolicy.CHAPTER_THREE_SLOT_KEY);
assert.equal(BalancePolicy.getProgressKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-31' }), BalancePolicy.CHAPTER_THREE_PROGRESS_KEY);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-three-32' }), 'brokenrock-canyon');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-32' }), BalancePolicy.CHAPTER_THREE_32_SLOT_KEY);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-three-33' }), 'bloodwar-wastes');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-33' }), BalancePolicy.CHAPTER_THREE_33_SLOT_KEY);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-three-34' }), 'skullcrusher-war-camp');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-34' }), BalancePolicy.CHAPTER_THREE_34_SLOT_KEY);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-three-35' }), 'ancient-altar');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-35' }), BalancePolicy.CHAPTER_THREE_35_SLOT_KEY);
assert.equal(BalancePolicy.getRequestedMapId({ hostname: '127.0.0.1', search: '?playtest=chapter-three-36' }), 'redrock-temple');
assert.equal(BalancePolicy.getSlotKey({ hostname: '127.0.0.1', search: '?playtest=chapter-three-36' }), BalancePolicy.CHAPTER_THREE_36_SLOT_KEY);
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

const chapterOne11Slots = BalancePolicy.createSlots({
  EquipmentPolicy,
  EquipmentDropPolicy,
  location: { hostname: '127.0.0.1', search: '?playtest=chapter-one-11&showcase=v1' }
});
assert.ok(chapterOne11Slots.every((slot) => slot.progress.selectedMapId === 'plains-entrance'));
assert.ok(chapterOne11Slots.every((slot) => slot.character.name.startsWith('1-1 測試')));

const chapterOne12Slots = BalancePolicy.createSlots({
  EquipmentPolicy,
  EquipmentDropPolicy,
  location: { hostname: '127.0.0.1', search: '?playtest=chapter-one-12&showcase=v1' }
});
assert.ok(chapterOne12Slots.every((slot) => slot.progress.selectedMapId === 'wolf-den'));
assert.ok(chapterOne12Slots.every((slot) => slot.character.name.startsWith('1-2 測試')));
assert.ok(chapterOne12Slots.every((slot) => slot.progress.mapUnlocked['wolf-den']));

const chapterOne13Slots = BalancePolicy.createSlots({
  EquipmentPolicy,
  EquipmentDropPolicy,
  location: { hostname: '127.0.0.1', search: '?playtest=chapter-one-13&showcase=v1' }
});
assert.ok(chapterOne13Slots.every((slot) => slot.progress.selectedMapId === 'boar-woods'));
assert.ok(chapterOne13Slots.every((slot) => slot.character.name.startsWith('1-3 測試')));
assert.ok(chapterOne13Slots.every((slot) => slot.progress.mapUnlocked['boar-woods']));

const chapterOne14Slots = BalancePolicy.createSlots({
  EquipmentPolicy,
  EquipmentDropPolicy,
  location: { hostname: '127.0.0.1', search: '?playtest=chapter-one-14&showcase=v1' }
});
assert.ok(chapterOne14Slots.every((slot) => slot.progress.selectedMapId === 'goblin-camp'));
assert.ok(chapterOne14Slots.every((slot) => slot.character.name.startsWith('1-4 測試')));
assert.ok(chapterOne14Slots.every((slot) => slot.progress.mapUnlocked['goblin-camp']));
assert.ok(chapterOne14Slots.every((slot) => !slot.progress.mapUnlocked['plains-depths']));

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

const chapterThree36Slots = BalancePolicy.createSlots({
  EquipmentPolicy, EquipmentDropPolicy, CraftingPolicy, ClassSkillPolicy,
  location: { hostname: 'raw.githack.com', pathname: '/komay0818-coder/world/dev/index.html', search: '?playtest=chapter-three-36' }
});
assert.ok(chapterThree36Slots.every((slot) => slot.progress.selectedMapId === 'redrock-temple'));
assert.ok(chapterThree36Slots.every((slot) => slot.progress.chapterThreeProgress.cleared['ancient-altar']));
assert.ok(chapterThree36Slots.every((slot) => slot.progress.chapterThreeProgress.bossFirstKills['ancient-altar']));
assert.ok(chapterThree36Slots.every((slot) => slot.progress.chapterThreeProgress.unlocked['redrock-temple']));

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
assert.match(script, /getScenario\(\) === 'purified-heart-pressure'[\s\S]*'heartOfTheBlackForest',[\s\S]*'forestSpirit',[\s\S]*'darkSporeBeast',[\s\S]*'corruptedBlackstoneCenturion'/);
assert.match(script, /sessionStorage\.setItem\(playtestProgressKey, JSON\.stringify\(progress\)\)/, 'playtest progress is session-only');
assert.match(script, /isChapterThreeActive\(\) \|\| ChapterTwoBalancePlaytestPolicy\?\.isChapterOne11Active\(\) \|\| ChapterTwoBalancePlaytestPolicy\?\.isChapterOne12Active\(\) \|\| ChapterTwoBalancePlaytestPolicy\?\.isChapterOne13Active\(\) \|\| ChapterTwoBalancePlaytestPolicy\?\.isChapterOne14Active\(\)\) setTimeout\(openBattle, 0\)/, 'visual playtests open the formal battle directly');
assert.match(script, /isChapterOne11Active\(\)[\s\S]*?return \['plainsRabbit', 'plainsWolfPup', 'plainsSlime', 'plainsGoblinYoung', 'lostGoblin'\]/, '1-1 visual playtest shows every map monster together');
assert.match(script, /isChapterOne12Active\(\)[\s\S]*?return \['greatfangWolf', 'ragingWolf', 'plainsWolfPup', 'denForestWolf', 'lostGoblin'\]/, '1-2 visual playtest shows every map monster together');
assert.match(script, /isChapterOne13Active\(\)[\s\S]*?return \['boarKing', 'irritableBoar', 'boarPiglet', 'forestBoar', 'lostGoblin'\]/, '1-3 visual playtest shows every map monster together');
assert.match(script, /activeMapId === 'goblin-camp' && ChapterTwoBalancePlaytestPolicy\?\.isChapterOne14Active\(\)[\s\S]*?getGoblinCampWaveTypes\(1\)/, '1-4 visual playtest starts with the first goblin camp wave');
assert.match(script, /chapterOne14ShowcaseGroups = Object\.freeze\([\s\S]*?length: 7[\s\S]*?getGoblinCampWaveTypes\(index \+ 1\)/, '1-4 unified showcase contains all seven goblin camp waves');
assert.match(script, /function rotateChapterOne14Showcase[\s\S]*?showcaseRoundIndex[\s\S]*?showcaseNextRoundAt = now \+ 6000/, '1-4 unified showcase rotates every six seconds');
assert.match(script, /if \(rotatingChapterOne14Showcase\) \{\s*rotateChapterOne14Showcase\(now\);\s*\} else if \(timedVisualShowcase\)/, '1-4 rotation does not use normal kill and respawn progression');
[
  ['goblinScout', '.7716375'],
  ['goblinWarrior', '.9215'],
  ['goblinSlinger', '.833'],
  ['goblinShaman', '1.029073'],
  ['goblinGuard', '1.145772'],
  ['goblinCaptain', '1.15'],
  ['goblinTreasureChest', '.72'],
  ['goblinHighChief', '1.32']
].forEach(([monsterId, scale]) => {
  assert.match(script, new RegExp(`${monsterId}:\\s*${scale.replace('.', '\\.')},`), `1-4 ${monsterId} keeps its approved independent display scale`);
});
assert.match(script, /boarPiglet:\s*\.722,/, '1-3 piglet retains the earlier reductions and is reduced by another 5%');
assert.match(script, /forestBoar:\s*\.81225,/, '1-3 forest boar retains the earlier reductions and is reduced by another 5%');
assert.match(script, /irritableBoar:\s*\.92,/, '1-3 elite display size is reduced by 8%');
assert.match(script, /boarKing:\s*1\.15,/, '1-3 boss display size is increased by 15%');

console.log('chapter-two balance playtest policy tests passed');
