// GENERATED from online survival/monster handlers.
(function(root){function create(env){
const {module,globalThis,Date,Math,setTimeout,clearTimeout,battle,getProgress,getActiveMap,getEnemyDefinition,
getCharacterStats,getOnlineFacilityEffects,getPlaytestHpFloor,getBlackForestDepthsCombatContext,
aliveMonsterIndexesByAge,getWoundedEnemyIndexes,isPlayerBleeding,emitLateChapterSkill,
logBattle,logPartyDebug,playMonsterAttackAnimation,playPartyMemberHitAnimation,updateBattleUI,
removePotionItem,saveProgress,usePotion,useSharedHealingPotionForMember,syncLegacyBattleStateFromMain,
syncMainBattleMemberFromLegacy,endBattleAfterPlayerDefeat,resetPartyAfterDefeat,rebuildBattlePartyMembers,
isTimedChapterThreeVisualShowcase,isMonsterRotationPreview,battleScreen,ChapterTwoBalancePlaytestPolicy,
getEnemySkillState,getPlayerAttackProfile,applyDamageToMonster,ensureHunterCompanions,
resolveEnemyDirectHitRecovery,applyPendingRoguePlagueSpread,CombatCorePolicy,MonsterDefense,ChapterOneLevelPolicy,PartyPolicy,ClassSkillPolicy,
ControlEffectPolicy,RunePolicy,ChapterThreeCraftedEpicAbilityPolicy,ChapterThreeSpecialEquipmentPolicy,
ChapterThreeEpicWeaponPolicy,ChapterTwoSpecialEquipmentPolicy,WarriorAdvancementPolicy,RogueAdvancementPolicy,
HunterAdvancementPolicy,MageAdvancementPolicy,PriestAdvancementPolicy,WarriorResourcePolicy}=env;
const getBattleProgress=getProgress;
const PARTY_REVIVE_DELAY_MS=10000,PARTY_REVIVE_HEALTH_RATIO=.30,PARTY_AUTO_POTION_HEALTH_RATIO=.35;
(function attachWolfDenPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WolfDenPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createWolfDenPolicy() {
  const WOLF_TYPES = Object.freeze(['plainsWolfPup', 'denForestWolf', 'ragingWolf', 'greatfangWolf']);
  const EVASION_BONUS = 10;
  const BOSS_BLEED_CHANCE = .30;
  const BOSS_BLOOD_FRENZY_BONUS = .20;
  const BLEED_DURATION_MS = 5000;
  const BLEED_TICK_MS = 1000;

  function applyWolfDenPassive(monster = {}, mapId = '') {
    if (mapId !== 'wolf-den' || !WOLF_TYPES.includes(monster.id)) return monster;
    return { ...monster, evasion: Math.min(100, (Number(monster.evasion) || 0) + EVASION_BONUS), passiveEvasion: true };
  }

  function shouldInflictBleed(monsterId, randomValue) {
    return monsterId === 'greatfangWolf' && Number(randomValue) < BOSS_BLEED_CHANCE;
  }

  function getBloodFrenzyMultiplier(monsterId, targetIsBleeding) {
    return monsterId === 'greatfangWolf' && targetIsBleeding ? 1 + BOSS_BLOOD_FRENZY_BONUS : 1;
  }

  return {
    WOLF_TYPES,
    EVASION_BONUS,
    BOSS_BLEED_CHANCE,
    BOSS_BLOOD_FRENZY_BONUS,
    BLEED_DURATION_MS,
    BLEED_TICK_MS,
    applyWolfDenPassive,
    shouldInflictBleed,
    getBloodFrenzyMultiplier
  };
}));

(function attachBoarWoodsPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BoarWoodsPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createBoarWoodsPolicy() {
  const BOAR_TYPES = Object.freeze(['boarPiglet', 'forestBoar', 'irritableBoar', 'boarKing']);
  const THICK_HIDE_DAMAGE_REDUCTION_BONUS = 5;
  const IRRITABLE_TYPES = Object.freeze(['irritableBoar', 'boarKing']);
  const IRRITABLE_HP_THRESHOLD = .40;
  const IRRITABLE_BONUS = .15;
  const BOSS_CHARGE_CHANCE = .30;
  const BOSS_CHARGE_STUN_MS = 2000;

  function applyBoarWoodsPassive(monster = {}, mapId = '') {
    if (mapId !== 'boar-woods' || !BOAR_TYPES.includes(monster.id)) return monster;
    return {
      ...monster,
      damageReduction: Math.min(95, Math.max(0, Number(monster.damageReduction) || 0) + THICK_HIDE_DAMAGE_REDUCTION_BONUS),
      passiveDamageReduction: true
    };
  }

  function isIrritableActive(monsterId, currentHp, maxHp) {
    const safeMaxHp = Math.max(0, Number(maxHp) || 0);
    if (!IRRITABLE_TYPES.includes(monsterId) || safeMaxHp === 0) return false;
    return Math.max(0, Number(currentHp) || 0) / safeMaxHp < IRRITABLE_HP_THRESHOLD;
  }

  function getIrritableMultiplier(monsterId, currentHp, maxHp) {
    return isIrritableActive(monsterId, currentHp, maxHp) ? 1 + IRRITABLE_BONUS : 1;
  }

  function shouldCharge(monsterId, randomValue) {
    return monsterId === 'boarKing' && Number(randomValue) < BOSS_CHARGE_CHANCE;
  }

  return {
    BOAR_TYPES,
    THICK_HIDE_DAMAGE_REDUCTION_BONUS,
    IRRITABLE_TYPES,
    IRRITABLE_HP_THRESHOLD,
    IRRITABLE_BONUS,
    BOSS_CHARGE_CHANCE,
    BOSS_CHARGE_STUN_MS,
    applyBoarWoodsPassive,
    isIrritableActive,
    getIrritableMultiplier,
    shouldCharge
  };
}));

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
    wanderingBlackKnight: Object.freeze({ id: 'wanderingBlackKnight', name: '黑石聖騎士', maxHp: 280, attack: 25, defense: 22, evasion: 4, parry: 18, damageReduction: 12, artClass: 'plains-depths-wandering-black-knight-art', xp: 26, gold: 20, isElite: true, lootPending: true }),
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

(function attachGoblinCampPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GoblinCampPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createGoblinCampPolicy() {
  const STRENGTH_MULTIPLIER = 1.5;
  const SLINGER_STUN_CHANCE = .2;
  const SHAMAN_HEAL_CHANCE = .20;
  const SHAMAN_HEAL_RATIO = .15;
  const SHAMAN_HEAL_COOLDOWN_MS = 10000;
  const HIGH_CHIEF_TOTEM_CHANCE = .25;
  const HIGH_CHIEF_SUMMON_CHANCE = .15;

  function scaleMonster(monster = {}, active = false) {
    if (!active) return monster;
    return {
      ...monster,
      maxHp: Math.max(1, Math.round((Number(monster.maxHp) || 1) * STRENGTH_MULTIPLIER)),
      attack: Math.max(1, Math.round((Number(monster.attack) || 1) * STRENGTH_MULTIPLIER)),
      defense: Math.max(0, Math.round((Number(monster.defense) || 0) * STRENGTH_MULTIPLIER))
    };
  }

  function shouldStun(type, randomValue) {
    return type === 'goblinSlinger' && Number(randomValue) < SLINGER_STUN_CHANCE;
  }

  function resolveAction({ type, randomValue, hasWoundedAlly = false, canHeal = true, canSummon = false }) {
    const roll = Math.min(1, Math.max(0, Number(randomValue) || 0));
    if (type === 'goblinShaman' && hasWoundedAlly && canHeal && roll < SHAMAN_HEAL_CHANCE) return 'heal';
    if (type !== 'goblinHighChief') return 'attack';
    if (hasWoundedAlly && roll < HIGH_CHIEF_TOTEM_CHANCE) return 'healing-totem';
    const summonThreshold = (hasWoundedAlly ? HIGH_CHIEF_TOTEM_CHANCE : 0) + HIGH_CHIEF_SUMMON_CHANCE;
    if (canSummon && roll < summonThreshold) return 'summon-scout';
    return 'attack';
  }

  return {
    STRENGTH_MULTIPLIER,
    SLINGER_STUN_CHANCE,
    SHAMAN_HEAL_CHANCE,
    SHAMAN_HEAL_RATIO,
    SHAMAN_HEAL_COOLDOWN_MS,
    HIGH_CHIEF_TOTEM_CHANCE,
    HIGH_CHIEF_SUMMON_CHANCE,
    scaleMonster,
    shouldStun,
    resolveAction
  };
}));

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackForestEntrancePolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP = Object.freeze({
    id: 'black-forest-entrance',
    chapter: 2,
    order: 1,
    name: '黑森林入口',
    theme: 'corrupted-forest-creatures',
    background: 'assets/black-forest-entrance-background.png',
    enemyPoolId: 'black-forest-entrance-enemies',
    bossId: 'forest-guardian',
    implemented: false,
    contentStatus: 'combat-ready'
  });

  const GROWTH = Object.freeze({ hpPerLevel: .14, attackPerLevel: .09, defensePerLevel: .08, expPerLevel: .11 });
  const BLEED = Object.freeze({ chance: .25, durationMs: 3000, tickMs: 1000, attackRatio: .08 });
  const POISON = Object.freeze({ chance: .30, durationMs: 5000, tickMs: 1000, attackRatio: .06 });
  const CONTROL = Object.freeze({ chargeChance: .20, chargeMultiplier: 1.4, chargeStunMs: 1000, rootChance: .20, rootDurationMs: 4000, rootAttackSpeedPenalty: .20 });
  const ENRAGE = Object.freeze({ hpThreshold: .40, attackBonus: .20, attackSpeedBonus: .15 });
  const HUNTER = Object.freeze({ bindChance: .25, bindMultiplier: 1.2, bindDurationMs: 2000, executeThreshold: .30, executeMultiplier: 1.6 });
  const BINDING_ARROW = Object.freeze({ durationMs: HUNTER.bindDurationMs });
  const GUARDIAN = Object.freeze({ phaseTwoThreshold: .70, phaseThreeThreshold: .35, rootStrikeChance: .25, rootStrikeMultiplier: 1.5, stormChance: .20, stormMultiplier: .60, phaseThreeAttackBonus: .20, phaseThreeAttackSpeedBonus: .15, phaseThreeDefensePenalty: .10 });

  function monster(id, name, rank, role, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      role,
      chapter: 2,
      mapId: MAP.id,
      image: null,
      stats: null,
      dropTableId: 'black-forest-entrance-pending',
      skillIds: Object.freeze([]),
      aiProfileId: null,
      implemented: true,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('black-forest-wolf', '黑森林野狼', 'normal', '快速流血攻擊', { combatId: 'blackForestWolf', level: Object.freeze([15, 16]), image: 'assets/black-forest-wolf.png?v=20260920-entrance-monsters-v3', stats: Object.freeze({ maxHp: 145, attack: 27, defense: 13, evasion: 12, parry: 0, damageReduction: 2, attackSpeed: 1.2, xp: 20, gold: 10 }), skillIds: Object.freeze(['shadow-bite']), aiProfileId: 'fast-bleeder' }),
    monster('corrupted-boar', '腐化野豬', 'normal', '高耐久衝撞怪物', { combatId: 'corruptedBoar', level: Object.freeze([15, 16]), image: 'assets/corrupted-boar.png?v=20260920-entrance-monsters-v3', stats: Object.freeze({ maxHp: 220, attack: 26, defense: 20, evasion: 2, parry: 0, damageReduction: 8, attackSpeed: .8, xp: 23, gold: 12 }), skillIds: Object.freeze(['corrupted-hide', 'irritable', 'charge']), aiProfileId: 'durable-charger' }),
    monster('shadow-spider', '暗影蜘蛛', 'normal', '持續中毒攻擊', { combatId: 'shadowSpider', level: Object.freeze([16, 17]), image: 'assets/shadow-spider.png?v=20260920-entrance-monsters-v3', stats: Object.freeze({ maxHp: 155, attack: 24, defense: 12, evasion: 10, parry: 0, damageReduction: 1, attackSpeed: 1.1, xp: 24, gold: 12 }), skillIds: Object.freeze(['venom-fang']), aiProfileId: 'poison-controller', tags: Object.freeze(['poison']) }),
    monster('withered-tree-walker', '枯木行者', 'normal', '高防禦控制怪物', { combatId: 'witheredTreeWalker', level: Object.freeze([16, 17]), image: 'assets/withered-tree-walker.png?v=20260920-entrance-monsters-v3', stats: Object.freeze({ maxHp: 250, attack: 23, defense: 23, evasion: 0, parry: 0, damageReduction: 10, attackSpeed: .7, xp: 27, gold: 14 }), skillIds: Object.freeze(['bark-armor', 'entangling-roots']), aiProfileId: 'tank-controller' }),
    monster('black-forest-hunter', '黑森林獵人', 'elite', '束縛與處決低生命目標', { combatId: 'blackForestHunter', level: Object.freeze([17, 17]), image: 'assets/black-forest-hunter.png?v=20260920-entrance-monsters-v3', stats: Object.freeze({ maxHp: 620, attack: 34, defense: 18, evasion: 13, parry: 8, damageReduction: 7, attackSpeed: 1.15, xp: 72, gold: 42 }), skillIds: Object.freeze(['binding-arrow', 'execution-arrow']), aiProfileId: 'lowest-health-executioner', visualStyle: 'night-elf' }),
    monster('forest-guardian', '森林守護者', 'boss', '三階段入口守關 Boss', { combatId: 'forestGuardianV2', level: Object.freeze([17, 17]), image: 'assets/forest-guardian.png?v=20260920-entrance-monsters-v3', stats: Object.freeze({ maxHp: 2100, attack: 33, defense: 25, evasion: 4, parry: 6, damageReduction: 12, attackSpeed: .9, xp: 300, gold: 180 }), skillIds: Object.freeze(['root-strike', 'leaf-storm', 'forest-wrath']), aiProfileId: 'three-phase-guardian' })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));

  function getMonster(monsterId) {
    return MONSTER_BY_ID.get(monsterId) || null;
  }

  function getMonstersByRank(rank) {
    return MONSTERS.filter((entry) => entry.rank === rank);
  }

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value) || 0)); }
  function multiplier(level, rate) { return 1 + Math.max(0, Math.floor(Number(level) || 15) - 15) * rate; }
  function rollLevel(monsterId, randomValue = Math.random()) {
    const range = MONSTERS.find((entry) => entry.id === monsterId || entry.combatId === monsterId)?.level;
    if (!range) return null;
    return range[0] + Math.floor(clamp(randomValue, 0, .999999) * (range[1] - range[0] + 1));
  }
  function toCombatMonster(entry, level = null) {
    if (!entry?.stats) return null;
    const resolvedLevel = clamp(level || entry.level[0], entry.level[0], entry.level[1]);
    const stats = entry.stats;
    return {
      id: entry.combatId, policyId: entry.id, name: entry.name, level: resolvedLevel, mapId: MAP.id,
      maxHp: Math.round(stats.maxHp * multiplier(resolvedLevel, GROWTH.hpPerLevel)),
      attack: Math.round(stats.attack * multiplier(resolvedLevel, GROWTH.attackPerLevel)),
      defense: Math.round(stats.defense * multiplier(resolvedLevel, GROWTH.defensePerLevel)),
      xp: Math.round(stats.xp * multiplier(resolvedLevel, GROWTH.expPerLevel)),
      gold: stats.gold, evasion: stats.evasion, parry: stats.parry, damageReduction: stats.damageReduction,
      attackSpeed: stats.attackSpeed, isElite: entry.rank === 'elite', isBoss: entry.rank === 'boss',
      artClass: `monster-image-art ${entry.combatId}`, image: entry.image, skillIds: entry.skillIds
    };
  }
  function getCombatMonster(combatId, level = null) {
    return toCombatMonster(MONSTERS.find((entry) => entry.combatId === combatId), level);
  }
  function getCombatPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.combatId)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.combatId)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.combatId))
    });
  }
  function getPhase(monsterId, currentHp, maxHp) {
    if (monsterId !== 'forestGuardianV2' || !(Number(maxHp) > 0)) return 1;
    const ratio = Math.max(0, Number(currentHp) || 0) / Number(maxHp);
    return ratio <= GUARDIAN.phaseThreeThreshold ? 3 : ratio <= GUARDIAN.phaseTwoThreshold ? 2 : 1;
  }
  function getCombatMultipliers(monsterId, currentHp, maxHp) {
    const ratio = Number(maxHp) > 0 ? Math.max(0, Number(currentHp) || 0) / Number(maxHp) : 1;
    if (monsterId === 'corruptedBoar' && ratio < ENRAGE.hpThreshold) return { attack: 1 + ENRAGE.attackBonus, attackSpeed: 1 + ENRAGE.attackSpeedBonus, defense: 1 };
    if (getPhase(monsterId, currentHp, maxHp) === 3) return { attack: 1 + GUARDIAN.phaseThreeAttackBonus, attackSpeed: 1 + GUARDIAN.phaseThreeAttackSpeedBonus, defense: 1 - GUARDIAN.phaseThreeDefensePenalty };
    return { attack: 1, attackSpeed: 1, defense: 1 };
  }
  function resolveAction(monsterId, randomValue, targetHpRatio = 1, currentHp = 1, maxHp = 1) {
    const roll = clamp(randomValue, 0, .999999);
    if (monsterId === 'blackForestWolf') return roll < BLEED.chance ? 'shadow-bite' : 'attack';
    if (monsterId === 'corruptedBoar') return roll < CONTROL.chargeChance ? 'charge' : 'attack';
    if (monsterId === 'shadowSpider') return roll < POISON.chance ? 'venom-fang' : 'attack';
    if (monsterId === 'witheredTreeWalker') return roll < CONTROL.rootChance ? 'entangling-roots' : 'attack';
    if (monsterId === 'blackForestHunter') {
      if (targetHpRatio < HUNTER.executeThreshold) return 'execution-arrow';
      return roll < HUNTER.bindChance ? 'binding-arrow' : 'attack';
    }
    if (monsterId === 'forestGuardianV2') {
      const phase = getPhase(monsterId, currentHp, maxHp);
      if (phase >= 2 && roll < GUARDIAN.stormChance) return 'leaf-storm';
      if (roll < GUARDIAN.stormChance + GUARDIAN.rootStrikeChance) return 'root-strike';
    }
    return 'attack';
  }
  function getDamageMultiplier(action) {
    return ({ charge: CONTROL.chargeMultiplier, 'binding-arrow': HUNTER.bindMultiplier, 'execution-arrow': HUNTER.executeMultiplier, 'root-strike': GUARDIAN.rootStrikeMultiplier, 'leaf-storm': GUARDIAN.stormMultiplier })[action] || 1;
  }

  function applyBindingArrow(member, now = Date.now()) {
    if (!member || member.alive === false || !(member.currentHp > 0)) return false;
    member.boundUntil = Math.max(0, Number(now) || 0) + BINDING_ARROW.durationMs;
    return true;
  }

  function isBound(member, now = Date.now()) {
    return Boolean(member?.alive !== false && member?.currentHp > 0 && Number(member.boundUntil) > Number(now));
  }

  function clearBinding(member) {
    if (member) member.boundUntil = 0;
    return member;
  }

  return Object.freeze({ MAP, GROWTH, BLEED, POISON, CONTROL, ENRAGE, HUNTER, BINDING_ARROW, GUARDIAN, MONSTERS, getMonster, getMonstersByRank, rollLevel, toCombatMonster, getCombatMonster, getCombatPool, getPhase, getCombatMultipliers, resolveAction, getDamageMultiplier, applyBindingArrow, isBound, clearBinding });
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackForestTrailPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP = Object.freeze({
    id: 'black-forest-trail',
    chapter: 2,
    order: 2,
    level: 17,
    name: '黑森林小徑',
    background: 'assets/black-forest-trail-background.png',
    primaryFaction: 'blackstone-bandits',
    enemyPoolId: 'black-forest-trail-enemies',
    bossId: 'blackstone-centurion',
    implemented: true,
    contentStatus: 'combat-ready'
  });

  const STORY = Object.freeze({
    premise: '黑石山賊已深入黑森林，建立巡邏路線與臨時據點，持續將物資運送至森林深處。',
    discoveries: Object.freeze(['blackstone-invasion', 'patrol-and-supply-route', 'poison-spider-husbandry']),
    previousMapId: 'black-forest-entrance',
    nextMapId: 'spider-nest',
    completionObjectiveId: 'defeat-blackstone-centurion',
    completionClueId: 'spider-nest-route-clue'
  });

  function monster(id, name, rank, role, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      role,
      chapter: 2,
      mapId: MAP.id,
      level: MAP.level,
      faction: 'blackstone-bandits',
      image: null,
      stats: null,
      dropTableId: 'black-forest-trail-pending',
      skillIds: Object.freeze([]),
      aiProfileId: null,
      implemented: true,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('blackstone-trail-scout', '黑石斥候', 'normal', '巡邏與偵察', { combatId: 'blackstoneTrailScout', level: Object.freeze([17, 17]), image: 'assets/plains-depths-blackstone-scout.png?v=20260920-shared-plains-depths-v2', stats: Object.freeze({ maxHp: 230, attack: 35, defense: 16, evasion: 14, parry: 4, damageReduction: 3, attackSpeed: 1.3, xp: 28, gold: 14 }), skillIds: Object.freeze(['scouting-mark']), aiProfileId: 'fast-marker' }),
    monster('blackstone-trail-raider', '黑石掠奪者', 'normal', '近戰攔截與物資護送', { combatId: 'blackstoneTrailRaider', level: Object.freeze([17, 17]), image: 'assets/plains-depths-blackstone-raider.png?v=20260920-shared-plains-depths-v2', stats: Object.freeze({ maxHp: 320, attack: 37, defense: 25, evasion: 4, parry: 8, damageReduction: 8, attackSpeed: .9, xp: 32, gold: 17 }), skillIds: Object.freeze(['armor-break', 'intercept']), aiProfileId: 'armored-disruptor' }),
    monster('blackstone-archer', '黑石弓箭手', 'normal', '遠程火力', { combatId: 'blackstoneArcher', level: Object.freeze([17, 17]), image: 'assets/blackstone-archer.png?v=20260920-blackstone-trail-monsters-v2', stats: Object.freeze({ maxHp: 210, attack: 39, defense: 16, evasion: 11, parry: 3, damageReduction: 2, attackSpeed: 1.05, xp: 30, gold: 16 }), skillIds: Object.freeze(['piercing-arrow', 'aimed-shot']), aiProfileId: 'ranged-burst' }),
    monster('blackstone-poison-spider', '黑石毒蜘蛛', 'normal', '黑石圈養的毒系怪物', { combatId: 'blackstonePoisonSpider', level: Object.freeze([17, 17]), image: 'assets/blackstone-poison-spider.png?v=20260920-blackstone-trail-monsters-v2', stats: Object.freeze({ maxHp: 250, attack: 34, defense: 18, evasion: 10, parry: 0, damageReduction: 3, attackSpeed: 1.15, xp: 31, gold: 15 }), skillIds: Object.freeze(['venom-fang', 'webbed-strike']), aiProfileId: 'poison-controller', faction: 'blackstone-beasts', ownerFaction: 'blackstone-bandits', tags: Object.freeze(['beast', 'poison', 'spider']) }),
    monster('blackstone-beastmaster', '黑石訓獸師', 'elite', '指揮與強化圈養蜘蛛', { combatId: 'blackstoneBeastmaster', level: Object.freeze([17, 17]), image: 'assets/blackstone-beastmaster.png?v=20260920-blackstone-trail-monsters-v2', stats: Object.freeze({ maxHp: 720, attack: 50, defense: 36, evasion: 9, parry: 7, damageReduction: 7, attackSpeed: 1, xp: 90, gold: 52 }), skillIds: Object.freeze(['venom-flask', 'beast-command', 'release-spider']), aiProfileId: 'poison-beast-handler' }),
    monster('blackstone-captain', '黑石隊長', 'elite', '巡邏隊與補給線指揮官', { combatId: 'blackstoneCaptain', level: Object.freeze([17, 17]), image: 'assets/blackstone-captain.png?v=20260920-blackstone-trail-monsters-v2', stats: Object.freeze({ maxHp: 880, attack: 54, defense: 40, evasion: 5, parry: 14, damageReduction: 10, attackSpeed: .9, xp: 105, gold: 65 }), skillIds: Object.freeze(['captain-command', 'shield-counter', 'captain-execution']), aiProfileId: 'low-health-executioner' }),
    monster('blackstone-centurion', '黑石百夫長', 'boss', '守衛補給路線並持有蛛巢線索', { combatId: 'blackstoneCenturion', level: Object.freeze([17, 17]), image: 'assets/blackstone-centurion.png?v=20260920-blackstone-trail-monsters-v2', stats: Object.freeze({ maxHp: 2800, attack: 64, defense: 53, evasion: 3, parry: 12, damageReduction: 14, attackSpeed: .85, xp: 380, gold: 230 }), skillIds: Object.freeze(['centurion-cleave', 'centurion-command', 'execution-axe', 'blackstone-fury']), aiProfileId: 'three-phase-centurion' })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));

  function getMonster(monsterId) {
    return MONSTER_BY_ID.get(monsterId) || null;
  }

  function getMonstersByRank(rank) {
    return MONSTERS.filter((entry) => entry.rank === rank);
  }

  const MARK = Object.freeze({ durationMs: 5000, blackstoneHumanDamageBonus: .12, archerDamageBonus: .20 });
  const SCOUT = Object.freeze({ retreatThreshold: .30, evasionBonus: 15, attackSpeedBonus: .25 });
  const RAIDER = Object.freeze({ armorBreakDurationMs: 5000, armorBreakPenalty: .15, interceptDurationMs: 3000, interceptAttackSpeedPenalty: .20 });
  const ARCHER = Object.freeze({ piercingDefenseIgnore: .30 });
  const POISON = Object.freeze({ durationMs: 5000, tickMs: 1000, attackRatio: .07, maxStacks: 3 });
  const CONTROL = Object.freeze({ webDurationMs: 4000, webAttackSpeedPenalty: .20 });
  const BEASTMASTER = Object.freeze({ commandDurationMs: 6000, spiderAttackBonus: .20, spiderAttackSpeedBonus: .20 });
  const CAPTAIN = Object.freeze({ commandDurationMs: 6000, commandAttackBonus: .15, shieldDurationMs: 5000, shieldParryBonus: 25, counterDamageMultiplier: .60 });
  const CENTURION = Object.freeze({ phaseTwoThreshold: .70, phaseThreeThreshold: .35, phaseTwoAttackBonus: .10, phaseTwoAttackSpeedBonus: .05, phaseThreeAttackBonus: .20, phaseThreeAttackSpeedBonus: .15, phaseThreeDefensePenalty: .15 });

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value) || 0)); }
  function rollLevel(monsterId) { return getMonster(monsterId) || MONSTERS.find((entry) => entry.combatId === monsterId) ? 17 : null; }
  function toCombatMonster(entry) {
    if (!entry?.stats) return null;
    return {
      id: entry.combatId, policyId: entry.id, name: entry.name, level: 17, mapId: MAP.id,
      ...entry.stats, isElite: entry.rank === 'elite', isBoss: entry.rank === 'boss',
      faction: entry.faction, ownerFaction: entry.ownerFaction || null,
      artClass: `monster-image-art ${entry.combatId}`, image: entry.image, skillIds: entry.skillIds
    };
  }
  function getCombatMonster(combatId) { return toCombatMonster(MONSTERS.find((entry) => entry.combatId === combatId || entry.id === combatId)); }
  function getCombatPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.combatId)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.combatId)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.combatId))
    });
  }
  function getPhase(monsterId, currentHp, maxHp) {
    if (monsterId !== 'blackstoneCenturion' || !(Number(maxHp) > 0)) return 1;
    const ratio = Math.max(0, Number(currentHp) || 0) / Number(maxHp);
    return ratio <= CENTURION.phaseThreeThreshold ? 3 : ratio <= CENTURION.phaseTwoThreshold ? 2 : 1;
  }
  function getCombatMultipliers(monsterId, currentHp, maxHp) {
    const ratio = Number(maxHp) > 0 ? Math.max(0, Number(currentHp) || 0) / Number(maxHp) : 1;
    if (monsterId === 'blackstoneTrailScout' && ratio < SCOUT.retreatThreshold) return { attack: 1, attackSpeed: 1 + SCOUT.attackSpeedBonus, defense: 1, evasion: SCOUT.evasionBonus };
    const phase = getPhase(monsterId, currentHp, maxHp);
    if (phase === 3) return { attack: 1 + CENTURION.phaseThreeAttackBonus, attackSpeed: 1 + CENTURION.phaseThreeAttackSpeedBonus, defense: 1 - CENTURION.phaseThreeDefensePenalty, evasion: 0 };
    if (phase === 2) return { attack: 1 + CENTURION.phaseTwoAttackBonus, attackSpeed: 1 + CENTURION.phaseTwoAttackSpeedBonus, defense: 1, evasion: 0 };
    return { attack: 1, attackSpeed: 1, defense: 1, evasion: 0 };
  }
  function resolveAction(monsterId, randomValue, targetHpRatio = 1, currentHp = 1, maxHp = 1) {
    const roll = clamp(randomValue, 0, .999999);
    if (monsterId === 'blackstoneTrailScout') return roll < .30 ? 'scouting-mark' : 'attack';
    if (monsterId === 'blackstoneTrailRaider') return roll < .25 ? 'armor-break' : roll < .35 ? 'intercept' : 'attack';
    if (monsterId === 'blackstoneArcher') return roll < .10 ? 'aimed-shot' : roll < .35 ? 'piercing-arrow' : 'attack';
    if (monsterId === 'blackstonePoisonSpider') return roll < .30 ? 'venom-fang' : roll < .40 ? 'webbed-strike' : 'attack';
    if (monsterId === 'blackstoneBeastmaster') return roll < .25 ? 'venom-flask' : roll < .45 ? 'beast-command' : roll < .55 ? 'release-spider' : 'attack';
    if (monsterId === 'blackstoneCaptain') {
      if (roll < .20) return 'captain-command';
      if (roll < .40) return 'shield-counter';
      if (targetHpRatio < .35 && roll < .50) return 'captain-execution';
      return 'attack';
    }
    if (monsterId === 'blackstoneCenturion') {
      const phase = getPhase(monsterId, currentHp, maxHp);
      if (phase === 3 && targetHpRatio < .35 && roll < .15) return 'execution-axe';
      if (phase >= 2 && roll < .30) return 'centurion-command';
      if (roll < .50) return 'centurion-cleave';
    }
    return 'attack';
  }
  function getDamageMultiplier(action) {
    return ({ 'armor-break': 1.2, 'aimed-shot': 1.7, 'venom-flask': 1.15, 'captain-execution': 1.8, 'centurion-cleave': 1.4, 'centurion-command': 1.3, 'execution-axe': 2.1 })[action] || 1;
  }

  function getDefenseIgnore(action) { return action === 'piercing-arrow' ? ARCHER.piercingDefenseIgnore : 0; }

  return Object.freeze({ MAP, STORY, MARK, SCOUT, RAIDER, ARCHER, POISON, CONTROL, BEASTMASTER, CAPTAIN, CENTURION, MONSTERS, getMonster, getMonstersByRank, rollLevel, toCombatMonster, getCombatMonster, getCombatPool, getPhase, getCombatMultipliers, resolveAction, getDamageMultiplier, getDefenseIgnore });
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SpiderNestPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP = Object.freeze({
    id: 'spider-nest',
    chapter: 2,
    order: 3,
    level: 19,
    name: '蜘蛛巢穴',
    background: 'assets/spider-nest-background.png',
    primaryFaction: 'blackstone-beasts',
    enemyPoolId: 'spider-nest-enemies',
    bossId: 'giant-spider',
    implemented: true,
    contentStatus: 'combat-ready'
  });

  const STORY = Object.freeze({
    premise: '黑石勢力在森林深處建立蜘蛛培育巢穴，利用毒液、蛛絲與圈養蜘蛛擴張軍備。',
    discoveries: Object.freeze(['blackstone-spider-breeding', 'venom-weapon-production', 'spider-silk-harvesting']),
    previousMapId: 'black-forest-trail',
    nextMapId: 'blackstone-stronghold',
    completionObjectiveId: 'defeat-giant-spider'
  });

  function monster(id, name, rank, role, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      role,
      chapter: 2,
      mapId: MAP.id,
      level: MAP.level,
      faction: 'blackstone-beasts',
      image: null,
      stats: null,
      dropTableId: 'spider-nest-pending',
      skillIds: Object.freeze([]),
      aiProfileId: null,
      implemented: true,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('spider-nest-blackstone-poison-spider', '黑石毒蜘蛛', 'normal', '近戰毒系怪物', { combatId: 'spiderNestBlackstonePoisonSpider', image: 'assets/blackstone-poison-spider.png?v=20260920-blackstone-trail-monsters-v2', stats: Object.freeze({ maxHp: 300, attack: 39, defense: 21, evasion: 12, parry: 0, damageReduction: 4, attackSpeed: 1.20, xp: 36, gold: 18 }), skillIds: Object.freeze(['nest-venom-fang', 'sticky-web-bite']), aiProfileId: 'fast-poison-stacker', attackProfile: 'melee-poison' }),
    monster('venom-spitter-spider', '噴毒蜘蛛', 'normal', '遠程持續傷害怪物', { combatId: 'venomSpitterSpider', image: 'assets/venom-spitter-spider.png?v=20260920-spider-nest-monsters-v2', stats: Object.freeze({ maxHp: 260, attack: 42, defense: 17, evasion: 8, parry: 0, damageReduction: 2, attackSpeed: .95, xp: 37, gold: 19 }), skillIds: Object.freeze(['venom-spray', 'corrosive-venom']), aiProfileId: 'ranged-poison-dot', attackProfile: 'ranged-poison' }),
    monster('web-weaver', '蛛網編織者', 'normal', '蛛絲控制型怪物', { combatId: 'webWeaver', image: 'assets/web-weaver.png?v=20260920-spider-nest-monsters-v2', stats: Object.freeze({ maxHp: 330, attack: 35, defense: 24, evasion: 7, parry: 0, damageReduction: 5, attackSpeed: .90, xp: 39, gold: 20 }), skillIds: Object.freeze(['web-entangle', 'suffocating-web']), aiProfileId: 'attack-speed-controller', attackProfile: 'ranged-control' }),
    monster('blackstone-venom-hunter', '黑石毒獵手', 'normal', '使用淬毒弓箭的哥布林遠程怪', { combatId: 'blackstoneVenomHunter', image: 'assets/blackstone-venom-hunter.png?v=20260920-spider-nest-monsters-v2', faction: 'blackstone-goblins', race: 'goblin', stats: Object.freeze({ maxHp: 275, attack: 44, defense: 19, evasion: 13, parry: 3, damageReduction: 3, attackSpeed: 1.10, xp: 40, gold: 22 }), skillIds: Object.freeze(['poisoned-arrow', 'venom-hunt-shot']), aiProfileId: 'poison-exploiter', attackProfile: 'ranged-poison' }),
    monster('spider-nest-blackstone-beastmaster', '黑石訓獸師', 'elite', '操控並強化蜘蛛的毒液菁英', { combatId: 'spiderNestBlackstoneBeastmaster', image: 'assets/blackstone-beastmaster.png?v=20260920-blackstone-trail-monsters-v2', faction: 'blackstone-bandits', stats: Object.freeze({ maxHp: 900, attack: 58, defense: 42, evasion: 9, parry: 8, damageReduction: 8, attackSpeed: 1, xp: 125, gold: 72 }), skillIds: Object.freeze(['nest-venom-flask', 'whip-spiders', 'release-spitter', 'venom-whip']), aiProfileId: 'nest-beast-handler', attackProfile: 'beast-support-poison' }),
    monster('blackstone-venomblade-assassin', '黑石毒刃刺客', 'elite', '雙持毒刃的高速爆發近戰菁英', { combatId: 'blackstoneVenombladeAssassin', image: 'assets/blackstone-venomblade-assassin.png?v=20260920-spider-nest-monsters-v2', faction: 'blackstone-bandits', race: 'orc', stats: Object.freeze({ maxHp: 780, attack: 63, defense: 34, evasion: 18, parry: 10, damageReduction: 6, attackSpeed: 1.25, xp: 135, gold: 78 }), skillIds: Object.freeze(['twin-poison-blades', 'shadow-dash', 'lethal-venom-cut']), aiProfileId: 'poison-burst-assassin', attackProfile: 'melee-burst-poison' }),
    monster('giant-spider', '蜘蛛皇后', 'boss', '以毒液與蜘蛛絲壓制戰場的巢穴最終 Boss', { combatId: 'giantSpider', image: 'assets/giant-spider.png?v=20260920-spider-nest-monsters-v2', stats: Object.freeze({ maxHp: 3900, attack: 73, defense: 61, evasion: 4, parry: 8, damageReduction: 16, attackSpeed: .90, xp: 520, gold: 320 }), skillIds: Object.freeze(['toxic-bite', 'web-restraint', 'boss-venom-spray', 'hatch-spider-eggs', 'deadly-fang', 'nest-frenzy']), aiProfileId: 'three-phase-brood-boss', bodyProfile: 'giant-bloated-abdomen', attackProfile: 'boss-poison-web-control' })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));
  function getMonster(monsterId) { return MONSTER_BY_ID.get(monsterId) || null; }
  function getMonstersByRank(rank) { return MONSTERS.filter((entry) => entry.rank === rank); }

  const POISON = Object.freeze({ durationMs: 6000, tickMs: 1000, attackRatio: .07, maxStacks: 4, bossMaxStacks: 5 });
  const CONTROL = Object.freeze({ stickyPenalty: .15, stickyDurationMs: 3000, webPenalty: .20, webDurationMs: 5000, suffocatingPenalty: .30, suffocatingDurationMs: 3000, minimumAttackSpeedRatio: .55 });
  const BEASTMASTER = Object.freeze({ commandDurationMs: 7000, spiderAttackBonus: .25, spiderAttackSpeedBonus: .20, summonHpRatio: .60, summonAttackRatio: .75, summonLimit: 1 });
  const ASSASSIN = Object.freeze({ dashDurationMs: 3000, dashEvasionBonus: 20, lethalPoisonThreshold: 3 });
  const BOSS = Object.freeze({ phaseTwoThreshold: .70, phaseThreeThreshold: .35, phaseThreeAttackBonus: .20, phaseThreeAttackSpeedBonus: .15, phaseThreeDefensePenalty: .15, summonHpRatio: .60, summonAttackRatio: .75, summonLimit: 2 });

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value) || 0)); }
  function rollLevel(monsterId) { return getMonster(monsterId) || MONSTERS.find((entry) => entry.combatId === monsterId) ? MAP.level : null; }
  function toCombatMonster(entry) {
    if (!entry?.stats) return null;
    return { id: entry.combatId, policyId: entry.id, name: entry.name, level: MAP.level, mapId: MAP.id, ...entry.stats,
      isElite: entry.rank === 'elite', isBoss: entry.rank === 'boss', faction: entry.faction,
      artClass: `monster-image-art ${entry.combatId}`, image: entry.image, skillIds: entry.skillIds };
  }
  function getCombatMonster(monsterId) { return toCombatMonster(MONSTERS.find((entry) => entry.combatId === monsterId || entry.id === monsterId)); }
  function getCombatPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.combatId)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.combatId)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.combatId))
    });
  }
  function getBossPhase(monsterId, currentHp, maxHp) {
    if (monsterId !== 'giantSpider' || !(Number(maxHp) > 0)) return 1;
    const ratio = Math.max(0, Number(currentHp) || 0) / Number(maxHp);
    return ratio <= BOSS.phaseThreeThreshold ? 3 : ratio <= BOSS.phaseTwoThreshold ? 2 : 1;
  }
  function getCombatMultipliers(monsterId, currentHp, maxHp) {
    if (getBossPhase(monsterId, currentHp, maxHp) === 3) return { attack: 1 + BOSS.phaseThreeAttackBonus, attackSpeed: 1 + BOSS.phaseThreeAttackSpeedBonus, defense: 1 - BOSS.phaseThreeDefensePenalty, evasion: 0 };
    return { attack: 1, attackSpeed: 1, defense: 1, evasion: 0 };
  }
  function resolveAction(monsterId, randomValue, targetPoisonStacks = 0, currentHp = 1, maxHp = 1, canSummon = true) {
    const roll = clamp(randomValue, 0, .999999);
    if (monsterId === 'spiderNestBlackstonePoisonSpider') return roll < .30 ? 'nest-venom-fang' : roll < .35 ? 'sticky-web-bite' : 'attack';
    if (monsterId === 'venomSpitterSpider') return roll < .35 ? 'venom-spray' : roll < .45 ? 'corrosive-venom' : 'attack';
    if (monsterId === 'webWeaver') return roll < .30 ? 'web-entangle' : roll < .45 ? 'suffocating-web' : 'attack';
    if (monsterId === 'blackstoneVenomHunter') return roll < .30 ? 'poisoned-arrow' : roll < .40 ? 'venom-hunt-shot' : 'attack';
    if (monsterId === 'spiderNestBlackstoneBeastmaster') {
      if (roll < .25) return 'nest-venom-flask';
      if (roll < .45) return 'whip-spiders';
      if (roll < .55) return canSummon ? 'release-spitter' : 'attack';
      return roll < .60 ? 'venom-whip' : 'attack';
    }
    if (monsterId === 'blackstoneVenombladeAssassin') return roll < .25 ? 'twin-poison-blades' : roll < .40 ? 'shadow-dash' : roll < .45 && targetPoisonStacks >= ASSASSIN.lethalPoisonThreshold ? 'lethal-venom-cut' : 'attack';
    if (monsterId === 'giantSpider') {
      const phase = getBossPhase(monsterId, currentHp, maxHp);
      if (phase === 3) return roll < .25 ? 'deadly-fang' : roll < .45 ? 'web-restraint' : roll < .55 ? 'boss-venom-spray' : 'attack';
      if (phase === 2) {
        if (roll < .10 && canSummon) return 'hatch-spider-eggs';
        if (roll >= .10 && roll < .35) return 'toxic-bite';
        if (roll < .55) return 'web-restraint';
        if (roll < .65) return 'boss-venom-spray';
        return 'attack';
      }
      return roll < .25 ? 'toxic-bite' : roll < .45 ? 'web-restraint' : roll < .55 ? 'boss-venom-spray' : 'attack';
    }
    return 'attack';
  }
  function getDamageMultiplier(action, targetPoisonStacks = 0) {
    return ({ 'nest-venom-fang': 1.10, 'sticky-web-bite': .90, 'venom-spray': .90, 'corrosive-venom': 1.10,
      'poisoned-arrow': 1.10, 'venom-hunt-shot': targetPoisonStacks > 0 ? 1.725 : 1.50, 'nest-venom-flask': 1.15,
      'venom-whip': 1.40, 'twin-poison-blades': 1.40, 'shadow-dash': 1.60, 'lethal-venom-cut': 1.90,
      'toxic-bite': 1.20, 'web-restraint': .70, 'boss-venom-spray': 1, 'deadly-fang': 1.45 })[action] || 1;
  }

  return Object.freeze({ MAP, STORY, POISON, CONTROL, BEASTMASTER, ASSASSIN, BOSS, MONSTERS, getMonster, getMonstersByRank, rollLevel, toCombatMonster, getCombatMonster, getCombatPool, getBossPhase, getCombatMultipliers, resolveAction, getDamageMultiplier });
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackstoneStrongholdPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULES = Object.freeze({
    dungeonId: 'blackstone-stronghold',
    level: 21,
    gameplayType: 'outpost-siege',
    objectiveCount: 5,
    minKillsPerOutpost: 10,
    maxKillsPerOutpost: 70,
    baseOutpostHp: 1200,
    outpostHpPerDestroyed: 300,
    outpostDamageReduction: null,
    outpostShield: null,
    enrageAttackBonus: .30,
    enrageAttackSpeedBonus: .30,
    enrageDurationMs: 15000
  });
  const OUTPOST_KILL_THRESHOLDS = Object.freeze([10, 25, 40, 55, 70]);

  function monster(id, name, rank, race, role, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      race,
      role,
      chapter: 2,
      mapId: RULES.dungeonId,
      level: RULES.level,
      faction: 'blackstone-bandits',
      image: null,
      stats: null,
      dropTableId: 'blackstone-stronghold-pending',
      skillIds: Object.freeze([]),
      aiProfileId: null,
      implemented: false,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('blackstone-guard', '黑石守衛', 'normal', 'human', '重甲前排', { combatId: 'blackstoneStrongholdGuard', image: 'assets/blackstone-guard.png?v=20260920-blackstone-stronghold-monsters-v1', stats: Object.freeze({ maxHp: 520, attack: 54, defense: 48, evasion: 2, parry: 18, damageReduction: 14, attackSpeed: .78, xp: 55, gold: 28 }), skillIds: Object.freeze(['shield-wall', 'shield-bash']), aiProfileId: 'stronghold-armored-guardian', implemented: true }),
    monster('blackstone-crossbowman', '黑石弩手', 'normal', 'goblin', '遠程輸出', { combatId: 'blackstoneStrongholdCrossbowman', image: 'assets/blackstone-crossbowman.png?v=20260920-blackstone-stronghold-monsters-v1', faction: 'blackstone-goblins', stats: Object.freeze({ maxHp: 340, attack: 66, defense: 25, evasion: 10, parry: 3, damageReduction: 3, attackSpeed: 1, xp: 54, gold: 29 }), skillIds: Object.freeze(['armor-piercing-bolt', 'aimed-volley']), aiProfileId: 'stronghold-ranged-burst', implemented: true }),
    monster('blackstone-berserker', '黑石狂戰士', 'normal', 'orc', '雙斧近戰', { combatId: 'blackstoneStrongholdBerserker', image: 'assets/blackstone-berserker.png?v=20260920-blackstone-stronghold-monsters-v1', stats: Object.freeze({ maxHp: 440, attack: 62, defense: 28, evasion: 6, parry: 8, damageReduction: 5, attackSpeed: 1.15, xp: 58, gold: 31 }), skillIds: Object.freeze(['blood-frenzy', 'twin-axe-cleave']), aiProfileId: 'stronghold-low-health-berserker', implemented: true }),
    monster('blackstone-warhound', '黑石戰犬', 'normal', 'beast', '高速近戰', { combatId: 'blackstoneStrongholdWarhound', image: 'assets/blackstone-warhound.png?v=20260920-blackstone-stronghold-monsters-v1', faction: 'blackstone-beasts', stats: Object.freeze({ maxHp: 380, attack: 55, defense: 24, evasion: 17, parry: 0, damageReduction: 4, attackSpeed: 1.4, xp: 56, gold: 27 }), skillIds: Object.freeze(['rending-bite', 'hunting-pounce']), aiProfileId: 'stronghold-fast-bleeder', implemented: true }),
    monster('blackstone-lion-guard', '黑石獅衛', 'elite', 'lionkin', '高攻擊近戰', { combatId: 'blackstoneStrongholdLionGuard', image: 'assets/blackstone-lion-guard.png?v=20260920-blackstone-stronghold-monsters-v1', stats: Object.freeze({ maxHp: 1250, attack: 82, defense: 58, evasion: 8, parry: 14, damageReduction: 12, attackSpeed: .9, xp: 180, gold: 105 }), skillIds: Object.freeze(['lion-roar', 'crushing-hammer']), aiProfileId: 'stronghold-elite-bruiser', implemented: true }),
    monster('blackstone-bullhorn-warrior', '黑石蠻角勇士', 'elite', 'bullkin', '高血量／重擊', { combatId: 'blackstoneStrongholdBullhornWarrior', image: 'assets/blackstone-bullhorn-warrior.png?v=20260920-blackstone-stronghold-monsters-v1', stats: Object.freeze({ maxHp: 1550, attack: 78, defense: 64, evasion: 3, parry: 8, damageReduction: 16, attackSpeed: .75, xp: 195, gold: 115 }), skillIds: Object.freeze(['bullhorn-stampede', 'seismic-smash']), aiProfileId: 'stronghold-elite-charger', implemented: true }),
    monster('blackstone-warlord', '黑石督軍', 'boss', 'orc', '據點指揮官', { combatId: 'blackstoneStrongholdWarlord', image: 'assets/blackstone-warlord.png?v=20260920-blackstone-stronghold-monsters-v1', stats: Object.freeze({ maxHp: 6200, attack: 96, defense: 78, evasion: 4, parry: 16, damageReduction: 18, attackSpeed: .88, xp: 750, gold: 450 }), skillIds: Object.freeze(['warlord-command', 'warhammer-sweep', 'warlord-execution', 'last-stand']), aiProfileId: 'stronghold-three-phase-warlord', implemented: true })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));
  function getMonster(monsterId) { return MONSTER_BY_ID.get(monsterId) || null; }
  function getMonstersByRank(rank) { return MONSTERS.filter((entry) => entry.rank === rank); }

  const GUARD = Object.freeze({ shieldWallThreshold: .50, shieldWallDefenseBonus: .25, bashChance: .20, bashDamageMultiplier: 1.10, bashStunMs: 1000 });
  const CROSSBOWMAN = Object.freeze({ piercingChance: .30, piercingDefenseIgnore: .35, volleyChance: .12, volleyDamageMultiplier: 1.65 });
  const BERSERKER = Object.freeze({ frenzyThreshold: .40, attackBonus: .25, attackSpeedBonus: .20, defensePenalty: .15, cleaveChance: .30, cleaveDamageMultiplier: 1.35 });
  const WARHOUND = Object.freeze({ bleedChance: .30, bleedDurationMs: 4000, bleedTickMs: 1000, bleedAttackRatio: .07, pounceChance: .18, pounceDamageMultiplier: 1.45 });
  const LION_GUARD = Object.freeze({ roarChance: .20, roarDurationMs: 6000, roarAttackBonus: .15, hammerChance: .30, hammerDamageMultiplier: 1.55 });
  const BULLHORN = Object.freeze({ stampedeChance: .22, stampedeDamageMultiplier: 1.50, stampedeStunMs: 1200, smashChance: .22, smashDamageMultiplier: 1.70 });
  const WARLORD = Object.freeze({ phaseTwoThreshold: .70, phaseThreeThreshold: .35, phaseTwoAttackBonus: .10, phaseThreeAttackBonus: .25, phaseThreeAttackSpeedBonus: .15, phaseThreeDefensePenalty: .10, commandChance: .18, sweepChance: .28, executionThreshold: .30, executionChance: .18 });

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value) || 0)); }
  function rollLevel(monsterId) { return MONSTERS.some((entry) => entry.id === monsterId || entry.combatId === monsterId) ? RULES.level : null; }
  function toCombatMonster(entry) {
    if (!entry?.stats) return null;
    return { id: entry.combatId, policyId: entry.id, name: entry.name, level: RULES.level, mapId: RULES.dungeonId, ...entry.stats,
      isElite: entry.rank === 'elite', isBoss: entry.rank === 'boss', faction: entry.faction,
      artClass: `monster-image-art ${entry.combatId}`, image: entry.image, skillIds: entry.skillIds };
  }
  function getCombatMonster(monsterId) { return toCombatMonster(MONSTERS.find((entry) => entry.id === monsterId || entry.combatId === monsterId)); }
  function getCombatPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.combatId)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.combatId)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.combatId))
    });
  }
  function getBossPhase(monsterId, currentHp, maxHp) {
    if (!['blackstone-warlord', 'blackstoneStrongholdWarlord'].includes(monsterId) || !(Number(maxHp) > 0)) return 1;
    const ratio = Math.max(0, Number(currentHp) || 0) / Number(maxHp);
    return ratio <= WARLORD.phaseThreeThreshold ? 3 : ratio <= WARLORD.phaseTwoThreshold ? 2 : 1;
  }
  function getCombatMultipliers(monsterId, currentHp, maxHp) {
    const ratio = Number(maxHp) > 0 ? Math.max(0, Number(currentHp) || 0) / Number(maxHp) : 1;
    if (['blackstone-guard', 'blackstoneStrongholdGuard'].includes(monsterId) && ratio <= GUARD.shieldWallThreshold) return { attack: 1, attackSpeed: 1, defense: 1 + GUARD.shieldWallDefenseBonus, evasion: 0 };
    if (['blackstone-berserker', 'blackstoneStrongholdBerserker'].includes(monsterId) && ratio <= BERSERKER.frenzyThreshold) return { attack: 1 + BERSERKER.attackBonus, attackSpeed: 1 + BERSERKER.attackSpeedBonus, defense: 1 - BERSERKER.defensePenalty, evasion: 0 };
    const phase = getBossPhase(monsterId, currentHp, maxHp);
    if (phase === 3) return { attack: 1 + WARLORD.phaseThreeAttackBonus, attackSpeed: 1 + WARLORD.phaseThreeAttackSpeedBonus, defense: 1 - WARLORD.phaseThreeDefensePenalty, evasion: 0 };
    if (phase === 2) return { attack: 1 + WARLORD.phaseTwoAttackBonus, attackSpeed: 1, defense: 1, evasion: 0 };
    return { attack: 1, attackSpeed: 1, defense: 1, evasion: 0 };
  }
  function resolveAction(monsterId, randomValue, targetHpRatio = 1, currentHp = 1, maxHp = 1) {
    const roll = clamp(randomValue, 0, .999999);
    if (['blackstone-guard', 'blackstoneStrongholdGuard'].includes(monsterId)) return roll < GUARD.bashChance ? 'shield-bash' : 'attack';
    if (['blackstone-crossbowman', 'blackstoneStrongholdCrossbowman'].includes(monsterId)) return roll < CROSSBOWMAN.volleyChance ? 'aimed-volley' : roll < CROSSBOWMAN.volleyChance + CROSSBOWMAN.piercingChance ? 'armor-piercing-bolt' : 'attack';
    if (['blackstone-berserker', 'blackstoneStrongholdBerserker'].includes(monsterId)) return roll < BERSERKER.cleaveChance ? 'twin-axe-cleave' : 'attack';
    if (['blackstone-warhound', 'blackstoneStrongholdWarhound'].includes(monsterId)) return roll < WARHOUND.pounceChance ? 'hunting-pounce' : roll < WARHOUND.pounceChance + WARHOUND.bleedChance ? 'rending-bite' : 'attack';
    if (['blackstone-lion-guard', 'blackstoneStrongholdLionGuard'].includes(monsterId)) return roll < LION_GUARD.roarChance ? 'lion-roar' : roll < LION_GUARD.roarChance + LION_GUARD.hammerChance ? 'crushing-hammer' : 'attack';
    if (['blackstone-bullhorn-warrior', 'blackstoneStrongholdBullhornWarrior'].includes(monsterId)) return roll < BULLHORN.stampedeChance ? 'bullhorn-stampede' : roll < BULLHORN.stampedeChance + BULLHORN.smashChance ? 'seismic-smash' : 'attack';
    if (['blackstone-warlord', 'blackstoneStrongholdWarlord'].includes(monsterId)) {
      const phase = getBossPhase(monsterId, currentHp, maxHp);
      if (phase === 3 && targetHpRatio <= WARLORD.executionThreshold && roll < WARLORD.executionChance) return 'warlord-execution';
      if (phase >= 2 && roll < WARLORD.commandChance) return 'warlord-command';
      if (roll < WARLORD.commandChance + WARLORD.sweepChance) return 'warhammer-sweep';
    }
    return 'attack';
  }
  function getDamageMultiplier(action) {
    return ({ 'shield-bash': GUARD.bashDamageMultiplier, 'aimed-volley': CROSSBOWMAN.volleyDamageMultiplier,
      'twin-axe-cleave': BERSERKER.cleaveDamageMultiplier, 'hunting-pounce': WARHOUND.pounceDamageMultiplier,
      'crushing-hammer': LION_GUARD.hammerDamageMultiplier, 'bullhorn-stampede': BULLHORN.stampedeDamageMultiplier,
      'seismic-smash': BULLHORN.smashDamageMultiplier, 'warhammer-sweep': 1.50, 'warlord-command': 1.25, 'warlord-execution': 2.10 })[action] || 1;
  }
  function getDefenseIgnore(action) { return action === 'armor-piercing-bolt' ? CROSSBOWMAN.piercingDefenseIgnore : 0; }

  function outpost(id, name, image, effect) {
    return Object.freeze({ id, name, image, effect: Object.freeze(effect), implemented: true });
  }

  const OUTPOSTS = Object.freeze([
    outpost('blackstone-supply-station', '補給站', 'assets/blackstone-supply-station.png', { stat: 'healthRegenPerSecond', operation: 'add-max-health-ratio', value: .01, label: '敵軍每秒恢復 1% 最大生命' }),
    outpost('blackstone-barracks', '兵營', 'assets/blackstone-barracks.png', { stat: 'maxHealth', operation: 'multiply', value: .20, label: '敵軍最大生命提高 20%' }),
    outpost('blackstone-armory', '軍械庫', 'assets/blackstone-armory.png', { stat: 'attack', operation: 'multiply', value: .15, label: '敵軍攻擊提高 15%' }),
    outpost('blackstone-watchtower', '哨塔', 'assets/blackstone-watchtower.png', { stat: 'criticalChance', operation: 'add', value: .10, label: '敵軍暴擊率提高 10%' }),
    outpost('blackstone-command-tent', '指揮帳篷', 'assets/blackstone-command-tent.png', { stat: 'attackSpeed', operation: 'multiply', value: .15, label: '敵軍攻速提高 15%' })
  ]);
  const OUTPOST_BY_ID = new Map(OUTPOSTS.map((entry) => [entry.id, entry]));
  function getOutpost(outpostId) { return OUTPOST_BY_ID.get(outpostId) || null; }
  function getOutpostEffect(outpostId) { return getOutpost(outpostId)?.effect || null; }
  function applyOutpostEffect(stats, outpostId) {
    const next = { ...(stats || {}) };
    const effect = getOutpostEffect(outpostId);
    if (!effect) return next;
    if (effect.stat === 'maxHealth') next.maxHp = Math.max(1, Math.round((Number(next.maxHp) || 1) * (1 + effect.value)));
    else if (effect.stat === 'attack') next.attack = Math.max(1, Math.round((Number(next.attack) || 1) * (1 + effect.value)));
    else if (effect.stat === 'attackSpeed') next.attackSpeed = Math.max(.1, (Number(next.attackSpeed) || 1) * (1 + effect.value));
    else if (effect.stat === 'criticalChance') next.criticalChance = Number(Math.min(1, Math.max(0, (Number(next.criticalChance) || 0) + effect.value)).toFixed(6));
    else if (effect.stat === 'healthRegenPerSecond') next.healthRegenPerSecond = Math.max(0, (Number(next.healthRegenPerSecond) || 0) + effect.value);
    return next;
  }

  function normalizeRandom(random = Math.random) {
    return Math.max(0, Math.min(.999999, Number(random()) || 0));
  }

  function rollOutpostId(availableOutpostIds = OUTPOSTS.map((entry) => entry.id), random = Math.random) {
    const available = [...new Set(availableOutpostIds)].filter((id) => OUTPOST_BY_ID.has(id));
    if (!available.length) return null;
    return available[Math.floor(normalizeRandom(random) * available.length)];
  }

  function getRequiredKills(destroyedOutposts = 0) {
    const index = Math.min(OUTPOST_KILL_THRESHOLDS.length - 1, Math.max(0, Math.floor(Number(destroyedOutposts) || 0)));
    return OUTPOST_KILL_THRESHOLDS[index];
  }

  function getOutpostMaxHp(destroyedOutposts = 0) {
    return RULES.baseOutpostHp + Math.min(RULES.objectiveCount - 1, Math.max(0, Math.floor(Number(destroyedOutposts) || 0))) * RULES.outpostHpPerDestroyed;
  }

  function createState(random = Math.random) {
    return { destroyedOutposts: 0, destroyedOutpostIds: [], availableOutpostIds: OUTPOSTS.map((entry) => entry.id), activeOutpostId: null, activeOutpostHp: 0, activeOutpostMaxHp: 0, killsSinceOutpost: 0, nextOutpostAtKills: getRequiredKills(0), outpostActive: false, bossSpawned: false, enragedUntil: 0 };
  }

  function normalizeState(saved, random = Math.random) {
    const source = saved && typeof saved === 'object' ? saved : {};
    const destroyedOutposts = Math.min(RULES.objectiveCount, Math.max(0, Math.floor(Number(source.destroyedOutposts) || 0)));
    const destroyedOutpostIds = [...new Set(Array.isArray(source.destroyedOutpostIds) ? source.destroyedOutpostIds : [])].filter((id) => OUTPOST_BY_ID.has(id)).slice(0, destroyedOutposts);
    const availableOutpostIds = OUTPOSTS.map((entry) => entry.id).filter((id) => !destroyedOutpostIds.includes(id));
    const sourceActiveOutpostId = OUTPOST_BY_ID.has(source.activeOutpostId) && availableOutpostIds.includes(source.activeOutpostId) ? source.activeOutpostId : null;
    const outpostActive = destroyedOutposts < RULES.objectiveCount && Boolean(source.outpostActive);
    const activeOutpostId = outpostActive ? (sourceActiveOutpostId || rollOutpostId(availableOutpostIds, random)) : null;
    const activeOutpostMaxHp = outpostActive ? getOutpostMaxHp(destroyedOutposts) : 0;
    const savedOutpostHp = Number(source.activeOutpostHp);
    const activeOutpostHp = outpostActive ? Math.min(activeOutpostMaxHp, savedOutpostHp > 0 ? savedOutpostHp : activeOutpostMaxHp) : 0;
    const nextOutpostAtKills = destroyedOutposts >= RULES.objectiveCount ? 0 : getRequiredKills(destroyedOutposts);
    return {
      destroyedOutposts,
      destroyedOutpostIds,
      availableOutpostIds,
      activeOutpostId,
      activeOutpostHp,
      activeOutpostMaxHp,
      killsSinceOutpost: Math.max(0, Math.floor(Number(source.killsSinceOutpost) || 0)),
      nextOutpostAtKills,
      outpostActive,
      bossSpawned: destroyedOutposts >= RULES.objectiveCount || Boolean(source.bossSpawned),
      enragedUntil: Math.max(0, Number(source.enragedUntil) || 0)
    };
  }

  function recordMonsterKill(state, random = Math.random) {
    const next = normalizeState(state, random);
    if (next.bossSpawned || next.outpostActive) return next;
    next.killsSinceOutpost += 1;
    if (next.killsSinceOutpost >= next.nextOutpostAtKills || next.killsSinceOutpost >= RULES.maxKillsPerOutpost) {
      next.outpostActive = true;
      next.activeOutpostId = rollOutpostId(next.availableOutpostIds, random);
      next.activeOutpostMaxHp = getOutpostMaxHp(next.destroyedOutposts);
      next.activeOutpostHp = next.activeOutpostMaxHp;
    }
    return next;
  }

  function destroyOutpost(state, options = {}) {
    const next = normalizeState(state, options.random);
    if (!next.outpostActive || next.bossSpawned) return { ok: false, reason: 'no-active-outpost', state: next };
    next.destroyedOutposts += 1;
    if (next.activeOutpostId && !next.destroyedOutpostIds.includes(next.activeOutpostId)) next.destroyedOutpostIds.push(next.activeOutpostId);
    next.availableOutpostIds = OUTPOSTS.map((entry) => entry.id).filter((id) => !next.destroyedOutpostIds.includes(id));
    const destroyedOutpostId = next.activeOutpostId;
    next.activeOutpostId = null;
    next.activeOutpostHp = 0;
    next.activeOutpostMaxHp = 0;
    next.outpostActive = false;
    next.killsSinceOutpost = 0;
    next.enragedUntil = Math.max(0, Number(options.now) || Date.now()) + RULES.enrageDurationMs;
    next.bossSpawned = next.destroyedOutposts >= RULES.objectiveCount;
    next.nextOutpostAtKills = next.bossSpawned ? 0 : getRequiredKills(next.destroyedOutposts);
    return { ok: true, state: next, destroyedOutpostId, effectRemoved: getOutpostEffect(destroyedOutpostId), triggerEnrage: true, spawnBoss: next.bossSpawned };
  }

  function damageOutpost(state, damage, options = {}) {
    const next = normalizeState(state, options.random);
    if (!next.outpostActive || !next.activeOutpostId) return { ok: false, reason: 'no-active-outpost', damage: 0, state: next };
    const dealt = Math.min(next.activeOutpostHp, Math.max(0, Math.floor(Number(damage) || 0)));
    next.activeOutpostHp -= dealt;
    if (next.activeOutpostHp > 0) return { ok: true, destroyed: false, damage: dealt, state: next };
    const result = destroyOutpost(next, options);
    return { ...result, destroyed: result.ok, damage: dealt };
  }

  function getEnrage(state, now = Date.now()) {
    const active = (Number(state?.enragedUntil) || 0) > now;
    return { active, attackBonus: active ? RULES.enrageAttackBonus : 0, attackSpeedBonus: active ? RULES.enrageAttackSpeedBonus : 0, remainingMs: active ? state.enragedUntil - now : 0 };
  }

  return Object.freeze({ RULES, OUTPOST_KILL_THRESHOLDS, GUARD, CROSSBOWMAN, BERSERKER, WARHOUND, LION_GUARD, BULLHORN, WARLORD, MONSTERS, OUTPOSTS,
    getMonster, getMonstersByRank, rollLevel, toCombatMonster, getCombatMonster, getCombatPool, getBossPhase, getCombatMultipliers,
    resolveAction, getDamageMultiplier, getDefenseIgnore, getOutpost, getOutpostEffect, applyOutpostEffect, rollOutpostId, getRequiredKills,
    createState, normalizeState, recordMonsterKill, getOutpostMaxHp, damageOutpost, destroyOutpost, getEnrage });
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ForestAltarPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP = Object.freeze({
    id: 'forest-altar',
    chapter: 2,
    order: 5,
    level: 23,
    name: '森林祭壇',
    background: 'assets/forest-altar-background.png',
    enemyPoolId: 'forest-altar-enemies',
    bossId: 'corrupted-altar-guardian',
    implemented: true,
    contentStatus: 'combat-ready'
  });

  const SKILLS = Object.freeze({
    corruptedForestWolf: Object.freeze({ active: 'corrupted-bite', passive: 'corrupted-frenzy', chance: .25, damage: 1.18, threshold: .40 }),
    thornDemonVine: Object.freeze({ active: 'thorn-entangle', passive: 'barbed-hide', chance: .24, damage: 1.08, slow: .20, durationMs: 4000, threshold: .50 }),
    corruptedBlackstoneSoldier: Object.freeze({ active: 'blackstone-heavy-slash', passive: 'corrupted-shield-wall', chance: .22, damage: 1.32, threshold: .50 }),
    altarGuard: Object.freeze({ active: 'rune-shock', passive: 'ancient-bulwark', chance: .24, damage: 1.35, slow: .15, durationMs: 3000 }),
    corruptedBlackstonePriest: Object.freeze({ active: 'corruption-flame', passive: 'dark-sacrifice', chance: .28, damage: 1.20, threshold: .35, dotAttackRatio: .25, dotTickMs: 1000, dotDurationMs: 5000 }),
    fallenDruid: Object.freeze({ active: 'withering-touch', passive: 'spreading-corruption', chance: .26, damage: 1.15, slow: .15, durationMs: 4000, threshold: .50 }),
    corruptedAltarGuardian: Object.freeze({ active: 'root-sweep', passive: 'altar-resonance', chance: .28, damage: 1.45, slow: .20, durationMs: 4000, phaseTwoThreshold: .70, phaseThreeThreshold: .35 })
  });

  function monster(id, name, rank, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      role: null,
      chapter: MAP.chapter,
      mapId: MAP.id,
      level: MAP.level,
      faction: 'corrupted-forest',
      combatId: null,
      image: null,
      stats: null,
      dropTableId: null,
      skillIds: Object.freeze([]),
      aiProfileId: null,
      implemented: true,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('corrupted-forest-wolf', '腐化森林狼', 'normal', { combatId: 'corruptedForestWolf', role: '高速追擊', image: 'assets/corrupted-forest-wolf.png?v=20260920-forest-altar-monsters-v1', skillIds: Object.freeze(['corrupted-bite', 'corrupted-frenzy']), aiProfileId: 'forest-altar-wolf', stats: Object.freeze({ maxHp: 480, attack: 68, defense: 30, evasion: 17, parry: 0, damageReduction: 5, attackSpeed: 1.40, xp: 65, gold: 32 }) }),
    monster('thorn-demon-vine', '荊棘魔藤', 'normal', { combatId: 'thornDemonVine', role: '控制與反擊', image: 'assets/thorn-demon-vine.png?v=20260920-forest-altar-monsters-v1', skillIds: Object.freeze(['thorn-entangle', 'barbed-hide']), aiProfileId: 'forest-altar-vine', stats: Object.freeze({ maxHp: 650, attack: 59, defense: 52, evasion: 2, parry: 0, damageReduction: 12, attackSpeed: .75, xp: 68, gold: 34 }) }),
    monster('corrupted-blackstone-soldier', '腐化黑石士兵', 'normal', { combatId: 'corruptedBlackstoneSoldier', role: '重甲前排', faction: 'corrupted-blackstone', image: 'assets/corrupted-blackstone-soldier.png?v=20260920-forest-altar-monsters-v1', skillIds: Object.freeze(['blackstone-heavy-slash', 'corrupted-shield-wall']), aiProfileId: 'forest-altar-soldier', stats: Object.freeze({ maxHp: 720, attack: 65, defense: 60, evasion: 3, parry: 15, damageReduction: 15, attackSpeed: .82, xp: 72, gold: 37 }) }),
    monster('altar-guard', '祭壇守衛', 'elite', { combatId: 'altarGuard', role: '防禦型菁英', image: 'assets/altar-guard.png?v=20260920-forest-altar-monsters-v1', skillIds: Object.freeze(['rune-shock', 'ancient-bulwark']), aiProfileId: 'forest-altar-guard', stats: Object.freeze({ maxHp: 1900, attack: 88, defense: 76, evasion: 3, parry: 10, damageReduction: 18, attackSpeed: .78, xp: 240, gold: 135 }) }),
    monster('corrupted-blackstone-priest', '腐化黑石祭司', 'elite', { combatId: 'corruptedBlackstonePriest', role: '腐化法術與輔助', faction: 'corrupted-blackstone', image: 'assets/corrupted-blackstone-priest.png?v=20260920-forest-altar-monsters-v1', skillIds: Object.freeze(['corruption-flame', 'dark-sacrifice']), aiProfileId: 'forest-altar-priest', stats: Object.freeze({ maxHp: 1450, attack: 96, defense: 48, evasion: 10, parry: 5, damageReduction: 9, attackSpeed: 1, xp: 225, gold: 145 }) }),
    monster('fallen-druid', '墮落德魯伊', 'elite', { combatId: 'fallenDruid', role: '控制與持續傷害', image: 'assets/fallen-druid.png?v=20260920-forest-altar-monsters-v1', skillIds: Object.freeze(['withering-touch', 'spreading-corruption']), aiProfileId: 'forest-altar-druid', stats: Object.freeze({ maxHp: 1700, attack: 91, defense: 57, evasion: 8, parry: 7, damageReduction: 12, attackSpeed: .92, xp: 260, gold: 155 }) }),
    monster('corrupted-altar-guardian', '腐化祭壇守護者', 'boss', { combatId: 'corruptedAltarGuardian', role: '三階段祭壇 Boss', image: 'assets/corrupted-altar-guardian.png?v=20260920-forest-altar-monsters-v1', skillIds: Object.freeze(['root-sweep', 'altar-resonance']), aiProfileId: 'forest-altar-boss', stats: Object.freeze({ maxHp: 8000, attack: 108, defense: 86, evasion: 4, parry: 12, damageReduction: 20, attackSpeed: .88, xp: 950, gold: 560 }) })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));
  function getMonster(monsterId) { return MONSTER_BY_ID.get(monsterId) || null; }
  function getMonstersByRank(rank) { return MONSTERS.filter((entry) => entry.rank === rank); }
  function getMonsterPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.id)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.id)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.id))
    });
  }

  function rollLevel(monsterId) {
    return MONSTERS.some((entry) => entry.id === monsterId || entry.combatId === monsterId) ? MAP.level : null;
  }
  function toCombatMonster(entry) {
    if (!entry?.stats || !entry.combatId) return null;
    return Object.freeze({
      id: entry.combatId,
      policyId: entry.id,
      name: entry.name,
      role: entry.role,
      level: MAP.level,
      mapId: MAP.id,
      ...entry.stats,
      isElite: entry.rank === 'elite',
      isBoss: entry.rank === 'boss',
      faction: entry.faction,
      artClass: `monster-image-art ${entry.combatId}`,
      image: entry.image,
      skillIds: entry.skillIds
    });
  }
  function getCombatMonster(monsterId) {
    return toCombatMonster(MONSTERS.find((entry) => entry.id === monsterId || entry.combatId === monsterId));
  }
  function getCombatPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.combatId)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.combatId)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.combatId))
    });
  }

  function getBossPhase(monsterId, currentHp, maxHp) {
    if (!['corrupted-altar-guardian', 'corruptedAltarGuardian'].includes(monsterId) || !(Number(maxHp) > 0)) return 1;
    const ratio = Math.max(0, Number(currentHp) || 0) / Number(maxHp);
    return ratio <= SKILLS.corruptedAltarGuardian.phaseThreeThreshold ? 3 : ratio <= SKILLS.corruptedAltarGuardian.phaseTwoThreshold ? 2 : 1;
  }
  function getCombatMultipliers(monsterId, currentHp, maxHp) {
    const ratio = Number(maxHp) > 0 ? Math.max(0, Number(currentHp) || 0) / Number(maxHp) : 1;
    if (monsterId === 'corruptedForestWolf' && ratio <= .40) return { attack: 1.15, attackSpeed: 1.20, defense: 1, evasion: 0 };
    if (monsterId === 'thornDemonVine' && ratio <= .50) return { attack: 1, attackSpeed: 1, defense: 1.20, evasion: 0 };
    if (monsterId === 'corruptedBlackstoneSoldier' && ratio <= .50) return { attack: 1, attackSpeed: 1, defense: 1.25, evasion: 0 };
    if (monsterId === 'altarGuard') return { attack: 1, attackSpeed: 1, defense: 1.15, evasion: 0 };
    if (monsterId === 'corruptedBlackstonePriest' && ratio <= .35) return { attack: 1.20, attackSpeed: 1, defense: .90, evasion: 0 };
    if (monsterId === 'fallenDruid' && ratio <= .50) return { attack: 1.15, attackSpeed: 1, defense: 1, evasion: 0 };
    const phase = getBossPhase(monsterId, currentHp, maxHp);
    if (phase === 3) return { attack: 1.25, attackSpeed: 1.20, defense: .90, evasion: 0 };
    if (phase === 2) return { attack: 1.15, attackSpeed: 1, defense: 1, evasion: 0 };
    return { attack: 1, attackSpeed: 1, defense: 1, evasion: 0 };
  }
  function resolveAction(monsterId, randomValue) {
    const skill = SKILLS[monsterId];
    const roll = Math.max(0, Math.min(.999999, Number(randomValue) || 0));
    return skill && roll < skill.chance ? skill.active : 'attack';
  }
  function getDamageMultiplier(action) {
    const skill = Object.values(SKILLS).find((entry) => entry.active === action);
    return skill?.damage || 1;
  }
  function getControlEffect(action) {
    const skill = Object.values(SKILLS).find((entry) => entry.active === action);
    return skill?.slow ? Object.freeze({ attackSpeedPenalty: skill.slow, durationMs: skill.durationMs }) : null;
  }

  function getDotEffect(action) {
    if (action !== SKILLS.corruptedBlackstonePriest.active) return null;
    return Object.freeze({ effectName: '腐化之焰', attackRatio: SKILLS.corruptedBlackstonePriest.dotAttackRatio, tickMs: SKILLS.corruptedBlackstonePriest.dotTickMs, durationMs: SKILLS.corruptedBlackstonePriest.dotDurationMs });
  }

  return Object.freeze({ MAP, SKILLS, MONSTERS, getMonster, getMonstersByRank, getMonsterPool, rollLevel, toCombatMonster, getCombatMonster, getCombatPool, getBossPhase, getCombatMultipliers, resolveAction, getDamageMultiplier, getControlEffect, getDotEffect });
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackForestDepthsPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULES = Object.freeze({
    mapId: 'black-forest-depths',
    chapter: 2,
    level: 25,
    name: '黑森林深處',
    background: 'assets/black-forest-depths-background.png',
    enemyPoolId: 'black-forest-depths-enemies',
    bossId: 'heart-of-the-black-forest',
    implemented: true,
    contentStatus: 'combat-ready',
    denseFogAccuracyPenalty: .15,
    denseFogUnavoidable: true,
    bossAuraModifiers: Object.freeze({ attackBonus: .10, defenseBonus: .10 }),
    visualDirection: Object.freeze({ primaryEnergy: 'purple-corruption', forestSpiritEnergy: 'green-nature' })
  });

  const SKILLS = Object.freeze({
    depthsCorruptedForestWolf: Object.freeze({ active: 'depths-shadow-bite', passive: 'depths-corrupted-hunt', chance: .25, damage: 1.25, threshold: .40 }),
    corruptedTreant: Object.freeze({ active: 'corrupted-root-entangle', passive: 'corrupted-bark', chance: .24, damage: 1.10, slow: .20, durationMs: 4000, threshold: .50 }),
    darkSporeBeast: Object.freeze({ active: 'spore-eruption', passive: 'spore-proliferation', chance: .28, damage: 1.12, threshold: .50 }),
    forestSpirit: Object.freeze({ active: 'nature-echo', passive: 'pure-spirit', chance: .28, healRatio: .18, cooldownMs: 10000 }),
    corruptedBlackstoneCenturion: Object.freeze({ active: 'corrupted-heavy-axe', passive: 'blackstone-command', chance: .24, damage: 1.40, armorBreak: .15, durationMs: 5000 }),
    corruptedFallenDruid: Object.freeze({ active: 'withering-storm', passive: 'deep-forest-corruption', chance: .26, damage: 1.25, slow: .20, durationMs: 4000, threshold: .50 }),
    heartOfTheBlackForest: Object.freeze({ active: 'corruption-pulse', passive: 'black-forest-core', chance: .28, damage: 1.35 })
  });
  const BOSS = Object.freeze({
    phaseTwoThreshold: .70,
    phaseThreeThreshold: .35,
    phaseTwoAttackBonus: .15,
    phaseThreeAttackBonus: .30,
    phaseThreeAttackSpeedBonus: .25,
    phaseThreeDefensePenalty: .15,
    rootSummonHpRatio: .55,
    rootSummonAttackRatio: .70,
    rootSummonLimit: 2,
    weakenedAuraBonus: .05
  });

  function monster(id, name, rank, visualEnergy, options = {}) {
    return Object.freeze({
      id, name, rank, chapter: RULES.chapter, mapId: RULES.mapId, level: RULES.level,
      visualEnergy, role: null, faction: 'deep-forest-corruption', combatId: null, image: null, stats: null,
      dropTableId: null, skillIds: Object.freeze([]), aiProfileId: null, implemented: true,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('corrupted-forest-wolf', '腐化森林狼', 'normal', 'purple-corruption', { combatId: 'depthsCorruptedForestWolf', role: '高速追擊', skillIds: Object.freeze(['depths-shadow-bite', 'depths-corrupted-hunt']), aiProfileId: 'depths-wolf', image: 'assets/corrupted-forest-wolf.png?v=20260920-forest-altar-monsters-v1', stats: Object.freeze({ maxHp: 650, attack: 82, defense: 35, evasion: 19, parry: 0, damageReduction: 6, attackSpeed: 1.50, xp: 82, gold: 41 }) }),
    monster('corrupted-treant', '腐化樹妖', 'normal', 'purple-corruption', { combatId: 'corruptedTreant', role: '控制型前排', skillIds: Object.freeze(['corrupted-root-entangle', 'corrupted-bark']), aiProfileId: 'depths-treant', image: 'assets/corrupted-treant.png?v=20260920-black-forest-depths-monsters-v1', stats: Object.freeze({ maxHp: 980, attack: 76, defense: 72, evasion: 3, parry: 8, damageReduction: 18, attackSpeed: .78, xp: 88, gold: 45 }) }),
    monster('dark-spore-beast', '黑暗孢子獸', 'normal', 'purple-corruption', { combatId: 'darkSporeBeast', role: '持續傷害', skillIds: Object.freeze(['spore-eruption', 'spore-proliferation']), aiProfileId: 'depths-spore-beast', image: 'assets/dark-spore-beast.png?v=20260920-black-forest-depths-monsters-v1', stats: Object.freeze({ maxHp: 820, attack: 88, defense: 48, evasion: 7, parry: 0, damageReduction: 10, attackSpeed: .95, xp: 92, gold: 48 }) }),
    monster('forest-spirit', '森林之魂', 'normal', 'green-nature', { combatId: 'forestSpirit', role: '自然輔助', faction: 'forest-nature', skillIds: Object.freeze(['nature-echo', 'pure-spirit']), aiProfileId: 'depths-forest-spirit', image: 'assets/forest-spirit.png?v=20260920-black-forest-depths-monsters-v1', stats: Object.freeze({ maxHp: 760, attack: 72, defense: 44, evasion: 16, parry: 0, damageReduction: 8, attackSpeed: 1.10, xp: 90, gold: 50 }) }),
    monster('corrupted-blackstone-centurion', '腐化黑石百夫長', 'elite', 'purple-corruption', { combatId: 'corruptedBlackstoneCenturion', role: '重裝輸出菁英', faction: 'corrupted-blackstone', skillIds: Object.freeze(['corrupted-heavy-axe', 'blackstone-command']), aiProfileId: 'depths-centurion', image: 'assets/corrupted-blackstone-centurion.png?v=20260920-black-forest-depths-monsters-v1', stats: Object.freeze({ maxHp: 2700, attack: 110, defense: 92, evasion: 4, parry: 18, damageReduction: 22, attackSpeed: .88, xp: 340, gold: 210 }) }),
    monster('corrupted-fallen-druid', '腐化墮落德魯伊', 'elite', 'purple-corruption', { combatId: 'corruptedFallenDruid', role: '控制法術菁英', skillIds: Object.freeze(['withering-storm', 'deep-forest-corruption']), aiProfileId: 'depths-druid', image: 'assets/corrupted-fallen-druid.png?v=20260920-black-forest-depths-monsters-v1', stats: Object.freeze({ maxHp: 2350, attack: 116, defense: 65, evasion: 10, parry: 6, damageReduction: 14, attackSpeed: 1, xp: 360, gold: 225 }) }),
    monster('heart-of-the-black-forest', '黑森林之心', 'boss', 'purple-corruption', { combatId: 'heartOfTheBlackForest', role: '三階段最終 Boss', skillIds: Object.freeze(['corruption-pulse', 'black-forest-core']), aiProfileId: 'depths-heart', image: 'assets/heart-of-the-black-forest.png?v=20260920-black-forest-depths-monsters-v1', stats: Object.freeze({ maxHp: 12000, attack: 132, defense: 105, evasion: 5, parry: 12, damageReduction: 24, attackSpeed: .92, xp: 1500, gold: 900 }) })
  ]);
  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));
  function getMonster(monsterId) { return MONSTER_BY_ID.get(monsterId) || null; }
  function getMonstersByRank(rank) { return MONSTERS.filter((entry) => entry.rank === rank); }
  function getMonsterPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.id)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.id)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.id))
    });
  }
  function getCombatPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.combatId)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.combatId)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.combatId))
    });
  }
  function rollLevel(monsterId) {
    return MONSTERS.some((entry) => entry.id === monsterId || entry.combatId === monsterId) ? RULES.level : null;
  }
  function toCombatMonster(entry) {
    if (!entry?.stats || !entry.combatId) return null;
    return Object.freeze({ id: entry.combatId, policyId: entry.id, name: entry.name, role: entry.role, level: RULES.level, mapId: RULES.mapId,
      ...entry.stats, isElite: entry.rank === 'elite', isBoss: entry.rank === 'boss', faction: entry.faction,
      artClass: `monster-image-art ${entry.combatId}`, image: entry.image, skillIds: entry.skillIds });
  }
  function getCombatMonster(monsterId) {
    return toCombatMonster(MONSTERS.find((entry) => entry.id === monsterId || entry.combatId === monsterId));
  }
  function getBossPhase(monsterId, currentHp, maxHp) {
    if (!['heart-of-the-black-forest', 'heartOfTheBlackForest'].includes(monsterId) || !(Number(maxHp) > 0)) return 1;
    const ratio = Math.max(0, Number(currentHp) || 0) / Number(maxHp);
    return ratio <= BOSS.phaseThreeThreshold ? 3 : ratio <= BOSS.phaseTwoThreshold ? 2 : 1;
  }
  function getCombatMultipliers(monsterId, currentHp, maxHp, context = {}) {
    const ratio = Number(maxHp) > 0 ? Math.max(0, Number(currentHp) || 0) / Number(maxHp) : 1;
    let attack = 1, attackSpeed = 1, defense = 1, evasion = 0;
    if (monsterId === 'depthsCorruptedForestWolf' && ratio <= .40) { attack *= 1.15; attackSpeed *= 1.20; }
    if (monsterId === 'corruptedTreant' && ratio <= .50) defense *= 1.25;
    if (monsterId === 'darkSporeBeast' && ratio <= .50) attack *= 1.15;
    if (monsterId === 'forestSpirit') evasion += .08;
    if (monsterId === 'corruptedBlackstoneCenturion') attack *= 1 + Math.min(4, Math.max(0, Number(context.aliveAllies) || 0)) * .04;
    if (monsterId === 'corruptedFallenDruid' && ratio <= .50) attack *= 1.20;
    const phase = getBossPhase(monsterId, currentHp, maxHp);
    if (phase === 3) { attack *= 1 + BOSS.phaseThreeAttackBonus; attackSpeed *= 1 + BOSS.phaseThreeAttackSpeedBonus; defense *= 1 - BOSS.phaseThreeDefensePenalty; }
    else if (phase === 2) attack *= 1 + BOSS.phaseTwoAttackBonus;
    if (context.bossAuraActive && monsterId !== 'heartOfTheBlackForest') {
      const auraBonus = context.forestSpiritAlive ? BOSS.weakenedAuraBonus : RULES.bossAuraModifiers.attackBonus;
      attack *= 1 + auraBonus;
      defense *= 1 + auraBonus;
    }
    return { attack, attackSpeed, defense, evasion };
  }
  function resolveAction(monsterId, randomValue, hasWoundedAlly = false, options = {}) {
    const skill = SKILLS[monsterId];
    const roll = Math.max(0, Math.min(.999999, Number(randomValue) || 0));
    if (monsterId === 'forestSpirit') return hasWoundedAlly && options.canUseNatureEcho !== false && roll < skill.chance ? skill.active : 'attack';
    return skill && roll < skill.chance ? skill.active : 'attack';
  }
  function getDamageMultiplier(action) {
    const skill = Object.values(SKILLS).find((entry) => entry.active === action);
    return skill?.damage || 1;
  }
  function getControlEffect(action) {
    const skill = Object.values(SKILLS).find((entry) => entry.active === action);
    return skill?.slow ? Object.freeze({ attackSpeedPenalty: skill.slow, durationMs: skill.durationMs }) : null;
  }

  function applyDenseFogAccuracy(accuracy, mapId) {
    const normalized = Math.max(0, Number(accuracy) || 0);
    return mapId === RULES.mapId ? Math.max(0, normalized - RULES.denseFogAccuracyPenalty) : normalized;
  }

  function getBossAura(enemies) {
    const roster = Array.isArray(enemies) ? enemies : [];
    const bossAlive = roster.some((enemy) => enemy?.isBoss && enemy.currentHp > 0);
    const forestSpiritAlive = roster.some((enemy) => ['forest-spirit', 'forestSpirit'].includes(enemy?.id) && enemy.currentHp > 0);
    const auraBonus = forestSpiritAlive ? BOSS.weakenedAuraBonus : RULES.bossAuraModifiers.attackBonus;
    return {
      active: bossAlive,
      affectedEnemyIds: bossAlive ? roster.filter((enemy) => !enemy?.isBoss && enemy?.currentHp > 0).map((enemy) => enemy.id) : [],
      weakenedByForestSpirit: bossAlive && forestSpiritAlive,
      modifiers: bossAlive ? Object.freeze({ attackBonus: auraBonus, defenseBonus: auraBonus }) : null
    };
  }

  return Object.freeze({ RULES, SKILLS, BOSS, MONSTERS, getMonster, getMonstersByRank, getMonsterPool, getCombatPool, rollLevel, toCombatMonster, getCombatMonster, getBossPhase, getCombatMultipliers, resolveAction, getDamageMultiplier, getControlEffect, applyDenseFogAccuracy, getBossAura });
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RedrockWastesPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAP_ID = 'redrock-wastes-entrance';
  const SKILLS = Object.freeze({
    'rend-bite': Object.freeze({ id:'rend-bite', name:'撕咬', triggerChance:.20, dot:Object.freeze({ type:'bleed', attackRatio:.20, durationMs:4000, tickMs:2000, ticks:2, stacking:'refresh-by-source' }) }),
    'hardened-scales': Object.freeze({ id:'hardened-scales', name:'硬化鱗片', passive:true, defenseBonus:.20 }),
    dive: Object.freeze({ id:'dive', name:'俯衝', cooldownMs:8000, damageMultiplier:1.50, criticalBonus:.15, target:'random-alive' }),
    'armor-breaking-throw': Object.freeze({ id:'armor-breaking-throw', name:'破甲投擲', cooldownMs:7000, damageMultiplier:1.20, target:'random-alive', debuff:Object.freeze({ type:'defense-down', value:.15, durationMs:5000, stacking:'refresh-by-source' }) }),
    'frenzied-charge': Object.freeze({ id:'frenzied-charge', name:'狂暴衝撞', cooldownMs:8000, damageMultiplier:1.80, target:'primary', stunChance:.30, stunMs:1000 }),
    'wounded-frenzy': Object.freeze({ id:'wounded-frenzy', name:'受傷狂暴', passive:true, threshold:.40, attackBonus:.15, attackSpeedBonus:.25, permanent:true }),
    'giant-jaw-rend': Object.freeze({ id:'giant-jaw-rend', name:'巨顎撕咬', cooldownMs:6000, damageMultiplier:1.70, target:'primary', dot:Object.freeze({ type:'rend', attackRatio:.25, durationMs:6000, tickMs:2000, ticks:3, stacking:'refresh-by-source' }) }),
    'rock-armor': Object.freeze({ id:'rock-armor', name:'岩甲', passive:true, threshold:.50, defenseBonus:.25, weakenedDefenseBonus:.10, permanentTransition:true }),
    'wasteland-fury': Object.freeze({ id:'wasteland-fury', name:'荒原狂怒', passive:true, threshold:.30, attackBonus:.25, attackSpeedBonus:.20, permanent:true })
  });
  const ENEMY_SKILLS = Object.freeze({
    'wasteland-hyena': Object.freeze(['rend-bite']), 'redrock-lizard': Object.freeze(['hardened-scales']),
    'wasteland-vulture': Object.freeze(['dive']), 'skullcrusher-scout': Object.freeze(['armor-breaking-throw']),
    'redrock-hornbeast': Object.freeze(['frenzied-charge','wounded-frenzy']),
    'redrock-giant-lizard': Object.freeze(['giant-jaw-rend','rock-armor','wasteland-fury'])
  });
  const ACTIVE_SKILL_BY_ENEMY = Object.freeze({ 'wasteland-vulture':'dive', 'skullcrusher-scout':'armor-breaking-throw', 'redrock-hornbeast':'frenzied-charge', 'redrock-giant-lizard':'giant-jaw-rend' });
  const MONSTERS = Object.freeze([
    Object.freeze({id:'wasteland-hyena',name:'荒原鬣狗',maxHp:748,attack:94,defense:40,evasion:19,parry:0,damageReduction:6,attackSpeed:1.50,xp:82,gold:41}),
    Object.freeze({id:'redrock-lizard',name:'赤岩蜥蜴',maxHp:1127,attack:87,defense:83,evasion:3,parry:8,damageReduction:18,attackSpeed:.78,xp:88,gold:45}),
    Object.freeze({id:'wasteland-vulture',name:'荒原禿鷹',maxHp:874,attack:83,defense:51,evasion:16,parry:0,damageReduction:8,attackSpeed:1.10,xp:90,gold:50}),
    Object.freeze({id:'skullcrusher-scout',name:'碎顱斥候',maxHp:943,attack:101,defense:55,evasion:8,parry:8,damageReduction:10,attackSpeed:.95,xp:92,gold:48}),
    Object.freeze({id:'redrock-hornbeast',name:'赤岩角獸',maxHp:3105,attack:127,defense:106,evasion:4,parry:18,damageReduction:22,attackSpeed:.88,xp:340,gold:210,isElite:true}),
    Object.freeze({id:'redrock-giant-lizard',name:'赤岩巨蜥',maxHp:13800,attack:152,defense:121,evasion:5,parry:12,damageReduction:24,attackSpeed:.92,xp:1500,gold:900,isBoss:true})
  ]);
  const MONSTER_BY_ID = Object.freeze(Object.fromEntries(MONSTERS.map((monster) => [monster.id, monster])));
  const COMBAT_POOL = Object.freeze({normal:Object.freeze(MONSTERS.slice(0,4).map((monster)=>monster.id)),elite:Object.freeze(['redrock-hornbeast']),boss:Object.freeze(['redrock-giant-lizard'])});
  function getCombatMonster(id){const monster=MONSTER_BY_ID[id];if(!monster)return null;return {...monster,level:30,mapId:MAP_ID,faction:id.startsWith('skullcrusher-')?'skullcrusher-tribe':'redrock-wildlife',artClass:`monster-image-art ${id}`,image:`assets/${id}.png`,skillIds:getEnemySkills(id)};}
  function getCombatPool(){return COMBAT_POOL;}
  function telemetry(){return {skillCasts:{},dotApplications:{},dotTicks:{},debuffApplications:{},stuns:0,thresholdTriggers:{woundedFrenzy:0,rockArmorWeakened:0,wastelandFury:0},rockArmorTransitions:0};}
  function createState(now=0){return {nextSkillAt:{},woundedFrenzy:false,rockArmorWeakened:false,wastelandFury:false,previousHpRatio:1,telemetry:telemetry(),startedAt:now};}
  function record(bucket,key,amount=1){bucket[key]=(bucket[key]||0)+amount;}
  function getSkill(id){return SKILLS[id]||null;} function getEnemySkills(enemyId){return ENEMY_SKILLS[enemyId]||Object.freeze([]);}
  function initializeSchedule(enemyId,state,now=0){const id=ACTIVE_SKILL_BY_ENEMY[enemyId];if(id&&!Number.isFinite(state.nextSkillAt[id]))state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;return state;}
  function resolveScheduledAction(enemyId,state,now=0){initializeSchedule(enemyId,state,state.startedAt||0);const id=ACTIVE_SKILL_BY_ENEMY[enemyId];if(!id||now<state.nextSkillAt[id])return null;state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;record(state.telemetry.skillCasts,id);return SKILLS[id];}
  function resolveHyenaBasicHit(state,randomValue){if(Number(randomValue)>=SKILLS['rend-bite'].triggerChance)return null;record(state.telemetry.skillCasts,'rend-bite');return SKILLS['rend-bite'];}
  function createDot(skillId,sourceId,attack){const dot=SKILLS[skillId]?.dot;if(!dot)return null;return {type:dot.type,sourceId,skillId,damage:Math.max(0,Number(attack)||0)*dot.attackRatio,durationMs:dot.durationMs,tickMs:dot.tickMs,ticks:dot.ticks,stacking:dot.stacking};}
  function recordDotApplication(state,skillId){record(state.telemetry.dotApplications,skillId);} function recordDotTick(state,skillId){record(state.telemetry.dotTicks,skillId);} function recordDebuff(state,skillId){record(state.telemetry.debuffApplications,skillId);}
  function resolveStun(state,randomValue){if(Number(randomValue)>=SKILLS['frenzied-charge'].stunChance)return null;state.telemetry.stuns++;return {type:'stun',durationMs:SKILLS['frenzied-charge'].stunMs};}
  function updateThresholds(enemyId,state,currentHp,maxHp){const ratio=Number(maxHp)>0?Math.max(0,Number(currentHp)||0)/Number(maxHp):1,previous=Number.isFinite(state.previousHpRatio)?state.previousHpRatio:1,events=[];
    if(enemyId==='redrock-hornbeast'&&!state.woundedFrenzy&&previous>=.40&&ratio<.40){state.woundedFrenzy=true;state.telemetry.thresholdTriggers.woundedFrenzy++;events.push('wounded-frenzy');}
    if(enemyId==='redrock-giant-lizard'&&!state.rockArmorWeakened&&previous>=.50&&ratio<.50){state.rockArmorWeakened=true;state.telemetry.thresholdTriggers.rockArmorWeakened++;state.telemetry.rockArmorTransitions++;events.push('rock-armor-weakened');}
    if(enemyId==='redrock-giant-lizard'&&!state.wastelandFury&&previous>=.30&&ratio<.30){state.wastelandFury=true;state.telemetry.thresholdTriggers.wastelandFury++;events.push('wasteland-fury');}
    state.previousHpRatio=ratio;return events;}
  function getCombatMultipliers(enemyId,state){return {attack:1+(enemyId==='redrock-hornbeast'&&state?.woundedFrenzy?SKILLS['wounded-frenzy'].attackBonus:0)+(enemyId==='redrock-giant-lizard'&&state?.wastelandFury?SKILLS['wasteland-fury'].attackBonus:0),attackSpeed:1+(enemyId==='redrock-hornbeast'&&state?.woundedFrenzy?SKILLS['wounded-frenzy'].attackSpeedBonus:0)+(enemyId==='redrock-giant-lizard'&&state?.wastelandFury?SKILLS['wasteland-fury'].attackSpeedBonus:0),defense:enemyId==='redrock-lizard'?1+SKILLS['hardened-scales'].defenseBonus:enemyId==='redrock-giant-lizard'?1+(state?.rockArmorWeakened?SKILLS['rock-armor'].weakenedDefenseBonus:SKILLS['rock-armor'].defenseBonus):1};}
  return Object.freeze({MAP_ID,SKILLS,ENEMY_SKILLS,MONSTERS,getSkill,getEnemySkills,getCombatMonster,getCombatPool,createState,initializeSchedule,resolveScheduledAction,resolveHyenaBasicHit,createDot,recordDotApplication,recordDotTick,recordDebuff,resolveStun,updateThresholds,getCombatMultipliers});
});

