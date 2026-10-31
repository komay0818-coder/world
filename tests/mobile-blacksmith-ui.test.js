const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'village.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(html, /styles\/village\.css\?v=20261101-reforge-workshop-v1/);
assert.match(html, /script\.js\?v=20261101-reforge-workshop-v1/);
assert.match(script, /function isMobileBlacksmithLayout\(\)/);
assert.match(script, /data-view-blacksmith-item="\$\{item\.instanceId \|\| item\.id\}"/);
assert.match(script, /class="blacksmith-detail-backdrop" role="dialog"/);
assert.match(script, /equipmentDetailsHtml\(previewItem\)/, 'blacksmith detail reuses the complete equipment detail renderer');
assert.match(script, /RunePolicy\.requestSocket\(previewItem\)/, 'socket eligibility comes from the existing rune policy');
assert.match(script, /材料與金幣尚未設定/, 'unset costs remain explicit and do not enable free socketing');
assert.match(script, /data-confirm-blacksmith-socket=/);
assert.match(script, /data-cancel-blacksmith-detail/);
assert.match(css, /\.blacksmith-equipment-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/, 'mobile equipment uses four columns');
assert.match(css, /\.blacksmith-equipment-tile\{display:flex;min-width:0;height:98px/, 'equipment cells keep a fixed size');
assert.match(css, /\.blacksmith-detail-backdrop\{position:fixed/, 'details use an independent mobile modal');
assert.match(css, /max-height:calc\(100dvh - 32px\)/, 'long details stay within the phone viewport');
assert.match(script, /if \(!isMobileBlacksmithLayout\(\)\) \{[\s\S]*?<section class="furnace-layout blacksmith-desktop-grid">/, 'desktop retains its existing card renderer');
assert.match(script, /class="furnace-layout blacksmith-desktop-grid"/, 'desktop blacksmith has its own equal-size grid hook');
assert.match(css, /\.blacksmith-desktop-grid\{grid-auto-rows:220px\}/, 'desktop blacksmith rows use one fixed height');
assert.match(css, /\.blacksmith-desktop-grid \.furnace-slot\{display:flex;height:220px;min-height:0/, 'every desktop blacksmith card has the same height');
assert.match(css, /section\.furnace-layout\.blacksmith-desktop-grid\{grid-template-columns:repeat\(3,280px\);justify-content:center\}/, 'wide desktop cards use identical fixed widths');

console.log('mobile-blacksmith-ui: assertions passed');
