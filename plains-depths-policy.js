(function attachPlainsDepthsPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PlainsDepthsPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createPlainsDepthsPolicy() {
  const MONSTER_TYPES = Object.freeze({
    highlandWolf: Object.freeze({ id: 'highlandWolf', name: '高地野狼', maxHp: 90, attack: 14, defense: 6, evasion: 10, parry: 0, damageReduction: 2, artClass: 'plains-depths-highland-wolf-art', xp: 10, gold: 5, lootPending: true }),
    rockbackBoar: Object.freeze({ id: 'rockbackBoar', name: '岩背野豬', maxHp: 115, attack: 16, defense: 12, evasion: 2, parry: 0, damageReduction: 8, artClass: 'plains-depths-rockback-boar-art', xp: 10, gold: 6, lootPending: true }),
    blackstoneScout: Object.freeze({ id: 'blackstoneScout', name: '黑石斥侯', maxHp: 95, attack: 17, defense: 8, evasion: 7, parry: 8, damageReduction: 3, artClass: 'plains-depths-blackstone-scout-art', xp: 10, gold: 7, lootPending: true }),
    grasslandVulture: Object.freeze({ id: 'grasslandVulture', name: '草原禿鷹', maxHp: 78, attack: 18, defense: 4, evasion: 14, parry: 0, damageReduction: 1, artClass: 'plains-depths-grassland-vulture-art', xp: 10, gold: 7, lootPending: true }),
    blackstoneRaider: Object.freeze({ id: 'blackstoneRaider', name: '黑石掠奪者', maxHp: 230, attack: 23, defense: 16, evasion: 5, parry: 15, damageReduction: 8, artClass: 'plains-depths-blackstone-raider-art', xp: 26, gold: 16, isElite: true, lootPending: true }),
    wanderingBlackKnight: Object.freeze({ id: 'wanderingBlackKnight', name: '流浪黑騎士', maxHp: 280, attack: 25, defense: 22, evasion: 4, parry: 18, damageReduction: 12, artClass: 'monster-placeholder-art', xp: 26, gold: 20, isElite: true, lootPending: true }),
    blackstoneLeader: Object.freeze({ id: 'blackstoneLeader', name: '黑石頭目', maxHp: 850, attack: 29, defense: 27, evasion: 5, parry: 20, damageReduction: 15, artClass: 'plains-depths-blackstone-leader-art', xp: 110, gold: 72, isBoss: true, lootPending: true })
  });

  const MONSTER_POOL = Object.freeze({
    normal: Object.freeze(['highlandWolf', 'rockbackBoar', 'blackstoneScout', 'grasslandVulture']),
    elite: Object.freeze(['blackstoneRaider', 'wanderingBlackKnight']),
    boss: Object.freeze(['blackstoneLeader'])
  });

  return { MONSTER_TYPES, MONSTER_POOL };
}));
