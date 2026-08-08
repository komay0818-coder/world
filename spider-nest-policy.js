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
    monster('spider-nest-blackstone-poison-spider', '黑石毒蜘蛛', 'normal', '近戰毒系怪物', { combatId: 'spiderNestBlackstonePoisonSpider', image: 'assets/blackstone-poison-spider.png', stats: Object.freeze({ maxHp: 300, attack: 39, defense: 21, evasion: 12, parry: 0, damageReduction: 4, attackSpeed: 1.20, xp: 36, gold: 18 }), skillIds: Object.freeze(['nest-venom-fang', 'sticky-web-bite']), aiProfileId: 'fast-poison-stacker', attackProfile: 'melee-poison' }),
    monster('venom-spitter-spider', '噴毒蜘蛛', 'normal', '遠程持續傷害怪物', { combatId: 'venomSpitterSpider', image: 'assets/venom-spitter-spider.png', stats: Object.freeze({ maxHp: 260, attack: 42, defense: 17, evasion: 8, parry: 0, damageReduction: 2, attackSpeed: .95, xp: 37, gold: 19 }), skillIds: Object.freeze(['venom-spray', 'corrosive-venom']), aiProfileId: 'ranged-poison-dot', attackProfile: 'ranged-poison' }),
    monster('web-weaver', '蛛網編織者', 'normal', '蛛絲控制型怪物', { combatId: 'webWeaver', image: 'assets/web-weaver.png', stats: Object.freeze({ maxHp: 330, attack: 35, defense: 24, evasion: 7, parry: 0, damageReduction: 5, attackSpeed: .90, xp: 39, gold: 20 }), skillIds: Object.freeze(['web-entangle', 'suffocating-web']), aiProfileId: 'attack-speed-controller', attackProfile: 'ranged-control' }),
    monster('blackstone-venom-hunter', '黑石毒獵手', 'normal', '使用淬毒弓箭的哥布林遠程怪', { combatId: 'blackstoneVenomHunter', image: 'assets/blackstone-venom-hunter.png', faction: 'blackstone-goblins', race: 'goblin', stats: Object.freeze({ maxHp: 275, attack: 44, defense: 19, evasion: 13, parry: 3, damageReduction: 3, attackSpeed: 1.10, xp: 40, gold: 22 }), skillIds: Object.freeze(['poisoned-arrow', 'venom-hunt-shot']), aiProfileId: 'poison-exploiter', attackProfile: 'ranged-poison' }),
    monster('spider-nest-blackstone-beastmaster', '黑石訓獸師', 'elite', '操控並強化蜘蛛的毒液菁英', { combatId: 'spiderNestBlackstoneBeastmaster', image: 'assets/blackstone-beastmaster.png', faction: 'blackstone-bandits', stats: Object.freeze({ maxHp: 900, attack: 58, defense: 42, evasion: 9, parry: 8, damageReduction: 8, attackSpeed: 1, xp: 125, gold: 72 }), skillIds: Object.freeze(['nest-venom-flask', 'whip-spiders', 'release-spitter', 'venom-whip']), aiProfileId: 'nest-beast-handler', attackProfile: 'beast-support-poison' }),
    monster('blackstone-venomblade-assassin', '黑石毒刃刺客', 'elite', '雙持毒刃的高速爆發近戰菁英', { combatId: 'blackstoneVenombladeAssassin', image: 'assets/blackstone-venomblade-assassin.png', faction: 'blackstone-bandits', race: 'orc', stats: Object.freeze({ maxHp: 780, attack: 63, defense: 34, evasion: 18, parry: 10, damageReduction: 6, attackSpeed: 1.25, xp: 135, gold: 78 }), skillIds: Object.freeze(['twin-poison-blades', 'shadow-dash', 'lethal-venom-cut']), aiProfileId: 'poison-burst-assassin', attackProfile: 'melee-burst-poison' }),
    monster('giant-spider', '巨大蜘蛛', 'boss', '以毒液與蜘蛛絲壓制戰場的巢穴最終 Boss', { combatId: 'giantSpider', image: 'assets/giant-spider.png', stats: Object.freeze({ maxHp: 3900, attack: 73, defense: 61, evasion: 4, parry: 8, damageReduction: 16, attackSpeed: .90, xp: 520, gold: 320 }), skillIds: Object.freeze(['toxic-bite', 'web-restraint', 'boss-venom-spray', 'hatch-spider-eggs', 'deadly-fang', 'nest-frenzy']), aiProfileId: 'three-phase-brood-boss', bodyProfile: 'giant-bloated-abdomen', attackProfile: 'boss-poison-web-control' })
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
