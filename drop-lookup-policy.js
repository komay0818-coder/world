(function attachDropLookupPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DropLookupPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createDropLookupPolicy() {
  'use strict';
  const QUALITY_NAMES = Object.freeze({ common: '白色裝備', uncommon: '綠色裝備', rare: '藍色裝備', epic: '紫色裝備', legendary: '傳奇裝備' });
  const CATEGORY_NAMES = Object.freeze({ equipment: '裝備', material: '材料', recipe: '配方', skill: '技能材料', rune: '符文' });
  function percent(rate) { const value = Math.max(0, Math.min(1, Number(rate) || 0)) * 100; return `${Number.isInteger(value) ? value : Number(value.toFixed(2))}%`; }
  function uniqueMonsterIds(pool) { return [...new Set(['normal', 'rare', 'elite', 'boss'].flatMap((rank) => pool?.[rank] || []))]; }
  function addSource(index, item, source) {
    if (!item?.id || !source?.mapId || !source?.monsterId) return;
    const current = index.get(item.id) || { ...item, sources: [] };
    const key = `${source.mapId}:${source.monsterId}:${source.rate}:${source.note || ''}`;
    if (!current.sources.some((entry) => entry.key === key)) current.sources.push({ ...source, key });
    index.set(item.id, current);
  }
  function buildIndex(options = {}) {
    const index = new Map();
    const maps = (options.maps || []).filter((map) => map?.regionOf);
    const mapPools = options.mapPools || {}, monsters = options.monsters || {};
    const materialPolicies = options.materialPolicies || [options.materialPolicy].filter(Boolean);
    const recipePolicies = options.recipePolicies || [options.recipePolicy].filter(Boolean);
    const materials = materialPolicies.flatMap((policy) => Object.values(policy?.MATERIALS || {})), recipes = recipePolicies.flatMap((policy) => Object.values(policy?.RECIPES || {})), skillMaterials = options.skillPolicy?.MATERIALS || {};
    const materialById = new Map(materials.map((item) => [item.id, item]));
    const recipeById = new Map(recipes.map((item) => [item.id, item]));
    const skillById = new Map(Object.values(skillMaterials).map((item) => [item.id, item]));
    maps.forEach((map) => uniqueMonsterIds(mapPools[map.id]).forEach((monsterId) => {
      const monster = monsters[monsterId]; if (!monster) return;
      const sourceBase = { chapter: map.chapter, mapId: map.id, mapName: map.name, monsterId, monsterName: monster.name };
      const runeConfig = options.runeDropPolicy?.getDropConfig?.(map.id, monster);
      const runeItem = runeConfig && options.runePolicy?.RUNE_BY_ID?.get(runeConfig.runeId);
      if (runeItem) addSource(index, { ...runeItem, category: 'rune', typeLabel: '區域專屬符文' }, { ...sourceBase, rate: runeConfig.dropRate, amount: 1, note: '所在地圖專屬，獨立判定，無保底' });
      const purificationItem = options.purificationPolicy?.MAP_MATERIALS?.[map.id];
      if (purificationItem) {
        const rank = monster.isBoss ? 'boss' : monster.isElite ? 'elite' : 'normal';
        addSource(index, { ...purificationItem, category: 'material', typeLabel: 'Debuff 解除道具' }, { ...sourceBase, rate: options.purificationPolicy.DROP_RATES?.[rank], amount: 1 });
      }
      materialPolicies.forEach((policy) => {
        (policy?.MAP_DROP_CONFIGS?.[map.id] || []).forEach((drop) => { const item = materialById.get(drop.materialId); addSource(index, item && { ...item, category: 'material', typeLabel: '製作材料' }, { ...sourceBase, rate: drop.dropRate }); });
        (policy?.MONSTER_DROP_CONFIGS?.[monsterId] || []).forEach((drop) => { const item = materialById.get(drop.materialId); addSource(index, item && { ...item, category: 'material', typeLabel: '製作材料' }, { ...sourceBase, rate: drop.dropRate, amount: drop.amount || 1 }); });
      });
      const specialSource = options.specialEquipmentPolicy?.DROP_SOURCES?.[monsterId];
      if (specialSource?.mapId === map.id) {
        const template = options.specialEquipmentPolicy.getTemplate?.(specialSource.templateId);
        addSource(index, template && { ...template, category: 'equipment', typeLabel: '紫色專屬裝備' }, { ...sourceBase, rate: specialSource.dropRate, amount: 1, note: '指定來源獨立判定，無保底' });
      }
      (options.skillPolicy?.DROP_CONFIG?.[map.chapter]?.materials || []).filter((drop) => !drop.bossOnly || monster.isBoss).forEach((drop) => { const item = skillById.get(drop.materialId); addSource(index, item && { ...item, category: 'skill', typeLabel: '技能材料' }, { ...sourceBase, rate: drop.chance, amount: drop.amount || 1 }); });
      const loot = monster.lootConfig;
      if (loot?.equipmentDropRate && loot.rarityWeights) {
        const total = Object.values(loot.rarityWeights).reduce((sum, weight) => sum + Math.max(0, Number(weight) || 0), 0);
        Object.entries(loot.rarityWeights).forEach(([quality, weight]) => { if (!QUALITY_NAMES[quality] || !(Number(weight) > 0) || total <= 0) return; addSource(index, { id: `equipment-${quality}`, name: QUALITY_NAMES[quality], category: 'equipment', typeLabel: '裝備品質' }, { ...sourceBase, rate: Number(loot.equipmentDropRate) * Number(weight) / total, note: '一般裝備池' }); });
      }
      const chapterOneBlueRate = options.bossPolicy?.getChapterOneBlueDropRate?.(monster, { chapter: map.chapter });
      if (chapterOneBlueRate > 0) {
        addSource(index, { id: 'chapter-1-blue-equipment', name: '第一章藍色裝備', category: 'equipment', typeLabel: '額外藍色裝備' }, { ...sourceBase, rate: chapterOneBlueRate, note: '與一般裝備獨立判定' });
      }
    }));
    recipePolicies.forEach((policy) => Object.entries(policy?.RARE_DROP_SOURCES || {}).forEach(([monsterId, source]) => {
      const map = maps.find((entry) => entry.id === source.mapId), item = recipeById.get(source.recipeItemId);
      addSource(index, item && { ...item, category: 'recipe', typeLabel: '配方' }, { chapter: map?.chapter || item?.chapter || 1, mapId: source.mapId, mapName: map?.name || source.mapId, monsterId, monsterName: monsters[monsterId]?.name || monsterId, rate: source.dropRate });
    }));
    const greenRecipes = recipePolicies.flatMap((policy) => policy?.GREEN_PLAINS_DEPTHS_RECIPES || []), bossId = 'blackstoneLeader', bossMap = maps.find((entry) => entry.id === 'plains-depths');
    greenRecipes.forEach((recipeId) => { const item = recipeById.get(recipeId); addSource(index, item && { ...item, category: 'recipe', typeLabel: '配方' }, { chapter: 1, mapId: 'plains-depths', mapName: bossMap?.name || '平原深處', monsterId: bossId, monsterName: monsters[bossId]?.name || '黑石首領', rate: 1 / Math.max(1, greenRecipes.length), note: 'Boss 必掉配方三選一' }); });
    return [...index.values()].map((item) => ({ ...item, sources: item.sources.map(({ key, ...source }) => source) }));
  }
  function filterItems(items, query = '', category = 'all', mapId = '') { const term = String(query || '').trim().toLocaleLowerCase('zh-Hant'); return (items || []).filter((item) => (category === 'all' || item.category === category) && (!mapId || item.sources.some((source) => source.mapId === mapId)) && (!term || item.name.toLocaleLowerCase('zh-Hant').includes(term))); }
  return Object.freeze({ QUALITY_NAMES, CATEGORY_NAMES, percent, uniqueMonsterIds, buildIndex, filterItems });
}));