(function (root, factory) {
  const dependency = typeof module === 'object' && module.exports ? require('./redrock-wastes-policy.js') : root.RedrockWastesPolicy;
  const api = factory(dependency);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BrokenrockCanyonPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (RedrockWastesPolicy) {
  'use strict';
  const MAP_ID='brokenrock-canyon';
  const SKILLS=Object.freeze({
    'armor-piercing-spear':Object.freeze({id:'armor-piercing-spear',name:'穿甲投矛',cooldownMs:7000,damageMultiplier:1.50,defenseIgnore:.20,target:'random-alive'}),
    'battle-cry':Object.freeze({id:'battle-cry',name:'戰鬥怒吼',cooldownMs:10000,target:'all-alive-skullcrusher',buff:Object.freeze({type:'attack-up',attackBonus:.10,durationMs:5000,stacking:'refresh-by-name',includesCaster:true})}),
    'brute-smash':Object.freeze({id:'brute-smash',name:'蠻力重擊',cooldownMs:7000,damageMultiplier:1.90,target:'primary',debuff:Object.freeze({type:'attack-speed-down',value:.15,durationMs:4000,stacking:'refresh-by-source'})}),
    bloodlust:Object.freeze({id:'bloodlust',name:'嗜戰',passive:true,thresholds:Object.freeze([.80,.60,.40,.20]),attackBonusPerStack:.05,maxStacks:4,permanent:true}),
    'warlord-slash':Object.freeze({id:'warlord-slash',name:'督軍斬擊',cooldownMs:6000,damageMultiplier:1.80,target:'primary',debuff:Object.freeze({type:'defense-down',value:.15,durationMs:5000,stacking:'refresh-by-source'})}),
    'offensive-command':Object.freeze({id:'offensive-command',name:'進攻號令',cooldownMs:12000,target:'all-other-alive',buff:Object.freeze({type:'offensive-command',attackBonus:.15,attackSpeedBonus:.15,durationMs:5000,stacking:'refresh-by-name',excludeCaster:true})}),
    'execution-command':Object.freeze({id:'execution-command',name:'處決號令',threshold:.30,damageMultiplier:2.20,target:'lowest-hp-ratio-alive',once:true})
  });
  const ENEMY_SKILLS=Object.freeze({
    'wasteland-hyena':RedrockWastesPolicy.getEnemySkills('wasteland-hyena'),
    'skullcrusher-scout':RedrockWastesPolicy.getEnemySkills('skullcrusher-scout'),
    'skullcrusher-spearman':Object.freeze(['armor-piercing-spear']),
    'skullcrusher-warrior':Object.freeze(['battle-cry']),
    'brokenrock-brute':Object.freeze(['brute-smash','bloodlust']),
    'canyon-warlord':Object.freeze(['warlord-slash','offensive-command','execution-command'])
  });
  const ACTIVE_SKILLS=Object.freeze({'skullcrusher-spearman':['armor-piercing-spear'],'skullcrusher-warrior':['battle-cry'],'brokenrock-brute':['brute-smash'],'canyon-warlord':['warlord-slash','offensive-command']});
  const MONSTERS=Object.freeze([
    RedrockWastesPolicy.getCombatMonster('wasteland-hyena'),
    RedrockWastesPolicy.getCombatMonster('skullcrusher-scout'),
    Object.freeze({id:'skullcrusher-spearman',name:'碎顱投矛手',maxHp:990,attack:109,defense:58,evasion:8,parry:0,damageReduction:8,attackSpeed:.95,xp:96,gold:52}),
    Object.freeze({id:'skullcrusher-warrior',name:'碎顱戰士',maxHp:1217,attack:92,defense:90,evasion:3,parry:10,damageReduction:18,attackSpeed:.72,xp:98,gold:54}),
    Object.freeze({id:'brokenrock-brute',name:'斷岩蠻兵',maxHp:3350,attack:135,defense:115,evasion:3,parry:20,damageReduction:24,attackSpeed:.82,xp:380,gold:240,isElite:true}),
    Object.freeze({id:'canyon-warlord',name:'峽谷督軍',maxHp:15500,attack:162,defense:132,evasion:3,parry:18,damageReduction:26,attackSpeed:.82,xp:1650,gold:1000,isBoss:true})
  ]);
  const MONSTER_BY_ID=Object.freeze(Object.fromEntries(MONSTERS.map((monster)=>[monster.id,monster])));
  const COMBAT_POOL=Object.freeze({normal:Object.freeze(['wasteland-hyena','skullcrusher-scout','skullcrusher-spearman','skullcrusher-warrior']),elite:Object.freeze(['brokenrock-brute']),boss:Object.freeze(['canyon-warlord'])});
  function getCombatMonster(id){const monster=MONSTER_BY_ID[id];if(!monster)return null;return {...monster,level:30,mapId:MAP_ID,faction:id.startsWith('skullcrusher-')||id==='brokenrock-brute'||id==='canyon-warlord'?'skullcrusher-tribe':'redrock-wildlife',artClass:`monster-image-art ${id}`,image:`assets/${id}.png`,skillIds:getEnemySkills(id)};}
  function getCombatPool(){return COMBAT_POOL;}
  function freshTelemetry(){return {skillAttempts:{},skillCasts:{},skillDamage:{},buffTargets:{},battleCryActiveMs:0,warlordDefenseDownActiveMs:0,bloodlustThresholds:{80:0,60:0,40:0,20:0},executionTriggers:0,executionKills:0};}
  function createState(now=0){return {startedAt:now,nextSkillAt:{},previousHpRatio:1,bloodlustStacks:0,bloodlustTriggered:{},executionTriggered:false,telemetry:freshTelemetry()};}
  function record(bucket,key,amount=1){bucket[key]=(bucket[key]||0)+amount;}
  function getSkill(id){return SKILLS[id]||RedrockWastesPolicy.getSkill(id)||null;} function getEnemySkills(id){return ENEMY_SKILLS[id]||Object.freeze([]);}
  function initializeSchedule(enemyId,state,now=0){for(const id of ACTIVE_SKILLS[enemyId]||[])if(!Number.isFinite(state.nextSkillAt[id]))state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;return state;}
  function resolveScheduledActions(enemyId,state,now=0,context={}){initializeSchedule(enemyId,state,state.startedAt||0);const actions=[];for(const id of ACTIVE_SKILLS[enemyId]||[]){if(now<state.nextSkillAt[id])continue;state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;record(state.telemetry.skillAttempts,id);if(id==='offensive-command'&&!(Number(context.otherAliveEnemies)>0))continue;record(state.telemetry.skillCasts,id);actions.push(SKILLS[id]);}return actions;}
  function updateThresholds(enemyId,state,currentHp,maxHp){const ratio=Number(maxHp)>0?Math.max(0,Number(currentHp)||0)/Number(maxHp):1,previous=Number.isFinite(state.previousHpRatio)?state.previousHpRatio:1,events=[];
    if(enemyId==='brokenrock-brute')for(const threshold of SKILLS.bloodlust.thresholds)if(!state.bloodlustTriggered[threshold]&&previous>=threshold&&ratio<threshold){state.bloodlustTriggered[threshold]=true;state.bloodlustStacks=Math.min(SKILLS.bloodlust.maxStacks,state.bloodlustStacks+1);state.telemetry.bloodlustThresholds[Math.round(threshold*100)]++;events.push({id:'bloodlust',threshold,stacks:state.bloodlustStacks});}
    if(enemyId==='canyon-warlord'&&!state.executionTriggered&&previous>=SKILLS['execution-command'].threshold&&ratio<SKILLS['execution-command'].threshold){state.executionTriggered=true;state.telemetry.executionTriggers++;events.push(SKILLS['execution-command']);}
    state.previousHpRatio=ratio;return events;}
  function getCombatMultipliers(enemyId,state){return {attack:enemyId==='brokenrock-brute'?1+state.bloodlustStacks*SKILLS.bloodlust.attackBonusPerStack:1,attackSpeed:1,defense:1};}
  function recordSkillDamage(state,id,damage){record(state.telemetry.skillDamage,id,Math.max(0,Number(damage)||0));} function recordBuffTargets(state,id,count){record(state.telemetry.buffTargets,id,Math.max(0,Math.floor(Number(count)||0)));}
  function recordCoverage(state,{battleCry=false,warlordDefenseDown=false}={},elapsedMs=0){if(battleCry)state.telemetry.battleCryActiveMs+=Math.max(0,elapsedMs);if(warlordDefenseDown)state.telemetry.warlordDefenseDownActiveMs+=Math.max(0,elapsedMs);}
  function recordExecutionOutcome(state,killed){if(killed)state.telemetry.executionKills++;}
  return Object.freeze({MAP_ID,SKILLS,ENEMY_SKILLS,MONSTERS,getSkill,getEnemySkills,getCombatMonster,getCombatPool,createState,initializeSchedule,resolveScheduledActions,updateThresholds,getCombatMultipliers,recordSkillDamage,recordBuffTargets,recordCoverage,recordExecutionOutcome});
});

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.BloodwarWastesPolicy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAP_ID='bloodwar-wastes';
  const SKILLS=Object.freeze({
    'blood-rage':Object.freeze({id:'blood-rage',name:'血怒',passive:true,threshold:.40,attackBonus:.20,attackSpeedBonus:.20,permanent:true}),
    'shield-wall':Object.freeze({id:'shield-wall',name:'盾牆',cooldownMs:10000,target:'self-and-lowest-hp-ratio-other',buff:Object.freeze({type:'shield-wall',damageReduction:.20,durationMs:4000,stacking:'refresh-by-name'})}),
    'hunting-mark':Object.freeze({id:'hunting-mark',name:'獵殺標記',cooldownMs:8000,target:'lowest-hp-ratio-alive-player',durationMs:5000,damageBonus:.20,oneMarkPerCaster:true}),
    'warblood-totem':Object.freeze({id:'warblood-totem',name:'戰血圖騰',cooldownMs:12000,target:'all-alive-enemies',buff:Object.freeze({type:'warblood-totem',attackBonus:.10,durationMs:6000,healRatio:.02,tickMs:2000,ticks:3,stacking:'refresh-globally-by-name'})}),
    'centurion-cleave':Object.freeze({id:'centurion-cleave',name:'百夫長重斬',cooldownMs:7000,damageMultiplier:2,target:'primary',debuff:Object.freeze({type:'healing-received-down',value:.20,durationMs:5000,stacking:'refresh-by-source'})}),
    'battle-formation-command':Object.freeze({id:'battle-formation-command',name:'戰陣指揮',passive:true,target:'all-other-alive-enemies',defenseBonus:.10,stacking:'maximum-by-name',requiresLivingSource:true}),
    'vanguard-smash':Object.freeze({id:'vanguard-smash',name:'先鋒猛擊',cooldownMs:6000,damageMultiplier:1.90,target:'primary',debuff:Object.freeze({type:'healing-received-down',value:.20,durationMs:5000,stacking:'refresh-by-source'})}),
    'full-army-charge':Object.freeze({id:'full-army-charge',name:'全軍突擊',cooldownMs:12000,target:'all-other-alive-enemies',buff:Object.freeze({type:'full-army-charge',attackBonus:.15,attackSpeedBonus:.20,durationMs:5000,stacking:'refresh-by-name',excludeCaster:true})}),
    'fight-to-the-end':Object.freeze({id:'fight-to-the-end',name:'血戰到底',passive:true,threshold:.40,target:'boss-and-all-other-alive-enemies',otherHealRatio:.15,attackBonus:.15,permanent:true,once:true})
  });
  const ENEMY_SKILLS=Object.freeze({'skullcrusher-berserker':Object.freeze(['blood-rage']),'skullcrusher-shieldguard':Object.freeze(['shield-wall']),'skullcrusher-hunter':Object.freeze(['hunting-mark']),'skullcrusher-shaman':Object.freeze(['warblood-totem']),'skullcrusher-centurion':Object.freeze(['centurion-cleave','battle-formation-command']),'skullcrusher-vanguard-commander':Object.freeze(['vanguard-smash','full-army-charge','fight-to-the-end'])});
  const ACTIVE_SKILLS=Object.freeze({'skullcrusher-shieldguard':['shield-wall'],'skullcrusher-hunter':['hunting-mark'],'skullcrusher-shaman':['warblood-totem'],'skullcrusher-centurion':['centurion-cleave'],'skullcrusher-vanguard-commander':['vanguard-smash','full-army-charge']});
  const MONSTERS=Object.freeze([
    Object.freeze({id:'skullcrusher-berserker',name:'碎顱狂戰士',maxHp:1180,attack:111,defense:68,evasion:4,parry:8,damageReduction:10,attackSpeed:.92,xp:0,gold:0}),
    Object.freeze({id:'skullcrusher-shieldguard',name:'碎顱盾衛',maxHp:1340,attack:91,defense:101,evasion:2,parry:18,damageReduction:20,attackSpeed:.68,xp:0,gold:0}),
    Object.freeze({id:'skullcrusher-hunter',name:'碎顱獵手',maxHp:1040,attack:105,defense:61,evasion:10,parry:0,damageReduction:8,attackSpeed:1.15,xp:0,gold:0}),
    Object.freeze({id:'skullcrusher-shaman',name:'碎顱薩滿',maxHp:960,attack:87,defense:58,evasion:5,parry:0,damageReduction:8,attackSpeed:.88,xp:0,gold:0}),
    Object.freeze({id:'skullcrusher-centurion',name:'碎顱百夫長',maxHp:3650,attack:142,defense:122,evasion:3,parry:20,damageReduction:25,attackSpeed:.80,xp:0,gold:0,isElite:true}),
    Object.freeze({id:'skullcrusher-vanguard-commander',name:'碎顱先鋒統領',maxHp:17500,attack:170,defense:140,evasion:3,parry:18,damageReduction:27,attackSpeed:.80,xp:0,gold:0,isBoss:true})
  ]);
  const MONSTER_BY_ID=Object.freeze(Object.fromEntries(MONSTERS.map((monster)=>[monster.id,monster])));
  const COMBAT_POOL=Object.freeze({normal:Object.freeze(MONSTERS.slice(0,4).map((monster)=>monster.id)),elite:Object.freeze(['skullcrusher-centurion']),boss:Object.freeze(['skullcrusher-vanguard-commander'])});
  function getCombatMonster(id){const monster=MONSTER_BY_ID[id];if(!monster)return null;return {...monster,level:30,mapId:MAP_ID,faction:'skullcrusher-tribe',artClass:`monster-image-art ${id}`,image:`assets/${id}.png?v=20260919`,skillIds:getEnemySkills(id)};}
  function getCombatPool(){return COMBAT_POOL;}
  function freshTelemetry(){return {skillAttempts:{},skillCasts:{},buffTargets:{},markTargets:[],bloodRageTriggers:0,shieldWallProtectedTargets:0,huntingMarkActiveMs:0,warbloodTotemActiveMs:0,warbloodTotemHealing:0,centurionAuraActiveMs:0,healingReductionActiveMs:0,fullArmyChargeTargets:0,fightToEndTriggers:0,fightToEndTriggeredAt:null,fightToEndHealing:0,fightToEndAliveTargets:0};}
  function createState(now=0){return {startedAt:now,nextSkillAt:{},previousHpRatio:1,bloodRage:false,fightToEnd:false,markedTargetId:null,markUntil:0,telemetry:freshTelemetry()};}
  function record(bucket,key,amount=1){bucket[key]=(bucket[key]||0)+amount;} function getSkill(id){return SKILLS[id]||null;} function getEnemySkills(id){return ENEMY_SKILLS[id]||Object.freeze([]);}
  function initializeSchedule(enemyId,state,now=0){for(const id of ACTIVE_SKILLS[enemyId]||[])if(!Number.isFinite(state.nextSkillAt[id]))state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;return state;}
  function resolveScheduledActions(enemyId,state,now=0,context={}){initializeSchedule(enemyId,state,state.startedAt||0);const result=[];for(const id of ACTIVE_SKILLS[enemyId]||[]){if(now<state.nextSkillAt[id])continue;state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;record(state.telemetry.skillAttempts,id);if(id==='full-army-charge'&&!(Number(context.otherAliveEnemies)>0))continue;record(state.telemetry.skillCasts,id);result.push(SKILLS[id]);}return result;}
  function updateThresholds(enemyId,state,currentHp,maxHp,now=0){const ratio=Number(maxHp)>0?Math.max(0,Number(currentHp)||0)/Number(maxHp):1,previous=Number.isFinite(state.previousHpRatio)?state.previousHpRatio:1,events=[];
    if(enemyId==='skullcrusher-berserker'&&!state.bloodRage&&previous>=.40&&ratio<.40){state.bloodRage=true;state.telemetry.bloodRageTriggers++;events.push(SKILLS['blood-rage']);}
    if(enemyId==='skullcrusher-vanguard-commander'&&!state.fightToEnd&&previous>=.40&&ratio<.40){state.fightToEnd=true;state.telemetry.fightToEndTriggers++;state.telemetry.fightToEndTriggeredAt=now;events.push(SKILLS['fight-to-the-end']);}
    state.previousHpRatio=ratio;return events;}
  function getCombatMultipliers(enemyId,state){const rage=enemyId==='skullcrusher-berserker'&&state?.bloodRage;const last=enemyId==='skullcrusher-vanguard-commander'&&state?.fightToEnd;return {attack:1+(rage?SKILLS['blood-rage'].attackBonus:0)+(last?SKILLS['fight-to-the-end'].attackBonus:0),attackSpeed:1+(rage?SKILLS['blood-rage'].attackSpeedBonus:0),defense:1};}
  function chooseLowestHpRatio(units,excludeId=null){return (units||[]).filter(unit=>unit&&unit.alive!==false&&unit.id!==excludeId).map((unit,index)=>({unit,index,ratio:Number(unit.maxHp)>0?Number(unit.currentHp)/Number(unit.maxHp):1})).sort((a,b)=>a.ratio-b.ratio||a.index-b.index)[0]?.unit||null;}
  function applyHuntingMark(state,targetId,now){const previousTargetId=state.markedTargetId;state.markedTargetId=targetId;state.markUntil=now+SKILLS['hunting-mark'].durationMs;state.telemetry.markTargets.push({atMs:now,targetId,previousTargetId});return {targetId,previousTargetId,until:state.markUntil};}
  function getHunterDamageMultiplier(state,targetId,now){return state?.markedTargetId===targetId&&now<state.markUntil?1+SKILLS['hunting-mark'].damageBonus:1;}
  function getCenturionAuraDefenseMultiplier(livingCenturionCount,targetIsCenturion=false){const availableSources=Math.max(0,Number(livingCenturionCount)||0)-(targetIsCenturion?1:0);return availableSources>0?1+SKILLS['battle-formation-command'].defenseBonus:1;}
  function getFightToEndAllyAttackMultiplier(active){return active?1+SKILLS['fight-to-the-end'].attackBonus:1;}
  function recordBuffTargets(state,id,count){const amount=Math.max(0,Math.floor(Number(count)||0));record(state.telemetry.buffTargets,id,amount);if(id==='shield-wall')state.telemetry.shieldWallProtectedTargets+=amount;if(id==='full-army-charge')state.telemetry.fullArmyChargeTargets+=amount;}
  function recordCoverage(state,flags={},elapsedMs=0){const ms=Math.max(0,Number(elapsedMs)||0);if(flags.huntingMark)state.telemetry.huntingMarkActiveMs+=ms;if(flags.warbloodTotem)state.telemetry.warbloodTotemActiveMs+=ms;if(flags.centurionAura)state.telemetry.centurionAuraActiveMs+=ms;if(flags.healingReduction)state.telemetry.healingReductionActiveMs+=ms;}
  function recordTotemHealing(state,amount){state.telemetry.warbloodTotemHealing+=Math.max(0,Number(amount)||0);} function recordFightToEnd(state,{healing=0,aliveTargets=0}={}){state.telemetry.fightToEndHealing+=Math.max(0,Number(healing)||0);state.telemetry.fightToEndAliveTargets+=Math.max(0,Math.floor(Number(aliveTargets)||0));}
  return Object.freeze({MAP_ID,SKILLS,ENEMY_SKILLS,MONSTERS,getSkill,getEnemySkills,getCombatMonster,getCombatPool,createState,initializeSchedule,resolveScheduledActions,updateThresholds,getCombatMultipliers,chooseLowestHpRatio,applyHuntingMark,getHunterDamageMultiplier,getCenturionAuraDefenseMultiplier,getFightToEndAllyAttackMultiplier,recordBuffTargets,recordCoverage,recordTotemHealing,recordFightToEnd});
});

