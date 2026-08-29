(function attachChapterTwoMaterialDropPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterTwoMaterialDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterTwoMaterialDropPolicy() {
  'use strict';

  const MATERIALS = Object.freeze({
    blackWood: Object.freeze({ id: 'black-wood', kind: 'material', materialType: 'monster-crafting', rarity: 'common', chapter: 2, icon: '🪵', image: 'assets/black-wood.png?v=20260830-chapter-two-material-art-v1', imageStatus: 'ready', name: '黑木', description: '從黑森林的樹木與植物系怪物取得，可用於製作與升級建築。' }),
    hardHide: Object.freeze({ id: 'hard-hide', kind: 'material', materialType: 'monster-crafting', rarity: 'common', chapter: 2, icon: '▰', name: '厚皮', description: '從黑森林的野獸系怪物取得，沿用共用的厚皮材料堆疊。' }),
    spiderSilk: Object.freeze({ id: 'spider-silk', kind: 'material', materialType: 'monster-crafting', rarity: 'common', chapter: 2, icon: '🕸', image: 'assets/spider-silk.png?v=20260830-chapter-two-material-art-v1', imageStatus: 'ready', name: '蜘蛛絲', description: '從第二章蜘蛛系怪物取得，主要產地為蜘蛛巢穴。' }),
    venomSac: Object.freeze({ id: 'venom-sac', kind: 'material', materialType: 'monster-crafting', rarity: 'rare', chapter: 2, icon: '🧪', image: 'assets/venom-sac.png?v=20260830-chapter-two-material-art-v1', imageStatus: 'ready', name: '毒囊', description: '從蜘蛛巢穴的毒系怪物取得的稀有材料。' }),
    blackIronOre: Object.freeze({ id: 'black-iron-ore', kind: 'material', materialType: 'special-crafting', rarity: 'rare', chapter: 2, icon: '⬢', image: 'assets/black-iron-ore.png?v=20260830-chapter-two-material-art-v1', imageStatus: 'ready', name: '黑鐵礦石', description: '只由符合規則的第二章黑石系列怪物掉落，不是地圖通用掉落。' }),
    corruptionCrystal: Object.freeze({ id: 'corruption-crystal', kind: 'material', materialType: 'special-crafting', rarity: 'rare', chapter: 2, icon: '◈', image: 'assets/corruption-crystal.png?v=20260830-chapter-two-material-art-v1', imageStatus: 'ready', name: '腐化結晶', description: '從森林祭壇與黑森林深處的明確腐化系怪物取得。' })
  });

  const drops = (...entries) => Object.freeze(entries.map((entry) => Object.freeze(entry)));
  const MONSTER_DROP_CONFIGS = Object.freeze({
    witheredTreeWalker: drops({ materialId: 'black-wood', dropRate: .25 }),
    forestGuardianV2: drops({ materialId: 'black-wood', dropRate: 1 }),
    thornDemonVine: drops({ materialId: 'black-wood', dropRate: .25 }),
    corruptedTreant: drops({ materialId: 'black-wood', dropRate: .25 }, { materialId: 'corruption-crystal', dropRate: .05 }),

    blackForestWolf: drops({ materialId: 'hard-hide', dropRate: .25 }),
    corruptedBoar: drops({ materialId: 'hard-hide', dropRate: .25 }),
    blackstoneStrongholdWarhound: drops({ materialId: 'hard-hide', dropRate: .25 }),
    corruptedForestWolf: drops({ materialId: 'hard-hide', dropRate: .25 }, { materialId: 'corruption-crystal', dropRate: .05 }),
    depthsCorruptedForestWolf: drops({ materialId: 'hard-hide', dropRate: .25 }, { materialId: 'corruption-crystal', dropRate: .05 }),

    shadowSpider: drops({ materialId: 'spider-silk', dropRate: .25 }),
    blackstonePoisonSpider: drops({ materialId: 'spider-silk', dropRate: .25 }, { materialId: 'venom-sac', dropRate: .05 }),
    spiderNestBlackstonePoisonSpider: drops({ materialId: 'spider-silk', dropRate: .25 }, { materialId: 'venom-sac', dropRate: .05 }),
    venomSpitterSpider: drops({ materialId: 'spider-silk', dropRate: .25 }, { materialId: 'venom-sac', dropRate: .05 }),
    webWeaver: drops({ materialId: 'spider-silk', dropRate: .25 }),
    giantSpider: drops({ materialId: 'spider-silk', dropRate: .25 }, { materialId: 'venom-sac', dropRate: 1 }),
    blackstoneVenomHunter: drops({ materialId: 'venom-sac', dropRate: .05 }, { materialId: 'black-iron-ore', dropRate: .10 }),
    blackstoneVenombladeAssassin: drops({ materialId: 'venom-sac', dropRate: .05 }, { materialId: 'black-iron-ore', dropRate: .30 }),

    blackstoneTrailScout: drops({ materialId: 'black-iron-ore', dropRate: .10 }),
    blackstoneTrailRaider: drops({ materialId: 'black-iron-ore', dropRate: .10 }),
    blackstoneArcher: drops({ materialId: 'black-iron-ore', dropRate: .10 }),
    blackstoneBeastmaster: drops({ materialId: 'black-iron-ore', dropRate: .30 }),
    blackstoneCaptain: drops({ materialId: 'black-iron-ore', dropRate: .30 }),
    blackstoneCenturion: drops({ materialId: 'black-iron-ore', dropRate: 1 }),
    spiderNestBlackstoneBeastmaster: drops({ materialId: 'black-iron-ore', dropRate: .30 }),
    blackstoneStrongholdGuard: drops({ materialId: 'black-iron-ore', dropRate: .10 }),
    blackstoneStrongholdCrossbowman: drops({ materialId: 'black-iron-ore', dropRate: .10 }),
    blackstoneStrongholdBerserker: drops({ materialId: 'black-iron-ore', dropRate: .10 }),
    blackstoneStrongholdLionGuard: drops({ materialId: 'black-iron-ore', dropRate: .30 }),
    blackstoneStrongholdBullhornWarrior: drops({ materialId: 'black-iron-ore', dropRate: .30 }),
    blackstoneStrongholdWarlord: drops({ materialId: 'black-iron-ore', dropRate: 1 }),
    corruptedBlackstoneSoldier: drops({ materialId: 'black-iron-ore', dropRate: .10 }, { materialId: 'corruption-crystal', dropRate: .05 }),
    corruptedBlackstonePriest: drops({ materialId: 'black-iron-ore', dropRate: .30 }, { materialId: 'corruption-crystal', dropRate: .15 }),
    corruptedBlackstoneCenturion: drops({ materialId: 'black-iron-ore', dropRate: .30 }, { materialId: 'corruption-crystal', dropRate: .15 }),

    corruptedAltarGuardian: drops({ materialId: 'corruption-crystal', dropRate: 1 }),
    corruptedFallenDruid: drops({ materialId: 'corruption-crystal', dropRate: .15 })
  });

  const MAP_DROP_CONFIGS = Object.freeze({});
  const MATERIAL_BY_ID = new Map(Object.values(MATERIALS).map((material) => [material.id, material]));
  function clampRoll(value) { return Math.max(0, Math.min(.999999, Number(value) || 0)); }
  function rollDrops(mapId, enemy = {}, random = Math.random, dropRateMultiplier = 1) {
    if (Number(enemy?.chapter) !== 2 && !String(mapId || '').startsWith('black-forest') && !['spider-nest', 'blackstone-stronghold', 'forest-altar'].includes(mapId)) return [];
    const bonus = Math.max(1, Number(dropRateMultiplier) || 1);
    return (MONSTER_DROP_CONFIGS[String(enemy?.id || '')] || [])
      .filter((entry) => clampRoll(random()) < Math.min(1, entry.dropRate * bonus))
      .map((entry) => ({ ...MATERIAL_BY_ID.get(entry.materialId), sourceMapId: mapId, sourceMonsterId: enemy.id, quantity: entry.amount || 1 }));
  }
  function addStackedMaterial(progress, material, amount = 1) {
    if (!progress || !material || !MATERIAL_BY_ID.has(material.id)) return null;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const quantity = Math.max(1, Math.floor(Number(amount) || 1));
    const existing = progress.inventory.find((item) => item?.id === material.id);
    if (existing) existing.quantity = Math.max(0, Number(existing.quantity) || 0) + quantity;
    else progress.inventory.push({ ...material, quantity });
    return existing || progress.inventory[progress.inventory.length - 1];
  }
  function grantMaterialDrops(progress, mapId, enemy = {}, options = {}) {
    if (!progress || typeof progress !== 'object') return [];
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const results = rollDrops(mapId, enemy, random, options.dropRateMultiplier);
    results.forEach((drop) => addStackedMaterial(progress, drop, drop.quantity));
    return results;
  }

  return Object.freeze({ MATERIALS, MAP_DROP_CONFIGS, MONSTER_DROP_CONFIGS, rollDrops, addStackedMaterial, grantMaterialDrops });
}));
