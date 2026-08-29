(function attachChapterBossDropPolicy(root, factory) {
  const dropPolicy = typeof module === 'object' && module.exports ? require('./equipment-drop-policy.js') : root.EquipmentDropPolicy;
  const api = factory(dropPolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterBossDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterBossDropPolicy(EquipmentDropPolicy) {
  const CHAPTER_BLUE_ITEM_DROP_RATES = Object.freeze({ 1: .10, 2: .05, 3: .08 });
  const BLUE_ITEM_DROP_RATE = CHAPTER_BLUE_ITEM_DROP_RATES[1];
  const CHAPTER_ONE_BLUE_DROP_RATES = Object.freeze({
    normal: 0,
    elite: .03,
    goblinTreasureChest: .05,
    goblinHighChief: .07,
    wanderingBlackKnight: .07,
    blackstoneLeader: .10
  });
  const CHAPTER_ONE_EQUIPMENT_POOLS = Object.freeze(['plains_common_weapons', 'plains_common_armor']);

  function clampRoll(value) { return Math.min(.999999, Math.max(0, Number(value) || 0)); }

  function isEligibleFinalBoss(enemy, context = {}) {
    return Boolean(enemy?.isBoss
      && Number(context.chapter) === 1
      && enemy.id === 'blackstoneLeader'
      && (!context.finalBossId || context.finalBossId === enemy.id));
  }

  function getChapterDropRate(chapter, rates = CHAPTER_BLUE_ITEM_DROP_RATES) {
    return Math.min(1, Math.max(0, Number(rates?.[chapter]) || 0));
  }

  function getChapterOneBlueDropRate(enemy, context = {}, rates = CHAPTER_ONE_BLUE_DROP_RATES) {
    if (!enemy || Number(context.chapter) !== 1) return 0;
    const sourceRate = Object.prototype.hasOwnProperty.call(rates, enemy.id) ? rates[enemy.id] : null;
    if (sourceRate !== null) return Math.min(1, Math.max(0, Number(sourceRate) || 0));
    return enemy.isElite ? Math.min(1, Math.max(0, Number(rates.elite) || 0)) : 0;
  }

  function grantChapterOneBlueDrop(progress, enemy, context = {}, options = {}) {
    if (!progress || typeof progress !== 'object') return null;
    if (!Array.isArray(progress.inventory)) progress.inventory = [];
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const dropRate = getChapterOneBlueDropRate(enemy, context, options.dropRates || CHAPTER_ONE_BLUE_DROP_RATES);
    if (dropRate <= 0) return null;
    if (random() >= dropRate) return null;
    const templates = EquipmentDropPolicy.getTemplatesFromPools(CHAPTER_ONE_EQUIPMENT_POOLS, options.warningHandler);
    if (!templates.length) return null;
    const template = templates[Math.floor(clampRoll(random()) * templates.length)];
    let instanceId = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      instanceId = typeof options.instanceIdFactory === 'function'
        ? options.instanceIdFactory(attempt)
        : EquipmentDropPolicy.createInstanceId(options.obtainedAt, random());
      if (!progress.inventory.some((item) => item?.id === instanceId || item?.instanceId === instanceId)) break;
      instanceId = '';
    }
    if (!instanceId) return null;
    const item = EquipmentDropPolicy.createEquipmentDropInstance(template, {
      rarity: 'rare', instanceId, affixRandom: random,
      chapter: context.chapter,
      obtainedFrom: enemy.id, obtainedAt: options.obtainedAt || Date.now(), warningHandler: options.warningHandler
    });
    if (!item || item.quality !== 'rare' || item.fixedAffixes.length !== 2 || item.randomAffixes.length !== 3) return null;
    item.specialDropType = isEligibleFinalBoss(enemy, context) ? 'chapter-boss-blue' : 'chapter-one-blue';
    progress.inventory.push(item);
    return item;
  }

  const grantChapterBossBlueDrop = grantChapterOneBlueDrop;

  return Object.freeze({
    CHAPTER_BLUE_ITEM_DROP_RATES,
    BLUE_ITEM_DROP_RATE,
    CHAPTER_ONE_BLUE_DROP_RATES,
    CHAPTER_ONE_EQUIPMENT_POOLS,
    isEligibleFinalBoss,
    getChapterDropRate,
    getChapterOneBlueDropRate,
    grantChapterOneBlueDrop,
    grantChapterBossBlueDrop
  });
}));