(function(root,factory){const dependency=typeof module==='object'&&module.exports?require('./bloodwar-wastes-policy.js'):root.BloodwarWastesPolicy;const api=factory(dependency);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SkullcrusherWarCampPolicy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(BloodwarWastesPolicy){
  'use strict';
  const MAP_ID='skullcrusher-war-camp';
  const SKILLS=Object.freeze({
    'heavy-armor-line':Object.freeze({id:'heavy-armor-line',name:'重甲防線',passive:true,defenseBonus:.30,criticalDamageReduction:.20,selfOnly:true}),
    'warwolf-assault':Object.freeze({id:'warwolf-assault',name:'戰狼突襲',firstDelayMs:2000,cooldownMs:10000,damageMultiplier:1.70,target:'random-alive-non-frontline-or-primary',debuff:Object.freeze({type:'defense-down',value:.15,durationMs:5000,stacking:'refresh-by-source'})}),
    'champion-slash':Object.freeze({id:'champion-slash',name:'勇士猛斬',cooldownMs:7000,damageMultiplier:2.10,defenseIgnore:.20,target:'primary'}),
    'unyielding-will':Object.freeze({id:'unyielding-will',name:'不屈戰意',passive:true,thresholds:Object.freeze([.75,.50,.25]),attackBonusPerStack:.06,damageReductionPerStack:.05,maxStacks:3,permanent:true}),
    'chieftain-earthsplitter':Object.freeze({id:'chieftain-earthsplitter',name:'酋長裂地斬',cooldownMs:6000,damageMultiplier:2,target:'primary',debuffs:Object.freeze([Object.freeze({type:'defense-down',value:.15,durationMs:5000,stacking:'refresh-by-source'}),Object.freeze({type:'healing-received-down',value:.15,durationMs:5000,stacking:'refresh-by-source'})])}),
    'fallen-warrior-rage':Object.freeze({id:'fallen-warrior-rage',name:'戰死者之怒',passive:true,attackBonusPerStack:.06,attackSpeedBonusPerStack:.05,maxStacks:4,permanent:true,trigger:'other-enemy-death'}),
    'skullcrusher-overlord':Object.freeze({id:'skullcrusher-overlord',name:'碎顱霸主',passive:true,threshold:.30,attackBonus:.20,damageReduction:.15,permanent:true,once:true})
  });
  const ENEMY_SKILLS=Object.freeze({'skullcrusher-berserker':BloodwarWastesPolicy.getEnemySkills('skullcrusher-berserker'),'skullcrusher-shaman':BloodwarWastesPolicy.getEnemySkills('skullcrusher-shaman'),'skullcrusher-heavy-guard':Object.freeze(['heavy-armor-line']),'skullcrusher-wolf-rider':Object.freeze(['warwolf-assault']),'skullcrusher-champion':Object.freeze(['champion-slash','unyielding-will']),'skullcrusher-great-chieftain':Object.freeze(['chieftain-earthsplitter','fallen-warrior-rage','skullcrusher-overlord'])});
  const ACTIVE_SKILLS=Object.freeze({'skullcrusher-wolf-rider':['warwolf-assault'],'skullcrusher-champion':['champion-slash'],'skullcrusher-great-chieftain':['chieftain-earthsplitter']});
  function freshTelemetry(){return {skillCasts:{},heavyGuardCriticalHits:0,heavyGuardCriticalDamagePrevented:0,wolfAssaultTargets:0,wolfAssaultBacklineTargets:0,wolfArmorBreakActiveMs:0,championThresholds:{75:0,50:0,25:0},fallenRageSources:[],fallenRageIgnoredDeaths:0,overlordTriggers:0,overlordTriggeredAt:null};}
  function createState(now=0){return {startedAt:now,nextSkillAt:{},previousHpRatio:1,unyieldingStacks:0,unyieldingTriggered:{},fallenRageStacks:0,deadEnemyIds:new Set(),overlord:false,telemetry:freshTelemetry()};}
  function record(bucket,key,amount=1){bucket[key]=(bucket[key]||0)+amount;} function getSkill(id){return SKILLS[id]||BloodwarWastesPolicy.getSkill(id)||null;} function getEnemySkills(id){return ENEMY_SKILLS[id]||Object.freeze([]);}
  function initializeSchedule(enemyId,state,now=0){for(const id of ACTIVE_SKILLS[enemyId]||[])if(!Number.isFinite(state.nextSkillAt[id]))state.nextSkillAt[id]=now+(id==='warwolf-assault'?SKILLS[id].firstDelayMs:SKILLS[id].cooldownMs);return state;}
  function resolveScheduledActions(enemyId,state,now=0){initializeSchedule(enemyId,state,state.startedAt||0);const actions=[];for(const id of ACTIVE_SKILLS[enemyId]||[]){if(now<state.nextSkillAt[id])continue;state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;record(state.telemetry.skillCasts,id);actions.push(SKILLS[id]);}return actions;}
  function chooseWarwolfTarget(units,primaryTarget,randomValue=0,isFrontline=unit=>Boolean(unit?.isFrontline)){const candidates=(units||[]).filter(unit=>unit&&unit.alive!==false&&!isFrontline(unit));if(!candidates.length)return primaryTarget||null;const index=Math.min(candidates.length-1,Math.floor(Math.max(0,Math.min(.999999,Number(randomValue)||0))*candidates.length));return candidates[index];}
  function recordWarwolfTarget(state,target,isFrontline=unit=>Boolean(unit?.isFrontline)){state.telemetry.wolfAssaultTargets++;if(target&&!isFrontline(target))state.telemetry.wolfAssaultBacklineTargets++;}
  function updateThresholds(enemyId,state,currentHp,maxHp,now=0){const ratio=Number(maxHp)>0?Math.max(0,Number(currentHp)||0)/Number(maxHp):1,previous=Number.isFinite(state.previousHpRatio)?state.previousHpRatio:1,events=[];
    if(enemyId==='skullcrusher-champion')for(const threshold of SKILLS['unyielding-will'].thresholds)if(!state.unyieldingTriggered[threshold]&&previous>threshold&&ratio<=threshold){state.unyieldingTriggered[threshold]=true;state.unyieldingStacks=Math.min(3,state.unyieldingStacks+1);state.telemetry.championThresholds[Math.round(threshold*100)]++;events.push({id:'unyielding-will',threshold,stacks:state.unyieldingStacks});}
    if(enemyId==='skullcrusher-great-chieftain'&&!state.overlord&&previous>=.30&&ratio<.30){state.overlord=true;state.telemetry.overlordTriggers++;state.telemetry.overlordTriggeredAt=now;events.push(SKILLS['skullcrusher-overlord']);}
    state.previousHpRatio=ratio;return events;}
  function recordOtherEnemyDeath(state,{enemyId,bossAlive=true,isBoss=false,atMs=0}={}){if(!bossAlive||isBoss||!enemyId||state.deadEnemyIds.has(enemyId))return false;state.deadEnemyIds.add(enemyId);if(state.fallenRageStacks>=SKILLS['fallen-warrior-rage'].maxStacks){state.telemetry.fallenRageIgnoredDeaths++;return false;}state.fallenRageStacks++;state.telemetry.fallenRageSources.push({enemyId,atMs,stack:state.fallenRageStacks});return true;}
  function getCombatMultipliers(enemyId,state){const champion=enemyId==='skullcrusher-champion'?state?.unyieldingStacks||0:0,boss=enemyId==='skullcrusher-great-chieftain',rage=boss?(state?.fallenRageStacks||0):0,overlord=boss&&state?.overlord,clean=value=>Number(value.toFixed(10));return {attack:clean(1+champion*SKILLS['unyielding-will'].attackBonusPerStack+rage*SKILLS['fallen-warrior-rage'].attackBonusPerStack+(overlord?SKILLS['skullcrusher-overlord'].attackBonus:0)),attackSpeed:clean(1+rage*SKILLS['fallen-warrior-rage'].attackSpeedBonusPerStack),defense:enemyId==='skullcrusher-heavy-guard'?1+SKILLS['heavy-armor-line'].defenseBonus:1,damageReduction:clean(champion*SKILLS['unyielding-will'].damageReductionPerStack+(overlord?SKILLS['skullcrusher-overlord'].damageReduction:0))};}
  function getHeavyGuardCriticalDamageMultiplier(critical){return critical?1-SKILLS['heavy-armor-line'].criticalDamageReduction:1;} function recordHeavyGuardCritical(state,damageBefore,damageAfter){state.telemetry.heavyGuardCriticalHits++;state.telemetry.heavyGuardCriticalDamagePrevented+=Math.max(0,(Number(damageBefore)||0)-(Number(damageAfter)||0));} function recordWolfArmorBreakCoverage(state,elapsedMs){state.telemetry.wolfArmorBreakActiveMs+=Math.max(0,Number(elapsedMs)||0);}
  return Object.freeze({MAP_ID,SKILLS,ENEMY_SKILLS,getSkill,getEnemySkills,createState,initializeSchedule,resolveScheduledActions,chooseWarwolfTarget,recordWarwolfTarget,updateThresholds,recordOtherEnemyDeath,getCombatMultipliers,getHeavyGuardCriticalDamageMultiplier,recordHeavyGuardCritical,recordWolfArmorBreakCoverage});
});

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.AncientAltarPolicy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAP_ID='ancient-altar';
  const SKILLS=Object.freeze({
    'fel-prayer':Object.freeze({id:'fel-prayer',name:'邪能祈禱',cooldownMs:10000,target:'lowest-hp-ratio-alive-enemy',healMaxHpRatio:.10}),
    'death-sacrifice':Object.freeze({id:'death-sacrifice',name:'死亡獻祭',trigger:'self-death',target:'all-other-alive-enemies',buff:Object.freeze({type:'death-sacrifice',attackBonus:.10,durationMs:6000,stacking:'refresh-by-name'})}),
    'petrified-body':Object.freeze({id:'petrified-body',name:'石化之軀',passive:true,defenseBonus:.25,dotDamageReduction:.20,selfOnly:true}),
    'rune-shield':Object.freeze({id:'rune-shield',name:'符文護盾',firstDelayMs:3000,cooldownMs:10000,shieldMaxHpRatio:.10,durationMs:5000,shieldSource:'rune-shield',stacking:'replace-by-source'}),
    'awakened-smash':Object.freeze({id:'awakened-smash',name:'覺醒重擊',cooldownMs:7000,damageMultiplier:2.10,target:'primary',debuff:Object.freeze({type:'attack-down',value:.15,durationMs:5000,stacking:'refresh-by-source'})}),
    'awakened-rune':Object.freeze({id:'awakened-rune',name:'覺醒符文',passive:true,threshold:.50,shieldMaxHpRatio:.20,shieldSource:'awakened-rune',attackBonus:.20,buffWhileShield:true,once:true}),
    'fallen-flame':Object.freeze({id:'fallen-flame',name:'墮落之火',cooldownMs:6000,damageMultiplier:1.50,target:'random-alive-player',dot:Object.freeze({type:'fallen-burn',attackRatio:.25,durationMs:6000,tickMs:2000,ticks:3,stacking:'refresh-by-source'})}),
    'blood-sacrifice':Object.freeze({id:'blood-sacrifice',name:'血祭',cooldownMs:15000,target:'lowest-hp-ratio-other-alive-enemy',currentHpCostRatio:.20,minRemainingHp:1,shieldMaxHpRatio:.08,shieldSource:'blood-sacrifice',attackBonus:.15,durationMs:6000,stacking:'replace-by-source'}),
    'forbidden-ritual':Object.freeze({id:'forbidden-ritual',name:'禁忌儀式',passive:true,threshold:.30,shieldMaxHpRatio:.15,shieldSource:'forbidden-ritual',attackBonus:.25,buffWhileShield:true,once:true})
  });
  const ENEMY_SKILLS=Object.freeze({'skullcrusher-priest':Object.freeze(['fel-prayer']),'skullcrusher-fanatic':Object.freeze(['death-sacrifice']),'ancient-stoneguard':Object.freeze(['petrified-body']),'rune-guard':Object.freeze(['rune-shield']),'awakened-guard':Object.freeze(['awakened-smash','awakened-rune']),'fallen-high-priest':Object.freeze(['fallen-flame','blood-sacrifice','forbidden-ritual'])});
  const ACTIVE_SKILLS=Object.freeze({'skullcrusher-priest':['fel-prayer'],'rune-guard':['rune-shield'],'awakened-guard':['awakened-smash'],'fallen-high-priest':['fallen-flame','blood-sacrifice']});
  function freshTelemetry(){return {skillAttempts:{},skillCasts:{},felPrayerHeals:0,felPrayerEffectiveHealing:0,deathSacrificeTriggers:0,deathSacrificeTargets:0,petrifiedDotDamagePrevented:0,shieldGenerated:{},shieldAbsorbed:{},shieldExpired:{},shieldBrokenAt:{},awakenedRuneTriggers:0,fallenBurnApplications:0,fallenBurnTicks:0,bloodSacrificeTargets:[],bloodSacrificeHpSpent:0,forbiddenRitualTriggers:0};}
  function createState(now=0){return {startedAt:now,nextSkillAt:{},previousHpRatio:1,deathTriggeredIds:new Set(),awakenedRuneTriggered:false,forbiddenRitualTriggered:false,shields:{},bloodSacrificeBuffUntil:0,telemetry:freshTelemetry()};}
  function record(bucket,key,amount=1){bucket[key]=(bucket[key]||0)+amount;} function getSkill(id){return SKILLS[id]||null;} function getEnemySkills(id){return ENEMY_SKILLS[id]||Object.freeze([]);}
  function initializeSchedule(enemyId,state,now=0){for(const id of ACTIVE_SKILLS[enemyId]||[])if(!Number.isFinite(state.nextSkillAt[id]))state.nextSkillAt[id]=now+(id==='rune-shield'?SKILLS[id].firstDelayMs:SKILLS[id].cooldownMs);return state;}
  function resolveScheduledActions(enemyId,state,now=0,context={}){initializeSchedule(enemyId,state,state.startedAt||0);const actions=[];for(const id of ACTIVE_SKILLS[enemyId]||[]){if(now<state.nextSkillAt[id])continue;state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;record(state.telemetry.skillAttempts,id);if(id==='blood-sacrifice'&&!(Number(context.otherAliveEnemies)>0))continue;record(state.telemetry.skillCasts,id);actions.push(SKILLS[id]);}return actions;}
  function chooseLowestHpRatio(units,excludeId=null){return (units||[]).filter(unit=>unit&&unit.alive!==false&&unit.id!==excludeId).map((unit,index)=>({unit,index,ratio:Number(unit.maxHp)>0?Number(unit.currentHp)/Number(unit.maxHp):1})).sort((a,b)=>a.ratio-b.ratio||a.index-b.index)[0]?.unit||null;}
  function applySourceShield(state,source,amount,now=0,durationMs=null){const value=Math.max(0,Number(amount)||0),expiresAt=Number(durationMs)>0?now+durationMs:null;state.shields[source]={source,value,maxValue:value,appliedAt:now,expiresAt};record(state.telemetry.shieldGenerated,source,value);return state.shields[source];}
  function expireShields(state,now=0){for(const[source,shield]of Object.entries(state.shields))if(shield.expiresAt!==null&&now>=shield.expiresAt){record(state.telemetry.shieldExpired,source,shield.value);delete state.shields[source];}}
  function absorbSourceShield(state,source,damage,now=0){expireShields(state,now);const shield=state.shields[source];if(!shield)return {absorbed:0,remainingDamage:Math.max(0,Number(damage)||0),broken:false};const incoming=Math.max(0,Number(damage)||0),absorbed=Math.min(shield.value,incoming);shield.value-=absorbed;record(state.telemetry.shieldAbsorbed,source,absorbed);const broken=shield.value<=0;if(broken){state.telemetry.shieldBrokenAt[source]=now;delete state.shields[source];}return {absorbed,remainingDamage:incoming-absorbed,broken};}
  function hasShield(state,source,now=0){expireShields(state,now);return (state.shields[source]?.value||0)>0;}
  function updateThresholds(enemyId,state,currentHp,maxHp,now=0){const ratio=Number(maxHp)>0?Math.max(0,Number(currentHp)||0)/Number(maxHp):1,previous=Number.isFinite(state.previousHpRatio)?state.previousHpRatio:1,events=[];
    if(enemyId==='awakened-guard'&&!state.awakenedRuneTriggered&&previous>=.50&&ratio<.50){state.awakenedRuneTriggered=true;state.telemetry.awakenedRuneTriggers++;events.push(SKILLS['awakened-rune']);}
    if(enemyId==='fallen-high-priest'&&!state.forbiddenRitualTriggered&&previous>=.30&&ratio<.30){state.forbiddenRitualTriggered=true;state.telemetry.forbiddenRitualTriggers++;events.push(SKILLS['forbidden-ritual']);}
    state.previousHpRatio=ratio;return events;}
  function resolveFanaticDeath(state,fanaticId,otherAliveCount){if(!fanaticId||state.deathTriggeredIds.has(fanaticId))return false;state.deathTriggeredIds.add(fanaticId);if(!(Number(otherAliveCount)>0))return false;state.telemetry.deathSacrificeTriggers++;state.telemetry.deathSacrificeTargets+=Math.floor(otherAliveCount);return true;}
  function getCombatMultipliers(enemyId,state,now=0){return {attack:1+(enemyId==='awakened-guard'&&hasShield(state,'awakened-rune',now)?SKILLS['awakened-rune'].attackBonus:0)+(enemyId==='fallen-high-priest'&&now<state.bloodSacrificeBuffUntil?SKILLS['blood-sacrifice'].attackBonus:0)+(enemyId==='fallen-high-priest'&&hasShield(state,'forbidden-ritual',now)?SKILLS['forbidden-ritual'].attackBonus:0),defense:enemyId==='ancient-stoneguard'?1+SKILLS['petrified-body'].defenseBonus:1,dotDamage:enemyId==='ancient-stoneguard'?1-SKILLS['petrified-body'].dotDamageReduction:1};}
  function resolveBloodSacrifice(currentHp){const hp=Math.max(1,Number(currentHp)||1),spent=Math.min(hp-SKILLS['blood-sacrifice'].minRemainingHp,hp*SKILLS['blood-sacrifice'].currentHpCostRatio);return {spent:Math.max(0,spent),remaining:hp-Math.max(0,spent)};}
  function recordFelPrayer(state,requested,effective){state.telemetry.felPrayerHeals++;state.telemetry.felPrayerEffectiveHealing+=Math.max(0,Number(effective)||0);} function recordPetrifiedDotReduction(state,before,after){state.telemetry.petrifiedDotDamagePrevented+=Math.max(0,(Number(before)||0)-(Number(after)||0));}
  function recordFallenBurn(state,kind){if(kind==='application')state.telemetry.fallenBurnApplications++;if(kind==='tick')state.telemetry.fallenBurnTicks++;} function recordBloodSacrifice(state,targetId,spent,now){state.telemetry.bloodSacrificeTargets.push({targetId,atMs:now});state.telemetry.bloodSacrificeHpSpent+=Math.max(0,Number(spent)||0);state.bloodSacrificeBuffUntil=now+SKILLS['blood-sacrifice'].durationMs;}
  return Object.freeze({MAP_ID,SKILLS,ENEMY_SKILLS,getSkill,getEnemySkills,createState,initializeSchedule,resolveScheduledActions,chooseLowestHpRatio,applySourceShield,expireShields,absorbSourceShield,hasShield,updateThresholds,resolveFanaticDeath,getCombatMultipliers,resolveBloodSacrifice,recordFelPrayer,recordPetrifiedDotReduction,recordFallenBurn,recordBloodSacrifice});
});

