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
    implemented: false,
    contentStatus: 'skill-foundation'
  });

  const SKILLS = Object.freeze({
    corruptedForestWolf: Object.freeze({ active: 'corrupted-bite', passive: 'corrupted-frenzy', chance: .25, damage: 1.18, threshold: .40 }),
    thornDemonVine: Object.freeze({ active: 'thorn-entangle', passive: 'barbed-hide', chance: .24, damage: 1.08, slow: .20, durationMs: 4000, threshold: .50 }),
    corruptedBlackstoneSoldier: Object.freeze({ active: 'blackstone-heavy-slash', passive: 'corrupted-shield-wall', chance: .22, damage: 1.32, threshold: .50 }),
    altarGuard: Object.freeze({ active: 'rune-shock', passive: 'ancient-bulwark', chance: .24, damage: 1.35, slow: .15, durationMs: 3000 }),
    corruptedBlackstonePriest: Object.freeze({ active: 'corruption-flame', passive: 'dark-sacrifice', chance: .28, damage: 1.20, threshold: .35 }),
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
      implemented: false,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('corrupted-forest-wolf', '腐化森林狼', 'normal', { combatId: 'corruptedForestWolf', role: '高速追擊', image: 'assets/corrupted-forest-wolf.png', skillIds: Object.freeze(['corrupted-bite', 'corrupted-frenzy']), aiProfileId: 'forest-altar-wolf', stats: Object.freeze({ maxHp: 480, attack: 68, defense: 30, evasion: 17, parry: 0, damageReduction: 5, attackSpeed: 1.40, xp: 65, gold: 32 }) }),
    monster('thorn-demon-vine', '荊棘魔藤', 'normal', { combatId: 'thornDemonVine', role: '控制與反擊', image: 'assets/thorn-demon-vine.png', skillIds: Object.freeze(['thorn-entangle', 'barbed-hide']), aiProfileId: 'forest-altar-vine', stats: Object.freeze({ maxHp: 650, attack: 59, defense: 52, evasion: 2, parry: 0, damageReduction: 12, attackSpeed: .75, xp: 68, gold: 34 }) }),
    monster('corrupted-blackstone-soldier', '腐化黑石士兵', 'normal', { combatId: 'corruptedBlackstoneSoldier', role: '重甲前排', faction: 'corrupted-blackstone', image: 'assets/corrupted-blackstone-soldier.png', skillIds: Object.freeze(['blackstone-heavy-slash', 'corrupted-shield-wall']), aiProfileId: 'forest-altar-soldier', stats: Object.freeze({ maxHp: 720, attack: 65, defense: 60, evasion: 3, parry: 15, damageReduction: 15, attackSpeed: .82, xp: 72, gold: 37 }) }),
    monster('altar-guard', '祭壇守衛', 'elite', { combatId: 'altarGuard', role: '防禦型菁英', image: 'assets/altar-guard.png', skillIds: Object.freeze(['rune-shock', 'ancient-bulwark']), aiProfileId: 'forest-altar-guard', stats: Object.freeze({ maxHp: 1900, attack: 88, defense: 76, evasion: 3, parry: 10, damageReduction: 18, attackSpeed: .78, xp: 240, gold: 135 }) }),
    monster('corrupted-blackstone-priest', '腐化黑石祭司', 'elite', { combatId: 'corruptedBlackstonePriest', role: '腐化法術與輔助', faction: 'corrupted-blackstone', image: 'assets/corrupted-blackstone-priest.png', skillIds: Object.freeze(['corruption-flame', 'dark-sacrifice']), aiProfileId: 'forest-altar-priest', stats: Object.freeze({ maxHp: 1450, attack: 96, defense: 48, evasion: 10, parry: 5, damageReduction: 9, attackSpeed: 1, xp: 225, gold: 145 }) }),
    monster('fallen-druid', '墮落德魯伊', 'elite', { combatId: 'fallenDruid', role: '控制與持續傷害', image: 'assets/fallen-druid.png', skillIds: Object.freeze(['withering-touch', 'spreading-corruption']), aiProfileId: 'forest-altar-druid', stats: Object.freeze({ maxHp: 1700, attack: 91, defense: 57, evasion: 8, parry: 7, damageReduction: 12, attackSpeed: .92, xp: 260, gold: 155 }) }),
    monster('corrupted-altar-guardian', '腐化祭壇守護者', 'boss', { combatId: 'corruptedAltarGuardian', role: '三階段祭壇 Boss', image: 'assets/corrupted-altar-guardian.png', skillIds: Object.freeze(['root-sweep', 'altar-resonance']), aiProfileId: 'forest-altar-boss', stats: Object.freeze({ maxHp: 8000, attack: 108, defense: 86, evasion: 4, parry: 12, damageReduction: 20, attackSpeed: .88, xp: 950, gold: 560 }) })
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

  return Object.freeze({ MAP, SKILLS, MONSTERS, getMonster, getMonstersByRank, getMonsterPool, rollLevel, toCombatMonster, getCombatMonster, getCombatPool, getBossPhase, getCombatMultipliers, resolveAction, getDamageMultiplier, getControlEffect });
});
