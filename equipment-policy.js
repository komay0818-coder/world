(function attachEquipmentPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EquipmentPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEquipmentPolicy() {
  const WEAPON_CATALOG = Object.freeze({
    shortIronSword: Object.freeze({
      id: 'short-iron-sword',
      kind: 'equipment',
      series: '單手劍',
      name: '短鐵劍',
      slot: 'weapon',
      weaponType: 'one-handed-sword',
      image: 'assets/goblin-short-sword.png',
      attackMin: 8,
      attackMax: 11,
      attack: 10,
      attackSpeed: 1.40,
      allowedJobs: ['warrior'],
      quality: '普通'
    }),
    knightLongsword: Object.freeze({
      id: 'knight-longsword',
      kind: 'equipment',
      series: '單手劍',
      name: '騎士長劍',
      slot: 'weapon',
      weaponType: 'one-handed-sword',
      image: 'assets/goblin-short-sword.png',
      attackMin: 10,
      attackMax: 14,
      attack: 12,
      attackSpeed: 1.20,
      allowedJobs: ['warrior'],
      quality: '普通'
    }),
    mercenaryGreatsword: Object.freeze({
      id: 'mercenary-greatsword',
      kind: 'equipment',
      series: '雙手劍',
      name: '傭兵大劍',
      slot: 'weapon',
      weaponType: 'two-handed-sword',
      image: 'assets/equipment-weapon.png',
      attackMin: 18,
      attackMax: 24,
      attack: 21,
      attackSpeed: .80,
      allowedJobs: ['warrior'],
      quality: '普通'
    }),
    giantIronSword: Object.freeze({
      id: 'giant-iron-sword',
      kind: 'equipment',
      series: '雙手劍',
      name: '巨鐵劍',
      slot: 'weapon',
      weaponType: 'two-handed-sword',
      image: 'assets/equipment-weapon.png',
      attackMin: 21,
      attackMax: 28,
      attack: 25,
      attackSpeed: .65,
      allowedJobs: ['warrior'],
      quality: '普通'
    })
  });

  function isRecruitEquipment(item) {
    return Boolean(item && item.kind === 'equipment' && String(item.id || '').startsWith('starter-'));
  }

  function removeLegacyEquipmentFromInventory(inventory) {
    return (Array.isArray(inventory) ? inventory : []).filter((item) => item?.kind !== 'equipment' || isRecruitEquipment(item));
  }

  function rollWeaponAttack(item, randomValue = Math.random()) {
    if (!item || !Number.isFinite(Number(item.attackMin)) || !Number.isFinite(Number(item.attackMax))) return null;
    const minimum = Math.floor(Math.min(Number(item.attackMin), Number(item.attackMax)));
    const maximum = Math.floor(Math.max(Number(item.attackMin), Number(item.attackMax)));
    const roll = Math.min(.999999, Math.max(0, Number(randomValue) || 0));
    return minimum + Math.floor(roll * (maximum - minimum + 1));
  }

  function getAttacksPerSecond(item, fallback = 1) {
    const weaponSpeed = Number(item?.attackSpeed);
    return weaponSpeed > 0 ? weaponSpeed : Math.max(.01, Number(fallback) || 1);
  }

  return { WEAPON_CATALOG, isRecruitEquipment, removeLegacyEquipmentFromInventory, rollWeaponAttack, getAttacksPerSecond };
}));
