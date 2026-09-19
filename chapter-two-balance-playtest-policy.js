(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ChapterTwoBalancePlaytestPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PLAYTEST_ID = 'chapter-two-balance';
  const SLOT_KEY = 'chapter-two-balance-playtest-slots-v1';
  const PROGRESS_KEY = 'chapter-two-balance-playtest-progress-v2';

  function isActive(locationLike) {
    const location = locationLike || (typeof window !== 'undefined' ? window.location : null);
    if (!location || !['localhost', '127.0.0.1'].includes(location.hostname)) return false;
    return new URLSearchParams(location.search || '').get('playtest') === PLAYTEST_ID;
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
    const location = locationLike || window.location;
    return new URLSearchParams(location.search || '').get('loadout') === 'full' ? 'full' : 'transition';
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
    return slots;
  }

  function createSlots(dependencies) {
    const jobs = ['warrior', 'hunter', 'priest'];
    const names = ['基準戰士', '基準獵人', '基準牧師'];
    const ids = jobs.map((job) => `chapter-two-balance-${job}`);
    const selectedMapId = getRequestedMapId(dependencies.location);
    return jobs.map((job, index) => ({
      character: { id: ids[index], name: names[index], faction: 'light', race: 'human', job },
      progress: {
        level: 25, xp: 0, gold: 0, potions: 20, manaPotions: 20, inventory: [],
        balancePlaytestLoadout: getLoadout(dependencies.location),
        selectedMapId, equipment: makeEquipment(job, dependencies),
        skillLevels: {}, lastActiveAt: Date.now(), unlockedChapter: 2,
        mapUnlocked: { 'black-forest': true },
        blackForestCorruption: { initialized: true, removedLayers: getRemovedCorruptionLayers(dependencies.location) },
        chapterTwoProgress: {
          unlocked: Object.fromEntries(['black-forest-trail', 'spider-nest', 'black-forest-entrance', 'blackstone-stronghold', 'forest-altar', 'black-forest-depths'].map((id) => [id, true])),
          cleared: {}, bossFirstKills: {}, normalKills: {}, completed: false
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

  return Object.freeze({ PLAYTEST_ID, SLOT_KEY, PROGRESS_KEY, isActive, getActiveSlotIndex, getRequestedMapId, getScenario, getRemovedCorruptionLayers, getLoadout, createSlots });
}));
