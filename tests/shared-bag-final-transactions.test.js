'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadGame } = require('../tools/headless-game-runtime');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
for (const name of ['synthesizeSkillBook', 'confirmFurnaceSalvage', 'assembleWeaponForgingRecipe']) {
  assert.match(source, new RegExp(`async function ${name}\\(`), `${name} must await persistence`);
}
assert.match(source, /await commitEconomyProgress\('技能書合成'/);
assert.match(source, /await commitEconomyProgress\('熔爐拆解'/);
assert.match(source, /await commitEconomyProgress\('武器配方合成'/);
assert.match(source, /magicSynthesisBusy \|\| !validation\.ok/);
assert.match(source, /weaponRecipeAssemblyBusy \|\| !fragmentAssembly\.ok/);

const game = loadGame();
game.evaluate(`
  var transactionMessages = [];
  var transactionRenders = [];
  var transactionPersisted = {
    inventory: [
      { id: 'beginner_skill_page', kind: 'material', quantity: 30 },
      { id: 'salvage-one', instanceId: 'salvage-one', kind: 'equipment', name: '測試綠裝', quality: 'uncommon', rarity: 'uncommon', slot: 'weapon' },
      { id: 'salvage-two', instanceId: 'salvage-two', kind: 'equipment', name: '測試綠裝二', quality: 'uncommon', rarity: 'uncommon', slot: 'weapon' },
      { id: 'salvage-batch-green', instanceId: 'salvage-batch-green', kind: 'equipment', name: '批次綠裝', quality: 'uncommon', rarity: 'uncommon', slot: 'head' },
      { id: 'salvage-batch-blue', instanceId: 'salvage-batch-blue', kind: 'equipment', name: '批次藍裝', quality: 'rare', rarity: 'rare', slot: 'body' },
      { ...ChapterThreeWeaponRecipeFragmentPolicy.FRAGMENT, quantity: 21 }
    ],
    equipment: {}, level: 1, xp: 0, gold: 0, skillLevels: {}, party: { activeMemberIds: [] }
  };
  var isolatedAccountB = JSON.parse(JSON.stringify(transactionPersisted));
  var isolatedAccountBBefore = JSON.stringify(isolatedAccountB);
  var transactionDraft = null;
  var transactionFail = false;
  var transactionHold = false;
  var transactionRelease = null;
  var transactionCommits = 0;
  showToast = message => transactionMessages.push(message);
  renderMagicTower = (_building, message = '') => transactionRenders.push(['magic', message]);
  renderFurnace = (_building, message = '') => transactionRenders.push(['furnace', message]);
  renderWorkshop = () => transactionRenders.push(['workshop', '']);
  getVillageBuildingData = id => ({ id, level: 1 });
  getProgress = () => PermanentPartyRuntime.current.getProgress();
  window.confirm = () => true;
  Math.random = () => 0;
  PermanentPartyRuntime = { current: {
    active: true,
    mainId: 'account-a-character',
    getProgress() { return JSON.parse(JSON.stringify(transactionPersisted)); },
    saveProgress(_id, value) {
      if (!this.active) throw Error('stopped');
      transactionDraft = JSON.parse(JSON.stringify(value));
    },
    async flush() {
      if (!this.active) throw Error('stopped');
      if (transactionDraft) {
        if (transactionHold) await new Promise(resolve => { transactionRelease = resolve; });
        if (transactionFail) { transactionDraft = null; throw Error('Injected IndexedDB failure'); }
        transactionPersisted = transactionDraft;
        transactionDraft = null;
        transactionCommits += 1;
      }
      return transactionPersisted;
    }
  } };
`);

(async () => {
  let result = await game.evaluate(`synthesizeSkillBook('beginner')`);
  assert.equal(result.ok, true);
  assert.equal(game.evaluate(`transactionPersisted.inventory.find(item => item.id === 'beginner_skill_page').quantity`), 20);
  assert.equal(game.evaluate(`transactionPersisted.inventory.find(item => item.id === 'beginner_skill_book').quantity`), 1);
  assert.match(game.evaluate('transactionRenders.at(-1)[1]'), /合成成功/);

  game.evaluate(`furnaceSelectedItemId = 'salvage-one'`);
  result = await game.evaluate('confirmFurnaceSalvage()');
  assert.equal(result.ok, true);
  assert.equal(game.evaluate(`transactionPersisted.inventory.some(item => item.instanceId === 'salvage-one')`), false);
  assert.equal(game.evaluate(`transactionPersisted.inventory.find(item => item.id === 'green_essence_stone').quantity`), 1);
  assert.match(game.evaluate('transactionMessages.at(-1)'), /分解完成/);

  const beforeCancel = game.evaluate('JSON.stringify(transactionPersisted)');
  game.evaluate(`window.confirm = () => false; furnaceSelectedItemIds = new Set(['salvage-batch-green', 'salvage-batch-blue']); furnaceSelectedItemId = 'salvage-batch-green';`);
  result = await game.evaluate('confirmFurnaceSalvage()');
  assert.equal(result.code, 'cancelled');
  assert.equal(game.evaluate('JSON.stringify(transactionPersisted)'), beforeCancel, 'cancelled batch leaves every item unchanged');

  game.evaluate(`window.confirm = () => true; furnaceSelectedItemIds = new Set(['salvage-batch-green', 'salvage-batch-blue']); furnaceSelectedItemId = 'salvage-batch-green';`);
  result = await game.evaluate('confirmFurnaceSalvage()');
  assert.equal(result.ok, true);
  assert.equal(result.total, 2);
  assert.equal(result.successCount, 2);
  assert.equal(game.evaluate(`transactionPersisted.inventory.some(item => item.instanceId === 'salvage-batch-green' || item.instanceId === 'salvage-batch-blue')`), false);
  assert.equal(game.evaluate(`transactionPersisted.inventory.find(item => item.id === 'green_essence_stone').quantity`), 2);
  assert.equal(game.evaluate(`transactionPersisted.inventory.find(item => item.id === 'blue_essence_stone').quantity`), 1);

  result = await game.evaluate('assembleWeaponForgingRecipe()');
  assert.equal(result.ok, true);
  assert.equal(game.evaluate(`transactionPersisted.inventory.find(item => item.id === ChapterThreeWeaponRecipeFragmentPolicy.FRAGMENT.id).quantity`), 14);
  assert.equal(game.evaluate(`transactionPersisted.inventory.find(item => item.id === ChapterThreeWeaponRecipeFragmentPolicy.FORGING_RECIPE.id).quantity`), 1);
  assert.match(game.evaluate('transactionMessages.at(-1)'), /合成成功/);
  assert.equal(game.evaluate('transactionCommits'), 4, 'each normal action and the whole batch commit exactly once');

  for (const expression of [
    `synthesizeSkillBook('beginner')`,
    `(furnaceSelectedItemId = 'salvage-two', confirmFurnaceSalvage())`,
    `assembleWeaponForgingRecipe()`
  ]) {
    const before = game.evaluate('JSON.stringify(transactionPersisted)');
    const successMessageCount = game.evaluate(`transactionMessages.filter(message => /^(合成成功|分解完成)/.test(message)).length`);
    game.evaluate('transactionFail = true');
    result = await game.evaluate(expression);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'save-failed');
    assert.equal(game.evaluate('JSON.stringify(transactionPersisted)'), before, 'failed commit rolls back all item changes');
    assert.equal(game.evaluate(`transactionMessages.filter(message => /^(合成成功|分解完成)/.test(message)).length`), successMessageCount, 'failed commit never reports success');
    game.evaluate('transactionFail = false');
  }

  game.evaluate(`transactionHold = true; var heldMagic = synthesizeSkillBook('beginner'); var duplicateMagic = synthesizeSkillBook('beginner');`);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await game.evaluate('duplicateMagic')).code, 'busy');
  game.evaluate('transactionHold = false; transactionRelease();');
  assert.equal((await game.evaluate('heldMagic')).ok, true);

  game.evaluate(`transactionHold = true; furnaceSelectedItemId = 'salvage-two'; var heldFurnace = confirmFurnaceSalvage(); var duplicateFurnace = confirmFurnaceSalvage();`);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await game.evaluate('duplicateFurnace')).code, 'busy');
  game.evaluate('transactionHold = false; transactionRelease();');
  assert.equal((await game.evaluate('heldFurnace')).ok, true);

  game.evaluate(`transactionHold = true; var heldRecipe = assembleWeaponForgingRecipe(); var duplicateRecipe = assembleWeaponForgingRecipe();`);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await game.evaluate('duplicateRecipe')).code, 'busy');
  game.evaluate('transactionHold = false; transactionRelease();');
  assert.equal((await game.evaluate('heldRecipe')).ok, true);
  assert.equal(game.evaluate('transactionCommits'), 7, 'rapid duplicate actions add only one commit per flow');

  const persistedAfterActions = game.evaluate('JSON.stringify(transactionPersisted)');
  assert.equal(game.evaluate('JSON.stringify(PermanentPartyRuntime.current.getProgress())'), persistedAfterActions, 'a fresh read after reload sees the committed inventory');
  assert.equal(game.evaluate('JSON.stringify(isolatedAccountB)'), game.evaluate('isolatedAccountBBefore'), 'the isolated second account remains unchanged');

  game.evaluate('PermanentPartyRuntime.current.active = false');
  const beforeStop = game.evaluate('JSON.stringify(transactionPersisted)');
  result = await game.evaluate(`synthesizeSkillBook('beginner')`);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'save-failed');
  assert.equal(game.evaluate('JSON.stringify(transactionPersisted)'), beforeStop, 'stopped runtime cannot begin a new shared-bag transaction');

  console.log('Shared bag final transactions: assertions passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
