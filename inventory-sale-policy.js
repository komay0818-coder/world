(function attachInventorySalePolicy(root, factory) {
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./item-rarity-policy') : root.ItemRarityPolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InventorySalePolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createInventorySalePolicy(ItemRarity) {
  const QUALITY_SELL_PRICES = Object.freeze({ common: 10, uncommon: 25, rare: 60, epic: 150 });
  const MATERIAL_SELL_PRICES = Object.freeze({ common: 2, uncommon: 5, rare: 10, epic: 25 });
  const copy = (value) => JSON.parse(JSON.stringify(value));

  function normalizeQuality(item) {
    const value = String(item?.rarity || item?.quality || '').toLowerCase();
    if (['epic', 'purple', '紫', '紫色', '史詩'].includes(value)) return 'epic';
    if (['rare', 'blue', '藍', '藍色', '稀有'].includes(value)) return 'rare';
    if (['uncommon', 'green', '綠', '綠色', '優良'].includes(value)) return 'uncommon';
    return 'common';
  }

  function getJunkReasons(item, context = {}) {
    if (!item || item.kind !== 'equipment') return [];
    const reasons = [];
    if (item.durability !== undefined && Number(item.durability) <= 0) reasons.push('damaged');
    if ((Number(item.requiredLevel) || 0) > (Number(context.level) || 1)) reasons.push('level');
    if (context.canEquip === false) reasons.push('job');
    if (item.isJunk === true) reasons.push('marked');
    return reasons;
  }

  function isJunkCandidate(item, context = {}) { return getJunkReasons(item, context).length > 0; }

  function isCommonEquipment(item) {
    return item?.kind === 'equipment' && normalizeQuality(item) === 'common';
  }

  function getSellPrice(item) {
    if (!item || item.kind !== 'equipment') return 0;
    const base = QUALITY_SELL_PRICES[normalizeQuality(item)] || QUALITY_SELL_PRICES.common;
    return Math.max(1, base);
  }

  function summarizeSelection(inventory, selectedIds, contextFactory = () => ({})) {
    const selected = (Array.isArray(inventory) ? inventory : []).filter((item) => item?.kind === 'equipment' && selectedIds?.has(item.id));
    return {
      count: selected.length,
      gold: selected.reduce((total, item) => total + getSellPrice(item), 0),
      containsJunkCandidate: selected.some((item) => isJunkCandidate(item, contextFactory(item))),
      items: selected
    };
  }

  function sellSelection(progress, selectedIds) {
    if (!progress || !Array.isArray(progress.inventory)) return { ok: false, count: 0, gold: 0 };
    const summary = summarizeSelection(progress.inventory, selectedIds);
    if (!summary.count) return { ok: false, ...summary };
    const soldIds = new Set(summary.items.map((item) => item.id));
    progress.inventory = progress.inventory.filter((item) => !soldIds.has(item.id));
    progress.gold = Math.max(0, Number(progress.gold) || 0) + summary.gold;
    return { ok: true, ...summary };
  }

  function isProtected(item) {
    return Boolean(item?.locked || item?.isLocked || item?.protected || item?.isProtected || item?.favorite || item?.isFavorite);
  }

  const STARTER_GIFT_ID = /^starter-(warrior|assassin|hunter|mage|priest)-(weapon-0|armor-1)$/;
  function isStarterGiftEquipment(item) {
    if (!item || item.kind !== 'equipment' || typeof item.instanceId !== 'string') return false;
    const match = String(item.legacyItemId || '').match(STARTER_GIFT_ID);
    if (!match) return false;
    return (match[2] === 'weapon-0' && item.slot === 'weapon') || (match[2] === 'armor-1' && item.slot === 'armor');
  }

  function normalizeDiscardInstanceId(instanceId) {
    const value = String(instanceId || '');
    if (!value || !/^equipment-[A-Za-z0-9:_-]+$/.test(value)) throw Error('Valid equipment instance required');
    return value;
  }

  function applyStarterGiftDiscard(model, instanceId, PermanentPolicy) {
    if (!model || !PermanentPolicy) throw Error('Permanent discard policy unavailable');
    const id = normalizeDiscardInstanceId(instanceId), next = copy(model);
    const owner = next.equipmentOwners?.[id];
    if (owner && owner.kind !== 'bag') throw Error('Equipped equipment must be unequipped before discard');
    const matches = next.bag.items.filter((item) => item?.kind === 'equipment' && item.instanceId === id);
    if (matches.length !== 1) throw Error(matches.length ? 'Ambiguous equipment instance' : 'Equipment is missing or already discarded');
    const item = matches[0];
    if (!owner || owner.kind !== 'bag') throw Error('Equipped equipment must be unequipped before discard');
    if (isProtected(item)) throw Error('Protected equipment cannot be discarded');
    if (!isStarterGiftEquipment(item)) throw Error('Only initial gifted equipment can be discarded');
    next.bag.items = next.bag.items.filter((entry) => entry !== item);
    delete next.equipmentOwners[id];
    PermanentPolicy.validate(next);
    return { model: next, discarded: { instanceId: id, legacyItemId: item.legacyItemId, slot: item.slot } };
  }

  function strictEquipmentQuality(item) {
    const raw = String(item?.rarity || item?.quality || '').trim().toLowerCase();
    const known = new Set(['common', 'white', '白', '白色', '普通', 'uncommon', 'green', '綠', '綠色', '優良', 'rare', 'blue', '藍', '藍色', '稀有', 'epic', 'purple', '紫', '紫色', '史詩']);
    if (!raw || !known.has(raw)) throw Error('Equipment sale requires a recognized quality');
    return normalizeQuality(item);
  }

  function normalizeSaleSelections(selections) {
    if (!Array.isArray(selections) || !selections.length) throw Error('Sale selection required');
    const seen = new Set();
    return selections.map((selection) => {
      if (!selection || !['equipment', 'material'].includes(selection.kind)) throw Error('Unsupported sale selection');
      if (selection.kind === 'equipment') {
        const instanceId = String(selection.instanceId || '');
        if (!instanceId || (selection.quantity !== undefined && selection.quantity !== 1)) throw Error('Equipment sale requires one instance');
        const key = 'equipment:' + instanceId;if (seen.has(key)) throw Error('Duplicate sale selection');seen.add(key);
        return { kind: 'equipment', instanceId };
      }
      const itemId = String(selection.itemId || ''), quantity = selection.quantity;
      if (!itemId || !Number.isSafeInteger(quantity) || quantity <= 0) throw Error('Material sale requires a positive quantity');
      const canonicalId = ItemRarity?.canonicalId?.(itemId) || itemId, key = 'material:' + canonicalId;
      if (seen.has(key)) throw Error('Duplicate sale selection');seen.add(key);
      return { kind: 'material', itemId: canonicalId, quantity };
    });
  }

  function applyAccountSaleOwned(model, selections, PermanentPolicy) {
    if (!model || !PermanentPolicy) throw Error('Permanent sale policy unavailable');
    const requested = normalizeSaleSelections(selections), next = model, sold = [];
    let proceeds = 0, equipmentCount = 0, materialQuantity = 0;
    for (const selection of requested) {
      if (selection.kind === 'equipment') {
        const matches = next.bag.items.filter((item) => item?.kind === 'equipment' && item.instanceId === selection.instanceId);
        if (matches.length !== 1) throw Error(matches.length ? 'Ambiguous equipment instance' : 'Equipment is missing or already sold');
        const item = matches[0], owner = next.equipmentOwners?.[selection.instanceId];
        if (!owner || owner.kind !== 'bag') throw Error('Equipped equipment cannot be sold');
        if (isProtected(item)) throw Error('Protected equipment cannot be sold');
        const rarity = strictEquipmentQuality(item), price = QUALITY_SELL_PRICES[rarity];
        proceeds += price;if (!Number.isSafeInteger(proceeds)) throw Error('Sale proceeds exceed safe range');
        next.bag.items = next.bag.items.filter((entry) => entry !== item);delete next.equipmentOwners[selection.instanceId];
        sold.push({ kind: 'equipment', instanceId: selection.instanceId, quantity: 1, rarity, unitPrice: price, subtotal: price });equipmentCount++;
        continue;
      }
      const classification = ItemRarity?.classifyForSale?.(selection.itemId);
      if (!classification?.sellable || classification.saleGroup !== 'material') throw Error('Item is not eligible for sale: ' + (classification?.code || 'catalog-unavailable'));
      const candidates = next.bag.items.filter((item) => item?.kind === 'material' && ItemRarity.canonicalId(item) === selection.itemId);
      if (!candidates.length) throw Error('Material is missing or already sold');
      if (candidates.some(isProtected)) throw Error('Protected material cannot be sold');
      const available = candidates.reduce((sum, item) => {
        if (!Number.isSafeInteger(item.quantity) || item.quantity < 0) throw Error('Invalid material quantity');
        return sum + item.quantity;
      }, 0);
      if (!Number.isSafeInteger(available) || available < selection.quantity) throw Error('Insufficient material quantity');
      let remaining = selection.quantity;
      next.bag.items = next.bag.items.filter((item) => {
        if (remaining <= 0 || item?.kind !== 'material' || ItemRarity.canonicalId(item) !== selection.itemId) return true;
        const consumed = Math.min(item.quantity, remaining);item.quantity -= consumed;remaining -= consumed;return item.quantity > 0;
      });
      const price = MATERIAL_SELL_PRICES[classification.rarity];if (!price) throw Error('Unsupported material rarity');
      const subtotal = price * selection.quantity;if (!Number.isSafeInteger(subtotal)) throw Error('Sale proceeds exceed safe range');
      proceeds += subtotal;if (!Number.isSafeInteger(proceeds)) throw Error('Sale proceeds exceed safe range');
      sold.push({ kind: 'material', itemId: selection.itemId, quantity: selection.quantity, rarity: classification.rarity, unitPrice: price, subtotal });materialQuantity += selection.quantity;
    }
    if (!proceeds) throw Error('Sale has no eligible proceeds');
    const gold = PermanentPolicy.applySharedGoldTransactionOwned(next, { type: 'credit', amount: proceeds }, { validateModel: false });
    PermanentPolicy.validate(gold.model);
    return { model: gold.model, sold, proceeds, before: gold.before, after: gold.after, selectionCount: sold.length, equipmentCount, materialQuantity };
  }

  function applyAccountSale(model, selections, PermanentPolicy) {
    return applyAccountSaleOwned(copy(model), selections, PermanentPolicy);
  }

  return Object.freeze({ QUALITY_SELL_PRICES, MATERIAL_SELL_PRICES, normalizeQuality, isProtected, isStarterGiftEquipment, normalizeDiscardInstanceId, applyStarterGiftDiscard, getJunkReasons, isJunkCandidate, isCommonEquipment, getSellPrice, summarizeSelection, sellSelection, normalizeSaleSelections, applyAccountSale, applyAccountSaleOwned });
}));
