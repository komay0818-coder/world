(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ChapterTwoBalancePlaytestPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PLAYTEST_ID = 'chapter-two-balance';
  const CHAPTER_ONE_11_PLAYTEST_ID = 'chapter-one-11';
  const CHAPTER_ONE_12_PLAYTEST_ID = 'chapter-one-12';
  const CHAPTER_ONE_13_PLAYTEST_ID = 'chapter-one-13';
  const CHAPTER_ONE_14_PLAYTEST_ID = 'chapter-one-14';
  const CHAPTER_ONE_15_PLAYTEST_ID = 'chapter-one-15';
  const CHAPTER_THREE_PLAYTEST_ID = 'chapter-three-31';
  const CHAPTER_THREE_32_PLAYTEST_ID = 'chapter-three-32';
  const CHAPTER_THREE_33_PLAYTEST_ID = 'chapter-three-33';
  const CHAPTER_THREE_34_PLAYTEST_ID = 'chapter-three-34';
  const CHAPTER_THREE_35_PLAYTEST_ID = 'chapter-three-35';
  const CHAPTER_THREE_36_PLAYTEST_ID = 'chapter-three-36';
  const SLOT_KEY = 'chapter-two-balance-playtest-slots-v1';
  const PROGRESS_KEY = 'chapter-two-balance-playtest-progress-v2';
  const CHAPTER_ONE_11_SLOT_KEY = 'chapter-one-11-playtest-slots-v1';
  const CHAPTER_ONE_11_PROGRESS_KEY = 'chapter-one-11-playtest-progress-v1';
  const CHAPTER_ONE_12_SLOT_KEY = 'chapter-one-12-playtest-slots-v2';
  const CHAPTER_ONE_12_PROGRESS_KEY = 'chapter-one-12-playtest-progress-v2';
  const CHAPTER_ONE_13_SLOT_KEY = 'chapter-one-13-playtest-slots-v1';
  const CHAPTER_ONE_13_PROGRESS_KEY = 'chapter-one-13-playtest-progress-v1';
  const CHAPTER_ONE_14_SLOT_KEY = 'chapter-one-14-playtest-slots-v1';
  const CHAPTER_ONE_14_PROGRESS_KEY = 'chapter-one-14-playtest-progress-v1';
  const CHAPTER_ONE_15_SLOT_KEY = 'chapter-one-15-playtest-slots-v1';
  const CHAPTER_ONE_15_PROGRESS_KEY = 'chapter-one-15-playtest-progress-v1';
  const CHAPTER_THREE_SLOT_KEY = 'chapter-three-31-playtest-slots-v1';
  const CHAPTER_THREE_PROGRESS_KEY = 'chapter-three-31-playtest-progress-v1';
  const CHAPTER_THREE_32_SLOT_KEY = 'chapter-three-32-playtest-slots-v1';
  const CHAPTER_THREE_32_PROGRESS_KEY = 'chapter-three-32-playtest-progress-v1';
  const CHAPTER_THREE_33_SLOT_KEY = 'chapter-three-33-playtest-slots-v1';
  const CHAPTER_THREE_33_PROGRESS_KEY = 'chapter-three-33-playtest-progress-v1';
  const CHAPTER_THREE_34_SLOT_KEY = 'chapter-three-34-playtest-slots-v1';
  const CHAPTER_THREE_34_PROGRESS_KEY = 'chapter-three-34-playtest-progress-v1';
  const CHAPTER_THREE_35_SLOT_KEY = 'chapter-three-35-playtest-slots-v1';
  const CHAPTER_THREE_35_PROGRESS_KEY = 'chapter-three-35-playtest-progress-v1';
  const CHAPTER_THREE_36_SLOT_KEY = 'chapter-three-36-playtest-slots-v1';
  const CHAPTER_THREE_36_PROGRESS_KEY = 'chapter-three-36-playtest-progress-v1';
  const CHAPTER_THREE_PLAYTEST_VERSION = 'chapter-three-31-full-lv5-v2';

  function isAllowedEnvironment(location) {
    if (['localhost', '127.0.0.1'].includes(location?.hostname)) return true;
    return location?.hostname === 'raw.githack.com'
      && /^\/komay0818-coder\/world\/(?:dev|[0-9a-f]{7,40})(?:\/|$)/i.test(location.pathname || '');
  }

  function getPlaytestId(locationLike) {
    const location = locationLike || (typeof window !== 'undefined' ? window.location : null);
    if (!location || !isAllowedEnvironment(location)) return '';
    const requested = new URLSearchParams(location.search || '').get('playtest');
    return [PLAYTEST_ID, CHAPTER_ONE_11_PLAYTEST_ID, CHAPTER_ONE_12_PLAYTEST_ID, CHAPTER_ONE_13_PLAYTEST_ID, CHAPTER_ONE_14_PLAYTEST_ID, CHAPTER_ONE_15_PLAYTEST_ID, CHAPTER_THREE_PLAYTEST_ID, CHAPTER_THREE_32_PLAYTEST_ID, CHAPTER_THREE_33_PLAYTEST_ID, CHAPTER_THREE_34_PLAYTEST_ID, CHAPTER_THREE_35_PLAYTEST_ID, CHAPTER_THREE_36_PLAYTEST_ID].includes(requested) ? requested : '';
  }

  function isActive(locationLike) {
    return Boolean(getPlaytestId(locationLike));
  }

  function isChapterThreeActive(locationLike) {
    return [CHAPTER_THREE_PLAYTEST_ID, CHAPTER_THREE_32_PLAYTEST_ID, CHAPTER_THREE_33_PLAYTEST_ID, CHAPTER_THREE_34_PLAYTEST_ID, CHAPTER_THREE_35_PLAYTEST_ID, CHAPTER_THREE_36_PLAYTEST_ID].includes(getPlaytestId(locationLike));
  }

  function isChapterOne11Active(locationLike) {
    return getPlaytestId(locationLike) === CHAPTER_ONE_11_PLAYTEST_ID;
  }

  function isChapterOne12Active(locationLike) {
    return getPlaytestId(locationLike) === CHAPTER_ONE_12_PLAYTEST_ID;
  }

  function isChapterOne13Active(locationLike) {
    return getPlaytestId(locationLike) === CHAPTER_ONE_13_PLAYTEST_ID;
  }

  function isChapterOne14Active(locationLike) {
    return getPlaytestId(locationLike) === CHAPTER_ONE_14_PLAYTEST_ID;
  }

  function isChapterOne15Active(locationLike) {
    return getPlaytestId(locationLike) === CHAPTER_ONE_15_PLAYTEST_ID;
  }

  function getSlotKey(locationLike) {
    return isChapterOne15Active(locationLike) ? CHAPTER_ONE_15_SLOT_KEY
      : isChapterOne14Active(locationLike) ? CHAPTER_ONE_14_SLOT_KEY
      : isChapterOne13Active(locationLike) ? CHAPTER_ONE_13_SLOT_KEY
      : isChapterOne12Active(locationLike) ? CHAPTER_ONE_12_SLOT_KEY
      : isChapterOne11Active(locationLike) ? CHAPTER_ONE_11_SLOT_KEY
      : getPlaytestId(locationLike) === CHAPTER_THREE_36_PLAYTEST_ID ? CHAPTER_THREE_36_SLOT_KEY
      : getPlaytestId(locationLike) === CHAPTER_THREE_35_PLAYTEST_ID ? CHAPTER_THREE_35_SLOT_KEY
      : getPlaytestId(locationLike) === CHAPTER_THREE_34_PLAYTEST_ID ? CHAPTER_THREE_34_SLOT_KEY
      : getPlaytestId(locationLike) === CHAPTER_THREE_33_PLAYTEST_ID ? CHAPTER_THREE_33_SLOT_KEY
      : getPlaytestId(locationLike) === CHAPTER_THREE_32_PLAYTEST_ID ? CHAPTER_THREE_32_SLOT_KEY
      : isChapterThreeActive(locationLike) ? CHAPTER_THREE_SLOT_KEY : SLOT_KEY;
  }

  function getProgressKey(locationLike) {
    return isChapterOne15Active(locationLike) ? CHAPTER_ONE_15_PROGRESS_KEY
      : isChapterOne14Active(locationLike) ? CHAPTER_ONE_14_PROGRESS_KEY
      : isChapterOne13Active(locationLike) ? CHAPTER_ONE_13_PROGRESS_KEY
      : isChapterOne12Active(locationLike) ? CHAPTER_ONE_12_PROGRESS_KEY
      : isChapterOne11Active(locationLike) ? CHAPTER_ONE_11_PROGRESS_KEY
      : getPlaytestId(locationLike) === CHAPTER_THREE_36_PLAYTEST_ID ? CHAPTER_THREE_36_PROGRESS_KEY
      : getPlaytestId(locationLike) === CHAPTER_THREE_35_PLAYTEST_ID ? CHAPTER_THREE_35_PROGRESS_KEY
      : getPlaytestId(locationLike) === CHAPTER_THREE_34_PLAYTEST_ID ? CHAPTER_THREE_34_PROGRESS_KEY
      : getPlaytestId(locationLike) === CHAPTER_THREE_33_PLAYTEST_ID ? CHAPTER_THREE_33_PROGRESS_KEY
      : getPlaytestId(locationLike) === CHAPTER_THREE_32_PLAYTEST_ID ? CHAPTER_THREE_32_PROGRESS_KEY
      : isChapterThreeActive(locationLike) ? CHAPTER_THREE_PROGRESS_KEY : PROGRESS_KEY;
  }

  function getActiveSlotIndex(locationLike) {
    if (!isActive(locationLike)) return 0;
    const location = locationLike || window.location;
    const requested = new URLSearchParams(location.search || '').get('main');
    return requested === 'hunter' ? 1 : requested === 'priest' ? 2 : 0;
  }

  function getRequestedMapId(locationLike) {
    const allowed = ['black-forest-trail', 'spider-nest', 'black-forest-entrance', 'blackstone-stronghold', 'forest-altar', 'black-forest-depths'];
    if (!isActive(locationLike)) return 'plains-entrance';
    if (isChapterOne15Active(locationLike)) return 'plains-depths';
    if (isChapterOne14Active(locationLike)) return 'goblin-camp';
    if (isChapterOne13Active(locationLike)) return 'boar-woods';
    if (isChapterOne12Active(locationLike)) return 'wolf-den';
    if (isChapterOne11Active(locationLike)) return 'plains-entrance';
    if (getPlaytestId(locationLike) === CHAPTER_THREE_36_PLAYTEST_ID) return 'redrock-temple';
    if (getPlaytestId(locationLike) === CHAPTER_THREE_35_PLAYTEST_ID) return 'ancient-altar';
    if (getPlaytestId(locationLike) === CHAPTER_THREE_34_PLAYTEST_ID) return 'skullcrusher-war-camp';
    if (getPlaytestId(locationLike) === CHAPTER_THREE_33_PLAYTEST_ID) return 'bloodwar-wastes';
    if (getPlaytestId(locationLike) === CHAPTER_THREE_32_PLAYTEST_ID) return 'brokenrock-canyon';
    if (isChapterThreeActive(locationLike)) return 'redrock-wastes-entrance';
    const location = locationLike || window.location;
    const requested = new URLSearchParams(location.search || '').get('map');
    return allowed.includes(requested) ? requested : 'black-forest-trail';
  }

  function getScenario(locationLike) {
    if (!isActive(locationLike)) return '';
    const location = locationLike || window.location;
    return new URLSearchParams(location.search || '').get('scenario') || '';
  }

  function getRemovedCorruptionLayers(locationLike) {
    if (!isActive(locationLike)) return 0;
    const location = locationLike || window.location;
    const requested = Number(new URLSearchParams(location.search || '').get('removedLayers'));
    return Math.max(0, Math.min(6, Number.isFinite(requested) ? Math.floor(requested) : 0));
  }

  function getLoadout(locationLike) {
    if (!isActive(locationLike)) return 'transition';
    if (isChapterThreeActive(locationLike)) return 'full';
    const location = locationLike || window.location;
    return new URLSearchParams(location.search || '').get('loadout') === 'full' ? 'full' : 'transition';
  }

  function makeSkillLevels(job, dependencies) {
    if (!isChapterThreeActive(dependencies.location)) return {};
    return Object.fromEntries((dependencies.ClassSkillPolicy?.getSkills(job) || []).map((skill) => [`${job}:${skill.id}`, 5]));
  }

  function affix(id, name, stat, value, unit = '%') {
    return { id, name, source: 'random', value, unit, components: [{ stat, value, unit }] };
  }

  function equipment(template, quality = 'uncommon', affixes = []) {
    return {
      ...template,
      id: `chapter-two-balance-${template.id}`,
      baseItemId: template.id,
      quality,
      rarity: quality,
      affixChapter: Number(template.affixChapter || template.chapter) || 1,
      affixSchemaVersion: 4,
      fixedAffixes: [],
      randomAffixes: affixes,
      affixes,
      specialAbility: null,
      runes: []
    };
  }

  function findTemplate(id, dependencies) {
    const catalog = [
      ...Object.values(dependencies.EquipmentPolicy.WEAPON_CATALOG),
      ...Object.values(dependencies.EquipmentPolicy.ARMOR_CATALOG),
      ...Object.values(dependencies.EquipmentPolicy.OFFHAND_CATALOG),
      ...dependencies.EquipmentDropPolicy.CHAPTER_TWO_TEMPLATES
    ];
    const template = catalog.find((entry) => entry.id === id);
    if (!template) throw new Error(`Unknown balance playtest equipment: ${id}`);
    return template;
  }

  function makeEquipment(job, dependencies) {
    const fullLoadout = getLoadout(dependencies.location) === 'full';
    const ids = job === 'warrior'
      ? { weapon: 'forest-guard-longsword', offhand: 'black-iron-guard-round-shield', head: 'blackstone-corrupted-helm', armor: 'blackstone-corrupted-plate', gloves: fullLoadout ? 'blackstone-corrupted-gauntlets' : 'starter-recruit-iron-gauntlets', pants: fullLoadout ? 'blackstone-corrupted-legguards' : 'starter-recruit-iron-legguards', boots: fullLoadout ? 'blackstone-corrupted-warboots' : 'starter-recruit-iron-boots' }
      : job === 'hunter'
        ? { weapon: 'longbranch-hunting-bow', offhand: 'deep-forest-hunter-quiver', head: 'deepwood-hunter-hood', armor: 'deepwood-hunter-vest', gloves: fullLoadout ? 'deepwood-hunter-gloves' : 'rough-leather-gloves', pants: fullLoadout ? 'deepwood-hunter-legguards' : 'leather-pants', boots: fullLoadout ? 'deepwood-hunter-boots' : 'leather-short-boots' }
        : { weapon: 'ancient-wood-wand', offhand: 'spiritwood-spellbook', head: 'spiritweave-crown', armor: 'spiritweave-robe', gloves: fullLoadout ? 'spiritweave-spellgloves' : 'apprentice-gloves', pants: fullLoadout ? 'spiritweave-pants' : 'apprentice-cloth-pants', boots: fullLoadout ? 'spiritweave-boots' : 'apprentice-cloth-shoes' };
    const slots = { weapon: null, offhand: null, head: null, armor: null, gloves: null, pants: null, boots: null, wrist: null, shoulders: null, cloak: null, belt: null, necklace: null, ring1: null, ring2: null };
    Object.entries(ids).forEach(([slot, id]) => {
      const template = findTemplate(id, dependencies);
      if (Number(template.chapter) === 2 || Number(template.affixChapter) === 2) {
        const affixes = slot === 'weapon'
          ? [affix('accuracy_percent', '命中', 'accuracyPercent', 8), affix('attack_speed_percent', '攻擊速度', 'attackSpeedPercent', 8), affix('max_hp_flat', '生命', 'maxHp', 30, '')]
          : slot === 'offhand'
            ? (job === 'hunter'
              ? [affix('critical_chance', '暴擊率', 'criticalChance', 5), affix('max_hp_flat', '生命', 'maxHp', 30, ''), affix('cooldown_speed_percent', '技能冷卻恢復速度', 'cooldownSpeedPercent', 8)]
              : job === 'priest'
                ? [affix('mana_regeneration_percent', '魔力恢復', 'manaRegenerationPercent', 15), affix('max_hp_flat', '生命', 'maxHp', 30, ''), affix('cooldown_speed_percent', '技能冷卻恢復速度', 'cooldownSpeedPercent', 8)]
                : [affix('max_hp_flat', '生命', 'maxHp', 30, ''), affix('hp_regeneration_flat', '生命恢復', 'hpRegeneration', 5, ''), affix('cooldown_speed_percent', '技能冷卻恢復速度', 'cooldownSpeedPercent', 8)])
            : [affix('max_hp_percent', '最大生命', 'maxHpPercent', 12), affix('defense_percent', '防禦', 'defensePercent', 12), affix('dodge_percent', '閃避', 'dodgePercent', 8)];
        slots[slot] = equipment(template, 'uncommon', affixes);
      } else slots[slot] = equipment(template, 'common', []);
    });
    if (fullLoadout && dependencies.CraftingPolicy) {
      Object.entries({
        shoulders: 'chapter2-blackstone-bullhorn-shoulders',
        wrist: 'chapter2-sturdy-guardian-wrist',
        cloak: 'chapter2-corrupted-centurion-cloak'
      }).forEach(([slot, recipeId]) => {
        slots[slot] = dependencies.CraftingPolicy.generateCraftedEquipment(recipeId, {
          instanceId: `chapter-three-31-${job}-${slot}`,
          random: () => .5
        });
      });
    }
    return slots;
  }

  function createSlots(dependencies) {
    const chapterOne11Playtest = isChapterOne11Active(dependencies.location);
    const chapterOne12Playtest = isChapterOne12Active(dependencies.location);
    const chapterOne13Playtest = isChapterOne13Active(dependencies.location);
    const chapterOne14Playtest = isChapterOne14Active(dependencies.location);
    const chapterOne15Playtest = isChapterOne15Active(dependencies.location);
    const chapterThreePlaytest = isChapterThreeActive(dependencies.location);
    const jobs = ['warrior', 'hunter', 'priest'];
    const chapterThree32Playtest = getPlaytestId(dependencies.location) === CHAPTER_THREE_32_PLAYTEST_ID;
    const chapterThree33Playtest = getPlaytestId(dependencies.location) === CHAPTER_THREE_33_PLAYTEST_ID;
    const chapterThree34Playtest = getPlaytestId(dependencies.location) === CHAPTER_THREE_34_PLAYTEST_ID;
    const chapterThree35Playtest = getPlaytestId(dependencies.location) === CHAPTER_THREE_35_PLAYTEST_ID;
    const chapterThree36Playtest = getPlaytestId(dependencies.location) === CHAPTER_THREE_36_PLAYTEST_ID;
    const chapterThreeMapNumber = chapterThree36Playtest ? '6' : chapterThree35Playtest ? '5' : chapterThree34Playtest ? '4' : chapterThree33Playtest ? '3' : chapterThree32Playtest ? '2' : '1';
    const chapterOneMapNumber = chapterOne15Playtest ? '5' : chapterOne14Playtest ? '4' : chapterOne13Playtest ? '3' : chapterOne12Playtest ? '2' : '1';
    const names = chapterOne11Playtest || chapterOne12Playtest || chapterOne13Playtest || chapterOne14Playtest || chapterOne15Playtest
      ? jobs.map((job) => `1-${chapterOneMapNumber} 測試${job === 'warrior' ? '戰士' : job === 'hunter' ? '獵人' : '牧師'}`)
      : chapterThreePlaytest ? jobs.map((job) => `3-${chapterThreeMapNumber} 測試${job === 'warrior' ? '戰士' : job === 'hunter' ? '獵人' : '牧師'}`) : ['基準戰士', '基準獵人', '基準牧師'];
    const ids = jobs.map((job) => `${chapterOne11Playtest || chapterOne12Playtest || chapterOne13Playtest || chapterOne14Playtest || chapterOne15Playtest ? `chapter-one-1${chapterOneMapNumber}` : chapterThreePlaytest ? `chapter-three-3${chapterThreeMapNumber}` : 'chapter-two-balance'}-${job}`);
    const selectedMapId = getRequestedMapId(dependencies.location);
    return jobs.map((job, index) => ({
      character: { id: ids[index], name: names[index], faction: 'light', race: 'human', job },
      progress: {
        level: chapterThreePlaytest ? 30 : 25, xp: 0, gold: 0, potions: 20, manaPotions: 20, inventory: [],
        balancePlaytestLoadout: getLoadout(dependencies.location),
        selectedMapId, equipment: makeEquipment(job, dependencies),
        skillLevels: makeSkillLevels(job, dependencies), lastActiveAt: Date.now(), unlockedChapter: chapterThreePlaytest ? 3 : 2,
        chapterThreePlaytestVersion: chapterThreePlaytest ? CHAPTER_THREE_PLAYTEST_VERSION : '',
        mapUnlocked: { 'black-forest': true, 'wolf-den': chapterOne12Playtest || chapterOne13Playtest || chapterOne14Playtest || chapterOne15Playtest, 'boar-woods': chapterOne13Playtest || chapterOne14Playtest || chapterOne15Playtest, 'goblin-camp': chapterOne14Playtest || chapterOne15Playtest, 'plains-depths': chapterOne15Playtest },
        blackForestCorruption: { initialized: true, removedLayers: getRemovedCorruptionLayers(dependencies.location) },
        chapterTwoProgress: {
          unlocked: Object.fromEntries(['black-forest-trail', 'spider-nest', 'black-forest-entrance', 'blackstone-stronghold', 'forest-altar', 'black-forest-depths'].map((id) => [id, true])),
          cleared: chapterThreePlaytest ? Object.fromEntries(['black-forest-trail', 'spider-nest', 'black-forest-entrance', 'blackstone-stronghold', 'forest-altar', 'black-forest-depths'].map((id) => [id, true])) : {},
          bossFirstKills: chapterThreePlaytest ? Object.fromEntries(['black-forest-trail', 'spider-nest', 'black-forest-entrance', 'blackstone-stronghold', 'forest-altar', 'black-forest-depths'].map((id) => [id, true])) : {},
          normalKills: {}, completed: chapterThreePlaytest
        },
        chapterThreeProgress: {
          unlocked: { 'redrock-wastes-entrance': chapterThreePlaytest, 'brokenrock-canyon': chapterThree32Playtest || chapterThree33Playtest || chapterThree34Playtest || chapterThree35Playtest || chapterThree36Playtest, 'bloodwar-wastes': chapterThree33Playtest || chapterThree34Playtest || chapterThree35Playtest || chapterThree36Playtest, 'skullcrusher-war-camp': chapterThree34Playtest || chapterThree35Playtest || chapterThree36Playtest, 'ancient-altar': chapterThree35Playtest || chapterThree36Playtest, 'redrock-temple': chapterThree36Playtest },
          cleared: chapterThree36Playtest ? { 'redrock-wastes-entrance': true, 'brokenrock-canyon': true, 'bloodwar-wastes': true, 'skullcrusher-war-camp': true, 'ancient-altar': true } : chapterThree35Playtest ? { 'redrock-wastes-entrance': true, 'brokenrock-canyon': true, 'bloodwar-wastes': true, 'skullcrusher-war-camp': true } : chapterThree34Playtest ? { 'redrock-wastes-entrance': true, 'brokenrock-canyon': true, 'bloodwar-wastes': true } : chapterThree33Playtest ? { 'redrock-wastes-entrance': true, 'brokenrock-canyon': true } : chapterThree32Playtest ? { 'redrock-wastes-entrance': true } : {},
          bossFirstKills: chapterThree36Playtest ? { 'redrock-wastes-entrance': true, 'brokenrock-canyon': true, 'bloodwar-wastes': true, 'skullcrusher-war-camp': true, 'ancient-altar': true } : chapterThree35Playtest ? { 'redrock-wastes-entrance': true, 'brokenrock-canyon': true, 'bloodwar-wastes': true, 'skullcrusher-war-camp': true } : chapterThree34Playtest ? { 'redrock-wastes-entrance': true, 'brokenrock-canyon': true, 'bloodwar-wastes': true } : chapterThree33Playtest ? { 'redrock-wastes-entrance': true, 'brokenrock-canyon': true } : chapterThree32Playtest ? { 'redrock-wastes-entrance': true } : {}
        },
        dungeonAdmission: selectedMapId === 'blackstone-stronghold',
        dungeonReturnMapId: 'black-forest-entrance',
        starterGearVersion: 'starter-gear-v1',
        equipmentRetentionVersion: 'planned-catalog-and-starter-v2',
        hunterQuiverMigrationVersion: 'hunter-quiver-resource-v1',
        equipmentVisualMigrationVersion: 'chapter-one-greatsword-images-v17',
        bowVisualMigrationVersion: 'hunter-bow-image-v1',
        quiverVisualMigrationVersion: 'hunter-quiver-image-v1',
        qualityUnlockMigrationVersion: 'quality-tier-map-gating-v1',
        equipmentAffixMigrationVersion: 'green-affix-v1',
        offhandAffixMigrationVersion: 'unified-offhand-affixes-v1',
        chapterTwoCraftedBaseStatsMigrationVersion: 'chapter2-crafted-base-stats-v1',
        chapterThreeBlueCraftedBaseStatsMigrationVersion: 'chapter3-blue-crafted-base-stats-v1',
        chapterThreeEpicCraftedTemplateMigrationVersion: 'chapter3-epic-crafted-template-v1',
        chapterThreeSpecialEquipmentTemplateMigrationVersion: 'chapter3-special-equipment-template-v1',
        equipmentDropMigrationVersion: 'equipment-drop-v1',
        sharedCasterWeaponMigrationVersion: 'mage-priest-weapons-v1',
        jobRestrictionMigrationVersion: 'job-restriction-v1',
        party: { activeMemberIds: ids, unlockedSlots: 3, members: [] }
      }
    }));
  }

  return Object.freeze({
    PLAYTEST_ID, CHAPTER_ONE_11_PLAYTEST_ID, CHAPTER_ONE_12_PLAYTEST_ID, CHAPTER_ONE_13_PLAYTEST_ID, CHAPTER_ONE_14_PLAYTEST_ID, CHAPTER_ONE_15_PLAYTEST_ID, CHAPTER_THREE_PLAYTEST_ID, CHAPTER_THREE_32_PLAYTEST_ID, CHAPTER_THREE_33_PLAYTEST_ID, CHAPTER_THREE_34_PLAYTEST_ID, CHAPTER_THREE_35_PLAYTEST_ID, CHAPTER_THREE_36_PLAYTEST_ID, SLOT_KEY, PROGRESS_KEY,
    CHAPTER_ONE_11_SLOT_KEY, CHAPTER_ONE_11_PROGRESS_KEY, CHAPTER_ONE_12_SLOT_KEY, CHAPTER_ONE_12_PROGRESS_KEY, CHAPTER_ONE_13_SLOT_KEY, CHAPTER_ONE_13_PROGRESS_KEY, CHAPTER_ONE_14_SLOT_KEY, CHAPTER_ONE_14_PROGRESS_KEY, CHAPTER_ONE_15_SLOT_KEY, CHAPTER_ONE_15_PROGRESS_KEY,
    CHAPTER_THREE_SLOT_KEY, CHAPTER_THREE_PROGRESS_KEY, CHAPTER_THREE_32_SLOT_KEY, CHAPTER_THREE_32_PROGRESS_KEY, CHAPTER_THREE_33_SLOT_KEY, CHAPTER_THREE_33_PROGRESS_KEY, CHAPTER_THREE_34_SLOT_KEY, CHAPTER_THREE_34_PROGRESS_KEY, CHAPTER_THREE_35_SLOT_KEY, CHAPTER_THREE_35_PROGRESS_KEY, CHAPTER_THREE_36_SLOT_KEY, CHAPTER_THREE_36_PROGRESS_KEY, CHAPTER_THREE_PLAYTEST_VERSION,
    isActive, isChapterOne11Active, isChapterOne12Active, isChapterOne13Active, isChapterOne14Active, isChapterOne15Active, isChapterThreeActive, getSlotKey, getProgressKey, getActiveSlotIndex,
    getRequestedMapId, getScenario, getRemovedCorruptionLayers, getLoadout, createSlots
  });
}));
