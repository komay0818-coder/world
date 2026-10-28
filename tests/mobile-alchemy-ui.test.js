'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'village.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(html, /styles\/village\.css\?v=20261025-mobile-village-fixed-window-v3/);
assert.match(html, /script\.js\?v=20261029-monster-refresh-v1/);
assert.match(script, /function isMobileAlchemyLayout\(\)/);
assert.match(script, /function openAlchemyItemDetail\(itemId, slotIndex = null\)/);
assert.match(script, /equipmentDetailsHtml\(previewItem\)/, 'mobile detail reuses the canonical equipment detail renderer');
assert.match(script, /data-confirm-alchemy-input/, 'viewing an item requires explicit confirmation before slot placement');
assert.match(script, /data-cancel-alchemy-input/, 'detail view can be cancelled without selecting the item');
assert.match(script, /data-view-alchemy-slot/, 'filled material slots can be reopened for inspection');
assert.match(script, /同一件裝備不能重複放入兩個材料槽/, 'duplicate material selection is rejected');
assert.match(script, /1\. \$\{validation\.items\[0\]\.name\}[\s\S]*2\. \$\{validation\.items\[1\]\.name\}/, 'mobile confirmation names both consumed items');
assert.match(css, /\.alchemy-inputs\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, 'mobile material slots remain side by side');
assert.match(css, /\.alchemy-available>div\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/, 'mobile equipment uses four columns');
assert.match(css, /\.alchemy-available>div\{[^}]*max-height:300px[^}]*overflow-y:auto/, 'large mobile equipment lists scroll independently');
assert.match(css, /\.alchemy-item-detail-backdrop\{position:fixed/, 'mobile equipment details open as a dedicated dialog');

console.log('mobile alchemy UI: assertions passed');
