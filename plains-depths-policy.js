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
    wanderingBlackKnight: Object.freeze({ id: 'wanderingBlackKnight', name: '流浪黑騎士', maxHp: 280, attack: 25, defense: 22, evasion: 4, parry: 18, damageReduction: 12, artClass: 'plains-depths-wandering-black-knight-art', xp: 26, gold: 20, isElite: true, lootPending: true }),
    blackstoneLeader: Object.freeze({ id: 'blackstoneLeader', name: '黑石頭目', maxHp: 850, attack: 29, defense: 27, evasion: 5, parry: 20, damageReduction: 15, artClass: 'plains-depths-blackstone-leader-art', xp: 110, gold: 72, isBoss: true, lootPending: true })
  });

  const MONSTER_POOL = Object.freeze({
    normal: Object.freeze(['highlandWolf', 'rockbackBoar', 'blackstoneScout', 'grasslandVulture']),
    elite: Object.freeze(['blackstoneRaider', 'wanderingBlackKnight']),
    boss: Object.freeze(['blackstoneLeader'])
  });

  const MAP_ID = 'plains-depths';
  const BLACKSTONE_TIERS = Object.freeze({ blackstoneScout: .05, blackstoneRaider: .10, blackstoneLeader: .15 });
  const WOLF_EVASION_BONUS = 10;
  const BOAR_DAMAGE_REDUCTION_BONUS = 5;
  const VULTURE_EVASION_BONUS = 10;
  const IRRITABLE_HP_THRESHOLD = .40;
  const IRRITABLE_BONUS = .15;
  const ACTIVE_SKILL_CHANCE = .30;
  const KNIGHT_HEAL_CHANCE = .25;
  const KNIGHT_HEAL_RATIO = .10;
  const DIVE_DAMAGE_MULTIPLIER = 2;
  const SMASH_DAMAGE_MULTIPLIER = 1.5;
  const COUNTER_DAMAGE_MULTIPLIER = .5;
  const ROAR_ATTACK_BONUS = .10;
  const ROAR_DURATION_MS = 5000;
  const BLEED_DURATION_MS = 5000;
  const BLEED_TICK_MS = 1000;
  const CHARGE_STUN_MS = 2000;

  function isBlackstone(monsterId) { return Object.hasOwn(BLACKSTONE_TIERS, monsterId); }

  function applyPlainsDepthsPassive(monster = {}, mapId = '') {
    if (mapId !== MAP_ID) return monster;
    if (monster.id === 'highlandWolf') return { ...monster, evasion: Math.min(100, (Number(monster.evasion) || 0) + WOLF_EVASION_BONUS), passiveSkill: '狼群敏捷' };
    if (monster.id === 'rockbackBoar') return { ...monster, damageReduction: Math.min(95, (Number(monster.damageReduction) || 0) + BOAR_DAMAGE_REDUCTION_BONUS), passiveSkill: '厚皮' };
    if (monster.id === 'grasslandVulture') return { ...monster, evasion: Math.min(100, (Number(monster.evasion) || 0) + VULTURE_EVASION_BONUS), passiveSkill: '高空本能' };
    if (monster.id === 'wanderingBlackKnight') return { ...monster, passiveSkill: '招架反擊' };
    return monster;
  }

  function getBlackstoneAuraBonus(aliveMonsterIds = []) {
    return Math.round(aliveMonsterIds.reduce((total, id) => total + (BLACKSTONE_TIERS[id] || 0), 0) * 100) / 100;
  }

  function applyBlackstoneAura(monster = {}, aliveMonsterIds = [], roarActive = false) {
    if (!isBlackstone(monster.id)) return monster;
    const auraBonus = getBlackstoneAuraBonus(aliveMonsterIds);
    return {
      ...monster,
      attack: (Number(monster.attack) || 0) * (1 + auraBonus + (roarActive ? ROAR_ATTACK_BONUS : 0)),
      defense: (Number(monster.defense) || 0) * (1 + auraBonus),
      blackstoneAuraBonus: auraBonus,
      blackstoneRoarActive: Boolean(roarActive)
    };
  }

  function isIrritableActive(monsterId, currentHp, maxHp) {
    return monsterId === 'rockbackBoar' && Number(maxHp) > 0 && Math.max(0, Number(currentHp) || 0) / Number(maxHp) < IRRITABLE_HP_THRESHOLD;
  }

  function getIrritableMultiplier(monsterId, currentHp, maxHp) { return isIrritableActive(monsterId, currentHp, maxHp) ? 1 + IRRITABLE_BONUS : 1; }

  function resolveActiveSkill(monsterId, randomValue, canHeal = false) {
    const roll = Math.max(0, Math.min(.999999, Number(randomValue) || 0));
    if (monsterId === 'wanderingBlackKnight') return canHeal && roll < KNIGHT_HEAL_CHANCE ? 'heal' : 'attack';
    if (monsterId === 'blackstoneLeader') return roll < .20 ? 'roar' : roll < .20 + ACTIVE_SKILL_CHANCE ? 'smash' : 'attack';
    if (roll >= ACTIVE_SKILL_CHANCE) return 'attack';
    return ({ highlandWolf: 'rend', rockbackBoar: 'charge', grasslandVulture: 'dive', blackstoneRaider: 'smash' })[monsterId] || 'attack';
  }

  function getActiveDamageMultiplier(action) {
    if (action === 'dive') return DIVE_DAMAGE_MULTIPLIER;
    if (action === 'smash') return SMASH_DAMAGE_MULTIPLIER;
    return 1;
  }

  return {
    MONSTER_TYPES, MONSTER_POOL, MAP_ID, BLACKSTONE_TIERS,
    WOLF_EVASION_BONUS, BOAR_DAMAGE_REDUCTION_BONUS, VULTURE_EVASION_BONUS,
    IRRITABLE_HP_THRESHOLD, IRRITABLE_BONUS, ACTIVE_SKILL_CHANCE,
    KNIGHT_HEAL_CHANCE, KNIGHT_HEAL_RATIO, DIVE_DAMAGE_MULTIPLIER,
    SMASH_DAMAGE_MULTIPLIER, COUNTER_DAMAGE_MULTIPLIER, ROAR_ATTACK_BONUS,
    ROAR_DURATION_MS, BLEED_DURATION_MS, BLEED_TICK_MS, CHARGE_STUN_MS,
    isBlackstone, applyPlainsDepthsPassive, getBlackstoneAuraBonus,
    applyBlackstoneAura, isIrritableActive, getIrritableMultiplier,
    resolveActiveSkill, getActiveDamageMultiplier
  };
}));
