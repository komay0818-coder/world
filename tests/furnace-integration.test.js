const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.match(html, /salvage-policy\.js\?v=20260815-essence-artwork-v1/);
assert.match(script, /SalvagePolicy\.normalizeInventory/, 'old material stacks are normalized through the shared inventory');
assert.match(script, /SalvagePolicy\.getEligibleEquipment/, 'furnace list uses centralized eligibility rules');
assert.match(script, /data-select-furnace-item/, 'one equipment item can be selected into the slot');
assert.match(script, /data-confirm-furnace/, 'salvage requires an explicit confirmation action');
assert.match(script, /window\.confirm\(`確定要分解/, 'the irreversible action displays a confirmation dialog');
assert.match(script, /furnaceBusy = true/, 'the UI locks while salvage is executing');
assert.match(script, /SalvagePolicy\.salvage\(progress, furnaceSelectedItemId/, 'execution reuses the selected unique id instead of an array index');
assert.match(script, /saveProgress\(progress\)/, 'the shared player save path remains in use');
assert.doesNotMatch(script, /data-salvage-item/, 'legacy one-click salvage is removed');
console.log('furnace-integration: assertions passed');
