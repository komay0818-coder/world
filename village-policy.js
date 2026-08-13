(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VillagePolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VILLAGE_MAX_LEVEL = 10;
  const BUILDING_DEFINITIONS = Object.freeze({
    furnace: { id: 'furnace', name: '熔爐', icon: '♨', maxLevel: 10, description: '分解裝備並取得製作素材', unlocked: true, feature: 'salvage' },
    alchemy: { id: 'alchemy', name: '煉金房', icon: '⚗', maxLevel: 10, description: '合成裝備並重新產生詞綴', unlocked: true, feature: 'alchemy' },
    workshop: { id: 'workshop', name: '工坊', icon: '⚙', maxLevel: 10, description: '使用配方與材料製作裝備', unlocked: true, feature: 'crafting' },
    blacksmith: { id: 'blacksmith', name: '鐵匠', icon: '⚒', maxLevel: 10, description: '替裝備開啟符文插槽', unlocked: true, feature: 'socketing' },
    rune: { id: 'rune', name: '魔法塔', icon: '◇', maxLevel: 10, description: '將技能殘頁合成為同階技能書', unlocked: true, feature: 'magic-synthesis' },
    storage: { id: 'storage', name: '倉庫', icon: '▣', maxLevel: 10, description: '存放裝備與各類材料', unlocked: true, feature: 'storage' },
    shop: { id: 'shop', name: '商店', icon: '⚖', maxLevel: 10, description: '購買與販售一般物品', unlocked: true, feature: 'shop' }
  });

  function clampLevel(value, maxLevel = VILLAGE_MAX_LEVEL) {
    return Math.min(maxLevel, Math.max(1, Math.floor(Number(value) || 1)));
  }

  function createDefaultVillageData() {
    return {
      version: 1,
      level: 1,
      buildings: Object.fromEntries(Object.values(BUILDING_DEFINITIONS).map((building) => [building.id, {
        level: 1,
        unlocked: building.unlocked
      }]))
    };
  }

  function normalizeVillageData(savedVillage) {
    const defaults = createDefaultVillageData();
    const source = savedVillage && typeof savedVillage === 'object' ? savedVillage : {};
    const savedBuildings = source.buildings && typeof source.buildings === 'object' ? source.buildings : {};
    return {
      ...source,
      version: Math.max(1, Math.floor(Number(source.version) || defaults.version)),
      level: clampLevel(source.level),
      buildings: Object.fromEntries(Object.values(BUILDING_DEFINITIONS).map((definition) => {
        const saved = savedBuildings[definition.id];
        const state = saved && typeof saved === 'object' ? saved : {};
        return [definition.id, {
          ...state,
          level: clampLevel(state.level, definition.maxLevel),
          unlocked: typeof state.unlocked === 'boolean' ? state.unlocked : definition.unlocked
        }];
      }))
    };
  }

  function getVillageBuildingData(village, buildingId) {
    const definition = BUILDING_DEFINITIONS[buildingId];
    if (!definition) return null;
    const normalized = normalizeVillageData(village);
    const state = normalized.buildings[buildingId];
    return { ...state, ...definition, level: state.level, unlocked: state.unlocked };
  }

  return Object.freeze({
    VILLAGE_MAX_LEVEL,
    BUILDING_DEFINITIONS,
    createDefaultVillageData,
    normalizeVillageData,
    getVillageBuildingData
  });
});
