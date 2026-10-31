(function(root, factory) {
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./chapter-three-map-policy') : root.ChapterThreeMapPolicy,
    node ? require('./chapter-three-late-combat-policy') : root.ChapterThreeLateCombatPolicy);
  if (node) module.exports = api;
  else root.SkullcrusherDungeonCombat = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(Maps, Late) {
  'use strict';
  const ID = 'skullcrusher-forbidden-dungeon';
  const row = (id, hp, attack, defense, level = 40, speed = null, dr = null) => Object.freeze({id, hp, attack, defense, level, speed, dr});
  const WAVES = Object.freeze([
    [row('skullcrusher-berserker',1600,125,85),row('skullcrusher-shaman',1300,100,70),row('skullcrusher-wolf-rider',1650,130,90)],
    [row('skullcrusher-heavy-guard',2000,110,140),row('skullcrusher-berserker',1700,130,90),row('skullcrusher-wolf-rider',1750,135,95),row('skullcrusher-shaman',1400,105,75)],
    [row('temple-stoneguard',2200,120,150),row('rune-golem',2000,130,125),row('temple-executioner',1850,145,100),row('ancient-stoneguard',2100,115,145),row('rune-guard',1900,120,110)],
    [row('skullcrusher-champion',6500,190,160,42,.84)],
    [row('skullcrusher-champion',7500,215,170,42,.84,26),row('awakened-guard',8000,198,185,42,.78,27)],
    [row('skullcrusher-great-chieftain',35000,240,190,43,1,28)]
  ].map(Object.freeze));
  const GUARDS = Object.freeze([row('skullcrusher-berserker',1800,135,85,42,.92,10),row('skullcrusher-wolf-rider',1800,140,90,42,1.05,10)]);
  function monster(spec, guard = false) {
    const skillMapId = spec.id.startsWith('skullcrusher-') ? 'skullcrusher-war-camp'
      : ['ancient-stoneguard','rune-guard','awakened-guard'].includes(spec.id) ? 'ancient-altar' : 'redrock-temple';
    const original = Late.getMonster(skillMapId, Maps.getEnemy(spec.id));
    if (!original) throw Error('Missing existing dungeon monster: ' + spec.id);
    return {...original, mapId:ID, skillMapId, maxHp:spec.hp, attack:spec.attack, defense:spec.defense,
      level:spec.level, attackSpeed:spec.speed ?? original.attackSpeed, damageReduction:spec.dr ?? original.damageReduction,
      criticalRate:original.isBoss ? .15 : original.isElite ? .10 : .05, criticalDamageMultiplier:1.5,
      skillIds:original.skillIds.filter(id=>id!=='fallen-warrior-rage'), isDungeonGuard:guard, xp:0, gold:0};
  }
  function wave(step) {
    if (!WAVES[step]) throw Error('Invalid dungeon wave');
    return WAVES[step].map(spec=>monster(spec));
  }
  // Flags are consumed immediately, even if the live-guard cap leaves no room.
  function summons(state, hp, maxHp, livingGuards, livingGuardIds = []) {
    if (state.ended || hp <= 0) return [];
    state.thresholds ||= {};
    const result = [];
    for (const threshold of [.7,.4]) {
      if (hp / maxHp > threshold || state.thresholds[threshold]) continue;
      state.thresholds[threshold] = true;
      const count = Math.max(0, 2 - livingGuards - result.length);
      const candidates = GUARDS.filter(spec=>!livingGuardIds.includes(spec.id));
      result.push(...candidates.slice(0,count).map(spec=>monster(spec,true)));
    }
    return result;
  }
  function outcome(state, enemies, hps, members) {
    if (state.ended) return null;
    const boss = enemies.findIndex(enemy=>enemy.isBoss);
    const result = boss >= 0 && hps[boss] <= 0 ? 'succeeded'
      : members.every(member=>!member.alive || member.currentHp<=0) ? 'failed' : null;
    if (result) state.ended = result;
    return result;
  }
  return Object.freeze({ID,WAVES,GUARDS,monster,wave,summons,outcome});
});