(function(root,factory){const dependency=typeof module==='object'&&module.exports?require('./ancient-altar-policy.js'):root.AncientAltarPolicy;const api=factory(dependency);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RedrockTemplePolicy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(AncientAltarPolicy){
  'use strict';
  const MAP_ID='redrock-temple',FINAL_BOSS_ID='redrock-ancient-god';
  const SHIELD_SOURCES=Object.freeze({runeBlessing:'rune-blessing',guardianRune:'temple-guardian-rune',ancientGuardianRune:'ancient-rune-guardian',divineWrath:'redrock-divine-wrath'});
  const SKILLS=Object.freeze({
    'temple-bulwark':Object.freeze({id:'temple-bulwark',name:'聖殿壁壘',passive:true,defenseBonus:.25,allyDamageReduction:.10,selfExcluded:true,requiresLivingSource:true,stacking:'maximum-by-name'}),
    'rune-overload':Object.freeze({id:'rune-overload',name:'符文過載',cooldownMs:10000,durationMs:4000,attackBonus:.25,attackSpeedBonus:.20,stacking:'refresh-by-name'}),
    execution:Object.freeze({id:'execution',name:'處決',cooldownMs:8000,target:'lowest-hp-ratio-alive-player',damageMultiplier:1.60,lowHpThreshold:.30,lowHpDamageMultiplier:2.20}),
    'rune-blessing':Object.freeze({id:'rune-blessing',name:'符文祝禱',cooldownMs:12000,target:'lowest-hp-ratio-alive-enemy',shieldMaxHpRatio:.12,durationMs:6000,shieldSource:SHIELD_SOURCES.runeBlessing,stacking:'replace-by-source'}),
    'guardian-smash':Object.freeze({id:'guardian-smash',name:'守護重擊',cooldownMs:7000,damageMultiplier:2.20,target:'primary',debuff:Object.freeze({type:'defense-down',value:.15,durationMs:5000,stacking:'refresh-by-source'})}),
    'guardian-rune':Object.freeze({id:'guardian-rune',name:'守護符文',passive:true,threshold:.50,shieldMaxHpRatio:.25,shieldSource:SHIELD_SOURCES.guardianRune,damageBonus:.20,attackSpeedBonus:.15,buffWhileShield:true,once:true}),
    'shield-shatter':Object.freeze({id:'shield-shatter',name:'護盾破裂',triggerShieldSource:SHIELD_SOURCES.guardianRune,selfMaxHpDamageRatio:.05,damageType:'special',canCrit:false,once:true}),
    'ancient-god-smash':Object.freeze({id:'ancient-god-smash',name:'古神重擊',cooldownMs:6000,damageMultiplier:2,target:'primary',mark:Object.freeze({maxStacks:3,damageTakenPerStack:.05,durationMs:10000,sourceBossId:FINAL_BOSS_ID})}),
    'ancient-rune':Object.freeze({id:'ancient-rune',name:'遠古符文',cooldownMs:12000,awakenedCooldownMs:10000,durationMs:6000,variants:Object.freeze(['war','guardian','weakening']),warAttackBonus:.20,guardianShieldMaxHpRatio:.10,guardianShieldSource:SHIELD_SOURCES.ancientGuardianRune,weakeningAttackPenalty:.10,singleActive:true}),
    'ancient-awakening':Object.freeze({id:'ancient-awakening',name:'古神甦醒',passive:true,threshold:.70,attackSpeedBonus:.15,permanent:true,once:true}),
    'redrock-divine-wrath':Object.freeze({id:'redrock-divine-wrath',name:'赤岩神怒',passive:true,threshold:.30,shieldMaxHpRatio:.15,shieldSource:SHIELD_SOURCES.divineWrath,attackBonus:.20,attackSpeedBonus:.15,buffWhileShield:true,once:true})
  });
  const ENEMY_SKILLS=Object.freeze({'temple-stoneguard':Object.freeze(['temple-bulwark']),'rune-golem':Object.freeze(['rune-overload']),'temple-executioner':Object.freeze(['execution']),'ancient-priest':Object.freeze(['rune-blessing']),'temple-guardian':Object.freeze(['guardian-smash','guardian-rune','shield-shatter']),[FINAL_BOSS_ID]:Object.freeze(['ancient-god-smash','ancient-rune','ancient-awakening','redrock-divine-wrath'])});
  const ACTIVE_SKILLS=Object.freeze({'rune-golem':['rune-overload'],'temple-executioner':['execution'],'ancient-priest':['rune-blessing'],'temple-guardian':['guardian-smash'],[FINAL_BOSS_ID]:['ancient-god-smash','ancient-rune']});
  function freshTelemetry(){return {skillCasts:{},bulwarkActiveMs:0,runeOverloadCasts:0,executionCasts:0,executionEmpowered:0,runeBlessingAbsorbed:0,guardianRuneTriggers:0,guardianRuneBrokenAt:null,guardianShatterDamage:0,markApplications:0,markMaxStacks:0,markActiveMs:0,ancientRuneRolls:{war:0,guardian:0,weakening:0},awakeningTriggers:0,awakeningTriggeredAt:null,runeCooldownChanges:0,divineWrathTriggers:0,divineWrathBrokenAt:null,shieldGenerated:{},shieldAbsorbed:{},shieldExpired:{},shieldBrokenAt:{}};}
  function createState(now=0){return {startedAt:now,nextSkillAt:{},previousHpRatio:1,runeOverloadUntil:0,guardianRuneTriggered:false,guardianShatterTriggered:false,awakened:false,divineWrathTriggered:false,marksByTarget:{},ancientRune:null,shields:{},telemetry:freshTelemetry()};}
  function record(bucket,key,amount=1){bucket[key]=(bucket[key]||0)+amount;} function getSkill(id){return SKILLS[id]||null;} function getEnemySkills(id){return ENEMY_SKILLS[id]||Object.freeze([]);}
  function initializeSchedule(enemyId,state,now=0){for(const id of ACTIVE_SKILLS[enemyId]||[])if(!Number.isFinite(state.nextSkillAt[id]))state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;return state;}
  function resolveScheduledActions(enemyId,state,now=0){initializeSchedule(enemyId,state,state.startedAt||0);const actions=[];for(const id of ACTIVE_SKILLS[enemyId]||[]){if(now<state.nextSkillAt[id])continue;const cooldown=id==='ancient-rune'&&state.awakened?SKILLS[id].awakenedCooldownMs:SKILLS[id].cooldownMs;state.nextSkillAt[id]=now+cooldown;record(state.telemetry.skillCasts,id);if(id==='rune-overload')state.telemetry.runeOverloadCasts++;if(id==='execution')state.telemetry.executionCasts++;actions.push(SKILLS[id]);}return actions;}
  function chooseLowestHpRatio(units){return (units||[]).filter(unit=>unit&&unit.alive!==false).map((unit,index)=>({unit,index,ratio:Number(unit.maxHp)>0?Number(unit.currentHp)/Number(unit.maxHp):1})).sort((a,b)=>a.ratio-b.ratio||a.index-b.index)[0]?.unit||null;}
  function activateRuneOverload(state,now){state.runeOverloadUntil=now+SKILLS['rune-overload'].durationMs;} function getExecutionMultiplier(targetHp,maxHp,state){const empowered=Number(maxHp)>0&&Number(targetHp)/Number(maxHp)<=SKILLS.execution.lowHpThreshold;if(empowered&&state)state.telemetry.executionEmpowered++;return empowered?SKILLS.execution.lowHpDamageMultiplier:SKILLS.execution.damageMultiplier;}
  function getRuneBlessingSource(casterId){return `${SHIELD_SOURCES.runeBlessing}:${casterId}`;}
  function updateThresholds(enemyId,state,currentHp,maxHp,now=0){const ratio=Number(maxHp)>0?Math.max(0,Number(currentHp)||0)/Number(maxHp):1,previous=Number.isFinite(state.previousHpRatio)?state.previousHpRatio:1,events=[];
    if(enemyId==='temple-guardian'&&!state.guardianRuneTriggered&&previous>=.50&&ratio<.50){state.guardianRuneTriggered=true;state.telemetry.guardianRuneTriggers++;events.push(SKILLS['guardian-rune']);}
    if(enemyId===FINAL_BOSS_ID&&!state.awakened&&previous>=.70&&ratio<.70){state.awakened=true;state.telemetry.awakeningTriggers++;state.telemetry.awakeningTriggeredAt=now;state.telemetry.runeCooldownChanges++;events.push(SKILLS['ancient-awakening']);}
    if(enemyId===FINAL_BOSS_ID&&!state.divineWrathTriggered&&previous>=.30&&ratio<.30){state.divineWrathTriggered=true;state.telemetry.divineWrathTriggers++;events.push(SKILLS['redrock-divine-wrath']);}
    state.previousHpRatio=ratio;return events;}
  function resolveGuardianShieldBreak(state,source,maxHp,now=0){if(source!==SHIELD_SOURCES.guardianRune||state.guardianShatterTriggered)return 0;state.guardianShatterTriggered=true;state.telemetry.guardianRuneBrokenAt=now;const damage=Math.max(0,Number(maxHp)||0)*SKILLS['shield-shatter'].selfMaxHpDamageRatio;state.telemetry.guardianShatterDamage+=damage;return damage;}
  function resolveDivineWrathBreak(state,source,now=0){if(source!==SHIELD_SOURCES.divineWrath)return false;state.telemetry.divineWrathBrokenAt=now;return true;}
  function applyAncientMark(state,targetId,now=0){const current=state.marksByTarget[targetId],stacks=Math.min(SKILLS['ancient-god-smash'].mark.maxStacks,(current&&now<current.until?current.stacks:0)+1);state.marksByTarget[targetId]={stacks,until:now+SKILLS['ancient-god-smash'].mark.durationMs};state.telemetry.markApplications++;state.telemetry.markMaxStacks=Math.max(state.telemetry.markMaxStacks,stacks);return state.marksByTarget[targetId];}
  function getAncientMarkDamageMultiplier(state,targetId,sourceEnemyId,now=0){const mark=state.marksByTarget[targetId];if(!mark||now>=mark.until||sourceEnemyId!==FINAL_BOSS_ID)return 1;return 1+mark.stacks*SKILLS['ancient-god-smash'].mark.damageTakenPerStack;}
  function activateAncientRune(state,randomValue,now=0){const variants=SKILLS['ancient-rune'].variants,index=Math.min(2,Math.floor(Math.max(0,Math.min(.999999,Number(randomValue)||0))*3)),type=variants[index];if(state.ancientRune?.type==='guardian')delete state.shields[SHIELD_SOURCES.ancientGuardianRune];state.ancientRune={type,until:now+SKILLS['ancient-rune'].durationMs};state.telemetry.ancientRuneRolls[type]++;return state.ancientRune;}
  function expireAncientRune(state,now=0){if(!state.ancientRune||now<state.ancientRune.until)return false;if(state.ancientRune.type==='guardian')delete state.shields[SHIELD_SOURCES.ancientGuardianRune];state.ancientRune=null;return true;}
  function getPlayerAttackMultiplier(state,now=0){expireAncientRune(state,now);return state.ancientRune?.type==='weakening'?1-SKILLS['ancient-rune'].weakeningAttackPenalty:1;}
  function getBulwarkDamageReduction(livingStoneguards,targetIsStoneguard=false){const sources=Math.max(0,Number(livingStoneguards)||0)-(targetIsStoneguard?1:0);return sources>0?SKILLS['temple-bulwark'].allyDamageReduction:0;}
  function getCombatMultipliers(enemyId,state,now=0){expireAncientRune(state,now);const guardian=enemyId==='temple-guardian'&&AncientAltarPolicy.hasShield(state,SHIELD_SOURCES.guardianRune,now),boss=enemyId===FINAL_BOSS_ID,war=boss&&state.ancientRune?.type==='war'&&now<state.ancientRune.until,wrath=boss&&AncientAltarPolicy.hasShield(state,SHIELD_SOURCES.divineWrath,now),clean=value=>Number(value.toFixed(10));return {attack:clean(1+(enemyId==='rune-golem'&&now<state.runeOverloadUntil?SKILLS['rune-overload'].attackBonus:0)+(war?SKILLS['ancient-rune'].warAttackBonus:0)+(wrath?SKILLS['redrock-divine-wrath'].attackBonus:0)),attackSpeed:clean(1+(enemyId==='rune-golem'&&now<state.runeOverloadUntil?SKILLS['rune-overload'].attackSpeedBonus:0)+(guardian?SKILLS['guardian-rune'].attackSpeedBonus:0)+(boss&&state.awakened?SKILLS['ancient-awakening'].attackSpeedBonus:0)+(wrath?SKILLS['redrock-divine-wrath'].attackSpeedBonus:0)),damage:guardian?1+SKILLS['guardian-rune'].damageBonus:1,defense:enemyId==='temple-stoneguard'?1+SKILLS['temple-bulwark'].defenseBonus:1};}
  function recordCoverage(state,{bulwark=false,mark=false}={},elapsedMs=0){const ms=Math.max(0,Number(elapsedMs)||0);if(bulwark)state.telemetry.bulwarkActiveMs+=ms;if(mark)state.telemetry.markActiveMs+=ms;} function recordRuneBlessingAbsorption(state,amount){state.telemetry.runeBlessingAbsorbed+=Math.max(0,Number(amount)||0);}
  return Object.freeze({MAP_ID,FINAL_BOSS_ID,SHIELD_SOURCES,SKILLS,ENEMY_SKILLS,getSkill,getEnemySkills,createState,initializeSchedule,resolveScheduledActions,chooseLowestHpRatio,activateRuneOverload,getExecutionMultiplier,getRuneBlessingSource,updateThresholds,resolveGuardianShieldBreak,resolveDivineWrathBreak,applyAncientMark,getAncientMarkDamageMultiplier,activateAncientRune,expireAncientRune,getPlayerAttackMultiplier,getBulwarkDamageReduction,getCombatMultipliers,recordCoverage,recordRuneBlessingAbsorption,applySourceShield:AncientAltarPolicy.applySourceShield,expireShields:AncientAltarPolicy.expireShields,absorbSourceShield:AncientAltarPolicy.absorbSourceShield,hasShield:AncientAltarPolicy.hasShield});
});

(function (root, factory) {
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./skullcrusher-war-camp-policy.js') : root.SkullcrusherWarCampPolicy,
    node ? require('./ancient-altar-policy.js') : root.AncientAltarPolicy,
    node ? require('./redrock-temple-policy.js') : root.RedrockTemplePolicy,
    node ? require('./bloodwar-wastes-policy.js') : root.BloodwarWastesPolicy);
  if (node) module.exports = api;
  if (root) root.ChapterThreeLateCombatPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Camp, Altar, Temple, Bloodwar) {
  'use strict';
  const POLICIES = { 'skullcrusher-war-camp': Camp, 'ancient-altar': Altar, 'redrock-temple': Temple };
  // Base values copied from TEST V1; skills come exclusively from the formal policies.
  // 3-6 values are a player-approved first-playtest reference, not a balance baseline.
  const BASES = Object.freeze({
    'skullcrusher-berserker': [1180,111,68,.92,4,8,10],
    'skullcrusher-shaman': [960,87,58,.88,5,0,8],
    'skullcrusher-heavy-guard': [1520,96,112,.66,1,20,22],
    'skullcrusher-wolf-rider': [1230,116,72,1.05,8,5,10],
    'skullcrusher-champion': [3950,150,128,.84,4,18,26],
    'skullcrusher-great-chieftain': [20000,180,148,.82,3,20,28],
    'skullcrusher-priest': [1080,92,64,.82,5,0,9],
    'skullcrusher-fanatic': [1260,122,70,.96,5,5,10],
    'ancient-stoneguard': [1620,101,120,.64,0,12,23],
    'rune-guard': [1340,108,91,.78,3,12,16],
    'awakened-guard': [4300,156,136,.78,2,18,27],
    'fallen-high-priest': [22500,187,154,.80,4,15,29],
    'temple-stoneguard': [1780,108,128,.62,0,14,24],
    'rune-golem': [1620,116,105,.70,0,10,19],
    'temple-executioner': [1430,132,82,.90,5,8,12],
    'ancient-priest': [1150,94,68,.80,5,0,10],
    'temple-guardian': [4750,164,145,.76,2,20,29],
    'redrock-ancient-god': [26000,198,165,.78,2,18,31]
  });
  function isSupported(mapId) { return Boolean(POLICIES[mapId]); }
  function getMonster(mapId, definition) {
    if (!isSupported(mapId) || !definition || !POLICIES[mapId].getEnemySkills(definition.id).length) return null;
    const values = BASES[definition.id];
    if (!values) return null;
    const [maxHp, attack, defense, attackSpeed, evasion, parry, damageReduction] = values;
    return { ...definition, maxHp, attack, defense, attackSpeed, evasion, parry, damageReduction,
      mapId, chapter: 3, level: 30, xp: 0, gold: 0,
      faction: mapId === Camp.MAP_ID ? 'skullcrusher-tribe' : 'ancient-guardians',
      isBoss: definition.rank === 'boss', isElite: definition.rank === 'elite',
      artClass: `monster-image-art ${definition.id}`, skillIds: POLICIES[mapId].getEnemySkills(definition.id) };
  }
  function createState(mapId, now) {
    const state = POLICIES[mapId].createState(now);
    state.shields = state.shields || {};
    for (const key of ['shieldGenerated', 'shieldAbsorbed', 'shieldExpired', 'shieldBrokenAt']) state.telemetry[key] = state.telemetry[key] || {};
    if (mapId === Camp.MAP_ID) state.inherited = Bloodwar.createState(now);
    state.pendingActions = [];
    state.deathHandled = false;
    return state;
  }
  function living(units) { return units.filter(unit => !unit.isFacility && unit.currentHp > 0); }
  function shield(unit, skill, now, source = skill.shieldSource) {
    Altar.applySourceShield(unit.state, source, unit.maxHp * skill.shieldMaxHpRatio, now, skill.durationMs);
  }
  function thresholds(mapId, unit, now, emit = () => {}) {
    if (unit.isFacility || unit.currentHp <= 0) return;
    const policy = POLICIES[mapId];
    for (const skill of policy.updateThresholds(unit.id, unit.state, unit.currentHp, unit.maxHp, now)) {
      if (skill.shieldMaxHpRatio) shield(unit, skill, now);
      emit(unit, skill);
    }
    if (mapId === Camp.MAP_ID && unit.id === 'skullcrusher-berserker') {
      for (const skill of Bloodwar.updateThresholds(unit.id, unit.state.inherited, unit.currentHp, unit.maxHp, now)) emit(unit, skill);
    }
  }
  function death(mapId, unit, units, now, emit = () => {}) {
    if (unit.isFacility || unit.state.deathHandled) return;
    unit.state.deathHandled = true;
    const others = living(units).filter(other => other.key !== unit.key);
    if (mapId === Camp.MAP_ID && !unit.isBoss) for (const boss of others.filter(other => other.id === 'skullcrusher-great-chieftain')) {
      if (Camp.recordOtherEnemyDeath(boss.state, { enemyId: unit.key, bossAlive: true, atMs: now })) emit(boss, Camp.SKILLS['fallen-warrior-rage']);
    }
    if (mapId === Altar.MAP_ID && unit.id === 'skullcrusher-fanatic'
      && Altar.resolveFanaticDeath(unit.state, unit.key, others.length)) {
      const skill = Altar.SKILLS['death-sacrifice'];
      others.forEach(other => { other.state.deathSacrificeUntil = now + skill.buff.durationMs; });
      emit(unit, skill);
    }
  }
  function tick(mapId, units, players, now, emit = () => {}, random = Math.random) {
    const policy = POLICIES[mapId];
    if (!policy) return;
    units.forEach(unit => {
      if (unit.isFacility) return;
      if (unit.currentHp <= 0) { death(mapId, unit, units, now, emit); return; }
      Altar.expireShields(unit.state, now);
      thresholds(mapId, unit, now, emit);
      const totem = unit.state.warbloodBuff;
      if (totem && totem.ticks > 0 && now >= totem.nextTickAt) {
        const ticks = Math.min(totem.ticks, Math.floor((now - totem.nextTickAt) / totem.tickMs) + 1);
        unit.currentHp = Math.min(unit.maxHp, unit.currentHp + unit.maxHp * totem.healRatio * ticks);
        totem.ticks -= ticks; totem.nextTickAt += ticks * totem.tickMs;
      }
      if (unit.controlled) return;
      let actions = policy.resolveScheduledActions(unit.id, unit.state, now, { otherAliveEnemies: living(units).length - 1 });
      if (mapId === Camp.MAP_ID && unit.id === 'skullcrusher-shaman') {
        actions = Bloodwar.resolveScheduledActions(unit.id, unit.state.inherited, now);
      }
      for (const skill of actions) {
        emit(unit, skill);
        if (skill.damageMultiplier) { unit.state.pendingActions.push(skill); continue; }
        if (skill.id === 'fel-prayer') {
          const target = Altar.chooseLowestHpRatio(living(units));
          if (target) {
            const heal = Math.min(target.maxHp - target.currentHp, target.maxHp * skill.healMaxHpRatio);
            target.currentHp += heal;
            Altar.recordFelPrayer(unit.state, target.maxHp * skill.healMaxHpRatio, heal);
          }
        } else if (skill.id === 'warblood-totem') {
          living(units).forEach(target => { target.state.warbloodBuff = { ...skill.buff, until: now + skill.buff.durationMs, nextTickAt: now + skill.buff.tickMs }; });
        } else if (skill.id === 'blood-sacrifice') {
          const target = Altar.chooseLowestHpRatio(living(units), unit.id);
          if (target) {
            const cost = Altar.resolveBloodSacrifice(target.currentHp);
            target.currentHp = cost.remaining;
            shield(unit, skill, now);
            Altar.recordBloodSacrifice(unit.state, target.key, cost.spent, now);
          }
        } else if (skill.id === 'rune-shield') shield(unit, skill, now);
        else if (skill.id === 'rune-blessing') {
          const target = Temple.chooseLowestHpRatio(living(units));
          if (target) shield(target, skill, now, Temple.getRuneBlessingSource(unit.key));
        } else if (skill.id === 'rune-overload') Temple.activateRuneOverload(unit.state, now);
        else if (skill.id === 'ancient-rune') {
          const rune = Temple.activateAncientRune(unit.state, random(), now);
          if (rune.type === 'guardian') shield(unit, { ...skill, shieldMaxHpRatio: skill.guardianShieldMaxHpRatio }, now, skill.guardianShieldSource);
        }
      }
    });
  }
  function modifiers(mapId, unit, units, now) {
    const policy = POLICIES[mapId];
    if (!policy || unit.isFacility) return { attack: 1, defense: 1, attackSpeed: 1, damage: 1, damageReduction: 0, dotDamage: 1 };
    const values = { attack: 1, defense: 1, attackSpeed: 1, damage: 1, damageReduction: 0, dotDamage: 1,
      ...policy.getCombatMultipliers(unit.id, unit.state, now) };
    if (mapId === Camp.MAP_ID && unit.id === 'skullcrusher-berserker') {
      const inherited = Bloodwar.getCombatMultipliers(unit.id, unit.state.inherited);
      values.attack *= inherited.attack; values.attackSpeed *= inherited.attackSpeed;
    }
    if (mapId === Camp.MAP_ID && now < (unit.state.warbloodBuff?.until || 0)) values.attack *= 1 + Bloodwar.SKILLS['warblood-totem'].buff.attackBonus;
    if (now < unit.state.deathSacrificeUntil) values.attack *= 1 + Altar.SKILLS['death-sacrifice'].buff.attackBonus;
    if (mapId === Temple.MAP_ID) values.damageReduction += Temple.getBulwarkDamageReduction(living(units).filter(other => other.id === 'temple-stoneguard').length, unit.id === 'temple-stoneguard');
    return values;
  }
  function absorb(mapId, unit, damage, now) {
    let remaining = Math.max(0, damage);
    for (const source of Object.keys(unit.state.shields || {})) {
      const result = Altar.absorbSourceShield(unit.state, source, remaining, now);
      remaining = result.remainingDamage;
      if (source.startsWith(Temple.SHIELD_SOURCES.runeBlessing)) Temple.recordRuneBlessingAbsorption(unit.state, result.absorbed);
      if (mapId === Temple.MAP_ID && result.broken) {
        const shatter = Temple.resolveGuardianShieldBreak(unit.state, source, unit.maxHp, now);
        if (shatter) unit.currentHp = Math.max(0, unit.currentHp - shatter);
        Temple.resolveDivineWrathBreak(unit.state, source, now);
      }
    }
    return remaining;
  }
  function selectTarget(mapId, unit, skill, players, primary, random = Math.random) {
    const alive = players.filter(player => player.alive && player.currentHp > 0);
    if (!skill) return primary;
    if (skill.id === 'warwolf-assault') return Camp.chooseWarwolfTarget(alive, primary, random(), player => player.job === 'warrior');
    if (skill.target === 'lowest-hp-ratio-alive-player') return Temple.chooseLowestHpRatio(alive);
    if (skill.target === 'random-alive-player') return alive[Math.min(alive.length - 1, Math.floor(random() * alive.length))] || primary;
    return primary;
  }
  function applyDebuff(player, definition, now) {
    player.chapterThreeDebuffs = player.chapterThreeDebuffs || {};
    player.chapterThreeDebuffs[definition.type] = { value: definition.value, until: now + definition.durationMs };
  }
  function playerMultiplier(player, type, now) {
    const debuff = player?.chapterThreeDebuffs?.[type];
    return debuff && now < debuff.until ? 1 - debuff.value : 1;
  }
  function playerAttackMultiplier(mapId, player, units, now) {
    const weakened = mapId === Temple.MAP_ID ? Math.min(1, ...living(units).filter(unit => unit.id === Temple.FINAL_BOSS_ID).map(unit => Temple.getPlayerAttackMultiplier(unit.state, now))) : 1;
    return weakened * playerMultiplier(player, 'attack-down', now);
  }
  function hit(mapId, unit, skill, target, units, now) {
    if (!skill) return;
    for (const debuff of [...(skill.debuffs || []), ...(skill.debuff ? [skill.debuff] : [])]) applyDebuff(target, debuff, now);
    if (skill.dot) {
      const dot = skill.dot;
      target.chapterThreeBurn = { sourceKey: unit.key, damage: unit.attack * dot.attackRatio, nextTickAt: now + dot.tickMs,
        ticks: dot.ticks, tickMs: dot.tickMs, expiresAt: now + dot.durationMs };
      Altar.recordFallenBurn(unit.state, 'application');
    }
    if (skill.id === 'ancient-god-smash') Temple.applyAncientMark(unit.state, target.id, now);
    if (skill.id === 'warwolf-assault') Camp.recordWarwolfTarget(unit.state, target, player => player.job === 'warrior');
  }
  return Object.freeze({ BASES, isSupported, getMonster, createState, thresholds, death, tick, modifiers, absorb,
    selectTarget, hit, playerMultiplier, playerAttackMultiplier });
});

