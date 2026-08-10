(function attachCraftingPolicy(root, factory) {
  const recipePolicy = typeof module === 'object' && module.exports
    ? require('./chapter-one-recipe-drop-policy.js')
    : root.ChapterOneRecipeDropPolicy;
  const materialPolicy = typeof module === 'object' && module.exports
    ? require('./chapter-one-material-drop-policy.js')
    : root.ChapterOneMaterialDropPolicy;
  const affixPolicy = typeof module === 'object' && module.exports
    ? require('./equipment-affix-policy.js')
    : root.EquipmentAffixPolicy;
  const api = factory(recipePolicy, materialPolicy, affixPolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CraftingPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCraftingPolicy(RecipePolicy, MaterialPolicy, EquipmentAffixPolicy) {
  const INVENTORY_CAPACITY = 1000;
  const RARITIES = Object.freeze({
    uncommon: Object.freeze({ id: 'uncommon', label: '綠色', fixedAffixCount: 1, randomAffixCount: 2, affixCount: 3, workshopLevel: 1, stoneId: 'equipment-stone-uncommon' }),
    rare: Object.freeze({ id: 'rare', label: '藍色', fixedAffixCount: 2, randomAffixCount: 3, affixCount: 5, workshopLevel: 1, stoneId: 'equipment-stone-rare' }),
    epic: Object.freeze({ id: 'epic', label: '紫色', fixedAffixCount: 2, randomAffixCount: 4, affixCount: 6, workshopLevel: 3, stoneId: 'equipment-stone-epic' })
  });

  const STAT_DEFINITIONS = Object.freeze({
    attackFlat: Object.freeze({ label: '固定攻擊力', min: 4, max: 8, unit: '' }),
    criticalChance: Object.freeze({ label: '爆擊率', min: 2, max: 5, unit: '%' }),
    criticalDamage: Object.freeze({ label: '爆擊傷害', min: 6, max: 12, unit: '%' }),
    attackSpeed: Object.freeze({ label: '攻擊速度', min: 2, max: 5, unit: '%' }),
    skillDamage: Object.freeze({ label: '技能傷害', min: 3, max: 7, unit: '%' }),
    defenseFlat: Object.freeze({ label: '固定防禦', min: 4, max: 9, unit: '' }),
    maxHp: Object.freeze({ label: '最大生命', min: 18, max: 40, unit: '' }),
    damageReduction: Object.freeze({ label: '傷害減免', min: 2, max: 5, unit: '%' }),
    blockChance: Object.freeze({ label: '格擋率', min: 2, max: 5, unit: '%' }),
    controlResistance: Object.freeze({ label: '控場抗性', min: 3, max: 8, unit: '%' }),
    dodgeChance: Object.freeze({ label: '閃避率', min: 2, max: 5, unit: '%' }),
    cooldownRecovery: Object.freeze({ label: '冷卻速度', min: 2, max: 6, unit: '%' }),
    hpRegeneration: Object.freeze({ label: '生命恢復', min: 2, max: 6, unit: '' }),
    manaRegeneration: Object.freeze({ label: '魔力恢復', min: 2, max: 6, unit: '' }),
    itemFind: Object.freeze({ label: '掉寶率', min: 2, max: 6, unit: '%' }),
    goldFind: Object.freeze({ label: '金幣獲得率', min: 3, max: 8, unit: '%' })
  });

  const PRIMARY_STAT_POOLS = Object.freeze({
    wrist: Object.freeze(['attackFlat', 'criticalChance', 'criticalDamage', 'attackSpeed', 'skillDamage']),
    shoulders: Object.freeze(['defenseFlat', 'maxHp', 'damageReduction', 'blockChance', 'controlResistance']),
    cloak: Object.freeze(['maxHp', 'dodgeChance', 'cooldownRecovery', 'hpRegeneration', 'manaRegeneration', 'itemFind', 'goldFind'])
  });

  const AFFIX_POOLS = Object.freeze({
    wrist: Object.freeze(['attackFlat', 'criticalChance', 'criticalDamage', 'attackSpeed', 'skillDamage', 'maxHp', 'cooldownRecovery']),
    shoulders: Object.freeze(['defenseFlat', 'maxHp', 'damageReduction', 'blockChance', 'controlResistance', 'hpRegeneration']),
    cloak: Object.freeze(['maxHp', 'dodgeChance', 'cooldownRecovery', 'hpRegeneration', 'manaRegeneration', 'itemFind', 'goldFind', 'damageReduction'])
  });

  const EXTRA_MATERIALS = Object.freeze({
    uncommonStone: Object.freeze({ id: 'equipment-stone-uncommon', kind: 'material', materialType: 'quality-stone', icon: '🟢', name: '綠色品質寶石', description: '製作綠色裝備所需的品質寶石。' }),
    rareStone: Object.freeze({ id: 'equipment-stone-rare', kind: 'material', materialType: 'quality-stone', icon: '🔵', name: '藍色品質寶石', description: '製作藍色裝備所需的品質寶石。' }),
    epicStone: Object.freeze({ id: 'equipment-stone-epic', kind: 'material', materialType: 'quality-stone', icon: '🟣', name: '紫色品質寶石', description: '保留給未來紫色裝備製作。' })
  });
  const MATERIALS = Object.freeze({ ...(MaterialPolicy?.MATERIALS || {}), ...EXTRA_MATERIALS });
  const MATERIAL_BY_ID = new Map(Object.values(MATERIALS).map((entry) => [entry.id, entry]));
  const RECIPES = Object.freeze(Object.fromEntries(Object.values(RecipePolicy?.RECIPES || {}).map((recipe) => [recipe.recipeId, recipe])));

  function clampRoll(value) { return Math.min(.999999, Math.max(0, Number(value) || 0)); }
  function pick(list, random) { return list[Math.floor(clampRoll(random()) * list.length)]; }
  function rollStat(stat, multiplier, random) {
    const definition = STAT_DEFINITIONS[stat];
    const base = definition.min + Math.floor(clampRoll(random()) * (definition.max - definition.min + 1));
    return { stat, label: definition.label, value: Math.max(1, Math.round(base * multiplier)), unit: definition.unit };
  }
  function createInstanceId(now = Date.now(), random = Math.random) {
    return `crafted-${now}-${Math.floor(clampRoll(random()) * 0x100000000).toString(36)}`;
  }
  function normalizeCraftingState(state) {
    const source = state && typeof state === 'object' ? state : {};
    return { version: 2, ...source };
  }
  function getItemQuantity(inventory, itemId) {
    return (Array.isArray(inventory) ? inventory : [])
      .filter((item) => item?.id === itemId)
      .reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  }
  function getRecipeQuantity(progress, recipeId) {
    const recipe = RECIPES[recipeId];
    return recipe ? getItemQuantity(progress?.inventory, recipe.itemId) : 0;
  }
  function isRecipeKnown(progress, recipeId) { return getRecipeQuantity(progress, recipeId) > 0; }
  function getProjectedInventorySlots(progress, recipe) {
    const inventory = Array.isArray(progress?.inventory) ? progress.inventory : [];
    const costs = { [recipe.itemId]: 1, ...recipe.materials };
    const emptiedStacks = Object.entries(costs).filter(([id, amount]) => {
      const matching = inventory.filter((item) => item?.id === id);
      return matching.length === 1 && getItemQuantity(inventory, id) === amount;
    }).length;
    return inventory.length - emptiedStacks + 1;
  }
  function canCraft(progress, recipeId, workshopLevel = 1) {
    const recipe = RECIPES[recipeId];
    if (!recipe) return { ok: false, code: 'missing-recipe-data', reason: '找不到製作配方。' };
    if (getRecipeQuantity(progress, recipeId) < 1) return { ok: false, code: 'missing-recipe', reason: '缺少對應配方。' };
    const rarity = RARITIES[recipe.quality];
    if (!rarity) return { ok: false, code: 'invalid-quality', reason: '配方品質設定錯誤。' };
    if ((Number(workshopLevel) || 1) < rarity.workshopLevel) return { ok: false, code: 'workshop-level', reason: `需要工坊 Lv${rarity.workshopLevel}。` };
    const stoneAmount = Number(recipe.materials?.[rarity.stoneId]) || 0;
    if (getItemQuantity(progress?.inventory, rarity.stoneId) < stoneAmount) return { ok: false, code: 'missing-quality-stone', itemId: rarity.stoneId, reason: `缺少${MATERIAL_BY_ID.get(rarity.stoneId)?.name || '品質寶石'}。` };
    const missingMaterial = Object.entries(recipe.materials || {}).find(([id, amount]) => id !== rarity.stoneId && getItemQuantity(progress?.inventory, id) < amount);
    if (missingMaterial) return { ok: false, code: 'missing-material', itemId: missingMaterial[0], reason: `缺少${MATERIAL_BY_ID.get(missingMaterial[0])?.name || missingMaterial[0]}。` };
    if ((Number(progress?.gold) || 0) < recipe.goldCost) return { ok: false, code: 'missing-gold', reason: '金幣不足。' };
    if (getProjectedInventorySlots(progress, recipe) > INVENTORY_CAPACITY) return { ok: false, code: 'inventory-full', reason: '背包空間不足。' };
    return { ok: true, recipe };
  }
  function generateCraftedEquipment(recipeId, options = {}) {
    const recipe = RECIPES[recipeId];
    if (!recipe) return null;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const craftedAt = options.craftedAt || Date.now();
    const instanceId = options.instanceId || createInstanceId(craftedAt, random);
    const template = {
      id: recipe.resultItemId, kind: 'equipment', name: recipe.resultName, slot: recipe.equipmentSlot,
      equipmentSlot: recipe.equipmentSlot, allowedJobs: [], baseStats: { ...(recipe.baseStats || {}) },
      ...(Array.isArray(recipe.fixedAffixIds) ? { fixedAffixIds: [...recipe.fixedAffixIds] } : {})
    };
    const generated = EquipmentAffixPolicy.createEquipmentInstance(template, { quality: recipe.quality, uniqueId: instanceId, random, chapter: options.chapter || recipe.chapter || 1, jobId: options.jobId });
    return { ...generated, id: instanceId, instanceId, equipmentId: recipe.resultItemId, templateId: recipe.resultItemId, sourceType: 'crafted', recipeId, sockets: 0, craftedAt };
  }
  function deductInventoryItems(inventory, costs) {
    const result = (Array.isArray(inventory) ? inventory : []).map((item) => ({ ...item }));
    Object.entries(costs).forEach(([id, amount]) => {
      let remaining = amount;
      result.filter((item) => item.id === id).forEach((item) => {
        const used = Math.min(remaining, Math.max(0, Number(item.quantity) || 0));
        item.quantity -= used;
        remaining -= used;
      });
    });
    return result.filter((item) => item.kind === 'equipment' || (Number(item.quantity) || 0) > 0);
  }
  function craftEquipment(progress, recipeId, options = {}) {
    const eligibility = canCraft(progress, recipeId, options.workshopLevel);
    if (!eligibility.ok) return eligibility;
    const item = generateCraftedEquipment(recipeId, options);
    if (!item) return { ok: false, code: 'generation-failed', reason: '裝備生成失敗，未扣除任何資源。' };
    const existingIds = new Set([...(progress.inventory || []), ...Object.values(progress.equipment || {})].filter(Boolean).map((entry) => entry.instanceId || entry.id));
    if (existingIds.has(item.instanceId)) return { ok: false, code: 'duplicate-instance', reason: '裝備識別碼重複，未扣除任何資源。' };
    const recipe = eligibility.recipe;
    const nextInventory = deductInventoryItems(progress.inventory, { [recipe.itemId]: 1, ...recipe.materials });
    nextInventory.push(item);
    progress.inventory = nextInventory;
    progress.gold = Math.max(0, (Number(progress.gold) || 0) - recipe.goldCost);
    return { ok: true, item, recipe };
  }
  function formatStat(entry) { return entry ? `${entry.label || STAT_DEFINITIONS[entry.stat]?.label || entry.stat} +${entry.value}${entry.unit || ''}` : ''; }

  return Object.freeze({
    INVENTORY_CAPACITY, RARITIES, STAT_DEFINITIONS, PRIMARY_STAT_POOLS, AFFIX_POOLS, MATERIALS, RECIPES,
    normalizeCraftingState, getItemQuantity, getRecipeQuantity, isRecipeKnown, getProjectedInventorySlots,
    canCraft, createInstanceId, generateCraftedEquipment, craftEquipment, formatStat
  });
}));
