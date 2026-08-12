(function attachChapterOneMaterialDropPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterOneMaterialDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterOneMaterialDropPolicy() {
  const MATERIALS = Object.freeze({
    wolfFur: Object.freeze({ id: 'wolf-fur', kind: 'material', materialType: 'monster-crafting', rarity: 'common', icon: '🐺', name: '狼毛', description: '從狼穴怪物身上取得的普通製作材料。' }),
    wolfFang: Object.freeze({ id: 'wolf-fang', kind: 'material', materialType: 'monster-crafting', rarity: 'rare', icon: '🦷', name: '狼牙', description: '從狼穴怪物身上取得的稀有製作材料。' }),
    hardHide: Object.freeze({ id: 'hard-hide', kind: 'material', materialType: 'monster-crafting', rarity: 'common', icon: '▰', name: '硬皮', description: '從野豬林怪物身上取得的普通製作材料。' }),
    boarTusk: Object.freeze({ id: 'boar-tusk', kind: 'material', materialType: 'monster-crafting', rarity: 'rare', icon: '🦷', name: '獠牙', description: '從野豬林怪物身上取得的稀有製作材料。' }),
    ironOre: Object.freeze({ id: 'iron-ore', kind: 'material', materialType: 'monster-crafting', rarity: 'common', icon: '⛏', name: '鐵礦', description: '從哥布林營地怪物身上取得的普通製作材料。' }),
    blackOre: Object.freeze({ id: 'black-ore', kind: 'material', materialType: 'special-crafting', rarity: 'rare', icon: '⬟', name: '黑礦石', description: '只由平原深處的黑石系列怪物掉落，用於製作與升級建築。' })
  });

  const MAP_DROP_CONFIGS = Object.freeze({
    'wolf-den': Object.freeze([
      Object.freeze({ materialId: MATERIALS.wolfFur.id, dropRate: .25 }),
      Object.freeze({ materialId: MATERIALS.wolfFang.id, dropRate: .05 })
    ]),
    'boar-woods': Object.freeze([
      Object.freeze({ materialId: MATERIALS.hardHide.id, dropRate: .25 }),
      Object.freeze({ materialId: MATERIALS.boarTusk.id, dropRate: .05 })
    ]),
    'goblin-camp': Object.freeze([
      Object.freeze({ materialId: MATERIALS.ironOre.id, dropRate: .25 })
    ])
  });

  const MONSTER_DROP_CONFIGS = Object.freeze({
    blackstoneScout: Object.freeze([
      Object.freeze({ materialId: MATERIALS.blackOre.id, dropRate: .10, amount: 1 })
    ]),
    blackstoneRaider: Object.freeze([
      Object.freeze({ materialId: MATERIALS.blackOre.id, dropRate: .30, amount: 1 })
    ]),
    blackstoneLeader: Object.freeze([
      Object.freeze({ materialId: MATERIALS.blackOre.id, dropRate: 1, amount: 2 })
    ])
  });

  const MATERIAL_BY_ID = new Map(Object.values(MATERIALS).map((material) => [material.id, material]));

  function clampRoll(value) {
    return Math.max(0, Math.min(.999999, Number(value) || 0));
  }

  function rollDrops(mapId, enemy = {}, random = Math.random) {
    const mapConfig = MAP_DROP_CONFIGS[String(mapId || '')] || [];
    const monsterConfig = String(mapId || '') === 'plains-depths'
      ? MONSTER_DROP_CONFIGS[String(enemy?.id || '')] || []
      : [];
    const config = [...mapConfig, ...monsterConfig];
    return config
      .filter((entry) => clampRoll(random()) < entry.dropRate)
      .map((entry) => ({ ...MATERIAL_BY_ID.get(entry.materialId), sourceMapId: mapId, sourceMonsterId: enemy?.id || null, quantity: entry.amount || 1 }));
  }

  function addStackedMaterial(progress, material, amount = 1) {
    if (!progress || !material || !MATERIAL_BY_ID.has(material.id)) return null;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const quantity = Math.max(1, Math.floor(Number(amount) || 1));
    const existing = progress.inventory.find((item) => item?.kind === 'material' && item.id === material.id);
    if (existing) {
      existing.quantity = Math.max(0, Number(existing.quantity) || 0) + quantity;
      return existing;
    }
    const item = { ...material, quantity };
    progress.inventory.push(item);
    return item;
  }

  function grantMaterialDrops(progress, mapId, enemy = {}, options = {}) {
    if (!progress || typeof progress !== 'object') return [];
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const drops = rollDrops(mapId, enemy, random);
    drops.forEach((drop) => addStackedMaterial(progress, drop, drop.quantity));
    return drops;
  }

  return Object.freeze({ MATERIALS, MAP_DROP_CONFIGS, MONSTER_DROP_CONFIGS, rollDrops, addStackedMaterial, grantMaterialDrops });
}));
