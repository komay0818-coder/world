const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const equipmentRenderer = source.match(/function renderEquipment\(progress, modal, title, content\) \{[\s\S]*?\n\}/)?.[0] || '';
const inventoryRenderer = source.match(/function renderInventory\(view = 'inventory'\) \{[\s\S]*?\r?\n\}(?=\r?\n\r?\nfunction renderInventoryTooltip)/)?.[0] || '';
const inventoryTooltipRenderer = source.match(/function renderInventoryTooltip\(itemId, anchor = null, pin = false\) \{[\s\S]*?\r?\n\}(?=\r?\n\r?\nfunction hideInventoryTooltip)/)?.[0] || '';
const inventoryGridCss = fs.readFileSync(path.join(__dirname, '..', 'styles', 'inventory-grid.css'), 'utf8');
const equipmentBranchIndex = inventoryRenderer.indexOf("if (view === 'equipment')");
const inventoryWorkIndex = inventoryRenderer.indexOf('const renderItemCard');

assert.match(source, /function getProgress\(activeCharacterOverride = null\)/, 'progress loading accepts the character already resolved for this render');
assert.match(inventoryRenderer, /const character = getActiveCharacter\(\);[\s\S]*const progress = getProgress\(character\);/, 'one render reuses its resolved character while loading progress');
assert.ok(equipmentBranchIndex >= 0 && equipmentBranchIndex < inventoryWorkIndex, 'equipment view exits before inventory filtering, sorting, stacking, and card generation');
assert.match(inventoryRenderer, /renderEquipment\(progress, modal, title, content\);\s*return;/, 'equipment view delegates to the focused renderer and returns immediately');
assert.doesNotMatch(equipmentRenderer, /progress\.inventory|itemCategory|stackIdenticalEquipment|renderItemCard|equipmentDetailsHtml/, 'equipment rendering does not scan or format inventory contents');
assert.match(equipmentRenderer, /Object\.entries\(equipmentSlots\)/, 'equipment rendering still builds every paper-doll slot');
assert.match(equipmentRenderer, /data-unequip-slot/, 'equipment rendering preserves unequip controls');
assert.match(inventoryRenderer, /const inventoryById = new Map\(\)/, 'inventory render builds one item lookup index');
assert.match(inventoryRenderer, /inventoryById\.get\(id\)/, 'stack cards resolve items through the render-local index');
assert.doesNotMatch(inventoryRenderer, /progress\.inventory\.find\(/, 'inventory cards do not linearly search the full inventory');
assert.doesNotMatch(inventoryRenderer, /progress\.inventory\.filter\(/, 'category and scrappable collections share the render traversal');
assert.match(inventoryRenderer, /const availableRuneIds = new Set\(\)/, 'available runes are indexed once per render');
assert.match(source, /function isItemWearableByCharacter\(item, character, level = 1, progress = getProgress\(\)\)/, 'wearability can reuse the current render progress');
assert.match(inventoryRenderer, /isItemWearableByCharacter\(item, character, progress\.level, progress\)/, 'inventory wearability checks reuse the loaded progress');
assert.doesNotMatch(inventoryRenderer, /equipmentDetailsHtml\(|itemStatsText\(/, 'initial grid does not build item details or equipped comparisons');
assert.match(inventoryRenderer, /id="inventory-shared-tooltip"/, 'inventory creates exactly one shared tooltip shell');
assert.match(inventoryRenderer, /label: '可裝備'/, 'inventory includes the wearable section');
assert.match(inventoryRenderer, /label: '其他職業裝備'/, 'inventory includes the other-job equipment section');
assert.match(inventoryRenderer, /label: '其他物品'/, 'inventory includes the non-equipment section');
assert.match(inventoryTooltipRenderer, /equipmentDetailsHtml\(item\)/, 'shared tooltip lazily renders full equipment details');
assert.match(inventoryTooltipRenderer, /inventory-tooltip-comparison/, 'shared tooltip lazily renders equipped comparison details');
assert.match(inventoryGridCss, /grid-template-columns:\s*repeat\(8, minmax\(0, 1fr\)\)/, 'desktop inventory uses eight columns');

console.log('inventory-render-performance: assertions passed');
