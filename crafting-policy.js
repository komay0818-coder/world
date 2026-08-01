(function attachCraftingPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CraftingPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCraftingPolicy() {
  const RARITIES = Object.freeze({
    uncommon: Object.freeze({ id: 'uncommon', label: '綠色', affixCount: 1, workshopLevel: 1, stoneId: 'equipment-stone-uncommon', primaryMultiplier: 1, affixMultiplier: 1 }),
    rare: Object.freeze({ id: 'rare', label: '藍色', affixCount: 2, workshopLevel: 2, stoneId: 'equipment-stone-rare', primaryMultiplier: 1.35, affixMultiplier: 1.25 }),
    epic: Object.freeze({ id: 'epic', label: '紫色', affixCount: 3, workshopLevel: 3, stoneId: 'equipment-stone-epic', primaryMultiplier: 1.75, affixMultiplier: 1.55 })
  });

  const STAT_DEFINITIONS = Object.freeze({
    attackFlat: { label: '攻擊力', min: 4, max: 8, unit: '' },
    criticalChance: { label: '爆擊率', min: 2, max: 5, unit: '%' },
    criticalDamage: { label: '爆擊傷害', min: 6, max: 12, unit: '%' },
    attackSpeed: { label: '攻擊速度', min: 2, max: 5, unit: '%' },
    skillDamage: { label: '技能傷害', min: 3, max: 7, unit: '%' },
    defenseFlat: { label: '防禦', min: 4, max: 9, unit: '' },
    maxHp: { label: '最大生命', min: 18, max: 40, unit: '' },
    damageReduction: { label: '傷害減免', min: 2, max: 5, unit: '%' },
    blockChance: { label: '格擋率', min: 2, max: 5, unit: '%' },
    controlResistance: { label: '控場抗性', min: 3, max: 8, unit: '%' },
    dodgeChance: { label: '閃避率', min: 2, max: 5, unit: '%' },
    cooldownRecovery: { label: '冷卻速度', min: 2, max: 6, unit: '%' },
    hpRegeneration: { label: '生命恢復', min: 2, max: 6, unit: '' },
    manaRegeneration: { label: '魔力恢復', min: 2, max: 6, unit: '' },
    itemFind: { label: '掉寶率', min: 2, max: 6, unit: '%' },
    goldFind: { label: '金幣獲得率', min: 3, max: 8, unit: '%' }
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

  const MATERIALS = Object.freeze({
    craftCloth: Object.freeze({ id: 'craft-cloth', kind: 'material', icon: '▧', name: '工坊織料', description: '製作共用防具的測試材料。' }),
    craftMetal: Object.freeze({ id: 'craft-metal', kind: 'material', icon: '◆', name: '工坊合金', description: '製作共用防具的測試材料。' }),
    uncommonStone: Object.freeze({ id: 'equipment-stone-uncommon', kind: 'material', icon: '◆', name: '綠色裝備石', description: '製作綠色裝備。' }),
    rareStone: Object.freeze({ id: 'equipment-stone-rare', kind: 'material', icon: '◆', name: '藍色裝備石', description: '製作藍色裝備。' }),
    epicStone: Object.freeze({ id: 'equipment-stone-epic', kind: 'material', icon: '◆', name: '紫色裝備石', description: '製作紫色裝備。' })
  });

  const RECIPES = Object.freeze({
    'test-wrist-uncommon': Object.freeze({ id: 'test-wrist-uncommon', equipmentId: 'workshop-wrist', name: '探索者護腕', equipmentSlot: 'wrist', rarity: 'uncommon', materials: Object.freeze({ 'craft-cloth': 2, 'craft-metal': 1, 'equipment-stone-uncommon': 1 }) }),
    'test-shoulders-rare': Object.freeze({ id: 'test-shoulders-rare', equipmentId: 'workshop-shoulders', name: '守望者肩甲', equipmentSlot: 'shoulders', rarity: 'rare', materials: Object.freeze({ 'craft-cloth': 3, 'craft-metal': 3, 'equipment-stone-rare': 1 }) }),
    'test-cloak-epic': Object.freeze({ id: 'test-cloak-epic', equipmentId: 'workshop-cloak', name: '遠行者斗篷', equipmentSlot: 'cloak', rarity: 'epic', materials: Object.freeze({ 'craft-cloth': 6, 'craft-metal': 2, 'equipment-stone-epic': 1 }) })
  });

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
    return { version: 1, ...source, recipes: source.recipes && typeof source.recipes === 'object' ? { ...source.recipes } : {} };
  }
  function isRecipeKnown(state, recipeId) { return Boolean(normalizeCraftingState(state).recipes[recipeId]); }
  function canCraft(progress, recipeId, workshopLevel = 1) {
    const recipe = RECIPES[recipeId];
    if (!recipe) return { ok: false, reason: '找不到配方。' };
    if (!isRecipeKnown(progress?.crafting, recipeId)) return { ok: false, reason: '尚未取得配方。' };
    const rarity = RARITIES[recipe.rarity];
    if ((Number(workshopLevel) || 1) < rarity.workshopLevel) return { ok: false, reason: `工坊需要 Lv${rarity.workshopLevel}。` };
    const inventory = Array.isArray(progress?.inventory) ? progress.inventory : [];
    const missing = Object.entries(recipe.materials).find(([id, amount]) => inventory.filter((item) => item.id === id).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) < amount);
    return missing ? { ok: false, reason: `材料不足：${MATERIALS[Object.keys(MATERIALS).find((key) => MATERIALS[key].id === missing[0])]?.name || missing[0]}。` } : { ok: true };
  }
  function generateCraftedEquipment(recipeId, options = {}) {
    const recipe = RECIPES[recipeId];
    if (!recipe) return null;
    const rarity = RARITIES[recipe.rarity];
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const primaryStat = rollStat(pick(PRIMARY_STAT_POOLS[recipe.equipmentSlot], random), rarity.primaryMultiplier, random);
    const candidates = AFFIX_POOLS[recipe.equipmentSlot].filter((stat) => stat !== primaryStat.stat);
    const affixes = [];
    while (affixes.length < rarity.affixCount && candidates.length) {
      const selected = pick(candidates, random);
      candidates.splice(candidates.indexOf(selected), 1);
      affixes.push({ id: `crafted-${selected}`, ...rollStat(selected, rarity.affixMultiplier, random) });
    }
    const instanceId = options.instanceId || createInstanceId(options.craftedAt, random);
    return {
      id: instanceId, instanceId, equipmentId: recipe.equipmentId, templateId: recipe.equipmentId,
      kind: 'equipment', name: recipe.name, slot: recipe.equipmentSlot, equipmentSlot: recipe.equipmentSlot,
      quality: recipe.rarity, rarity: recipe.rarity, sourceType: 'crafted', recipeId,
      primaryStat, affixes, sockets: 0, craftedAt: options.craftedAt || Date.now(), allowedJobs: []
    };
  }
  function deductMaterials(inventory, costs) {
    Object.entries(costs).forEach(([id, amount]) => {
      let remaining = amount;
      inventory.filter((item) => item.id === id).forEach((item) => {
        const used = Math.min(remaining, Number(item.quantity) || 0);
        item.quantity -= used; remaining -= used;
      });
    });
    return inventory.filter((item) => item.kind === 'equipment' || (Number(item.quantity) || 0) > 0);
  }
  function craftEquipment(progress, recipeId, options = {}) {
    const eligibility = canCraft(progress, recipeId, options.workshopLevel);
    if (!eligibility.ok) return eligibility;
    const item = generateCraftedEquipment(recipeId, options);
    if (!item) return { ok: false, reason: '裝備生成失敗。' };
    const existingIds = new Set([...(progress.inventory || []), ...Object.values(progress.equipment || {})].filter(Boolean).map((entry) => entry.instanceId || entry.id));
    if (existingIds.has(item.instanceId)) return { ok: false, reason: '裝備實例編號重複，請重新製作。' };
    progress.inventory = deductMaterials(progress.inventory, RECIPES[recipeId].materials);
    progress.inventory.push(item);
    return { ok: true, item };
  }
  function formatStat(entry) { return entry ? `${entry.label || STAT_DEFINITIONS[entry.stat]?.label || entry.stat} +${entry.value}${entry.unit || ''}` : ''; }

  return Object.freeze({ RARITIES, STAT_DEFINITIONS, PRIMARY_STAT_POOLS, AFFIX_POOLS, MATERIALS, RECIPES, normalizeCraftingState, isRecipeKnown, canCraft, createInstanceId, generateCraftedEquipment, craftEquipment, formatStat });
}));
