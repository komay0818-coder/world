(function attachEquipmentPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EquipmentPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEquipmentPolicy() {
  function isRecruitEquipment(item) {
    return Boolean(item && item.kind === 'equipment' && String(item.id || '').startsWith('starter-'));
  }

  function removeLegacyEquipmentFromInventory(inventory) {
    return (Array.isArray(inventory) ? inventory : []).filter((item) => item?.kind !== 'equipment' || isRecruitEquipment(item));
  }

  return { isRecruitEquipment, removeLegacyEquipmentFromInventory };
}));
