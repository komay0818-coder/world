'use strict';

const assert = require('node:assert/strict');
const AuthEntry = require('../account-auth-entry');

(async () => {
  const listeners = [];
  const first = { userId: '81111111-1111-4111-8111-111111111111' };
  const refreshed = { userId: first.userId };
  let current = first;
  const controller = {
    subscribeLifecycle(listener) { listeners.push(listener); return () => {}; },
    isCurrent(verification) { return verification === current; }
  };
  const preparedWith = [];
  const confirmedWith = [];
  let migrations = 0;
  const bootstrap = {
    start() { const error = Error('金幣資料需要轉換'); error.code = 'SHARED_GOLD_MIGRATION_REQUIRED'; return Promise.reject(error); },
    stop: async () => ({ stopped: true }),
    state: () => ({}),
    async prepareSharedGoldMigration(options) { preparedWith.push(options.verification); return { status: 'legacy', preview: { characters: [{ name: '角色', gold: 9 }], total: 9 } }; },
    async confirmSharedGoldMigration(options) { confirmedWith.push(options.verification); migrations++; return { migration: { total: 9 }, startup: { runtimeStarted: true } }; }
  };
  let confirmAction = null;
  let hidden = 0;
  const previousView = globalThis.accountAuthView;
  globalThis.accountAuthView = {
    showGoldMigration(_preview, action) { confirmAction = action; },
    hideGoldMigration() { hidden++; },
    announce() {}
  };
  try {
    AuthEntry.connectLifecycle({ controller, bootstrap, announce() {} });
    listeners[0]({ type: 'authenticated', verification: first });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(migrations, 0, 'authentication and backup preview never auto-migrate');
    assert.equal(typeof confirmAction, 'function');

    current = refreshed;
    listeners[0]({ type: 'refreshed', verification: refreshed });
    await new Promise(resolve => setImmediate(resolve));
    await confirmAction();
    assert.equal(migrations, 1, 'player confirmation invokes migration once');
    assert.equal(confirmedWith[0], refreshed, 'confirmation uses the latest current token verification');
    assert.equal(preparedWith.length, 1, 'token refresh renews pending authorization without repeating backup preparation');

    current = null;
    listeners[0]({ type: 'invalidated', reason: 'signed-out' });
    assert.equal(hidden, 1, 'sign-out removes the pending migration UI');

    const recoveryListeners=[];let recoveryCurrent=first,recoveryAction=null,recoveryConfirms=0,reloads=0;
    const recoveryController={subscribeLifecycle(listener){recoveryListeners.push(listener);return()=>{};},isCurrent(verification){return verification===recoveryCurrent;}};
    const recoveryBootstrap={start(){const error=Error('金幣資料需要轉換');error.code='SHARED_GOLD_MIGRATION_REQUIRED';return Promise.reject(error);},stop:async()=>({stopped:true}),state:()=>({}),async prepareSharedGoldMigration(){throw Error('Stop active farming before shared gold migration');},async prepareFarmingRecovery(){return {status:'recovery-required',preview:{characters:[{name:'0122',durationMs:60000,report:{gainedGold:2}}]}};},async confirmFarmingRecovery(){recoveryConfirms++;return {status:'recovered',reloadRequired:true};}};
    globalThis.accountAuthView={showFarmingRecovery(_preview,action){recoveryAction=action;},hideGoldMigration(){},hideFarmingRecovery(){},announce(){}};
    AuthEntry.connectLifecycle({controller:recoveryController,bootstrap:recoveryBootstrap,reload(){reloads++;},announce(){}});recoveryListeners[0]({type:'authenticated',verification:first});
    await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof recoveryAction,'function','active solo session opens a separate manual recovery confirmation');assert.equal(recoveryConfirms,0,'recovery never runs before player confirmation');await recoveryAction();assert.equal(recoveryConfirms,1,'manual recovery confirmation runs once');assert.equal(reloads,1,'successful recovery reloads before offering the separate gold conversion');
  } finally {
    if (previousView === undefined) delete globalThis.accountAuthView;
    else globalThis.accountAuthView = previousView;
  }
  console.log('Shared gold auth confirmation: assertions passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
