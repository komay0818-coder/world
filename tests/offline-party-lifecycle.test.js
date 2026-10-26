const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const policy = require('../offline-party-policy.js');
const source = fs.readFileSync(require('node:path').join(__dirname, '../script.js'), 'utf8');
const lifecycle = source.slice(source.indexOf('function isOfflinePartyFoundationPreview()'), source.indexOf('function markPlayerActive()'));
const store = new Map(); let cleared = 0, restarted = 0, persisted = 0;
const member = { id: 'main', isMain: true, job: 'warrior', level: 30, currentHp: 100, maxHp: 100,
  alive: true, nextAttackAt: 2000, globalSkillReadyAt: 3000, skillCooldowns: { x: 4000 },
  progress: { equipment: { weapon: { id: 'original' } }, skillLevels: { x: 2 } },
  stats: { attack: 10, defense: 0, attackSpeed: 1, hpRegeneration: 0 }, shield: 0 };
const context = vm.createContext({ window: { location: { hostname: '127.0.0.1', search: '?offlinePartyStageA=1' } },
  URLSearchParams, Date, OfflinePartyPolicy: policy, fighting: true,
  battle: { partyMembers: [member], enemyNextAttackAt: [2500], lastFacilityDrainAt: 1000 },
  getProgress: () => ({ level: 30 }), getActiveMap: () => ({ id: 'test' }), getActiveCharacter: () => ({ id: 'main' }),
  getOfflineCombatMonsters: () => [{ maxHp: 100, attack: 0, attackSpeed: 1 }],
  persistPartyRuntimeState: () => persisted++,
  sessionStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) },
  battleTimer: 1, skillTimer: 2, enemyAttackTimer: 3,
  clearInterval: () => cleared++, setInterval: () => { restarted++; return restarted; },
  autoSkillTick() {}, battleTick() {}, enemyAttackTick() {}
});
vm.runInContext(lifecycle, context);
vm.runInContext('suspendOfflinePartyPreview(1000)', context);
assert.equal(context.fighting, false); assert.equal(cleared, 3); assert.equal(persisted, 1);
vm.runInContext('suspendOfflinePartyPreview(2000)', context);
assert.equal(cleared, 3, 'hidden then unload cannot restart the offline clock');
member.progress.equipment.weapon.id = 'changed';
assert.equal(JSON.parse(store.get('stardust-offline-party-preview')).members[0].progress.equipment.weapon.id, 'original');
vm.runInContext('resumeOfflinePartyPreview(6000)', context);
assert.equal(context.fighting, true); assert.equal(restarted, 3);
assert.equal(member.nextAttackAt, 7000); assert.equal(member.skillCooldowns.x, 9000);
assert.equal(context.battle.enemyNextAttackAt[0], 7500);
assert.equal(context.battle.lastFacilityDrainAt, 6000, 'online facility drain cannot catch up over offline time');
assert.equal(member.currentHp, 100, 'incomplete preview cannot apply combat results to save');
assert.equal(store.has('stardust-offline-party-preview'), false);
assert.equal(vm.runInContext('resumeOfflinePartyPreview(7000)', context), null);
context.fighting = false;
vm.runInContext('suspendOfflinePartyPreview(8000); resumeOfflinePartyPreview(9000)', context);
assert.equal(JSON.parse(store.get('stardust-offline-party-preview-result')).effectiveMs, 0);
assert.equal(context.fighting, false);
context.window.location.hostname = 'example.com';
assert.equal(vm.runInContext('isOfflinePartyFoundationPreview()', context), false);
console.log('offline-party-lifecycle: assertions passed');
