(function attachChapterBossDropPolicy(root, factory) {
  const dropPolicy = typeof module === 'object' && module.exports ? require('./equipment-drop-policy.js') : root.EquipmentDropPolicy;
  const api = factory(dropPolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterBossDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterBossDropPolicy(EquipmentDropPolicy) {
  const CHAPTER_BLUE_ITEM_DROP_RATES = Object.freeze({ 1: .03, 2: .05, 3: .08 });
  const BLUE_ITEM_DROP_RATE = CHAPTER_BLUE_ITEM_DROP_RATES[1];

  function clampRoll(value) { return Math.min(.999999, Math.max(0, Number(value) || 0)); }

  function isEligibleFinalBoss(enemy, context = {}) {
    return Boolean(enemy?.isBoss
      && Number(context.chapter) === 1
      && context.finalBossId
      && enemy.id === context.finalBossId);
  }

  function getChapterDropRate(chapter, rates = CHAPTER_BLUE_ITEM_DROP_RATES) {
    return Math.min(1, Math.max(0, Number(rates?.[chapter]) || 0));
  }

  function grantChapterBossBlueDrop(progress, enemy, context = {}, options = {}) {
    if (!progress || typeof progress !== 'object' || !isEligibleFinalBoss(enemy, context)) return null;
    if (!Array.isArray(progress.inventory)) progress.inventory = [];
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const dropRate = getChapterDropRate(context.chapter, options.dropRates);
    if (random() >= dropRate) return null;
    const poolIds = Object.keys(EquipmentDropPolicy.EQUIPMENT_POOLS || {});
    const templates = EquipmentDropPolicy.getTemplatesFromPools(poolIds, options.warningHandler);
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
      obtainedFrom: enemy.id, obtainedAt: options.obtainedAt || Date.now(), warningHandler: options.warningHandler
    });
    if (!item || item.quality !== 'rare' || item.fixedAffixes.length !== 2 || item.randomAffixes.length !== 3) return null;
    item.specialDropType = 'chapter-boss-blue';
    progress.inventory.push(item);
    return item;
  }

  return Object.freeze({ CHAPTER_BLUE_ITEM_DROP_RATES, BLUE_ITEM_DROP_RATE, isEligibleFinalBoss, getChapterDropRate, grantChapterBossBlueDrop });
}));
