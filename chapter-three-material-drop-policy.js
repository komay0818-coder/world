(function attachChapterThreeMaterialDropPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterThreeMaterialDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterThreeMaterialDropPolicy() {
  'use strict';

  const MATERIALS = Object.freeze({
    redrockOre: Object.freeze({ id: 'redrock-ore', kind: 'material', materialType: 'monster-crafting', rarity: 'common', chapter: 3, icon: '⛏', name: '赤岩礦石', description: '赤岩荒原出產的基礎金屬材料。' }),
    wastelandThickHide: Object.freeze({ id: 'wasteland-thick-hide', kind: 'material', materialType: 'monster-crafting', rarity: 'common', chapter: 3, icon: '▰', name: '荒原厚皮', description: '荒原野獸身上取得的基礎皮革材料。' }),
    vultureHardFeather: Object.freeze({ id: 'vulture-hard-feather', kind: 'material', materialType: 'monster-crafting', rarity: 'common', chapter: 3, icon: '🩶', name: '禿鷹硬羽', description: '荒原禿鷹掉落的輕裝與披風材料。' }),
    skullcrusherIronScrap: Object.freeze({ id: 'skullcrusher-iron-scrap', kind: 'material', materialType: 'monster-crafting', rarity: 'common', chapter: 3, icon: '▣', name: '碎顱鐵片', description: '從碎顱部族裝備上拆解的金屬材料。' }),
    warpatternCloth: Object.freeze({ id: 'warpattern-cloth', kind: 'material', materialType: 'monster-crafting', rarity: 'common', chapter: 3, icon: '🧵', name: '戰紋布', description: '碎顱部族使用的布甲與部族材料。' }),
    warbeastFang: Object.freeze({ id: 'warbeast-fang', kind: 'material', materialType: 'monster-crafting', rarity: 'rare', chapter: 3, icon: '🦷', name: '戰獸獠牙', description: '碎顱戰獸掉落的稀有材料。' }),
    ancientRunestone: Object.freeze({ id: 'ancient-runestone', kind: 'material', materialType: 'special-crafting', rarity: 'rare', chapter: 3, icon: '◈', name: '遠古符文石', description: '遠古區域守衛與祭司留下的高階材料。' }),
    templeCoreFragment: Object.freeze({ id: 'temple-core-fragment', kind: 'material', materialType: 'special-crafting', rarity: 'rare', chapter: 3, icon: '◆', name: '聖殿核心碎片', description: '赤岩聖殿守衛掉落的高階材料。' })
  });

  const drops = (...entries) => Object.freeze(entries.map((entry) => Object.freeze(entry)));
  const MONSTER_DROP_CONFIGS = Object.freeze({
    'wasteland-hyena': drops({ materialId: 'wasteland-thick-hide', dropRate: .25 }),
    'redrock-lizard': drops({ materialId: 'redrock-ore', dropRate: .25 }),
    'wasteland-vulture': drops({ materialId: 'vulture-hard-feather', dropRate: .20 }),
    'skullcrusher-scout': drops({ materialId: 'warpattern-cloth', dropRate: .25 }),
    'redrock-hornbeast': drops({ materialId: 'wasteland-thick-hide', dropRate: 1, amount: 1 }),
    'redrock-giant-lizard': drops({ materialId: 'redrock-ore', dropRate: 1, amount: 2 }),
    'skullcrusher-spearman': drops({ materialId: 'warpattern-cloth', dropRate: .25 }),
    'skullcrusher-warrior': drops({ materialId: 'skullcrusher-iron-scrap', dropRate: .25 }),
    'brokenrock-brute': drops({ materialId: 'skullcrusher-iron-scrap', dropRate: 1, amount: 1 }),
    'canyon-warlord': drops({ materialId: 'skullcrusher-iron-scrap', dropRate: 1, amount: 2 }),
    'skullcrusher-berserker': drops({ materialId: 'skullcrusher-iron-scrap', dropRate: .25 }),
    'skullcrusher-shieldguard': drops({ materialId: 'skullcrusher-iron-scrap', dropRate: .25 }),
    'skullcrusher-hunter': drops({ materialId: 'warpattern-cloth', dropRate: .25 }),
    'skullcrusher-shaman': drops({ materialId: 'warpattern-cloth', dropRate: .25 }),
    'skullcrusher-centurion': drops({ materialId: 'skullcrusher-iron-scrap', dropRate: 1, amount: 1 }),
    'skullcrusher-vanguard-commander': drops({ materialId: 'skullcrusher-iron-scrap', dropRate: 1, amount: 2 }, { materialId: 'warpattern-cloth', dropRate: .50, amount: 1 }),
    'skullcrusher-heavy-guard': drops({ materialId: 'skullcrusher-iron-scrap', dropRate: .25 }),
    'skullcrusher-wolf-rider': drops({ materialId: 'warbeast-fang', dropRate: .10 }),
    'skullcrusher-champion': drops({ materialId: 'skullcrusher-iron-scrap', dropRate: 1, amount: 1 }, { materialId: 'warbeast-fang', dropRate: .25, amount: 1 }),
    'skullcrusher-great-chieftain': drops({ materialId: 'skullcrusher-iron-scrap', dropRate: 1, amount: 2 }, { materialId: 'warbeast-fang', dropRate: .50, amount: 1 }),
    'skullcrusher-priest': drops({ materialId: 'warpattern-cloth', dropRate: .25 }),
    'skullcrusher-fanatic': drops({ materialId: 'warpattern-cloth', dropRate: .25 }),
    'ancient-stoneguard': drops({ materialId: 'ancient-runestone', dropRate: .15 }),
    'rune-guard': drops({ materialId: 'ancient-runestone', dropRate: .15 }),
    'awakened-guard': drops({ materialId: 'ancient-runestone', dropRate: 1, amount: 1 }),
    'fallen-high-priest': drops({ materialId: 'warpattern-cloth', dropRate: 1, amount: 2 }, { materialId: 'ancient-runestone', dropRate: .50, amount: 1 }),
    'temple-stoneguard': drops({ materialId: 'ancient-runestone', dropRate: .15 }),
    'rune-golem': drops({ materialId: 'temple-core-fragment', dropRate: .10 }),
    'temple-executioner': drops({ materialId: 'temple-core-fragment', dropRate: .10 }),
    'ancient-priest': drops({ materialId: 'ancient-runestone', dropRate: .15 }),
    'temple-guardian': drops({ materialId: 'ancient-runestone', dropRate: 1, amount: 1 }, { materialId: 'temple-core-fragment', dropRate: .25, amount: 1 })
  });

  const MAP_DROP_CONFIGS = Object.freeze({});
  const CHAPTER_THREE_MAP_IDS = new Set(['redrock-wastes-entrance', 'brokenrock-canyon', 'bloodwar-wastes', 'skullcrusher-war-camp', 'ancient-altar', 'redrock-temple']);
  const MATERIAL_BY_ID = new Map(Object.values(MATERIALS).map((material) => [material.id, material]));
  function clampRoll(value) { return Math.max(0, Math.min(.999999, Number(value) || 0)); }
  function rollDrops(mapId, enemy = {}, random = Math.random, dropRateMultiplier = 1) {
    if (Number(enemy?.chapter) !== 3 && !CHAPTER_THREE_MAP_IDS.has(mapId)) return [];
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