(function attachEliteAffixPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EliteAffixPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEliteAffixPolicy() {
  'use strict';

  const AFFIXES = Object.freeze({
    frenzy: Object.freeze({ id: 'frenzy', name: '狂暴', description: '攻擊速度 +20%', weight: 30, attackSpeedMultiplier: 1.20 }),
    bloodthirst: Object.freeze({ id: 'bloodthirst', name: '嗜血', description: '直接傷害的 10% 恢復自身生命', weight: 18, directDamageLeech: .10 }),
    ironWall: Object.freeze({ id: 'ironWall', name: '鐵壁', description: '防禦 +20%', weight: 30, defenseMultiplier: 1.20 }),
    tenacious: Object.freeze({ id: 'tenacious', name: '強韌', description: '最大生命 +30%', weight: 30, maxHpMultiplier: 1.30 }),
    regeneration: Object.freeze({ id: 'regeneration', name: '再生', description: '每 5 秒恢復最大生命 3%', weight: 18, regenerationIntervalMs: 5000, regenerationRatio: .03 }),
    executioner: Object.freeze({ id: 'executioner', name: '處刑者', description: '對生命低於 35% 的角色傷害 +20%', weight: 8, targetHpThreshold: .35, damageMultiplier: 1.20 })
  });
  const CHAPTER_CONFIGS = Object.freeze({
    2: Object.freeze({ affixChance: .40, maxAffixes: 1, affixPool: Object.freeze(Object.keys(AFFIXES)), dropBonus: Object.freeze({ equipmentMultiplier: 1.10, materialMultiplier: 1.10 }) })
  });
  const MONSTER_COMPATIBILITY = Object.freeze({
    blackstoneVenombladeAssassin: Object.freeze({ blockedAffixes: Object.freeze(['executioner']) }),
    altarGuard: Object.freeze({ blockedAffixes: Object.freeze(['ironWall']) })
  });

  function clampRoll(value) { return Math.max(0, Math.min(.999999, Number(value) || 0)); }
  function getChapterConfig(chapter) { return CHAPTER_CONFIGS[Number(chapter)] || null; }
  function getAllowedAffixIds(enemy, chapter = enemy?.chapter) {
    const config = getChapterConfig(chapter);
    if (!config || !enemy?.isElite || enemy?.isBoss) return [];
    const compatibility = MONSTER_COMPATIBILITY[enemy.id] || MONSTER_COMPATIBILITY[enemy.policyId] || {};
    const allowed = Array.isArray(compatibility.allowedAffixes) ? compatibility.allowedAffixes : config.affixPool;
    const blocked = new Set(compatibility.blockedAffixes || []);
    return allowed.filter((id) => AFFIXES[id] && !blocked.has(id));
  }
  function weightedPick(ids, randomValue) {
    const entries = ids.map((id) => AFFIXES[id]).filter((entry) => entry && entry.weight > 0);
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    if (!total) return null;
    let cursor = clampRoll(randomValue) * total;
    return entries.find((entry) => ((cursor -= entry.weight) < 0)) || entries[entries.length - 1];
  }
  function rollAffixes(enemy, chapter = enemy?.chapter, random = Math.random) {
    const config = getChapterConfig(chapter);
    if (!config || !enemy?.isElite || enemy?.isBoss || clampRoll(random()) >= config.affixChance) return Object.freeze([]);
    const available = [...getAllowedAffixIds(enemy, chapter)];
    const selected = [];
    while (available.length && selected.length < config.maxAffixes) {
      const affix = weightedPick(available, random());
      if (!affix) break;
      selected.push(affix);
      available.splice(available.indexOf(affix.id), 1);
    }
    return Object.freeze(selected);
  }
  function applyAffixes(enemy, affixes = []) {
    if (!enemy || !affixes.length) return enemy;
    const multiply = (key) => affixes.reduce((value, affix) => value * (affix[key] || 1), 1);
    return { ...enemy, name: `${enemy.name}${affixes.map((affix) => `【${affix.name}】`).join('')}`, maxHp: Math.max(1, Math.round(enemy.maxHp * multiply('maxHpMultiplier'))), defense: Math.max(0, Math.round(enemy.defense * multiply('defenseMultiplier'))), attackSpeed: enemy.attackSpeed * multiply('attackSpeedMultiplier'), eliteAffixes: affixes };
  }
  function getDamageMultiplier(affixes = [], targetHpRatio = 1) { return affixes.reduce((value, affix) => value * (affix.targetHpThreshold != null && targetHpRatio < affix.targetHpThreshold ? affix.damageMultiplier : 1), 1); }
  function getDirectDamageLeech(affixes = []) { return affixes.reduce((sum, affix) => sum + (affix.directDamageLeech || 0), 0); }
  function getRegeneration(affixes = []) { return affixes.find((affix) => affix.regenerationIntervalMs && affix.regenerationRatio) || null; }
  function getDropBonus(affixes = [], chapter = 2) { const config = getChapterConfig(chapter); return affixes.length && config ? config.dropBonus : Object.freeze({ equipmentMultiplier: 1, materialMultiplier: 1 }); }
  function createBonusRandom(random, multiplier = 1) { const source = typeof random === 'function' ? random : Math.random; const bonus = Math.max(1, Number(multiplier) || 1); return () => clampRoll(source()) / bonus; }

  return Object.freeze({ AFFIXES, CHAPTER_CONFIGS, MONSTER_COMPATIBILITY, getChapterConfig, getAllowedAffixIds, rollAffixes, applyAffixes, getDamageMultiplier, getDirectDamageLeech, getRegeneration, getDropBonus, createBonusRandom });
}));

