(function(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./chapter-three-progression-policy') : root.ChapterThreeProgressionPolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SkullcrusherDungeonLifecycle = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(Progression) {
  'use strict';
  const ID = 'skullcrusher-forbidden-dungeon';
  const NAME = '副本・碎顱禁地';
  const TICKET = Object.freeze({ id: 'skullcrusher-dungeon-pass', name: '碎顱禁地入場憑證', kind: 'dungeon-pass', stackable: true, sellable: false });
  const copy = value => JSON.parse(JSON.stringify(value));
  const terminal = new Set(['succeeded', 'failed', 'exited', 'aborted']);
  function active(account) {
    const ledger = account.skullcrusherDungeon;
    const run = ledger?.runs?.[ledger.activeRunId];
    return run?.status === 'active' ? run : null;
  }
  function validateEntry(account, leaderId) {
    const model = account.permanent, role = model?.characters?.[leaderId];
    if (!role || model.activeMainId !== leaderId) throw Error('Active party leader required');
    const probe = copy(role.progress);
    if (!Progression.normalize(probe).unlocked['skullcrusher-war-camp']) throw Error('Unlock chapter 3-4 first');
    const ids = model.parties?.[leaderId]?.memberIds;
    if (!ids || ids.length !== 3 || ids[0] !== leaderId || new Set(ids).size !== 3 || ids.some(id => !model.characters[id])) throw Error('Three valid party members required');
    if (active(account)) throw Error('Dungeon session already active');
    if (ids.some(id => account.farming?.owners?.[id]) || Object.values(account.farming?.sessions || {}).some(s => s.status === 'online' && s.members.some(id => ids.includes(id)))) throw Error('Battle or farming conflict');
    if (ids.some(id => account.farming?.legacyDebts?.[id]) || Object.values(account.farming?.teamOffline || {}).some(s => s.members.some(id => ids.includes(id)))) throw Error('Settle offline income before entry');
    const quantity = model.bag.items.filter(item => item.id === TICKET.id && item.kind === TICKET.kind).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    if (quantity < 1) throw Error('Dungeon pass required');
    return ids;
  }
  function saveMembers(account, ids, states, now) {
    if (!Array.isArray(states) || states.length !== 3 || new Set(states.map(s=>s.id)).size !== 3 || states.some(s=>!ids.includes(s.id))) throw Error('Dungeon member checkpoint mismatch');
    for (const {id,state} of states) {
      if (!Number.isFinite(state?.currentHp) || !Number.isFinite(state?.maxHp) || state.maxHp <= 0 || state.currentHp < 0 || state.currentHp > state.maxHp || !Number.isFinite(state?.resource?.current) || !Number.isFinite(state.resource.max) || state.resource.current < 0 || state.resource.current > state.resource.max) throw Error('Invalid dungeon member state');
      account.permanent.characters[id].progress.partyMemberState = copy(state);
      account.permanent.characters[id].progress.lastActiveAt = now;
      if (account.farming) account.farming.eligibility[id] = {eligible:false,since:now};
    }
  }
  function checkpoint(members) {
    return members.map(m=>({id:m.id,state:{currentHp:m.currentHp,maxHp:m.maxHp,resource:{type:m.resourceType,current:m.resourceCurrent,max:m.resourceMax},runtime:{alive:m.alive,skillCooldowns:{},reviveAt:null}}}));
  }
  function apply(account, command) {
    const { type, runId, now } = command;
    if (typeof runId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(runId) || !Number.isFinite(now)) throw Error('Valid dungeon identity/time required');
    const previous = account.skullcrusherDungeon?.runs?.[runId];
    if (previous && previous.accountId !== account.id) throw Error('Dungeon account mismatch');
    if (type === 'enter') {
      if (previous) {
        if (previous.leaderId !== command.leaderId) throw Error('Dungeon request identity mismatch');
        return account;
      }
      const ids = validateEntry(account, command.leaderId);
      saveMembers(account, ids, command.memberStates, now);
      let consumed = false;
      account.permanent.bag.items = account.permanent.bag.items.map(item => {
        if (!consumed && item.id === TICKET.id && item.kind === TICKET.kind && item.quantity >= 1) { consumed = true; return { ...item, quantity: item.quantity - 1 }; }
        return item;
      }).filter(item => item.id !== TICKET.id || item.quantity > 0);
      const returnMapId = account.permanent.characters[command.leaderId].progress.selectedMapId;
      if (!returnMapId || returnMapId === ID) throw Error('Valid original map required');
      const run = { dungeonId: ID, runId, accountId: account.id, leaderId: command.leaderId, characterIds: [...ids], returnMapId,
        status: 'active', ticket: { itemId: TICKET.id, quantity: 1, consumed: true }, enteredAt: now, endedAt: null,
        endReason: null, settlementId: 'skullcrusher-settlement:' + runId, rewardStatus: 'not-implemented', testOnly: true };
      account.skullcrusherDungeon ||= { version: 1, activeRunId: null, runs: {} };
      account.skullcrusherDungeon.runs[runId] = run;
      account.skullcrusherDungeon.activeRunId = runId;
      return account;
    }
    if (type !== 'end' || !terminal.has(command.status) || !previous) throw Error('Invalid dungeon ending');
    if (previous.status !== 'active') return account;
    if (now < previous.enteredAt || typeof command.reason !== 'string' || !command.reason) throw Error('Invalid dungeon end boundary');
    if (command.memberStates) saveMembers(account, previous.characterIds, command.memberStates, now);
    for (const id of previous.characterIds) if(account.permanent.characters[id]) account.permanent.characters[id].progress.lastActiveAt=now;
    previous.status = command.status; previous.endedAt = now; previous.endReason = command.reason;
    account.skullcrusherDungeon.activeRunId = null;
    const progress = account.permanent.characters[previous.leaderId]?.progress;
    if (progress) { progress.selectedMapId = previous.returnMapId; progress.requiresMapSelectionAfterDefeat = true; progress.dungeonAdmission = false; }
    return account;
  }
  function initializeMembers(members, now = Date.now()) {
    if (members.length !== 3) throw Error('Three battle members required');
    // Callers construct fresh members from character/equipment data without saved combat runtime.
    for (const member of members) {
      member.currentHp = member.maxHp; member.resourceCurrent = member.resourceMax; member.alive = true;
      member.skillCooldowns = {}; member.globalSkillReadyAt = 0; member.nextAttackAt = now;
      member.reviveAt = null; member.targetIndex = -1;
    }
    return members;
  }
  function create({ runtime, prepareMembers, activate = () => {}, stop = () => {}, now = Date.now, generate = () => crypto.randomUUID() }) {
    let scene = null, entering = null, ending = null, pendingRequest = null, pendingEnd = null, epoch = 0;
    async function end(status = 'exited', reason = 'player-exit') {
      if (ending) return ending;
      const run = scene?.run || active(runtime.getCommitted());
      if (!run) return null;
      if (scene?.terminalOutcome) { status = scene.terminalOutcome.status; reason = scene.terminalOutcome.reason; }
      const memberStates = scene ? checkpoint(scene.members) : undefined;
      ++epoch; stop(); scene = null;
      pendingEnd ||= { type: 'end', runId: run.runId, status, reason, ...(memberStates ? {memberStates} : {}), now: now() };
      ending = runtime.skullcrusherAction(pendingEnd).then(result => { pendingEnd = null; return result; }).finally(() => { ending = null; });
      return ending;
    }
    const api = {
      get scene() { return scene; },
      claimOutcome(status, reason) {
        if (!scene || scene.terminalOutcome || !['succeeded','failed'].includes(status)) return false;
        scene.terminalOutcome = {status,reason};
        return true;
      },
      enter() {
        if (entering) return entering;
        if (scene) return Promise.resolve(scene);
        const generation = epoch;
        entering = (async () => {
          if (!runtime.active) throw Error('Active account required');
          await runtime.flush();
          if (generation !== epoch) throw Error('Dungeon entry cancelled');
          if (!pendingRequest) {
            validateEntry(runtime.getCommitted(), runtime.mainId);
            pendingRequest = { type: 'enter', runId: generate(), leaderId: runtime.mainId, now: now() };
          }
          const members = initializeMembers(prepareMembers(), now());
          pendingRequest.memberStates ||= checkpoint(members);
          const result = await runtime.skullcrusherAction(pendingRequest);
          const run = result.account.skullcrusherDungeon.runs[pendingRequest.runId];
          pendingRequest = null;
          if (run.status !== 'active' || generation !== epoch || !runtime.active) {
            if (run.status === 'active') await runtime.skullcrusherAction({ type: 'end', runId: run.runId, status: 'aborted', reason: 'entry-cancelled', now: now() });
            throw Error('Dungeon entry cancelled');
          }
          scene = { run: copy(run), members, step: 0, phase: 1 };
          try { activate(scene); } catch (error) { await end('aborted', 'scene-start-failed'); throw error; }
          return scene;
        })().finally(() => { entering = null; });
        return entering;
      },
      advance() {
        if (!scene || ending || scene.step >= 5) throw Error('No next test step');
        scene.step++; scene.phase = scene.step < 4 ? 1 : scene.step === 4 ? 2 : 3;
        return scene;
      },
      checkDefeat() { return scene && !scene.terminalOutcome && scene.members.every(m => !m.alive || m.currentHp <= 0) ? end('failed', 'party-defeated') : Promise.resolve(null); },
      end,
      async recover() { const run = active(runtime.getCommitted()); if (run) return end('aborted', 'page-reload'); return null; },
      async dispose() { ++epoch; stop(); if (entering) { try { await entering; } catch {} } return end('aborted', 'session-ended'); }
    };
    return api;
  }
  return Object.freeze({ ID, NAME, TICKET, active, validateEntry, apply, initializeMembers, create });
});
