'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadGame } = require('../tools/headless-game-runtime');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
assert.match(source, /let autoPotionPurchasePromise = null;/);
assert.match(source, /const pending = commitEconomyProgress\('自動購買治癒藥水'/);
assert.match(source, /if \(progress\.potions <= 0\) \{[\s\S]*const purchase = autoBuyPotions\(\);[\s\S]*return false;/);

const game = loadGame();
game.evaluate(`
  var potionMessages = [];
  showToast = message => potionMessages.push(message);
  logBattle = message => potionMessages.push(message);
  updateBattleUI = () => {};
  syncMainBattleMemberFromLegacy = () => {};
  getMaxHp = () => 100;
  var potionPersisted = { level: 1, xp: 0, gold: 100, potions: 0, inventory: [], equipment: {}, skillLevels: {}, party: { activeMemberIds: [] } };
  var potionDraft = null, potionFail = false, potionHold = false, potionRelease = null, potionCommits = 0;
  PermanentPartyRuntime = { current: {
    active: true,
    mainId: 'potion-character',
    getProgress() { return JSON.parse(JSON.stringify(potionPersisted)); },
    saveProgress(id, value) { if (!this.active) throw Error('stopped'); potionDraft = JSON.parse(JSON.stringify(value)); },
    async flush() {
      if (!this.active) throw Error('stopped');
      if (potionDraft) {
        if (potionHold) await new Promise(resolve => { potionRelease = resolve; });
        if (potionFail) { potionDraft = null; throw Error('Injected IndexedDB failure'); }
        potionPersisted = potionDraft;
        potionDraft = null;
        potionCommits += 1;
      }
      return potionPersisted;
    }
  } };
  battle.playerHp = 10;
`);

(async () => {
  game.evaluate('potionHold = true; var firstPurchase = autoBuyPotions(); var duplicatePurchase = autoBuyPotions();');
  assert.equal(game.evaluate('firstPurchase === duplicatePurchase'), true, 'rapid triggers share one purchase promise');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(game.evaluate('potionPersisted.potions'), 0, 'uncommitted potions are unavailable to combat');
  assert.equal(game.evaluate('usePotion(false)'), false, 'combat does not consume an uncommitted potion');
  game.evaluate('potionHold = false; potionRelease();');
  let result = await game.evaluate('firstPurchase');
  assert.equal(result.ok, true);
  assert.equal(game.evaluate('potionPersisted.gold'), 50);
  assert.equal(game.evaluate('potionPersisted.potions'), 15);
  assert.equal(game.evaluate("potionPersisted.inventory.find(item => item.id === 'healing-potion').quantity"), 15);
  assert.equal(game.evaluate('potionCommits'), 1, 'rapid triggers commit once');
  assert.deepEqual(game.evaluate('PermanentPartyRuntime.current.getProgress()').potions, 15, 'a fresh read after reload sees the committed potion quantity');
  assert.deepEqual(game.evaluate('PermanentPartyRuntime.current.getProgress()').gold, 50, 'a fresh read after reload sees the committed shared-gold projection');

  assert.equal(game.evaluate('usePotion(false)'), true, 'the next combat action may use a committed potion');
  await game.evaluate('PermanentPartyRuntime.current.flush()');
  assert.equal(game.evaluate('potionPersisted.potions'), 14);
  assert.equal(game.evaluate('battle.playerHp'), 40);

  game.evaluate("potionPersisted.gold = 40; potionPersisted.potions = 0; potionPersisted.inventory = []; potionFail = false;");
  result = await game.evaluate('autoBuyPotions()');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'insufficient-gold');
  assert.equal(game.evaluate('potionPersisted.gold'), 40);
  assert.equal(game.evaluate('potionPersisted.potions'), 0);

  game.evaluate("potionPersisted.gold = 100; potionFail = true;");
  const beforeFailure = game.evaluate('JSON.stringify(potionPersisted)');
  result = await game.evaluate('autoBuyPotions()');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'save-failed');
  assert.equal(game.evaluate('JSON.stringify(potionPersisted)'), beforeFailure, 'failed commit rolls back gold and potion inventory');

  game.evaluate('potionFail = false; PermanentPartyRuntime.current.active = false;');
  const beforeStop = game.evaluate('JSON.stringify(potionPersisted)');
  result = await game.evaluate('autoBuyPotions()');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'stopped');
  assert.equal(game.evaluate('JSON.stringify(potionPersisted)'), beforeStop, 'stopped runtime cannot start a purchase');

  console.log('Auto potion purchase transaction: assertions passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
