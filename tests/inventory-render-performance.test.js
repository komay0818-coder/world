const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const equipmentRenderer = source.match(/function renderEquipment\(progress, modal, title, content\) \{[\s\S]*?\n\}/)?.[0] || '';
const inventoryRenderer = source.match(/function renderInventory\(view = 'inventory'\) \{[\s\S]*?\n\}/)?.[0] || '';
const equipmentBranchIndex = inventoryRenderer.indexOf("if (view === 'equipment')");
const inventoryWorkIndex = inventoryRenderer.indexOf('const renderItemCard');

assert.match(source, /function getProgress\(activeCharacterOverride = null\)/, 'progress loading accepts the character already resolved for this render');
assert.match(inventoryRenderer, /const character = getActiveCharacter\(\);[\s\S]*const progress = getProgress\(character\);/, 'one render reuses its resolved character while loading progress');
assert.ok(equipmentBranchIndex >= 0 && equipmentBranchIndex < inventoryWorkIndex, 'equipment view exits before inventory filtering, sorting, stacking, and card generation');
assert.match(inventoryRenderer, /renderEquipment\(progress, modal, title, content\);\s*return;/, 'equipment view delegates to the focused renderer and returns immediately');
assert.doesNotMatch(equipmentRenderer, /progress\.inventory|itemCategory|stackIdenticalEquipment|renderItemCard|equipmentDetailsHtml/, 'equipment rendering does not scan or format inventory contents');
assert.match(equipmentRenderer, /Object\.entries\(equipmentSlots\)/, 'equipment rendering still builds every paper-doll slot');
assert.match(equipmentRenderer, /data-unequip-slot/, 'equipment rendering preserves unequip controls');

console.log('inventory-render-performance: assertions passed');