const {WolfDenPolicy,BoarWoodsPolicy,PlainsDepthsPolicy,GoblinCampPolicy,
BlackForestEntrancePolicy,BlackForestTrailPolicy,SpiderNestPolicy,BlackstoneStrongholdPolicy,ForestAltarPolicy,
BlackForestDepthsPolicy,RedrockWastesPolicy,BrokenrockCanyonPolicy,BloodwarWastesPolicy,SkullcrusherWarCampPolicy,
AncientAltarPolicy,RedrockTemplePolicy,ChapterThreeLateCombatPolicy,EliteAffixPolicy}=env;
function defeatPartyMember(member, now = Date.now()) {
  if (member.currentHp > 0 || !member.alive) return false;
  // Isolated chapter-three preview only: retain ordinary attacks and damage calculations.
  if (ChapterTwoBalancePlaytestPolicy.isChapterThreeActive()
      && new URLSearchParams(window.location.search || '').get('immortal') === '1') {
    member.currentHp = 1;
    return false;
  }
  const holyPriest=(battle.partyMembers||[]).find(candidate=>candidate.alive&&PriestAdvancementPolicy.isAdvanced(candidate.progress,'holy-priest')&&Number(candidate.progress.skillLevels?.['priest:prayer-of-life'])>=6);
  if(holyPriest&&PriestAdvancementPolicy.trySacredGuardian(holyPriest,member,battle,now)){logBattle(`✨ ${holyPriest.name}的【神聖守護】阻止 ${member.name}死亡！`,'healing');return false;}
  if (!member.isMain && member.character.race === 'undead' && !member.undeadRevived && Math.random() < .35) {
    member.undeadRevived = true;
    member.currentHp = Math.ceil(member.maxHp * .35);
    logBattle(`${member.name} 以不死族之力重新站起。`, 'system');
    return false;
  }
  member.currentHp = 0;
  member.chapterThreeBurn = null;
  member.chapterThreeDebuffs = {};
  ChapterThreeCraftedEpicAbilityPolicy.clear(member);
  ChapterThreeSpecialEquipmentPolicy.clearCombatState(member);
  ChapterThreeEpicWeaponPolicy.clear(member);
  WarriorAdvancementPolicy.clear(member);
  RogueAdvancementPolicy.clear(member);
  HunterAdvancementPolicy.clear(member);
  MageAdvancementPolicy.clear(member);
  PriestAdvancementPolicy.clear(member);
  member.alive = false;
  member.targetIndex = -1;
  member.bleed = null;
  member.stunnedUntil = 0;
  BlackForestEntrancePolicy.clearBinding(member);
  member.blackstoneMarkedUntil = 0;
  member.blackstoneArmorBreakUntil = 0;
  member.spiderNestArmorBreakUntil = 0;
  member.blackstoneAttackSpeedPenaltyUntil = 0;
  member.blackstoneAttackSpeedPenalty = 0;
  member.nextAttackAt = Number.POSITIVE_INFINITY;
  member.reviveAt = member.isMain ? null : now + PARTY_REVIVE_DELAY_MS;
  logPartyDebug('死亡事件', { memberId: member.id, memberName: member.name, at: now });
  logBattle(`${member.name} 已倒下。`, 'system');
  if (member.isMain) endBattleAfterPlayerDefeat(now);
  return true;
}

function reviveDefeatedTeammates(now = Date.now()) {
  const candidates = (battle.partyMembers || []).filter(member => !member.isMain && !member.alive && Number.isFinite(member.reviveAt) && now >= member.reviveAt);
  if (!candidates.length) return 0;
  const progress = getProgress();
  let revived = 0;
  for (const member of candidates) {
    if ((progress.potions || 0) <= 0) continue;
    progress.potions -= 1;
    removePotionItem(progress);
    member.currentHp = Math.max(1, Math.ceil(member.maxHp * PARTY_REVIVE_HEALTH_RATIO));
    member.alive = true;
    member.shield = 0;
    member.bleed = null;
    member.stunnedUntil = 0;
    BlackForestEntrancePolicy.clearBinding(member);
    member.blackstoneMarkedUntil = 0;
    member.blackstoneArmorBreakUntil = 0;
    member.spiderNestArmorBreakUntil = 0;
    member.blackstoneAttackSpeedPenaltyUntil = 0;
    member.blackstoneAttackSpeedPenalty = 0;
    member.nextAttackAt = now + 1000;
    member.targetIndex = -1;
    member.reviveAt = null;
    revived += 1;
    logBattle(`🧪 使用主要角色的治癒藥水，${member.name}以 30% 生命復活。`, 'healing');
  }
  if (revived) saveProgress(progress);
  return revived;
}

function processPartyMemberBleed(member, now = Date.now()) {
  const bleed = member.bleed;
  if (!bleed) return false;
  if (now >= bleed.expiresAt) {
    member.bleed = null;
    return true;
  }
  if (now < bleed.nextTickAt) return false;
  const tickMs = bleed.tickMs || WolfDenPolicy.BLEED_TICK_MS;
  const ticks = Math.max(1, Math.floor((now - bleed.nextTickAt) / tickMs) + 1);
  const damage = bleed.tickDamage * ticks;
  bleed.nextTickAt += tickMs * ticks;
  member.currentHp = Math.max(getPlaytestHpFloor(), member.currentHp - damage);
  const effectName = bleed.effectName || '流血';
  logBattle(`${member.name} 因${effectName}受到 ${damage} 點傷害。`, 'damage-taken', {
    aggregateKey: `enemy-bleed-${member.id}`,
    damage,
    summary: `${member.name} 的${effectName}傷害`
  });
  return true;
}

function applyControlEffectToPlayer(member, options, now = Date.now()) {
  return ControlEffectPolicy.applyControlEffectToPlayer(member, {
    ...options,
    now,
    controlResistancePercent: member?.stats?.controlResistancePercent
  });
}

function applyBlackstoneAttackSpeedPenalty(member, penalty, durationMs, now, sourceName) {
  applyControlEffectToPlayer(member, { type: 'attack-speed-slow', baseDurationMs: durationMs, magnitude: penalty, source: sourceName }, now);
  logBattle(`${member.name} 受到【${sourceName}】，攻擊速度降低 ${Math.round(penalty * 100)}%！`, 'system');
}

function activateBlackstoneCommand(durationMs, now, sourceName) {
  battle.blackstoneCommandUntil = Math.max(battle.blackstoneCommandUntil || 0, now + durationMs);
  logBattle(`📣【${sourceName}】施放【隊長號令】，全體黑石怪攻擊提高 15%，持續 6 秒！`, 'system');
}

function inflictPartyMemberBleed(member, enemy, now = Date.now()) {
  member.bleed = {
    tickDamage: Math.max(2, Math.ceil((Number(enemy.attack) || 1) * .25)),
    nextTickAt: now + WolfDenPolicy.BLEED_TICK_MS,
    expiresAt: now + WolfDenPolicy.BLEED_DURATION_MS
  };
  logBattle(`${member.name} 受到 ${enemy.name} 的流血效果。`, 'system');
}

function inflictForestAltarCorruptionFlame(member, enemy, now = Date.now()) {
  const effect = ForestAltarPolicy.getDotEffect('corruption-flame');
  if (!effect) return false;
  member.bleed = {
    effectName: effect.effectName,
    tickMs: effect.tickMs,
    tickDamage: Math.max(2, Math.ceil((Number(enemy.attack) || 1) * effect.attackRatio)),
    nextTickAt: now + effect.tickMs,
    expiresAt: now + effect.durationMs
  };
  logBattle(`🔥 ${member.name} 受到 ${enemy.name} 的【腐化之焰】，持續受到腐化傷害。`, 'system');
  return true;
}

function inflictBlackForestDot(member, enemy, effect, now = Date.now()) {
  const rule = effect === 'poison' ? BlackForestEntrancePolicy.POISON : BlackForestEntrancePolicy.BLEED;
  const poisonMultiplier = effect === 'poison' ? Math.max(0, 1 - (member.stats?.poisonResistancePercent || 0)) : 1;
  member.bleed = {
    effectName: effect === 'poison' ? '中毒' : '流血',
    tickMs: rule.tickMs,
    tickDamage: Math.max(1, Math.ceil((Number(enemy.attack) || 1) * rule.attackRatio * poisonMultiplier)),
    nextTickAt: now + rule.tickMs,
    expiresAt: now + rule.durationMs
  };
  logBattle(`${member.name} 受到 ${enemy.name} 的${member.bleed.effectName}效果。`, 'system');
}

function inflictBlackForestTrailPoison(member, enemy, now = Date.now()) {
  const rule = BlackForestTrailPolicy.POISON;
  const existingStacks = member.bleed?.effectName === '黑石毒素' ? member.bleed.stacks || 1 : 0;
  const stacks = Math.min(rule.maxStacks, existingStacks + 1);
  const baseTickDamage = Math.max(1, Math.ceil((Number(enemy.attack) || 1) * rule.attackRatio * Math.max(0, 1 - (member.stats?.poisonResistancePercent || 0))));
  member.bleed = {
    effectName: '黑石毒素',
    tickMs: rule.tickMs,
    stacks,
    tickDamage: baseTickDamage * stacks,
    nextTickAt: now + rule.tickMs,
    expiresAt: now + rule.durationMs
  };
  logBattle(`${member.name} 受到 ${enemy.name} 的黑石毒素效果（${stacks}／${rule.maxStacks} 層）。`, 'system');
}

function inflictBlackForestDepthsCorruption(member, enemy, now = Date.now()) {
  member.bleed = {
    effectName: '深林腐化',
    tickMs: 1000,
    tickDamage: Math.max(2, Math.ceil((Number(enemy.attack) || 1) * .16)),
    nextTickAt: now + 1000,
    expiresAt: now + 5000
  };
  logBattle(`${member.name} 受到 ${enemy.name} 的深林腐化效果。`, 'system');
}

function getSpiderNestPoisonStacks(member) {
  return member.bleed?.effectName === '蛛巢毒素' ? Number(member.bleed.stacks) || 0 : 0;
}

function inflictSpiderNestPoison(member, enemy, stackCount = 1, now = Date.now()) {
  const rule = SpiderNestPolicy.POISON;
  const existingStacks = getSpiderNestPoisonStacks(member);
  const maxStacks = enemy.id === 'giantSpider' ? rule.bossMaxStacks : rule.maxStacks;
  const stacks = Math.min(maxStacks, existingStacks + Math.max(1, stackCount));
  const baseTickDamage = Math.max(1, Math.ceil((Number(enemy.attack) || 1) * rule.attackRatio));
  member.bleed = {
    effectName: '蛛巢毒素', tickMs: rule.tickMs, stacks,
    tickDamage: baseTickDamage * stacks,
    nextTickAt: now + rule.tickMs,
    expiresAt: now + rule.durationMs
  };
  logBattle(`${member.name} 受到 ${enemy.name} 的蛛巢毒素（${stacks}／${maxStacks} 層）。`, 'system');
}

function healBlackForestDepthsAlly(healerIndex, now = Date.now()) {
  const wounded = getWoundedEnemyIndexes();
  if (!wounded.length) return false;
  const targetIndex = wounded.sort((first, second) => (
    battle.enemyHps[first] / getEnemyDefinition(first).maxHp
    - battle.enemyHps[second] / getEnemyDefinition(second).maxHp
  ))[0];
  const target = getEnemyDefinition(targetIndex);
  const heal = Math.max(1, Math.ceil(target.maxHp * BlackForestDepthsPolicy.SKILLS.forestSpirit.healRatio));
  const restored = Math.min(heal, target.maxHp - battle.enemyHps[targetIndex]);
  battle.enemyHps[targetIndex] += restored;
  getEnemySkillState(healerIndex).natureEchoReadyAt = now + BlackForestDepthsPolicy.SKILLS.forestSpirit.cooldownMs;
  playMonsterAttackAnimation(healerIndex, false);
  logBattle(`🌿【森林之魂】施放【自然回響】，替【${target.name}】恢復 ${restored} 生命。`, 'enemy-healing');
  return true;
}

function hasSummonedBlackstoneSpider() {
  return (battle.enemyTrailSummoned || []).some((summoned, index) => summoned
    && battle.enemyTypes[index] === 'blackstonePoisonSpider' && battle.enemyHps[index] > 0);
}

function summonBlackstonePoisonSpider(beastmasterIndex, now = Date.now()) {
  if (hasSummonedBlackstoneSpider()) return false;
  const type = 'blackstonePoisonSpider';
  const spider = BlackForestTrailPolicy.getCombatMonster(type);
  if (!spider) return false;
  if (!battle.enemyTrailSummoned) battle.enemyTrailSummoned = battle.enemyTypes.map(() => false);
  const reusedIndex = battle.enemyTrailSummoned.findIndex((summoned, index) => summoned && battle.enemyHps[index] <= 0);
  if (reusedIndex >= 0) {
    battle.enemyTypes[reusedIndex] = type;
    battle.enemyLevels[reusedIndex] = 17;
    battle.enemyHps[reusedIndex] = Math.max(1, Math.round(spider.maxHp * .70));
    battle.enemyRespawns[reusedIndex] = null;
    battle.enemySpawnedAt[reusedIndex] = now;
    battle.enemyDots[reusedIndex] = [];
    battle.enemyDamages[reusedIndex] = [];
    battle.enemyNextAttackAt[reusedIndex] = now + getMonsterAttackInterval(spider);
    battle.enemyBoarEnraged[reusedIndex] = false;
    applyPendingRoguePlagueSpread(reusedIndex, now);
    playMonsterAttackAnimation(beastmasterIndex, false);
    logBattle('🕷【黑石訓獸師】施放【放養蜘蛛】，一隻削弱版黑石毒蜘蛛加入戰鬥！', 'spawn');
    return true;
  }
  battle.enemyTypes.push(type);
  battle.enemyLevels.push(17);
  battle.enemyHps.push(Math.max(1, Math.round(spider.maxHp * .70)));
  battle.enemyRespawns.push(null);
  battle.enemySpawnedAt.push(now);
  battle.enemyDots.push([]);
  battle.enemyDamages.push([]);
  battle.enemyNextAttackAt.push(now + getMonsterAttackInterval(spider));
  battle.enemyBoarEnraged.push(false);
  battle.enemyTrailSummoned.push(true);
  applyPendingRoguePlagueSpread(battle.enemyTypes.length - 1, now);
  playMonsterAttackAnimation(beastmasterIndex, false);
  logBattle('🕷【黑石訓獸師】施放【放養蜘蛛】，一隻削弱版黑石毒蜘蛛加入戰鬥！', 'spawn');
  return true;
}

function countAliveSpiderNestSummons(type = null) {
  return (battle.enemyTrailSummoned || []).filter((summoned, index) => summoned && battle.enemyHps[index] > 0
    && (!type || battle.enemyTypes[index] === type)).length;
}

function summonSpiderNestMonster(type, summonerIndex, hpRatio, attackRatio, limit, message, now = Date.now()) {
  if (countAliveSpiderNestSummons(type) >= limit) return false;
  const base = SpiderNestPolicy.getCombatMonster(type);
  if (!base) return false;
  if (!battle.enemyTrailSummoned) battle.enemyTrailSummoned = battle.enemyTypes.map(() => false);
  if (!battle.enemySummonProfiles) battle.enemySummonProfiles = battle.enemyTypes.map(() => null);
  const profile = { hpRatio, attackRatio };
  const reusedIndex = battle.enemyTrailSummoned.findIndex((summoned, index) => summoned && battle.enemyHps[index] <= 0);
  const index = reusedIndex >= 0 ? reusedIndex : battle.enemyTypes.length;
  if (reusedIndex >= 0) {
    battle.enemyTypes[index] = type;
    battle.enemyLevels[index] = SpiderNestPolicy.MAP.level;
    battle.enemyRespawns[index] = null;
    battle.enemySpawnedAt[index] = now;
    battle.enemyDots[index] = [];
    battle.enemyDamages[index] = [];
    battle.enemyTrailSummoned[index] = true;
    battle.enemySummonProfiles[index] = profile;
  } else {
    battle.enemyTypes.push(type);
    battle.enemyLevels.push(SpiderNestPolicy.MAP.level);
    battle.enemyRespawns.push(null);
    battle.enemySpawnedAt.push(now);
    battle.enemyDots.push([]);
    battle.enemyDamages.push([]);
    battle.enemyTrailSummoned.push(true);
    battle.enemySummonProfiles.push(profile);
    battle.enemyBoarEnraged.push(false);
    battle.enemyNextAttackAt.push(null);
  }
  const summoned = getEnemyDefinition(index);
  battle.enemyHps[index] = summoned.maxHp;
  battle.enemyNextAttackAt[index] = now + getMonsterAttackInterval(summoned);
  applyPendingRoguePlagueSpread(index, now);
  playMonsterAttackAnimation(summonerIndex, false);
  logBattle(message, 'spawn');
  return true;
}

function getRedrockEnemyState(index, currentHp = null, maxHp = null) {
  battle.redrockEnemyStates = Array.isArray(battle.redrockEnemyStates) ? battle.redrockEnemyStates : [];
  battle.redrockEnemyStates[index] = battle.redrockEnemyStates[index] || RedrockWastesPolicy.createState(Date.now());
  if (currentHp !== null && maxHp !== null) RedrockWastesPolicy.updateThresholds(battle.enemyTypes[index], battle.redrockEnemyStates[index], currentHp, maxHp);
  return battle.redrockEnemyStates[index];
}

function getRedrockEnemyStateById(enemyId, currentHp, maxHp) {
  const index = (battle.enemyTypes || []).findIndex((type, candidate) => type === enemyId && battle.enemyHps?.[candidate] > 0);
  return index >= 0 ? getRedrockEnemyState(index, currentHp, maxHp) : RedrockWastesPolicy.createState(Date.now());
}

function getBrokenrockEnemyState(index, currentHp = null, maxHp = null) {
  battle.brokenrockEnemyStates = Array.isArray(battle.brokenrockEnemyStates) ? battle.brokenrockEnemyStates : [];
  battle.brokenrockEnemyStates[index] = battle.brokenrockEnemyStates[index] || BrokenrockCanyonPolicy.createState(Date.now());
  if (currentHp !== null && maxHp !== null) {
    const events = BrokenrockCanyonPolicy.updateThresholds(battle.enemyTypes[index], battle.brokenrockEnemyStates[index], currentHp, maxHp);
    battle.brokenrockEnemyStates[index].pendingActions = [...(battle.brokenrockEnemyStates[index].pendingActions || []), ...events.filter((event) => event.damageMultiplier)];
  }
  return battle.brokenrockEnemyStates[index];
}

function getBrokenrockEnemyStateById(enemyId, currentHp, maxHp) {
  const index = (battle.enemyTypes || []).findIndex((type, candidate) => type === enemyId && battle.enemyHps?.[candidate] > 0);
  return index >= 0 ? getBrokenrockEnemyState(index, currentHp, maxHp) : BrokenrockCanyonPolicy.createState(Date.now());
}

function getBloodwarEnemyState(index, currentHp = null, maxHp = null, now = Date.now()) {
  battle.bloodwarEnemyStates = Array.isArray(battle.bloodwarEnemyStates) ? battle.bloodwarEnemyStates : [];
  battle.bloodwarEnemyStates[index] = battle.bloodwarEnemyStates[index] || BloodwarWastesPolicy.createState(now);
  if (currentHp !== null && maxHp !== null) {
    const events = BloodwarWastesPolicy.updateThresholds(battle.enemyTypes[index], battle.bloodwarEnemyStates[index], currentHp, maxHp, now);
    battle.bloodwarEnemyStates[index].pendingActions = [...(battle.bloodwarEnemyStates[index].pendingActions || []), ...events];
  }
  return battle.bloodwarEnemyStates[index];
}

function getBloodwarEnemyStateById(enemyId, currentHp, maxHp) {
  const index = (battle.enemyTypes || []).findIndex((type, candidate) => type === enemyId && battle.enemyHps?.[candidate] > 0);
  return index >= 0 ? getBloodwarEnemyState(index, currentHp, maxHp) : BloodwarWastesPolicy.createState(Date.now());
}

function getLateChapterUnits(now = Date.now()) {
  const mapId = battle.dungeonId || getActiveMap(getBattleProgress()).id;
  if (!ChapterThreeLateCombatPolicy.isSupported(mapId)) return [];
  return battle.enemyTypes.map((type, index) => {
    const definition = getEnemyDefinition(index);
    const skillState = getEnemySkillState(index);
    skillState.lateChapter = skillState.lateChapter || ChapterThreeLateCombatPolicy.createState(mapId, battle.enemySpawnedAt[index] || now);
    return { ...definition, key: `${battle.sessionId}:${index}:${battle.enemySpawnedAt[index]}`, state: skillState.lateChapter,
      controlled: now < skillState.stunnedUntil || now < skillState.frozenUntil,
      get currentHp() { return battle.enemyHps[index]; },
      set currentHp(value) { battle.enemyHps[index] = value; } };
  });
}

