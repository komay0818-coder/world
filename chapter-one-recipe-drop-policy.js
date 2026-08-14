(function attachChapterOneRecipeDropPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterOneRecipeDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterOneRecipeDropPolicy() {
  const RARE_RECIPE_DROP_RATE = .01;

  function recipe(definition) {
    return Object.freeze({
      kind: 'recipe',
      itemType: 'recipe',
      icon: '📜',
      consumable: true,
      stackable: true,
      consumeOnCraft: true,
      quantity: 1,
      chapter: 1,
      ...definition
    });
  }

  const RECIPES = Object.freeze({
    greenWrist: recipe({ id: 'recipe-green-wrist', itemId: 'recipe-green-wrist', recipeId: 'chapter1-green-wrist', name: '平原護腕配方', equipmentSlot: 'wrist', quality: 'uncommon', rarity: 'uncommon', resultItemId: 'crafted-green-wrist', resultEquipmentId: 'crafted-green-wrist', resultName: '平原護腕', image: 'assets/plains-wrist.png?v=20260815-user-image-v1', imageStatus: 'ready', materials: Object.freeze({ 'equipment-stone-uncommon': 1, 'iron-ore': 4, 'hard-hide': 3 }), materialRequirements: Object.freeze({ 'equipment-stone-uncommon': 1, 'iron-ore': 4, 'hard-hide': 3 }), goldCost: 2400 }),
    greenCloak: recipe({ id: 'recipe-green-cloak', itemId: 'recipe-green-cloak', recipeId: 'chapter1-green-cloak', name: '平原斗篷配方', equipmentSlot: 'cloak', quality: 'uncommon', rarity: 'uncommon', resultItemId: 'crafted-green-cloak', resultEquipmentId: 'crafted-green-cloak', resultName: '平原斗篷', image: 'assets/plains-cloak.png?v=20260815-user-image-v1', imageStatus: 'ready', materials: Object.freeze({ 'equipment-stone-uncommon': 1, 'hard-hide': 3, 'wolf-fur': 4 }), materialRequirements: Object.freeze({ 'equipment-stone-uncommon': 1, 'hard-hide': 3, 'wolf-fur': 4 }), goldCost: 2400 }),
    greenShoulders: recipe({ id: 'recipe-green-shoulders', itemId: 'recipe-green-shoulders', recipeId: 'chapter1-green-shoulders', name: '平原肩甲配方', equipmentSlot: 'shoulders', quality: 'uncommon', rarity: 'uncommon', resultItemId: 'crafted-green-shoulders', resultEquipmentId: 'crafted-green-shoulders', resultName: '平原肩甲', image: 'assets/plains-shoulders.png?v=20260815-user-image-v1', imageStatus: 'ready', materials: Object.freeze({ 'equipment-stone-uncommon': 1, 'wolf-fur': 4, 'iron-ore': 4, 'hard-hide': 3 }), materialRequirements: Object.freeze({ 'equipment-stone-uncommon': 1, 'wolf-fur': 4, 'iron-ore': 4, 'hard-hide': 3 }), goldCost: 3200 }),
    goblinRareCloak: recipe({ id: 'recipe-goblin-rare-cloak', itemId: 'recipe-goblin-rare-cloak', recipeId: 'chapter1-goblin-rare-cloak', name: '哥布林精良斗篷配方', equipmentSlot: 'cloak', quality: 'rare', rarity: 'rare', resultItemId: 'crafted-goblin-rare-cloak', resultEquipmentId: 'crafted-goblin-rare-cloak', resultName: '哥布林精良斗篷', image: 'assets/goblin-rare-cloak.png?v=20260815-user-image-v1', imageStatus: 'ready', materials: Object.freeze({ 'equipment-stone-rare': 1, 'black-ore': 3, 'hard-hide': 5, 'wolf-fur': 6 }), materialRequirements: Object.freeze({ 'equipment-stone-rare': 1, 'black-ore': 3, 'hard-hide': 5, 'wolf-fur': 6 }), goldCost: 9000 }),
    highChiefRareWrist: recipe({ id: 'recipe-high-chief-rare-wrist', itemId: 'recipe-high-chief-rare-wrist', recipeId: 'chapter1-high-chief-rare-wrist', name: '酋長精良護腕配方', equipmentSlot: 'wrist', quality: 'rare', rarity: 'rare', resultItemId: 'crafted-high-chief-rare-wrist', resultEquipmentId: 'crafted-high-chief-rare-wrist', resultName: '酋長精良護腕', image: 'assets/high-chief-rare-wrist.png?v=20260815-user-image-v1', imageStatus: 'ready', materials: Object.freeze({ 'equipment-stone-rare': 1, 'black-ore': 3, 'hard-hide': 6, 'wolf-fang': 2 }), materialRequirements: Object.freeze({ 'equipment-stone-rare': 1, 'black-ore': 3, 'hard-hide': 6, 'wolf-fang': 2 }), goldCost: 9000 }),
    blackKnightRareShoulders: recipe({ id: 'recipe-black-knight-rare-shoulders', itemId: 'recipe-black-knight-rare-shoulders', recipeId: 'chapter1-black-knight-rare-shoulders', name: '黑騎士精良肩甲配方', equipmentSlot: 'shoulders', quality: 'rare', rarity: 'rare', resultItemId: 'crafted-black-knight-rare-shoulders', resultEquipmentId: 'crafted-black-knight-rare-shoulders', resultName: '黑騎士精良肩甲', image: 'assets/black-knight-rare-shoulders.png?v=20260815-user-image-v1', imageStatus: 'ready', materials: Object.freeze({ 'equipment-stone-rare': 1, 'black-ore': 4, 'wolf-fur': 6, 'hard-hide': 6, 'boar-tusk': 2 }), materialRequirements: Object.freeze({ 'equipment-stone-rare': 1, 'black-ore': 4, 'wolf-fur': 6, 'hard-hide': 6, 'boar-tusk': 2 }), goldCost: 11000 })
  });

  const GREEN_PLAINS_DEPTHS_RECIPES = Object.freeze([
    RECIPES.greenWrist.id,
    RECIPES.greenCloak.id,
    RECIPES.greenShoulders.id
  ]);

  const RARE_DROP_SOURCES = Object.freeze({
    goblinTreasureChest: Object.freeze({ mapId: 'goblin-camp', recipeItemId: RECIPES.goblinRareCloak.id, dropRate: RARE_RECIPE_DROP_RATE }),
    goblinHighChief: Object.freeze({ mapId: 'goblin-camp', recipeItemId: RECIPES.highChiefRareWrist.id, dropRate: RARE_RECIPE_DROP_RATE }),
    wanderingBlackKnight: Object.freeze({ mapId: 'plains-depths', recipeItemId: RECIPES.blackKnightRareShoulders.id, dropRate: RARE_RECIPE_DROP_RATE })
  });

  const RECIPE_BY_ITEM_ID = new Map(Object.values(RECIPES).map((entry) => [entry.id, entry]));

  function clampRoll(value) {
    return Math.max(0, Math.min(.999999, Number(value) || 0));
  }

  function addStackedRecipe(progress, recipeItem, amount = 1) {
    if (!progress || !recipeItem || !RECIPE_BY_ITEM_ID.has(recipeItem.id)) return null;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const quantity = Math.max(1, Math.floor(Number(amount) || 1));
    const existing = progress.inventory.find((item) => item?.kind === 'recipe' && item.id === recipeItem.id);
    if (existing) {
      existing.quantity = Math.max(0, Number(existing.quantity) || 0) + quantity;
      return existing;
    }
    const item = { ...recipeItem, materialRequirements: { ...recipeItem.materialRequirements }, quantity };
    progress.inventory.push(item);
    return item;
  }

  function rollRecipeDrops(enemy, mapId, random = Math.random) {
    const drops = [];
    if (mapId === 'plains-depths' && enemy?.id === 'blackstoneLeader' && enemy?.isBoss) {
      const index = Math.floor(clampRoll(random()) * GREEN_PLAINS_DEPTHS_RECIPES.length);
      drops.push(RECIPE_BY_ITEM_ID.get(GREEN_PLAINS_DEPTHS_RECIPES[index]));
    }
    const rareSource = RARE_DROP_SOURCES[enemy?.id];
    if (rareSource?.mapId === mapId && clampRoll(random()) < rareSource.dropRate) {
      drops.push(RECIPE_BY_ITEM_ID.get(rareSource.recipeItemId));
    }
    return drops.filter(Boolean).map((entry) => ({ ...entry, materialRequirements: { ...entry.materialRequirements }, quantity: 1 }));
  }

  function grantRecipeDrops(progress, enemy, mapId, options = {}) {
    if (!progress || typeof progress !== 'object') return [];
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const drops = rollRecipeDrops(enemy, mapId, random);
    drops.forEach((drop) => addStackedRecipe(progress, drop, drop.quantity));
    return drops;
  }

  return Object.freeze({ RARE_RECIPE_DROP_RATE, RECIPES, GREEN_PLAINS_DEPTHS_RECIPES, RARE_DROP_SOURCES, addStackedRecipe, rollRecipeDrops, grantRecipeDrops });
}));
