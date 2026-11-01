const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'village.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const village = require('../village-policy.js');
const affixes = require('../equipment-affix-policy.js');
const reforge = require('../equipment-reforge-policy.js');

assert.equal(village.BUILDING_DEFINITIONS.reforge.unlockLevel, 8);
assert.equal(village.BUILDING_DEFINITIONS.reforge.noUpgrade, true);
assert.equal(reforge.REQUIRED_LEVEL.type, 8);
assert.equal(reforge.REQUIRED_LEVEL.value, 10);
assert.match(html, /equipment-reforge-policy\.js[\s\S]*village-policy\.js[\s\S]*script\.js/, 'core reforge policy loads before the village UI');
assert.match(html, /styles\/village\.css\?v=20261101-reforge-workshop-v1/);
assert.match(html, /village-policy\.js\?v=20261101-reforge-workshop-v1/);
assert.match(html, /script\.js\?v=20261101-character-switch-v1/);

assert.match(script, /function renderReforgeWorkshop\(/);
assert.match(script, /EquipmentReforgePolicy\.getCost\(reforgeMode/, 'fees come from the core policy');
assert.match(script, /EquipmentAffixPolicy\.canReforgeEquipment\(item\)/, 'the UI reuses core item eligibility');
assert.match(script, /owner\?\.kind === 'bag'[\s\S]*Object\.keys\(owner\)\.length === 1/, 'only shared-bag equipment is selectable');
assert.match(script, /\['uncommon', 'rare'\]\.includes\(quality\)/, 'purple and legendary qualities remain unavailable');
assert.match(script, /await runtime\.reforgeEquipment\(transactionId, operation\)/, 'the UI calls the authoritative runtime API');
assert.doesNotMatch(script.match(/async function executeReforge\(\)[\s\S]*?\n\}/)?.[0] || '', /gold\s*[-+]=|quantity\s*[-+]=|randomAffixes\s*=/, 'the UI does not mutate currency, materials, or affixes');
assert.match(script, /reforgePendingTransactions\.get\(key\) \|\| `reforge-ui-\$\{crypto\.randomUUID\(\)\}`/, 'an uncertain retry reuses its transaction id');
assert.match(script, /reforgePendingTransactions\.delete\(key\)/, 'a confirmed transaction releases the retry id');
assert.match(script, /確定要永久指定這條詞綴作為種類重鑄欄位嗎？確認成功後，這件裝備將無法改選其他詞綴進行種類重鑄，但所有隨機詞綴仍然可以進行數值重鑄。/);
assert.match(script, /Number\(selected\.affixSchemaVersion\) < 5 \? '・舊版裝備將於成功重鑄時安全轉換'/, 'legacy equipment is displayed without UI conversion');
assert.doesNotMatch(script, /data-reforge-again|再次重鑄/, 'result area does not duplicate the main reforge action');
assert.match(script, /選擇其他詞綴/);
assert.match(script, /確認詞綴重鑄/);
assert.match(script, /確認數值重鑄/);
assert.match(script, /reforge-affix-name reforge-grade-/);
assert.match(script, /reforge-affix-value reforge-value-/);
assert.match(script, /fixedAffixes[\s\S]*reforge-readonly-affix[\s\S]*specialAbility/, 'fixed affixes and special abilities remain visible but read-only');
assert.match(script, /const preservedEquipmentGrid = !rebuildGrid[\s\S]*replacement\?\.replaceWith\(preservedEquipmentGrid\)/, 'mode and selection changes preserve the equipment grid DOM');

assert.equal(affixes.canReforgeEquipment({ kind: 'equipment', slot: 'offhand', quality: 'uncommon' }), true, 'ordinary class offhands remain eligible');
assert.equal(affixes.canReforgeEquipment({ kind: 'equipment', slot: 'ring', quality: 'uncommon' }), false, 'rings are rejected');
assert.equal(affixes.canReforgeEquipment({ kind: 'equipment', slot: 'necklace', quality: 'rare' }), false, 'necklaces are rejected');
assert.equal(affixes.canReforgeEquipment({ kind: 'equipment', slot: 'weapon', quality: 'uncommon', reforgeAllowed: false }), false, 'explicitly protected templates are rejected');

assert.match(css, /\.reforge-mode-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, 'the two modes stay side-by-side');
assert.match(css, /\.reforge-equipment-grid\{display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/, 'desktop uses a compact equipment grid');
assert.match(css, /@media\(max-width:700px\) and \(orientation:portrait\)[\s\S]*\.reforge-equipment-grid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/, 'portrait phones use four equipment columns');
assert.match(css, /\.reforge-confirm-backdrop\{position:fixed/, 'the permanent-lock warning is a complete modal');

console.log('reforge-workshop-ui: assertions passed');