function getLateChapterMonsterMultiplier(enemy, stat, now = Date.now()) {
  if (!ChapterThreeLateCombatPolicy.isSupported(enemy.mapId) || !Number.isInteger(enemy.combatIndex)) return 1;
  const units = getLateChapterUnits(now), unit = units[enemy.combatIndex];
  return unit ? ChapterThreeLateCombatPolicy.modifiers(enemy.mapId, unit, units, now)[stat] || 1 : 1;
}

function updateLateChapterThresholds(index, now = Date.now()) {
  const units = getLateChapterUnits(now);
  if (units[index]) ChapterThreeLateCombatPolicy.thresholds(units[index].mapId, units[index], now, emitLateChapterSkill);
}

function processLateChapterCombat(now = Date.now()) {
  const units = getLateChapterUnits(now);
  if (!units.length) return;
  ChapterThreeLateCombatPolicy.tick(units[0].mapId, units, battle.partyMembers, now, emitLateChapterSkill);
  units.forEach((unit, index) => {
    if (unit.currentHp > 0 && unit.state.pendingActions.length && !unit.controlled) battle.enemyNextAttackAt[index] = Math.min(battle.enemyNextAttackAt[index], now);
  });
  for (const member of battle.partyMembers.filter(player => player.alive)) {
    const burn = member.chapterThreeBurn;
    if (!burn || burn.ticks <= 0 || now < burn.nextTickAt) continue;
    const ticks = Math.min(burn.ticks, Math.floor((now - burn.nextTickAt) / burn.tickMs) + 1);
    burn.ticks -= ticks; burn.nextTickAt += ticks * burn.tickMs;
    const damage = MonsterDefense.resolvePlayerDamage({ baseDamage: burn.damage * ticks, defense: member.stats.defense * getOnlineFacilityEffects().defense, damageReduction: member.stats.damageReduction }).finalDamage;
    const absorbed = Math.min(member.shield || 0, damage);
    member.shield = Math.max(0, (member.shield || 0) - absorbed);
    member.currentHp = Math.max(getPlaytestHpFloor(), member.currentHp - (damage - absorbed));
    logBattle(`🔥 ${member.name}受到【墮落之火】持續傷害 ${damage - absorbed}。`, 'damage-taken');
    const caster = units.find(unit => unit.key === burn.sourceKey);
    if (caster) AncientAltarPolicy.recordFallenBurn(caster.state, 'tick');
    defeatPartyMember(member, now);
  }
}

function getMonsterAttackPower(enemy, progress = getProgress(), currentHp = enemy.maxHp) {
  const randomMultiplier = .9 + Math.random() * .2;
  const bloodFrenzy = WolfDenPolicy.getBloodFrenzyMultiplier(enemy.id, isPlayerBleeding());
  const irritable = BoarWoodsPolicy.getIrritableMultiplier(enemy.id, currentHp, enemy.maxHp);
  const plainsIrritable = PlainsDepthsPolicy.getIrritableMultiplier(enemy.id, currentHp, enemy.maxHp);
  const blackForestMultiplier = BlackForestEntrancePolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attack;
  const blackForestTrailMultiplier = BlackForestTrailPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attack;
  const spiderNestMultiplier = SpiderNestPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attack;
  const strongholdMultiplier = BlackstoneStrongholdPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attack;
  const forestAltarMultiplier = ForestAltarPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attack;
  const depthsMultiplier = BlackForestDepthsPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp, getBlackForestDepthsCombatContext()).attack;
  const redrockState = enemy.mapId === 'redrock-wastes-entrance' ? getRedrockEnemyStateById(enemy.id, currentHp, enemy.maxHp) : null;
  const redrockMultiplier = RedrockWastesPolicy.getCombatMultipliers(enemy.id, redrockState).attack;
  const brokenrockState = enemy.mapId === 'brokenrock-canyon' ? getBrokenrockEnemyStateById(enemy.id, currentHp, enemy.maxHp) : null;
  const brokenrockMultiplier = BrokenrockCanyonPolicy.getCombatMultipliers(enemy.id, brokenrockState).attack;
  const brokenrockBuffMultiplier = brokenrockState && Date.now() < (brokenrockState.battleCryUntil || 0) ? 1.10 : 1;
  const brokenrockCommandMultiplier = brokenrockState && Date.now() < (brokenrockState.offensiveCommandUntil || 0) ? 1.15 : 1;
  const bloodwarState = enemy.mapId === 'bloodwar-wastes' ? getBloodwarEnemyStateById(enemy.id, currentHp, enemy.maxHp) : null;
  const bloodwarMultiplier = BloodwarWastesPolicy.getCombatMultipliers(enemy.id, bloodwarState).attack;
  const bloodwarTotemMultiplier = bloodwarState && Date.now() < (bloodwarState.warbloodTotemUntil || 0) ? 1.10 : 1;
  const bloodwarChargeMultiplier = bloodwarState && Date.now() < (bloodwarState.fullArmyChargeUntil || 0) ? 1.15 : 1;
  const strongholdCommandMultiplier = enemy.mapId === 'blackstone-stronghold' && Date.now() < (battle.strongholdCommandUntil || 0)
    ? 1 + BlackstoneStrongholdPolicy.LION_GUARD.roarAttackBonus : 1;
  const strongholdEnrageMultiplier = enemy.mapId === 'blackstone-stronghold'
    ? 1 + BlackstoneStrongholdPolicy.getEnrage(battle.blackstoneStrongholdState, Date.now()).attackBonus : 1;
  const commandMultiplier = enemy.mapId === 'black-forest-trail' && Date.now() < (battle.blackstoneCommandUntil || 0)
    ? 1 + BlackForestTrailPolicy.CAPTAIN.commandAttackBonus : 1;
  const beastCommandMultiplier = enemy.id === 'blackstonePoisonSpider' && Date.now() < (battle.blackstoneSpiderCommandUntil || 0)
    ? 1 + BlackForestTrailPolicy.BEASTMASTER.spiderAttackBonus : 1;
  const nestSpiderCommandMultiplier = ['spiderNestBlackstonePoisonSpider', 'venomSpitterSpider', 'webWeaver', 'giantSpider'].includes(enemy.id)
    && Date.now() < (battle.spiderNestCommandUntil || 0) ? 1 + SpiderNestPolicy.BEASTMASTER.spiderAttackBonus : 1;
  if (enemy.mapId) return Math.max(1, Math.round((enemy.attack || 1) * randomMultiplier * getLateChapterMonsterMultiplier(enemy, 'attack') * bloodFrenzy * irritable * plainsIrritable * blackForestMultiplier * blackForestTrailMultiplier * spiderNestMultiplier * strongholdMultiplier * forestAltarMultiplier * depthsMultiplier * redrockMultiplier * brokenrockMultiplier * brokenrockBuffMultiplier * brokenrockCommandMultiplier * bloodwarMultiplier * bloodwarTotemMultiplier * bloodwarChargeMultiplier * strongholdCommandMultiplier * strongholdEnrageMultiplier * commandMultiplier * beastCommandMultiplier * nestSpiderCommandMultiplier));
  const map = getActiveMap(progress);
  const monsterLevel = Math.min(map.max, Math.max(map.min, progress.level));
  const levelMultiplier = 1 + (monsterLevel - 1) * .10;
  const rankMultiplier = enemy.isBoss ? 2.4 : enemy.isElite ? 1.65 : 1;
  return Math.max(1, Math.round((enemy.attack || 10) * levelMultiplier * rankMultiplier * randomMultiplier * 1.25 * bloodFrenzy * irritable * plainsIrritable));
}

function getMonsterAttackInterval(enemy, currentHp = enemy.maxHp) {
  const bloodFrenzy = WolfDenPolicy.getBloodFrenzyMultiplier(enemy.id, isPlayerBleeding());
  const irritable = BoarWoodsPolicy.getIrritableMultiplier(enemy.id, currentHp, enemy.maxHp);
  const plainsIrritable = PlainsDepthsPolicy.getIrritableMultiplier(enemy.id, currentHp, enemy.maxHp);
  const blackForestMultiplier = BlackForestEntrancePolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attackSpeed;
  const blackForestTrailMultiplier = BlackForestTrailPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attackSpeed;
  const spiderNestMultiplier = SpiderNestPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attackSpeed;
  const strongholdMultiplier = BlackstoneStrongholdPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attackSpeed;
  const forestAltarMultiplier = ForestAltarPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attackSpeed;
  const depthsMultiplier = BlackForestDepthsPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp, getBlackForestDepthsCombatContext()).attackSpeed;
  const redrockState = enemy.mapId === 'redrock-wastes-entrance' ? getRedrockEnemyStateById(enemy.id, currentHp, enemy.maxHp) : null;
  const redrockMultiplier = RedrockWastesPolicy.getCombatMultipliers(enemy.id, redrockState).attackSpeed;
  const brokenrockState = enemy.mapId === 'brokenrock-canyon' ? getBrokenrockEnemyStateById(enemy.id, currentHp, enemy.maxHp) : null;
  const brokenrockCommandMultiplier = brokenrockState && Date.now() < (brokenrockState.offensiveCommandUntil || 0) ? 1.15 : 1;
  const bloodwarState = enemy.mapId === 'bloodwar-wastes' ? getBloodwarEnemyStateById(enemy.id, currentHp, enemy.maxHp) : null;
  const bloodwarMultiplier = BloodwarWastesPolicy.getCombatMultipliers(enemy.id, bloodwarState).attackSpeed;
  const bloodwarChargeMultiplier = bloodwarState && Date.now() < (bloodwarState.fullArmyChargeUntil || 0) ? 1.20 : 1;
  const strongholdEnrageMultiplier = enemy.mapId === 'blackstone-stronghold'
    ? 1 + BlackstoneStrongholdPolicy.getEnrage(battle.blackstoneStrongholdState, Date.now()).attackSpeedBonus : 1;
  const beastCommandMultiplier = enemy.id === 'blackstonePoisonSpider' && Date.now() < (battle.blackstoneSpiderCommandUntil || 0)
    ? 1 + BlackForestTrailPolicy.BEASTMASTER.spiderAttackSpeedBonus : 1;
  const nestSpiderCommandMultiplier = ['spiderNestBlackstonePoisonSpider', 'venomSpitterSpider', 'webWeaver', 'giantSpider'].includes(enemy.id)
    && Date.now() < (battle.spiderNestCommandUntil || 0) ? 1 + SpiderNestPolicy.BEASTMASTER.spiderAttackSpeedBonus : 1;
  return Math.max(250, (enemy.attackInterval || (1000 / (enemy.attackSpeed || 1))) / getLateChapterMonsterMultiplier(enemy, 'attackSpeed') / bloodFrenzy / irritable / plainsIrritable / blackForestMultiplier / blackForestTrailMultiplier / spiderNestMultiplier / strongholdMultiplier / forestAltarMultiplier / depthsMultiplier / redrockMultiplier / brokenrockCommandMultiplier / bloodwarMultiplier / bloodwarChargeMultiplier / strongholdEnrageMultiplier / beastCommandMultiplier / nestSpiderCommandMultiplier);
}

function healGoblinAlly(healerIndex, now = Date.now()) {
  const wounded = getWoundedEnemyIndexes();
  if (!wounded.length) return false;
  const targetIndex = wounded.sort((first, second) => (
    battle.enemyHps[first] / getEnemyDefinition(first).maxHp
    - battle.enemyHps[second] / getEnemyDefinition(second).maxHp
  ))[0];
  const target = getEnemyDefinition(targetIndex);
  const heal = Math.max(1, Math.ceil(target.maxHp * GoblinCampPolicy.SHAMAN_HEAL_RATIO));
  const restored = Math.min(heal, target.maxHp - battle.enemyHps[targetIndex]);
  battle.enemyHps[targetIndex] += restored;
  getEnemySkillState(healerIndex).shamanHealReadyAt = now + GoblinCampPolicy.SHAMAN_HEAL_COOLDOWN_MS;
  playMonsterAttackAnimation(healerIndex, false);
  logBattle(`✨【哥布林薩滿】施放治療術，替【${target.name}】恢復 ${restored} 生命。`, 'enemy-healing');
  return true;
}

function useGoblinHealingTotem(chiefIndex) {
  const wounded = getWoundedEnemyIndexes();
  if (!wounded.length) return false;
  let totalRestored = 0;
  wounded.forEach((index) => {
    const target = getEnemyDefinition(index);
    const heal = Math.max(1, Math.ceil(target.maxHp * .20));
    const restored = Math.min(heal, target.maxHp - battle.enemyHps[index]);
    battle.enemyHps[index] += restored;
    totalRestored += restored;
  });
  playMonsterAttackAnimation(chiefIndex, false);
  logBattle(`🗿【哥布林大酋長】立起治療圖騰，為自己與隊友共恢復 ${totalRestored} 生命。`, 'system');
  return true;
}

