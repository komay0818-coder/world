(function attachDungeonTicketCycle(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DungeonTicketCycle = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createDungeonTicketCycle() {
  const GOBLIN_CAMP_WAVES = Object.freeze({
    1: Object.freeze(['goblinWarrior', 'goblinSlinger', 'goblinScout', 'goblinScout']),
    2: Object.freeze(['goblinWarrior', 'goblinSlinger', 'goblinSlinger', 'goblinScout']),
    3: Object.freeze(['goblinWarrior', 'goblinWarrior', 'goblinShaman', 'goblinShaman']),
    4: Object.freeze(['goblinGuard', 'goblinWarrior', 'goblinShaman', 'goblinShaman']),
    5: Object.freeze(['goblinCaptain', 'goblinGuard', 'goblinGuard', 'goblinShaman']),
    6: Object.freeze(['goblinGuard', 'goblinGuard', 'goblinShaman', 'goblinTreasureChest']),
    7: Object.freeze(['goblinHighChief', 'goblinGuard', 'goblinShaman'])
  });

  function getGoblinCampWaveTypes(wave) {
    const normalizedWave = Math.floor(Number(wave) || 0);
    return [...(GOBLIN_CAMP_WAVES[normalizedWave] || [])];
  }

  function resolveCompletion({ ticketCount = 0, dungeonId, returnMapId }) {
    const availableTickets = Math.max(0, Math.floor(Number(ticketCount) || 0));
    const consumed = availableTickets > 0 ? 1 : 0;
    const ticketsLeft = Math.max(0, availableTickets - consumed);
    const restartDungeon = ticketsLeft > 0;
    return {
      consumed,
      ticketsLeft,
      restartDungeon,
      nextMapId: restartDungeon ? dungeonId : returnMapId,
      nextAdmission: restartDungeon,
      delayMs: restartDungeon ? 1500 : 5000
    };
  }

  function shouldDropTicket(randomValue, dropRate = .5) {
    const roll = Math.min(1, Math.max(0, Number(randomValue) || 0));
    const rate = Math.min(1, Math.max(0, Number(dropRate) || 0));
    return roll < rate;
  }

  function resolveGoblinCampWaveClear({ wave, randomValue, minWave = 4, maxWave = 7 }) {
    const clearedWave = Math.max(1, Math.floor(Number(wave) || 1));
    if (clearedWave < minWave) {
      return { horn: false, escaped: false, continueDungeon: true, nextWave: clearedWave + 1 };
    }
    if (clearedWave >= maxWave) {
      return { horn: false, escaped: false, continueDungeon: false, nextWave: null };
    }
    const escaped = (Number(randomValue) || 0) < .5;
    return {
      horn: true,
      escaped,
      continueDungeon: !escaped,
      nextWave: escaped ? null : clearedWave + 1
    };
  }

  return { GOBLIN_CAMP_WAVES, getGoblinCampWaveTypes, resolveCompletion, shouldDropTicket, resolveGoblinCampWaveClear };
}));
