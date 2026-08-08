(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackstoneStrongholdPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULES = Object.freeze({
    dungeonId: 'blackstone-stronghold',
    gameplayType: 'outpost-siege',
    objectiveCount: 5,
    minKillsPerOutpost: 10,
    maxKillsPerOutpost: 70,
    outpostDamageReduction: null,
    outpostShield: null,
    enrageAttackBonus: .30,
    enrageAttackSpeedBonus: .30,
    enrageDurationMs: 15000
  });

  function monster(id, name, rank, race, role, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      race,
      role,
      chapter: 2,
      mapId: RULES.dungeonId,
      faction: 'blackstone-bandits',
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
    monster('blackstone-guard', '黑石守衛', 'normal', 'human', '重甲前排', { image: 'assets/blackstone-guard.png' }),
    monster('blackstone-crossbowman', '黑石弩手', 'normal', 'goblin', '遠程輸出', { image: 'assets/blackstone-crossbowman.png', faction: 'blackstone-goblins' }),
    monster('blackstone-berserker', '黑石狂戰士', 'normal', 'orc', '雙斧近戰', { image: 'assets/blackstone-berserker.png' }),
    monster('blackstone-warhound', '黑石戰犬', 'normal', 'beast', '高速近戰', { image: 'assets/blackstone-warhound.png', faction: 'blackstone-beasts' }),
    monster('blackstone-lion-guard', '黑石獅衛', 'elite', 'lionkin', '高攻擊近戰', { image: 'assets/blackstone-lion-guard.png' }),
    monster('blackstone-bullhorn-warrior', '黑石蠻角勇士', 'elite', 'bullkin', '高血量／重擊', { image: 'assets/blackstone-bullhorn-warrior.png' }),
    monster('blackstone-warlord', '黑石督軍', 'boss', 'orc', '據點指揮官', { image: 'assets/blackstone-warlord.png' })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));
  function getMonster(monsterId) { return MONSTER_BY_ID.get(monsterId) || null; }
  function getMonstersByRank(rank) { return MONSTERS.filter((entry) => entry.rank === rank); }

  const OUTPOSTS = Object.freeze([
    Object.freeze({ id: 'blackstone-supply-station', name: '補給站', image: 'assets/blackstone-supply-station.png', effect: null, implemented: false })
  ]);
  const OUTPOST_BY_ID = new Map(OUTPOSTS.map((entry) => [entry.id, entry]));
  function getOutpost(outpostId) { return OUTPOST_BY_ID.get(outpostId) || null; }

  function rollRequiredKills(random = Math.random) {
    const roll = Math.max(0, Math.min(.999999, Number(random()) || 0));
    return RULES.minKillsPerOutpost + Math.floor(roll * (RULES.maxKillsPerOutpost - RULES.minKillsPerOutpost + 1));
  }

  function createState(random = Math.random) {
    return { destroyedOutposts: 0, killsSinceOutpost: 0, nextOutpostAtKills: rollRequiredKills(random), outpostActive: false, bossSpawned: false, enragedUntil: 0 };
  }

  function normalizeState(saved, random = Math.random) {
    const source = saved && typeof saved === 'object' ? saved : {};
    const destroyedOutposts = Math.min(RULES.objectiveCount, Math.max(0, Math.floor(Number(source.destroyedOutposts) || 0)));
    const nextOutpostAtKills = Math.min(RULES.maxKillsPerOutpost, Math.max(RULES.minKillsPerOutpost, Math.floor(Number(source.nextOutpostAtKills) || rollRequiredKills(random))));
    return {
      destroyedOutposts,
      killsSinceOutpost: Math.max(0, Math.floor(Number(source.killsSinceOutpost) || 0)),
      nextOutpostAtKills,
      outpostActive: destroyedOutposts < RULES.objectiveCount && Boolean(source.outpostActive),
      bossSpawned: destroyedOutposts >= RULES.objectiveCount || Boolean(source.bossSpawned),
      enragedUntil: Math.max(0, Number(source.enragedUntil) || 0)
    };
  }

  function recordMonsterKill(state) {
    const next = normalizeState(state);
    if (next.bossSpawned || next.outpostActive) return next;
    next.killsSinceOutpost += 1;
    if (next.killsSinceOutpost >= next.nextOutpostAtKills || next.killsSinceOutpost >= RULES.maxKillsPerOutpost) next.outpostActive = true;
    return next;
  }

  function destroyOutpost(state, options = {}) {
    const next = normalizeState(state, options.random);
    if (!next.outpostActive || next.bossSpawned) return { ok: false, reason: 'no-active-outpost', state: next };
    next.destroyedOutposts += 1;
    next.outpostActive = false;
    next.killsSinceOutpost = 0;
    next.enragedUntil = Math.max(0, Number(options.now) || Date.now()) + RULES.enrageDurationMs;
    next.bossSpawned = next.destroyedOutposts >= RULES.objectiveCount;
    next.nextOutpostAtKills = next.bossSpawned ? 0 : rollRequiredKills(options.random);
    return { ok: true, state: next, triggerEnrage: true, spawnBoss: next.bossSpawned };
  }

  function getEnrage(state, now = Date.now()) {
    const active = (Number(state?.enragedUntil) || 0) > now;
    return { active, attackBonus: active ? RULES.enrageAttackBonus : 0, attackSpeedBonus: active ? RULES.enrageAttackSpeedBonus : 0, remainingMs: active ? state.enragedUntil - now : 0 };
  }

  return Object.freeze({ RULES, MONSTERS, OUTPOSTS, getMonster, getMonstersByRank, getOutpost, rollRequiredKills, createState, normalizeState, recordMonsterKill, destroyOutpost, getEnrage });
});