function enemyAttackTick() {
  if (!env.fighting || battleScreen.classList.contains('hidden') || battle.dungeonComplete) return;
  if (isTimedChapterThreeVisualShowcase() || isMonsterRotationPreview()) return;
  if (!battle.partyMembers?.length) rebuildBattlePartyMembers();
  const progress = getBattleProgress();
  const now = Date.now();
  let attackOccurred = false;

  if (!battle.enemyAffixRegenAt) battle.enemyAffixRegenAt = battle.enemyTypes.map(() => now);
  battle.enemyHps.forEach((hp, index) => {
    if (hp <= 0 || getEnemyDefinition(index).isFacility) return;
    const regeneration = EliteAffixPolicy.getRegeneration(battle.enemyAffixes?.[index] || []);
    if (!regeneration || now - (battle.enemyAffixRegenAt[index] || now) < regeneration.regenerationIntervalMs) return;
    battle.enemyAffixRegenAt[index] = now;
    const enemy = getEnemyDefinition(index);
    const restored = Math.min(Math.max(1, Math.ceil(enemy.maxHp * regeneration.regenerationRatio)), enemy.maxHp - hp);
    if (restored > 0) {
      battle.enemyHps[index] += restored;
      logBattle(`♻【${enemy.name}】觸發【再生】，恢復 ${restored} 生命。`, 'enemy-healing');
      attackOccurred = true;
    }
  });

  if (getActiveMap(progress).id === 'blackstone-stronghold' && now - (battle.lastStrongholdRegenAt || 0) >= 1000) {
    battle.lastStrongholdRegenAt = now;
    battle.enemyHps.forEach((hp, index) => {
      if (hp <= 0) return;
      const enemy = getEnemyDefinition(index);
      if (!(enemy.healthRegenPerSecond > 0)) return;
      battle.enemyHps[index] = Math.min(enemy.maxHp, hp + Math.max(1, Math.ceil(enemy.maxHp * enemy.healthRegenPerSecond)));
    });
  }

  processLateChapterCombat(now);
  reviveDefeatedTeammates(now);

  battle.partyMembers.filter(member => member.alive).forEach(member => {
    attackOccurred = processPartyMemberBleed(member, now) || attackOccurred;
    if (!member.isMain && member.currentHp > 0 && member.currentHp / member.maxHp < PARTY_AUTO_POTION_HEALTH_RATIO) {
      useSharedHealingPotionForMember(member);
    }
    defeatPartyMember(member, now);
  });
  if (!env.fighting) return;
  if (resetPartyAfterDefeat(now)) {
    updateBattleUI();
    return;
  }

  for (const enemyIndex of aliveMonsterIndexesByAge()) {
    if (battle.enemyHps[enemyIndex] <= 0) continue;
    const enemy = getEnemyDefinition(enemyIndex);
    const nextAttackAt = battle.enemyNextAttackAt?.[enemyIndex];
    if (!Number.isFinite(nextAttackAt)) {
      battle.enemyNextAttackAt[enemyIndex] = now + getMonsterAttackInterval(enemy);
      continue;
    }
    if (nextAttackAt > now) continue;

    const enemySkillState = getEnemySkillState(enemyIndex);
    if (now < enemySkillState.stunnedUntil || now < enemySkillState.frozenUntil) {
      battle.enemyNextAttackAt[enemyIndex] = now + 250;
      continue;
    }

    const enemyCurrentHp = battle.enemyHps[enemyIndex];
    battle.enemyNextAttackAt[enemyIndex] = now + getMonsterAttackInterval(enemy, enemyCurrentHp);
    attackOccurred = true;

    const plainsAction = getActiveMap(progress).id === 'plains-depths'
      ? PlainsDepthsPolicy.resolveActiveSkill(enemy.id, Math.random(), enemyCurrentHp < enemy.maxHp)
      : 'attack';
    if (plainsAction === 'heal') {
      const restored = Math.min(Math.ceil(enemy.maxHp * PlainsDepthsPolicy.KNIGHT_HEAL_RATIO), enemy.maxHp - enemyCurrentHp);
      battle.enemyHps[enemyIndex] += restored;
      logBattle(`✚【${enemy.name}】施放治療，恢復 ${restored} 生命。`, 'enemy-healing');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (plainsAction === 'roar') {
      battle.blackstoneRoarUntil = now + PlainsDepthsPolicy.ROAR_DURATION_MS;
      logBattle('📣【黑石頭目】施放【怒吼】，黑石系列怪物攻擊提高 10%！', 'system');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }

    if (battle.dungeonId === 'goblin-camp') {
      const action = GoblinCampPolicy.resolveAction({
        type: battle.enemyTypes[enemyIndex],
        randomValue: Math.random(),
        hasWoundedAlly: getWoundedEnemyIndexes().length > 0,
        canHeal: now >= (getEnemySkillState(enemyIndex).shamanHealReadyAt || 0),
        canSummon: aliveMonsterIndexesByAge().length < 4 && (battle.goblinScoutSummons || 0) < 2
      });
      if (action === 'heal' && healGoblinAlly(enemyIndex, now)) continue;
      if (action === 'healing-totem' && useGoblinHealingTotem(enemyIndex)) continue;
      if (action === 'summon-scout' && summonGoblinScout(enemyIndex, now)) continue;
    }

    const lateUnit = getLateChapterUnits(now)[enemyIndex];
    const lateAction = lateUnit?.state.pendingActions.shift() || null;
    const aliveMembers = battle.partyMembers.filter((member) => member.alive);
    let target = ['blackForestHunter', 'blackstoneCaptain', 'blackstoneCenturion', 'blackstoneVenomHunter', 'blackstoneVenombladeAssassin', 'blackstoneStrongholdCrossbowman', 'blackstoneStrongholdWarlord'].includes(enemy.id)
      ? aliveMembers.sort((first, second) => first.currentHp / first.maxHp - second.currentHp / second.maxHp)[0]
      : PartyPolicy.chooseRandomAliveMember(battle.partyMembers, Math.random);
    if (lateUnit) target = ChapterThreeLateCombatPolicy.selectTarget(enemy.mapId, lateUnit, lateAction, aliveMembers, target);
    if (!target) break;
    logPartyDebug('怪物選擇隊員', {
      attackerId: battle.enemyTypes[enemyIndex],
      attackerName: enemy.name,
      targetId: target.id,
      targetName: target.name
    });
    const baseStats = { ...getCharacterStats(target.level, target.progress, target.character) };
    const stats = now < (target.redrockDefenseDownUntil || 0)
      ? { ...baseStats, defense: Math.max(0, Math.round(baseStats.defense * (1 - (target.redrockDefenseDown || 0)))) }
      : baseStats;
    stats.defense *= getOnlineFacilityEffects().defense;
    if (lateUnit) stats.defense *= ChapterThreeLateCombatPolicy.playerMultiplier(target, 'defense-down', now);
    const lowHealthAssassin = target.job === 'assassin' && target.level >= 20 && target.currentHp / target.maxHp <= .3;
    if (!lowHealthAssassin) target.desperateLowActive = false;
    if (lowHealthAssassin && !target.desperateLowActive) {
      target.desperateLowActive = true;
      const desperate = ClassSkillPolicy.getEffect('assassin', 'desperate-counter', Number(target.progress.skillLevels?.['assassin:desperate-counter']) || 1);
      if (!target.desperateEntryTriggered && desperate.entryDodge) {
        target.desperateEntryTriggered = true;
        target.desperateDodgeUntil = now + (desperate.entryDuration || 3) * 1000;
        target.desperateEntryDodge = desperate.entryDodge;
      }
    }
    const transientDodge = now < (target.desperateDodgeUntil || 0) ? target.desperateEntryDodge || 0 : 0;
    const monsterHitChance = enemy.mapId
      ? ChapterOneLevelPolicy.getMonsterHitChance(enemy.level, target.level, Math.min(.9, stats.dodge + transientDodge))
      : 1 - Math.min(.9, stats.dodge + transientDodge);
    let dodged = Math.random() >= monsterHitChance;
    let blinkDodged = false;
    if (!dodged && target.job === 'mage' && target.level >= 8) {
      const blink = ClassSkillPolicy.getEffect('mage', 'blink', Number(target.progress.skillLevels?.['mage:blink']) || 1);
      if (now >= (target.blinkReadyAt || 0) && Math.random() < blink.chance) {
        dodged = true;
        blinkDodged = true;
        target.blinkReadyAt = now + (blink.internalCooldown || 10) * 1000;
        target.blinkCooldownReduction = blink.nextCooldownReduction || 0;
        logBattle(`💨 ${target.name}觸發【閃現】，完全避開攻擊！`, 'system');
      }
    }
    const redrockState = getActiveMap(progress).id === 'redrock-wastes-entrance'
      ? getRedrockEnemyState(enemyIndex, enemyCurrentHp, enemy.maxHp) : null;
    const redrockAction = redrockState
      ? (RedrockWastesPolicy.resolveScheduledAction(enemy.id, redrockState, now)
        || (enemy.id === 'wasteland-hyena' ? RedrockWastesPolicy.resolveHyenaBasicHit(redrockState, Math.random()) : null))
      : null;
    const brokenrockState = getActiveMap(progress).id === 'brokenrock-canyon'
      ? getBrokenrockEnemyState(enemyIndex, enemyCurrentHp, enemy.maxHp) : null;
    const brokenrockActions = brokenrockState
      ? [...(brokenrockState.pendingActions || []), ...BrokenrockCanyonPolicy.resolveScheduledActions(enemy.id, brokenrockState, now, { otherAliveEnemies: Math.max(0, aliveMonsterIndexesByAge().length - 1) })]
      : [];
    if (brokenrockState) brokenrockState.pendingActions = [];
    for (const action of brokenrockActions) {
      if (action.id === 'battle-cry') {
        let affected = 0;
        aliveMonsterIndexesByAge().forEach((candidate) => {
          if (getEnemyDefinition(candidate).faction !== 'skullcrusher-tribe') return;
          getBrokenrockEnemyState(candidate).battleCryUntil = now + action.buff.durationMs;
          affected += 1;
        });
        BrokenrockCanyonPolicy.recordBuffTargets(brokenrockState, action.id, affected);
        logBattle(`📣【${enemy.name}】施放【戰鬥怒吼】，碎顱敵軍攻擊提高 10%！`, 'system');
      }
      if (action.id === 'offensive-command') {
        let affected = 0;
        aliveMonsterIndexesByAge().forEach((candidate) => {
          if (candidate === enemyIndex) return;
          getBrokenrockEnemyState(candidate).offensiveCommandUntil = now + action.buff.durationMs;
          affected += 1;
        });
        BrokenrockCanyonPolicy.recordBuffTargets(brokenrockState, action.id, affected);
        logBattle(`📣【${enemy.name}】施放【進攻號令】，其他敵軍攻擊與攻速提高 15%！`, 'system');
      }
    }
    const brokenrockAction = brokenrockActions.find((action) => action.damageMultiplier) || null;
    if (brokenrockAction?.target === 'lowest-hp-ratio-alive') {
      target = aliveMembers.sort((first, second) => first.currentHp / first.maxHp - second.currentHp / second.maxHp)[0];
    }
    const bloodwarState = getActiveMap(progress).id === 'bloodwar-wastes'
      ? getBloodwarEnemyState(enemyIndex, enemyCurrentHp, enemy.maxHp, now) : null;
    const bloodwarActions = bloodwarState
      ? [...(bloodwarState.pendingActions || []), ...BloodwarWastesPolicy.resolveScheduledActions(enemy.id, bloodwarState, now, { otherAliveEnemies: Math.max(0, aliveMonsterIndexesByAge().length - 1) })]
      : [];
    if (bloodwarState) bloodwarState.pendingActions = [];
    for (const action of bloodwarActions) {
      if (action.id === 'shield-wall') {
        const allies = aliveMonsterIndexesByAge().filter((candidate) => candidate !== enemyIndex);
        const protectedIndexes = [enemyIndex, ...allies.slice(0, 1)];
        protectedIndexes.forEach((candidate) => { getBloodwarEnemyState(candidate).shieldWallUntil = now + action.buff.durationMs; });
        BloodwarWastesPolicy.recordBuffTargets(bloodwarState, action.id, protectedIndexes.length);
        logBattle(`🛡【${enemy.name}】施放【盾牆】，保護自己與一名友軍！`, 'system');
      }
      if (action.id === 'hunting-mark') {
        target = [...aliveMembers].sort((first, second) => first.currentHp / first.maxHp - second.currentHp / second.maxHp)[0];
        BloodwarWastesPolicy.applyHuntingMark(bloodwarState, target.id, now);
        logBattle(`🎯【${enemy.name}】對 ${target.name}施放【獵殺標記】！`, 'system');
      }
      if (action.id === 'warblood-totem') {
        const affected = aliveMonsterIndexesByAge();
        affected.forEach((candidate) => { getBloodwarEnemyState(candidate).warbloodTotemUntil = now + action.buff.durationMs; });
        BloodwarWastesPolicy.recordBuffTargets(bloodwarState, action.id, affected.length);
        logBattle(`🩸【${enemy.name}】召喚【戰血圖騰】，強化全體敵軍！`, 'system');
      }
      if (action.id === 'full-army-charge') {
        const affected = aliveMonsterIndexesByAge().filter((candidate) => candidate !== enemyIndex);
        affected.forEach((candidate) => { getBloodwarEnemyState(candidate).fullArmyChargeUntil = now + action.buff.durationMs; });
        BloodwarWastesPolicy.recordBuffTargets(bloodwarState, action.id, affected.length);
        logBattle(`📣【${enemy.name}】施放【全軍突擊】，其他敵軍攻擊與攻速提高！`, 'system');
      }
      if (action.id === 'fight-to-the-end') {
        const allies = aliveMonsterIndexesByAge().filter((candidate) => candidate !== enemyIndex);
        let healing = 0;
        allies.forEach((candidate) => {
          const ally = getEnemyDefinition(candidate);
          const restored = Math.min(Math.round(ally.maxHp * action.otherHealRatio), ally.maxHp - battle.enemyHps[candidate]);
          battle.enemyHps[candidate] += restored;
          getBloodwarEnemyState(candidate).fightToEnd = true;
          healing += restored;
        });
        BloodwarWastesPolicy.recordFightToEnd(bloodwarState, { healing, aliveTargets: allies.length });
        logBattle(`🔥【${enemy.name}】發動【血戰到底】！`, 'system');
      }
    }
    const bloodwarAction = bloodwarActions.find((action) => action.damageMultiplier) || null;
    const critical = !dodged && Math.random() < ((enemy.criticalChance ?? (enemy.isBoss ? .15 : enemy.isElite ? .10 : .05)) + (redrockAction?.criticalBonus || 0));
    const blackForestAction = getActiveMap(progress).id === 'black-forest-entrance'
      ? BlackForestEntrancePolicy.resolveAction(enemy.id, Math.random(), target.currentHp / target.maxHp, enemyCurrentHp, enemy.maxHp)
      : 'attack';
    if (blackForestAction === 'leaf-storm') {
      logBattle(`🍃【${enemy.name}】施放【落葉風暴】，席捲所有存活隊員！`, 'system');
      resolveBlackForestLeafStorm(enemy, enemyCurrentHp, now);
      playMonsterAttackAnimation(enemyIndex, true);
      if (!env.fighting) return;
      if (resetPartyAfterDefeat(now)) {
        updateBattleUI();
        return;
      }
      continue;
    }
    let blackForestTrailAction = getActiveMap(progress).id === 'black-forest-trail'
      ? BlackForestTrailPolicy.resolveAction(enemy.id, Math.random(), target.currentHp / target.maxHp, enemyCurrentHp, enemy.maxHp)
      : 'attack';
    const spiderNestActive = getActiveMap(progress).id === 'spider-nest';
    const poisonStacks = getSpiderNestPoisonStacks(target);
    const currentBossPhase = SpiderNestPolicy.getBossPhase(enemy.id, enemyCurrentHp, enemy.maxHp);
    if (spiderNestActive && enemy.id === 'giantSpider') {
      if (!battle.enemySpiderNestPhase) battle.enemySpiderNestPhase = battle.enemyTypes.map(() => 1);
      const previousPhase = battle.enemySpiderNestPhase[enemyIndex] || 1;
      battle.enemySpiderNestPhase[enemyIndex] = currentBossPhase;
      if (currentBossPhase === 2 && previousPhase < 2) {
        summonSpiderNestMonster('spiderNestBlackstonePoisonSpider', enemyIndex, SpiderNestPolicy.BOSS.summonHpRatio, SpiderNestPolicy.BOSS.summonAttackRatio, SpiderNestPolicy.BOSS.summonLimit, '🥚【蜘蛛皇后】進入孵化階段，一隻削弱版黑石毒蜘蛛破卵而出！', now);
      }
      if (currentBossPhase === 3 && previousPhase < 3) logBattle('🕷【蜘蛛皇后】進入【巢穴狂暴】，攻擊與攻速提高，但防禦降低！', 'system');
    }
    let spiderNestAction = spiderNestActive
      ? SpiderNestPolicy.resolveAction(enemy.id, Math.random(), poisonStacks, enemyCurrentHp, enemy.maxHp,
        enemy.id === 'spiderNestBlackstoneBeastmaster'
          ? countAliveSpiderNestSummons('venomSpitterSpider') < SpiderNestPolicy.BEASTMASTER.summonLimit
          : countAliveSpiderNestSummons('spiderNestBlackstonePoisonSpider') < SpiderNestPolicy.BOSS.summonLimit)
      : 'attack';
    const blackForestDepthsActive = getActiveMap(progress).id === 'black-forest-depths';
    if (blackForestDepthsActive && enemy.id === 'heartOfTheBlackForest') {
      if (!battle.enemyDepthsPhase) battle.enemyDepthsPhase = battle.enemyTypes.map(() => 1);
      const depthsPhase = BlackForestDepthsPolicy.getBossPhase(enemy.id, enemyCurrentHp, enemy.maxHp);
      const previousDepthsPhase = battle.enemyDepthsPhase[enemyIndex] || 1;
      battle.enemyDepthsPhase[enemyIndex] = depthsPhase;
      if (depthsPhase >= 2 && previousDepthsPhase < 2) {
        logBattle('🌑【黑森林之心】進入第二階段【根脈甦醒】，攻擊提高 15%！', 'system');
        summonBlackForestDepthsRoot(enemyIndex, now);
      }
      if (depthsPhase >= 3 && previousDepthsPhase < 3) {
        logBattle('💜【黑森林之心】進入第三階段【核心崩裂】，攻擊與攻速大幅提高，但防禦降低！', 'system');
        summonBlackForestDepthsRoot(enemyIndex, now);
      }
    }
    const strongholdAction = getActiveMap(progress).id === 'blackstone-stronghold'
      ? BlackstoneStrongholdPolicy.resolveAction(enemy.id, Math.random(), target.currentHp / target.maxHp, enemyCurrentHp, enemy.maxHp)
      : 'attack';
    const forestAltarAction = getActiveMap(progress).id === 'forest-altar'
      ? ForestAltarPolicy.resolveAction(enemy.id, Math.random())
      : 'attack';
    const blackForestDepthsAction = getActiveMap(progress).id === 'black-forest-depths'
      ? BlackForestDepthsPolicy.resolveAction(enemy.id, Math.random(), getWoundedEnemyIndexes().length > 0, {
        canUseNatureEcho: now >= (getEnemySkillState(enemyIndex).natureEchoReadyAt || 0)
      })
      : 'attack';
    if (blackForestDepthsAction === 'nature-echo' && healBlackForestDepthsAlly(enemyIndex, now)) continue;
    if (strongholdAction === 'lion-roar' || strongholdAction === 'warlord-command') {
      battle.strongholdCommandUntil = Math.max(battle.strongholdCommandUntil || 0, now + BlackstoneStrongholdPolicy.LION_GUARD.roarDurationMs);
      logBattle(`📣【${enemy.name}】施放【${strongholdAction === 'lion-roar' ? '獅吼' : '督軍號令'}】，黑石據點敵軍攻擊提高 15%，持續 6 秒！`, 'system');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (spiderNestAction === 'whip-spiders') {
      battle.spiderNestCommandUntil = Math.max(battle.spiderNestCommandUntil || 0, now + SpiderNestPolicy.BEASTMASTER.commandDurationMs);
      logBattle('⛓【黑石訓獸師】施放【鞭策蜘蛛】，蜘蛛攻擊提高 25%、攻速提高 20%，持續 7 秒！', 'system');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (spiderNestAction === 'release-spitter') {
      if (summonSpiderNestMonster('venomSpitterSpider', enemyIndex, SpiderNestPolicy.BEASTMASTER.summonHpRatio, SpiderNestPolicy.BEASTMASTER.summonAttackRatio, SpiderNestPolicy.BEASTMASTER.summonLimit, '🕷【黑石訓獸師】施放【放養蜘蛛】，一隻削弱版噴毒蜘蛛加入戰鬥！', now)) continue;
      spiderNestAction = 'attack';
    }
    if (spiderNestAction === 'hatch-spider-eggs') {
      if (summonSpiderNestMonster('spiderNestBlackstonePoisonSpider', enemyIndex, SpiderNestPolicy.BOSS.summonHpRatio, SpiderNestPolicy.BOSS.summonAttackRatio, SpiderNestPolicy.BOSS.summonLimit, '🥚【蜘蛛皇后】施放【孵化蛛卵】，一隻削弱版黑石毒蜘蛛加入戰鬥！', now)) continue;
      spiderNestAction = 'attack';
    }
    if (spiderNestAction === 'shadow-dash') {
      if (!battle.enemyAssassinDashUntil) battle.enemyAssassinDashUntil = battle.enemyTypes.map(() => 0);
      battle.enemyAssassinDashUntil[enemyIndex] = now + SpiderNestPolicy.ASSASSIN.dashDurationMs;
    }
    if (spiderNestAction === 'web-entangle') {
      applyBlackstoneAttackSpeedPenalty(target, SpiderNestPolicy.CONTROL.webPenalty, SpiderNestPolicy.CONTROL.webDurationMs, now, '蛛絲纏繞');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (blackForestTrailAction === 'beast-command') {
      battle.blackstoneSpiderCommandUntil = Math.max(battle.blackstoneSpiderCommandUntil || 0, now + BlackForestTrailPolicy.BEASTMASTER.commandDurationMs);
      logBattle('⛓【黑石訓獸師】施放【鞭策】，黑石毒蜘蛛攻擊與攻速提高 20%，持續 6 秒！', 'system');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (blackForestTrailAction === 'release-spider') {
      if (summonBlackstonePoisonSpider(enemyIndex, now)) continue;
      blackForestTrailAction = 'attack';
    }
    if (blackForestTrailAction === 'captain-command') {
      activateBlackstoneCommand(BlackForestTrailPolicy.CAPTAIN.commandDurationMs, now, enemy.name);
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (blackForestTrailAction === 'shield-counter') {
      if (!battle.enemyCaptainShieldUntil) battle.enemyCaptainShieldUntil = battle.enemyTypes.map(() => 0);
      battle.enemyCaptainShieldUntil[enemyIndex] = now + BlackForestTrailPolicy.CAPTAIN.shieldDurationMs;
      logBattle(`🛡【${enemy.name}】進入【盾架反擊】，招架提高並會反擊，持續 5 秒！`, 'system');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    const activeDamageMultiplier = PlainsDepthsPolicy.getActiveDamageMultiplier(plainsAction)
      * BlackForestEntrancePolicy.getDamageMultiplier(blackForestAction)
      * BlackForestTrailPolicy.getDamageMultiplier(blackForestTrailAction)
      * SpiderNestPolicy.getDamageMultiplier(spiderNestAction, poisonStacks)
      * BlackstoneStrongholdPolicy.getDamageMultiplier(strongholdAction)
      * ForestAltarPolicy.getDamageMultiplier(forestAltarAction)
      * BlackForestDepthsPolicy.getDamageMultiplier(blackForestDepthsAction)
      * (redrockAction?.damageMultiplier || 1)
      * (brokenrockAction?.damageMultiplier || 1)
      * (bloodwarAction?.damageMultiplier || 1)
      * (lateAction?.id === 'execution' ? RedrockTemplePolicy.getExecutionMultiplier(target.currentHp, target.maxHp, lateUnit.state) : lateAction?.damageMultiplier || 1)
      * (lateUnit ? ChapterThreeLateCombatPolicy.modifiers(enemy.mapId, lateUnit, getLateChapterUnits(now), now).damage : 1)
      * (lateUnit && enemy.id === RedrockTemplePolicy.FINAL_BOSS_ID ? RedrockTemplePolicy.getAncientMarkDamageMultiplier(lateUnit.state, target.id, enemy.id, now) : 1)
      * (bloodwarState ? BloodwarWastesPolicy.getHunterDamageMultiplier(bloodwarState, target.id, now) : 1);
    const marked = now < (target.blackstoneMarkedUntil || 0);
    const markedHumanBonus = marked && enemy.faction === 'blackstone-bandits'
      ? 1 + BlackForestTrailPolicy.MARK.blackstoneHumanDamageBonus : 1;
    const markedArcherBonus = marked && enemy.id === 'blackstoneArcher'
      ? 1 + BlackForestTrailPolicy.MARK.archerDamageBonus : 1;
    const holyAttackMultiplier = now < enemySkillState.attackDownUntil ? 1 - enemySkillState.attackDown : 1;
    const eliteAffixDamageMultiplier = EliteAffixPolicy.getDamageMultiplier(enemy.eliteAffixes, target.currentHp / target.maxHp);
    const rawDamage = getMonsterAttackPower(enemy, progress, enemyCurrentHp) * holyAttackMultiplier * activeDamageMultiplier * markedHumanBonus * markedArcherBonus * eliteAffixDamageMultiplier * (critical ? 1.5 : 1);
    const parried = !dodged && Math.random() < stats.parry;
    const armorBreakMultiplier = now < (target.blackstoneArmorBreakUntil || 0)
      ? 1 - BlackForestTrailPolicy.RAIDER.armorBreakPenalty : 1;
    const spiderNestArmorMultiplier = now < (target.spiderNestArmorBreakUntil || 0) ? .90 : 1;
    const piercingMultiplier = (1 - BlackForestTrailPolicy.getDefenseIgnore(blackForestTrailAction))
      * (1 - BlackstoneStrongholdPolicy.getDefenseIgnore(strongholdAction))
      * (1 - (brokenrockAction?.defenseIgnore || 0))
      * (1 - (lateAction?.defenseIgnore || 0));
    const runeIronWallReduction = RunePolicy.hasWord(target.progress.equipment, 'iron-wall') && Math.random() < .15 ? .20 : 0;
    if (RunePolicy.hasWord(target.progress.equipment, 'unyielding') && target.currentHp / target.maxHp < .30 && now >= (target.runeUnyieldingReadyAt || 0)) {
      target.runeUnyieldingUntil = now + 5000;
      target.runeUnyieldingReadyAt = now + 20000;
    }
    const runeUnyieldingReduction = now < (target.runeUnyieldingUntil || 0) ? .20 : 0;
    let damage = dodged ? 0 : MonsterDefense.resolvePlayerDamage({
      baseDamage: rawDamage,
      defense: Math.max(0, Math.round(stats.defense * ChapterThreeSpecialEquipmentPolicy.getDefenseMultiplier(target, now) * armorBreakMultiplier * spiderNestArmorMultiplier * piercingMultiplier)),
      damageReduction: Math.min(.9, stats.damageReduction
        + ChapterTwoSpecialEquipmentPolicy.getIncomingDamageReduction(target.progress.equipment, target.currentHp / target.maxHp)
        + ChapterThreeCraftedEpicAbilityPolicy.getWastelandDamageReduction(target, now)
        + WarriorAdvancementPolicy.getUnyieldingReduction(target, now)
        + runeIronWallReduction + runeUnyieldingReduction
        + (now < (target.sanctuaryUntil || 0) ? target.sanctuaryDamageReduction || 0 : 0)
        + (target.job === 'priest' ? PriestAdvancementPolicy.getFaithBonuses(target, now).selfDamageReduction : 0)
        + (now < (target.manaShieldReductionUntil || 0) ? target.manaShieldDamageReduction || 0 : 0))
    }).finalDamage;
    if (parried && damage > 0) damage = Math.max(1, Math.ceil(damage * .5));
    ensureHunterCompanions(target, now);
    HunterAdvancementPolicy.updatePetSurvival(target, now);
    const guard = HunterAdvancementPolicy.applyGuardDamage(target, damage, now, Math.random);
    damage = guard.hunterDamage;
    if (guard.blockedReason === 'cooldown') CombatCorePolicy.record(target, 'petGuardCooldownSkips');
    else if (guard.blockedReason === 'chance') CombatCorePolicy.record(target, 'petGuardChanceMisses');
    else if (guard.blockedReason === 'no-pet') CombatCorePolicy.record(target, 'petGuardNoPetSkips');
    if (guard.triggered) {
      CombatCorePolicy.record(target, 'petGuardTriggers');
      CombatCorePolicy.record(target, 'petGuardAbsorbed', guard.petDamage);
      CombatCorePolicy.recordEvent(target, 'petEvents', { atMs: now, petId: guard.petId, kind: 'pet-guard', damage: guard.petDamage, share: guard.share, usesRemaining: guard.petUsesRemaining, guardReadyAt: guard.guardReadyAt });
      if (guard.petDied) CombatCorePolicy.recordEvent(target, 'petEvents', { atMs: now, petId: guard.petId, kind: 'pet-death', reviveAt: guard.reviveAt });
      logBattle(`🐾 ${target.name}的戰寵發動護主，承受 ${Math.round(guard.petDamage)} 點傷害（該寵物剩餘 ${guard.petUsesRemaining} 次）。`, 'system');
    }
    const absorbed = Math.min(target.shield || 0, damage);
    target.shield = Math.max(0, (target.shield || 0) - absorbed);
    PriestAdvancementPolicy.recordShieldAbsorption(target,absorbed,now);
    damage -= absorbed;
    CombatCorePolicy.record(target,'shieldAbsorbed',absorbed);CombatCorePolicy.record(target,'damageTaken',damage);
    const hpBeforeEnemyHit = target.currentHp;
    target.currentHp = Math.max(getPlaytestHpFloor(), target.currentHp - damage);
    if (target.currentHp <= 0) {
      const holyPriest=(battle.partyMembers||[]).find(member=>member.alive&&PriestAdvancementPolicy.isAdvanced(member.progress,'holy-priest')&&Number(member.progress.skillLevels?.['priest:prayer-of-life'])>=6);
      if(holyPriest&&PriestAdvancementPolicy.trySacredGuardian(holyPriest,target,battle,now)) logBattle(`✨ ${holyPriest.name}的【神聖守護】阻止 ${target.name}死亡！`, 'healing');
    }
    WarriorAdvancementPolicy.crossUnyielding(target, hpBeforeEnemyHit, now);
    resolveEnemyDirectHitRecovery(target, damage, stats);
    ChapterThreeSpecialEquipmentPolicy.resolveEnemyAttackOutcome(target, { actualDamage: damage, parried, dodged: dodged && !blinkDodged }, now);
    const directDamageLeech = EliteAffixPolicy.getDirectDamageLeech(enemy.eliteAffixes);
    if (damage > 0 && directDamageLeech > 0) {
      const restored = Math.min(Math.max(1, Math.floor(damage * directDamageLeech)), enemy.maxHp - battle.enemyHps[enemyIndex]);
      if (restored > 0) {
        battle.enemyHps[enemyIndex] += restored;
        logBattle(`🩸【${enemy.name}】觸發【嗜血】，恢復 ${restored} 生命。`, 'enemy-healing');
      }
    }

    if (target.currentHp > 0 && target.currentHp / target.maxHp < .3 && target.job === 'mage' && target.level >= 20 && now >= (target.manaShieldReadyAt || 0)) {
      const shield = ClassSkillPolicy.getEffect('mage', 'mana-shield', Number(target.progress.skillLevels?.['mage:mana-shield']) || 1);
      const manaCost = target.resourceMax * shield.manaCost;
      if (target.resourceCurrent >= manaCost) {
        target.resourceCurrent -= manaCost;
        target.shield += target.maxHp * shield.shield;
        target.manaShieldReadyAt = now + shield.internalCooldown * 1000;
        target.manaShieldReductionUntil = now + 6000;
        target.manaShieldDamageReduction = shield.damageReduction || 0;
        logBattle(`🛡 ${target.name}觸發【魔力護盾】！`, 'system');
      }
    }
    if (target.currentHp > 0 && target.currentHp / target.maxHp < .3 && target.job === 'priest' && target.level >= 8 && now >= (target.holyProtectionReadyAt || 0)) {
      const protection = ClassSkillPolicy.getEffect('priest', 'holy-protection', Number(target.progress.skillLevels?.['priest:holy-protection']) || 1);
      PriestAdvancementPolicy.grantShield(target,target,target.maxHp * protection.shield,'holy-protection',now,6000);
      target.holyProtectionReadyAt = now + protection.cooldown * 1000;
      target.holyProtectionUntil = now + 6000;
      if (protection.cleanse) target.bleed = null;
      logBattle(`✨ ${target.name}觸發【神聖庇護】！`, 'system');
    }

    const counterTargetAlive = battle.enemyHps[enemyIndex] > 0;
    if (counterTargetAlive && target.job === 'warrior' && target.level >= 20 && parried) {
      const counter = ClassSkillPolicy.getEffect('warrior', 'parry', Number(target.progress.skillLevels?.['warrior:parry']) || 1);
      applyDamageToMonster(enemyIndex, target.stats.attack * counter.counterPower, getPlayerAttackProfile(target.character), { attacker: target, attackKind: 'counter', canParry: false });
      const shieldCounter = WarriorAdvancementPolicy.getShieldCounter(target);
      if (shieldCounter && battle.enemyHps[enemyIndex] > 0) {
        const shieldCritical = Math.random() < target.stats.crit;
        const shieldResult = applyDamageToMonster(enemyIndex, target.stats.attack * shieldCounter.counterPower * (shieldCritical ? target.stats.criticalDamageMultiplier : 1), getPlayerAttackProfile(target.character), { attacker: target, attackKind: 'shield-counter', canParry: false });
        if (!shieldResult.evaded && shieldResult.finalDamage > 0 && shieldCounter.armorBreak) getEnemySkillState(enemyIndex).armorShatterUntil = now + shieldCounter.armorBreakDuration * 1000;
      }
    }
    if (counterTargetAlive && target.job === 'assassin' && target.level >= 8 && dodged) {
      const counter = ClassSkillPolicy.getEffect('assassin', 'evasion', Number(target.progress.skillLevels?.['assassin:evasion']) || 1);
      if (counter.counterPower) applyDamageToMonster(enemyIndex, target.stats.attack * counter.counterPower, getPlayerAttackProfile(target.character), { attacker: target, attackKind: 'counter', canParry: false });
    }

    if (!dodged && WarriorResourcePolicy.isWarrior(target.character.job)) {
      target.resourceCurrent = WarriorResourcePolicy.gainFromHitTaken(target.resourceCurrent);
    }
    if (!dodged && damage > 0 && getActiveMap(progress).id === 'wolf-den'
      && WolfDenPolicy.shouldInflictBleed(enemy.id, Math.random())) {
      inflictPartyMemberBleed(target, enemy, now);
      battle.enemyNextAttackAt[enemyIndex] = now + getMonsterAttackInterval(enemy);
    }
    if (!dodged && damage > 0 && battle.dungeonId === 'goblin-camp'
      && GoblinCampPolicy.shouldStun(battle.enemyTypes[enemyIndex], Math.random())) {
      applyControlEffectToPlayer(target, { type: 'stun', baseDurationMs: 1500, source: '投石暈眩' }, now);
    }
    if (!dodged && damage > 0 && getActiveMap(progress).id === 'boar-woods'
      && BoarWoodsPolicy.shouldCharge(enemy.id, Math.random())) {
      applyControlEffectToPlayer(target, { type: 'stun', baseDurationMs: BoarWoodsPolicy.BOSS_CHARGE_STUN_MS, source: '衝撞' }, now);
    }
    if (!dodged && damage > 0 && plainsAction === 'rend') inflictPartyMemberBleed(target, enemy, now);
    if (!dodged && damage > 0 && plainsAction === 'charge') {
      applyControlEffectToPlayer(target, { type: 'stun', baseDurationMs: PlainsDepthsPolicy.CHARGE_STUN_MS, source: '衝撞' }, now);
      logBattle(`💥【${enemy.name}】施放【衝撞】，${target.name}暈眩 2 秒！`, 'system');
    }
    if (!dodged && damage > 0 && plainsAction === 'dive') logBattle(`🦅【${enemy.name}】施放【俯衝】，造成雙倍傷害！`, 'system');
    if (!dodged && damage > 0 && plainsAction === 'smash') logBattle(`💢【${enemy.name}】施放【猛擊】，攻擊傷害提高！`, 'system');
    if (!dodged && damage > 0 && blackForestAction === 'shadow-bite') inflictBlackForestDot(target, enemy, 'bleed', now);
    if (!dodged && damage > 0 && blackForestAction === 'venom-fang') inflictBlackForestDot(target, enemy, 'poison', now);
    if (!dodged && damage > 0 && blackForestAction === 'charge') {
      applyControlEffectToPlayer(target, { type: 'stun', baseDurationMs: BlackForestEntrancePolicy.CONTROL.chargeStunMs, source: '衝撞' }, now);
      logBattle(`💥【${enemy.name}】施放【衝撞】，${target.name}暈眩 1 秒！`, 'system');
    }
    if (!dodged && damage > 0 && blackForestAction === 'entangling-roots') {
      applyControlEffectToPlayer(target, { type: 'stun', baseDurationMs: BlackForestEntrancePolicy.CONTROL.rootDurationMs, source: '纏繞根鬚' }, now);
      logBattle(`🌿【${enemy.name}】施放【纏繞根鬚】，${target.name}受困 4 秒！`, 'system');
    }
    if (!dodged && damage > 0 && blackForestAction === 'binding-arrow') {
      BlackForestEntrancePolicy.applyBindingArrow(target, now);
      logBattle(`🏹【${enemy.name}】施放【束縛箭】，${target.name}被束縛 2 秒！`, 'system');
    }
    if (!dodged && damage > 0 && blackForestAction === 'execution-arrow') logBattle(`🏹【${enemy.name}】對低生命目標施放【處決箭】！`, 'system');
    if (!dodged && damage > 0 && blackForestAction === 'root-strike') logBattle(`🌳【${enemy.name}】施放【根鬚重擊】！`, 'system');
    if (!dodged && damage > 0 && ['venom-fang', 'venom-flask'].includes(blackForestTrailAction)) inflictBlackForestTrailPoison(target, enemy, now);
    if (!dodged && damage > 0 && blackForestTrailAction === 'webbed-strike') {
      applyBlackstoneAttackSpeedPenalty(target, BlackForestTrailPolicy.CONTROL.webAttackSpeedPenalty, BlackForestTrailPolicy.CONTROL.webDurationMs, now, '蛛絲纏繞');
    }
    if (!dodged && damage > 0 && blackForestTrailAction === 'scouting-mark') {
      target.blackstoneMarkedUntil = now + BlackForestTrailPolicy.MARK.durationMs;
      logBattle(`🎯【${enemy.name}】施放【偵察標記】，${target.name}受到黑石人形怪傷害提高 12%，持續 5 秒！`, 'system');
    }
    if (!dodged && damage > 0 && blackForestTrailAction === 'armor-break') {
      target.blackstoneArmorBreakUntil = now + BlackForestTrailPolicy.RAIDER.armorBreakDurationMs;
      logBattle(`🪓【${enemy.name}】施放【破甲劈砍】，${target.name}防禦降低 15%，持續 5 秒！`, 'system');
    }
    if (!dodged && damage > 0 && blackForestTrailAction === 'intercept') {
      applyBlackstoneAttackSpeedPenalty(target, BlackForestTrailPolicy.RAIDER.interceptAttackSpeedPenalty, BlackForestTrailPolicy.RAIDER.interceptDurationMs, now, '攔截');
    }
    const blackForestTrailActionNames = { 'piercing-arrow': '穿甲箭', 'aimed-shot': '狙擊', 'venom-flask': '毒液瓶', 'captain-execution': '斬首', 'centurion-cleave': '破甲重斧', 'centurion-command': '百夫長號令', 'execution-axe': '處刑重斧' };
    if (!dodged && damage > 0 && blackForestTrailActionNames[blackForestTrailAction]) logBattle(`⚔【${enemy.name}】施放【${blackForestTrailActionNames[blackForestTrailAction]}】！`, 'system');
    if (!dodged && damage > 0 && ['nest-venom-fang', 'venom-spray', 'poisoned-arrow', 'twin-poison-blades', 'boss-venom-spray'].includes(spiderNestAction)) inflictSpiderNestPoison(target, enemy, 1, now);
    if (!dodged && damage > 0 && ['nest-venom-flask', 'toxic-bite', 'deadly-fang'].includes(spiderNestAction)) inflictSpiderNestPoison(target, enemy, 2, now);
    if (!dodged && damage > 0 && spiderNestAction === 'corrosive-venom') {
      target.spiderNestArmorBreakUntil = now + 4000;
      logBattle(`☣【${enemy.name}】施放【腐蝕毒液】，${target.name}防禦降低 10%，持續 4 秒！`, 'system');
    }
    if (!dodged && damage > 0 && spiderNestAction === 'sticky-web-bite') applyBlackstoneAttackSpeedPenalty(target, SpiderNestPolicy.CONTROL.stickyPenalty, SpiderNestPolicy.CONTROL.stickyDurationMs, now, '黏網撕咬');
    if (!dodged && damage > 0 && spiderNestAction === 'web-entangle') applyBlackstoneAttackSpeedPenalty(target, SpiderNestPolicy.CONTROL.webPenalty, SpiderNestPolicy.CONTROL.webDurationMs, now, '蛛絲纏繞');
    if (!dodged && damage > 0 && spiderNestAction === 'suffocating-web') applyBlackstoneAttackSpeedPenalty(target, SpiderNestPolicy.CONTROL.suffocatingPenalty, SpiderNestPolicy.CONTROL.suffocatingDurationMs, now, '窒息蛛網');
    if (!dodged && damage > 0 && spiderNestAction === 'web-restraint') applyBlackstoneAttackSpeedPenalty(target, .25, 5000, now, '蛛網束縛');
    const spiderNestActionNames = { 'venom-hunt-shot': '獵毒射擊', 'venom-whip': '毒鞭', 'twin-poison-blades': '雙重毒刃', 'shadow-dash': '暗影突進', 'lethal-venom-cut': '致命毒割', 'toxic-bite': '劇毒撕咬', 'deadly-fang': '致命毒牙', 'boss-venom-spray': '毒液噴射' };
    if (!dodged && damage > 0 && spiderNestActionNames[spiderNestAction]) logBattle(`⚔【${enemy.name}】施放【${spiderNestActionNames[spiderNestAction]}】！`, 'system');
    if (!dodged && damage > 0 && strongholdAction === 'rending-bite') inflictPartyMemberBleed(target, enemy, now);
    if (!dodged && damage > 0 && strongholdAction === 'shield-bash') {
      applyControlEffectToPlayer(target, { type: 'stun', baseDurationMs: BlackstoneStrongholdPolicy.GUARD.bashStunMs, source: '盾擊' }, now);
      logBattle(`💫【${enemy.name}】以盾擊使 ${target.name} 暈眩 1 秒！`, 'system');
    }
    if (!dodged && damage > 0 && strongholdAction === 'bullhorn-stampede') {
      applyControlEffectToPlayer(target, { type: 'stun', baseDurationMs: BlackstoneStrongholdPolicy.BULLHORN.stampedeStunMs, source: '蠻角衝鋒' }, now);
      logBattle(`💥【${enemy.name}】衝鋒命中，${target.name} 暈眩 1.2 秒！`, 'system');
    }
    const strongholdActionNames = { 'armor-piercing-bolt': '穿甲弩箭', 'aimed-volley': '瞄準齊射', 'twin-axe-cleave': '雙斧橫掃', 'hunting-pounce': '狩獵撲擊', 'crushing-hammer': '碎甲重錘', 'seismic-smash': '震地重擊', 'warhammer-sweep': '戰錘橫掃', 'warlord-execution': '督軍處決' };
    if (!dodged && damage > 0 && strongholdActionNames[strongholdAction]) logBattle(`⚔【${enemy.name}】施放【${strongholdActionNames[strongholdAction]}】！`, 'system');
    if (!dodged && damage > 0 && forestAltarAction === 'corrupted-bite') inflictPartyMemberBleed(target, enemy, now);
    if (!dodged && damage > 0 && forestAltarAction === 'corruption-flame') inflictForestAltarCorruptionFlame(target, enemy, now);
    const forestAltarControl = ForestAltarPolicy.getControlEffect(forestAltarAction);
    if (!dodged && damage > 0 && forestAltarControl) {
      const forestAltarControlNames = { 'thorn-entangle': '荊棘纏繞', 'rune-shock': '符文震擊', 'withering-touch': '凋零之觸', 'root-sweep': '根鬚橫掃' };
      applyBlackstoneAttackSpeedPenalty(target, forestAltarControl.attackSpeedPenalty, forestAltarControl.durationMs, now, forestAltarControlNames[forestAltarAction]);
    }
    const forestAltarActionNames = { 'corrupted-bite': '腐化撕咬', 'blackstone-heavy-slash': '黑石重斬', 'corruption-flame': '腐化之焰' };
    if (!dodged && damage > 0 && forestAltarActionNames[forestAltarAction]) logBattle(`⚔【${enemy.name}】施放【${forestAltarActionNames[forestAltarAction]}】！`, 'system');
    if (!dodged && damage > 0 && blackForestDepthsAction === 'depths-shadow-bite') inflictPartyMemberBleed(target, enemy, now);
    if (!dodged && damage > 0 && ['spore-eruption', 'corruption-pulse'].includes(blackForestDepthsAction)) inflictBlackForestDepthsCorruption(target, enemy, now);
    if (!dodged && damage > 0 && blackForestDepthsAction === 'corrupted-heavy-axe') {
      target.blackstoneArmorBreakUntil = now + BlackForestDepthsPolicy.SKILLS.corruptedBlackstoneCenturion.durationMs;
      logBattle(`🪓【${enemy.name}】施放【腐化重斧】，${target.name}防禦降低 15%，持續 5 秒！`, 'system');
    }
    const depthsControl = BlackForestDepthsPolicy.getControlEffect(blackForestDepthsAction);
    if (!dodged && damage > 0 && depthsControl) {
      const depthsControlNames = { 'corrupted-root-entangle': '腐根纏繞', 'withering-storm': '凋零風暴' };
      applyBlackstoneAttackSpeedPenalty(target, depthsControl.attackSpeedPenalty, depthsControl.durationMs, now, depthsControlNames[blackForestDepthsAction]);
    }
    const depthsActionNames = { 'depths-shadow-bite': '暗影撕咬', 'spore-eruption': '孢子噴發', 'corruption-pulse': '腐化脈衝' };
    if (!dodged && damage > 0 && depthsActionNames[blackForestDepthsAction]) logBattle(`⚔【${enemy.name}】施放【${depthsActionNames[blackForestDepthsAction]}】！`, 'system');
    if (!dodged && damage > 0 && redrockAction?.dot) {
      const dot = RedrockWastesPolicy.createDot(redrockAction.id, enemy.id, enemy.attack);
      target.bleed = { effectName: redrockAction.name, tickMs: dot.tickMs, tickDamage: Math.max(1, Math.ceil(dot.damage)), nextTickAt: now + dot.tickMs, expiresAt: now + dot.durationMs };
      RedrockWastesPolicy.recordDotApplication(redrockState, redrockAction.id);
      logBattle(`🩸【${enemy.name}】施放【${redrockAction.name}】，${target.name}陷入持續傷害。`, 'system');
    }
    if (!dodged && damage > 0 && redrockAction?.debuff?.type === 'defense-down') {
      target.redrockDefenseDown = redrockAction.debuff.value;
      target.redrockDefenseDownUntil = now + redrockAction.debuff.durationMs;
      RedrockWastesPolicy.recordDebuff(redrockState, redrockAction.id);
      logBattle(`🎯【${enemy.name}】施放【${redrockAction.name}】，${target.name}防禦降低 15%。`, 'system');
    }
    if (!dodged && damage > 0 && redrockAction?.stunChance) {
      const stun = RedrockWastesPolicy.resolveStun(redrockState, Math.random());
      if (stun) applyControlEffectToPlayer(target, { type: 'stun', baseDurationMs: stun.durationMs, source: redrockAction.name }, now);
    }
    if (!dodged && damage > 0 && redrockAction && !redrockAction.passive && !redrockAction.dot && !redrockAction.debuff) {
      logBattle(`⚔【${enemy.name}】施放【${redrockAction.name}】！`, 'system');
    }

    if (!dodged && lateUnit && lateAction) ChapterThreeLateCombatPolicy.hit(enemy.mapId, lateUnit, lateAction, target, getLateChapterUnits(now), now);
    if (dodged) {
      logBattle(`${target.name} 閃避了 ${enemy.name} 的攻擊。`, 'damage-taken');
    } else {
      logBattle(`${enemy.name} 對 ${target.name} 造成 ${damage} 點傷害${critical ? '（暴擊）' : ''}${absorbed ? `，護盾吸收 ${absorbed}` : ''}。`, 'damage-taken', {
        aggregateKey: `enemy-${battle.enemyTypes[enemyIndex]}-${target.id}`,
        damage,
        summary: `${enemy.name} 攻擊 ${target.name}${critical ? '（暴擊）' : ''}`
      });
    }
    playMonsterAttackAnimation(enemyIndex, !dodged && damage > 0, target);
    if (!dodged && damage > 0) playPartyMemberHitAnimation(target);

    if (target.currentHp > 0 && target.currentHp / target.maxHp < PARTY_AUTO_POTION_HEALTH_RATIO) {
      if (target.isMain) {
        syncLegacyBattleStateFromMain();
        usePotion();
        syncMainBattleMemberFromLegacy();
      } else useSharedHealingPotionForMember(target);
    }
    defeatPartyMember(target, now);
    if (!env.fighting) return;
    if (resetPartyAfterDefeat(now)) {
      updateBattleUI();
      return;
    }
  }

  syncLegacyBattleStateFromMain();
  if (attackOccurred) updateBattleUI();
}
return {defeatPartyMember,reviveDefeatedTeammates,processPartyMemberBleed,applyControlEffectToPlayer,applyBlackstoneAttackSpeedPenalty,activateBlackstoneCommand,inflictPartyMemberBleed,inflictForestAltarCorruptionFlame,inflictBlackForestDot,inflictBlackForestTrailPoison,inflictBlackForestDepthsCorruption,getSpiderNestPoisonStacks,inflictSpiderNestPoison,healBlackForestDepthsAlly,hasSummonedBlackstoneSpider,summonBlackstonePoisonSpider,countAliveSpiderNestSummons,summonSpiderNestMonster,getRedrockEnemyState,getRedrockEnemyStateById,getBrokenrockEnemyState,getBrokenrockEnemyStateById,getBloodwarEnemyState,getBloodwarEnemyStateById,getLateChapterUnits,getLateChapterMonsterMultiplier,updateLateChapterThresholds,processLateChapterCombat,getMonsterAttackPower,getMonsterAttackInterval,healGoblinAlly,useGoblinHealingTotem,enemyAttackTick};} const api={create};
if(typeof module==='object'&&module.exports)module.exports=api;else root.OfflineEnemyRuntime=api;
})(typeof globalThis!=='undefined'?globalThis:this);
