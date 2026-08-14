(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VillageUpgradePolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MATERIALS = Object.freeze({
    buildingWolfFur: Object.freeze({ id: 'wolf-fur', kind: 'material', materialType: 'monster-crafting', chapter: 1, icon: '🐺', image: 'assets/wolf-fur.png?v=20260815-user-image-v1', imageStatus: 'ready', name: '狼毛', description: '由狼穴取得，可用於製作與升級建築。' }),
    buildingWolfFang: Object.freeze({ id: 'wolf-fang', kind: 'material', materialType: 'monster-crafting', rarity: 'rare', chapter: 1, icon: '🦷', image: 'assets/wolf-fang.png?v=20260815-user-image-v1', imageStatus: 'ready', name: '狼牙', description: '從狼穴怪物身上取得的稀有製作材料，也可用於升級建築。' }),
    buildingHardHide: Object.freeze({ id: 'hard-hide', kind: 'material', materialType: 'monster-crafting', chapter: 1, icon: '▰', image: 'assets/hard-hide.png?v=20260815-user-image-v1', imageStatus: 'ready', name: '硬皮', description: '由野豬林取得，可用於製作與升級建築。' }),
    buildingBoarTusk: Object.freeze({ id: 'boar-tusk', kind: 'material', materialType: 'monster-crafting', chapter: 1, icon: '🦷', image: 'assets/boar-tusk.png?v=20260815-user-image-v1', imageStatus: 'ready', name: '獠牙', description: '由野豬林取得，可用於製作與升級建築。' }),
    buildingIronOre: Object.freeze({ id: 'iron-ore', kind: 'material', materialType: 'monster-crafting', chapter: 1, icon: '⛏', image: 'assets/iron-ore.png?v=20260815-user-image-v1', imageStatus: 'ready', name: '鐵礦石', description: '由哥布林營地取得，可用於製作與升級建築。' }),
    buildingBlackOre: Object.freeze({ id: 'black-ore', kind: 'material', materialType: 'special-crafting', chapter: 1, icon: '⬟', image: 'assets/black-ore.png?v=20260815-user-image-v1', imageStatus: 'ready', name: '黑礦石', description: '只由平原深處的黑石系列怪物掉落，可用於製作與升級建築。' }),
    buildingBlackWood: Object.freeze({ id: 'black-wood', kind: 'material', materialType: 'monster-crafting', chapter: 2, icon: '🪵', name: '黑木', description: '從黑森林的樹木與植物系怪物取得。' }),
    buildingSpiderSilk: Object.freeze({ id: 'spider-silk', kind: 'material', materialType: 'monster-crafting', chapter: 2, icon: '🕸', name: '蜘蛛絲', description: '從第二章蜘蛛系怪物取得。' }),
    buildingVenomSac: Object.freeze({ id: 'venom-sac', kind: 'material', materialType: 'monster-crafting', rarity: 'rare', chapter: 2, icon: '🧪', name: '毒囊', description: '從蜘蛛巢穴的毒系怪物取得。' }),
    buildingBlackIronOre: Object.freeze({ id: 'black-iron-ore', kind: 'material', materialType: 'special-crafting', rarity: 'rare', chapter: 2, icon: '⬢', name: '黑鐵礦石', description: '只由符合規則的第二章黑石系列怪物掉落。' }),
    buildingCorruptionCrystal: Object.freeze({ id: 'corruption-crystal', kind: 'material', materialType: 'special-crafting', rarity: 'rare', chapter: 2, icon: '◈', name: '腐化結晶', description: '從第二章中後期的腐化系怪物取得。' })
  });

  // 材料掉落由章節材料政策統一處理；建築不再額外擲出第二份同名材料。
  const MAP_DROP_CONFIGS = Object.freeze({});

  const CHAPTER_LEVEL_CAPS = Object.freeze({ 1: 2, 2: 3 });
  const LEVEL_TWO_COSTS = Object.freeze({
    workshop: Object.freeze({ chapter: 1, targetLevel: 2, gold: 15000, materials: Object.freeze({ 'wolf-fur': 150, 'hard-hide': 150 }) }),
    blacksmith: Object.freeze({ chapter: 1, targetLevel: 2, gold: 15000, materials: Object.freeze({ 'iron-ore': 200, 'black-ore': 100 }) }),
    furnace: Object.freeze({ chapter: 1, targetLevel: 2, gold: 15000, materials: Object.freeze({ 'iron-ore': 150, 'black-ore': 150 }) }),
    alchemy: Object.freeze({ chapter: 1, targetLevel: 2, gold: 15000, materials: Object.freeze({ 'wolf-fang': 50, 'boar-tusk': 50, 'black-ore': 50 }) }),
    rune: Object.freeze({ chapter: 1, targetLevel: 2, gold: 15000, materials: Object.freeze({ 'black-ore': 250, 'wolf-fang': 25, 'boar-tusk': 25 }) })
  });
  const LEVEL_THREE_COSTS = Object.freeze({
    workshop: Object.freeze({ chapter: 2, targetLevel: 3, gold: 30000, materials: Object.freeze({ 'black-wood': 400, 'hard-hide': 400, 'spider-silk': 300 }) }),
    blacksmith: Object.freeze({ chapter: 2, targetLevel: 3, gold: 30000, materials: Object.freeze({ 'black-iron-ore': 500, 'black-wood': 300 }) }),
    furnace: Object.freeze({ chapter: 2, targetLevel: 3, gold: 30000, materials: Object.freeze({ 'black-iron-ore': 400, 'corruption-crystal': 200 }) }),
    alchemy: Object.freeze({ chapter: 2, targetLevel: 3, gold: 30000, materials: Object.freeze({ 'venom-sac': 150, 'corruption-crystal': 150, 'spider-silk': 200 }) }),
    rune: Object.freeze({ chapter: 2, targetLevel: 3, gold: 30000, materials: Object.freeze({ 'corruption-crystal': 300, 'black-iron-ore': 300, 'venom-sac': 100 }) })
  });

  const MATERIAL_BY_ID = new Map(Object.values(MATERIALS).map((material) => [material.id, material]));

  function getMaterial(materialId) {
    return MATERIAL_BY_ID.get(materialId) || null;
  }

  function getQuantity(inventory, materialId) {
    return (Array.isArray(inventory) ? inventory : [])
      .filter((item) => item?.id === materialId)
      .reduce((total, item) => total + Math.max(0, Number(item.quantity) || 0), 0);
  }

  const LEGACY_MATERIAL_IDS = Object.freeze({
    'building-wolf-fur': 'wolf-fur',
    'building-wolf-fang': 'wolf-fang',
    'building-hard-hide': 'hard-hide',
    'building-boar-tusk': 'boar-tusk',
    'building-iron-ore': 'iron-ore',
    'building-black-ore': 'black-ore'
  });

  function normalizeMaterialInventory(inventory) {
    const items = Array.isArray(inventory) ? inventory : [];
    const normalized = [];
    items.forEach((item) => {
      const canonicalId = LEGACY_MATERIAL_IDS[item?.id] || item?.id;
      const material = MATERIAL_BY_ID.get(canonicalId);
      if (!material) { normalized.push(item); return; }
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const existing = normalized.find((entry) => entry?.id === canonicalId && entry?.kind === 'material');
      if (existing) existing.quantity = Math.max(0, Number(existing.quantity) || 0) + quantity;
      else if (quantity > 0) normalized.push({ ...material, quantity });
    });
    return normalized;
  }

  const normalizeWolfFangInventory = normalizeMaterialInventory;

  function addMaterial(inventory, materialId, amount) {
    const material = MATERIAL_BY_ID.get(materialId);
    if (!material || amount <= 0) return null;
    const existing = inventory.find((item) => item?.id === materialId);
    if (existing) existing.quantity = Math.max(0, Number(existing.quantity) || 0) + amount;
    else inventory.push({ ...material, quantity: amount });
    return { ...material, quantity: amount };
  }

  function grantMapDrops(progress, mapId, options = {}) {
    if (!progress || typeof progress !== 'object') return [];
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const random = options.random || Math.random;
    return (MAP_DROP_CONFIGS[String(mapId || '')] || [])
      .filter((drop) => Math.max(0, Math.min(.999999, Number(random()) || 0)) < drop.dropRate)
      .map((drop) => addMaterial(progress.inventory, drop.materialId, drop.amount));
  }

  function getRequirement(buildingId, currentLevel) {
    const level = Math.max(1, Number(currentLevel) || 1);
    if (level === 1) return LEVEL_TWO_COSTS[buildingId] || null;
    if (level === 2) return LEVEL_THREE_COSTS[buildingId] || null;
    return null;
  }

  function canUpgrade(progress, village, buildingId) {
    const building = village?.buildings?.[buildingId];
    if (!building) return { ok: false, reason: 'missing-building', requirement: null };
    const currentLevel = Math.max(1, Number(building.level) || 1);
    const requirement = getRequirement(buildingId, currentLevel);
    if (!requirement) return { ok: false, reason: currentLevel >= 3 ? 'chapter-cap' : 'not-configured', requirement: null };
    const unlockedChapter = Math.max(1, Number(progress?.unlockedChapter) || 1);
    if (unlockedChapter < requirement.chapter) return { ok: false, reason: 'chapter-locked', requirement };
    if ((Number(progress?.gold) || 0) < requirement.gold) return { ok: false, reason: 'gold', requirement };
    const missing = Object.entries(requirement.materials).find(([id, amount]) => getQuantity(progress?.inventory, id) < amount);
    if (missing) return { ok: false, reason: 'material', materialId: missing[0], requirement };
    return { ok: true, reason: '', requirement };
  }

  function consumeMaterial(inventory, materialId, amount) {
    let remaining = amount;
    for (let index = inventory.length - 1; index >= 0 && remaining > 0; index -= 1) {
      const item = inventory[index];
      if (item?.id !== materialId) continue;
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const consumed = Math.min(quantity, remaining);
      item.quantity = quantity - consumed;
      remaining -= consumed;
      if (item.quantity <= 0) inventory.splice(index, 1);
    }
  }

  function upgrade(progress, village, buildingId) {
    const validation = canUpgrade(progress, village, buildingId);
    if (!validation.ok) return validation;
    const requirement = validation.requirement;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    Object.entries(requirement.materials).forEach(([id, amount]) => consumeMaterial(progress.inventory, id, amount));
    progress.gold = Math.max(0, (Number(progress.gold) || 0) - requirement.gold);
    village.buildings[buildingId].level = requirement.targetLevel;
    return { ok: true, requirement, level: requirement.targetLevel };
  }

  return Object.freeze({ MATERIALS, MAP_DROP_CONFIGS, CHAPTER_LEVEL_CAPS, LEVEL_TWO_COSTS, LEVEL_THREE_COSTS, LEGACY_MATERIAL_IDS, getMaterial, getQuantity, normalizeMaterialInventory, normalizeWolfFangInventory, grantMapDrops, getRequirement, canUpgrade, upgrade });
});
