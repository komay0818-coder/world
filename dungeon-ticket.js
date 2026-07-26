(function attachDungeonTicketCycle(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DungeonTicketCycle = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createDungeonTicketCycle() {
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

  return { resolveCompletion, shouldDropTicket };
}));
