(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VillageUpgradePolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MATERIALS = Object.freeze({
    buildingWolfFur: Object.freeze({ id: 'building-wolf-fur', kind: 'material', materialType: 'building-upgrade', chapter: 1, icon: '🐺', name: '狼毛', description: '第一章建築升級材料；由狼穴取得。' }),
    buildingWolfFang: Object.freeze({ id: 'wolf-fang', kind: 'material', materialType: 'monster-crafting', rarity: 'rare', chapter: 1, icon: '🦷', name: '狼牙', description: '從狼穴怪物身上取得的稀有製作材料，也可用於升級建築。' }),
    buildingHardHide: Object.freeze({ id: 'building-hard-hide', kind: 'material', materialType: 'building-upgrade', chapter: 1, icon: '▰', name: '硬皮', description: '第一章建築升級材料；由野豬林取得。' }),
    buildingBoarTusk: Object.freeze({ id: 'building-boar-tusk', kind: 'material', materialType: 'building-upgrade', chapter: 1, icon: '🦷', name: '獠牙', description: '第一章建築升級材料；由野豬林取得。' }),
    buildingIronOre: Object.freeze({ id: 'building-iron-ore', kind: 'material', materialType: 'building-upgrade', chapter: 1, icon: '⛏', name: '鐵礦石', description: '第一章建築升級材料；由哥布林營地取得。' }),
    buildingBlackOre: Object.freeze({ id: 'building-black-ore', kind: 'material', materialType: 'building-upgrade', chapter: 1, icon: '⬟', name: '黑礦石', description: '第一章最高階建築升級材料；由平原深處取得。' })
  });

  const MAP_DROP_CONFIGS = Object.freeze({
    'wolf-den': Object.freeze([
      Object.freeze({ materialId: MATERIALS.buildingWolfFur.id, dropRate: .25, amount: 1 })
    ]),
    'boar-woods': Object.freeze([
      Object.freeze({ materialId: MATERIALS.buildingHardHide.id, dropRate: .25, amount: 1 }),
      Object.freeze({ materialId: MATERIALS.buildingBoarTusk.id, dropRate: .05, amount: 1 })
    ]),
    'goblin-camp': Object.freeze([
      Object.freeze({ materialId: MATERIALS.buildingIronOre.id, dropRate: .25, amount: 1 })
    ]),
    'plains-depths': Object.freeze([
      Object.freeze({ materialId: MATERIALS.buildingBlackOre.id, dropRate: .25, amount: 1 })
    ])
  });

  const CHAPTER_LEVEL_CAPS = Object.freeze({ 1: 2, 2: 3 });
  const LEVEL_TWO_COSTS = Object.freeze({
    workshop: Object.freeze({ chapter: 1, targetLevel: 2, gold: 15000, materials: Object.freeze({ 'building-wolf-fur': 150, 'building-hard-hide': 150 }) }),
    blacksmith: Object.freeze({ chapter: 1, targetLevel: 2, gold: 15000, materials: Object.freeze({ 'building-iron-ore': 200, 'building-black-ore': 100 }) }),
    furnace: Object.freeze({ chapter: 1, targetLevel: 2, gold: 15000, materials: Object.freeze({ 'building-iron-ore': 150, 'building-black-ore': 150 }) }),
    alchemy: Object.freeze({ chapter: 1, targetLevel: 2, gold: 15000, materials: Object.freeze({ 'wolf-fang': 50, 'building-boar-tusk': 50, 'building-black-ore': 50 }) }),
    rune: Object.freeze({ chapter: 1, targetLevel: 2, gold: 15000, materials: Object.freeze({ 'building-black-ore': 250, 'wolf-fang': 25, 'building-boar-tusk': 25 }) })
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

  function normalizeWolfFangInventory(inventory) {
    const items = Array.isArray(inventory) ? inventory : [];
    const fangItems = items.filter((item) => ['wolf-fang', 'building-wolf-fang'].includes(item?.id));
    if (!fangItems.some((item) => item.id === 'building-wolf-fang')) return items;
    const quantity = fangItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
    const normalized = items.filter((item) => !['wolf-fang', 'building-wolf-fang'].includes(item?.id));
    if (quantity > 0) normalized.push({ ...MATERIALS.buildingWolfFang, quantity });
    return normalized;
  }

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
    if (Math.max(1, Number(currentLevel) || 1) !== 1) return null;
    return LEVEL_TWO_COSTS[buildingId] || null;
  }

  function canUpgrade(progress, village, buildingId) {
    const building = village?.buildings?.[buildingId];
    if (!building) return { ok: false, reason: 'missing-building', requirement: null };
    const currentLevel = Math.max(1, Number(building.level) || 1);
    const requirement = getRequirement(buildingId, currentLevel);
    if (!requirement) return { ok: false, reason: currentLevel >= 2 ? 'chapter-cap' : 'not-configured', requirement: null };
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

  return Object.freeze({ MATERIALS, MAP_DROP_CONFIGS, CHAPTER_LEVEL_CAPS, LEVEL_TWO_COSTS, getMaterial, getQuantity, normalizeWolfFangInventory, grantMapDrops, getRequirement, canUpgrade, upgrade });
});
