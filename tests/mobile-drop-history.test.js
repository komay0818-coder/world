const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(source, /function recordMobileDropHistory\(enemy, rewardKey, drops\)/, 'per-kill history uses the resolved victory event');
assert.match(source, /monsterName: String\(enemy\?\.name \|\| '未知怪物'\)/, 'each row records its source monster');
assert.match(source, /killId,[\s\S]*killSequence,[\s\S]*sameKill: index > 0/, 'multiple drops retain one shared kill identity');
assert.match(source, /battle\.mobileDropHistory = \[\.\.\.batch, \.\.\.battle\.mobileDropHistory\]/, 'newest kill batches are displayed first without merging items');
assert.match(source, /recordMobileDropHistory\(enemy, rewardKey, \[[\s\S]*name: '金幣'[\s\S]*materialDrops\.map[\s\S]*equipmentDrop[\s\S]*goblinCampMapDropped/, 'history reuses all resolved reward results including gold');
assert.match(source, /mobile-drop-monster[\s\S]*mobile-drop-verb">給你<[\s\S]*mobile-drop-item/, 'mobile history renders one concise monster-to-item sentence');
assert.match(source, /entry\.showQuantity && entry\.quantity > 1 \? ` <span class="mobile-drop-quantity">\(\$\{entry\.quantity\.toLocaleString\('zh-TW'\)\}\)<\/span>` : ''/, 'only drops with a quantity greater than one display the quantity in parentheses');
assert.match(source, /equipmentDrop\.name[\s\S]*stackable: false/, 'non-stackable equipment omits the quantity suffix');
assert.match(source, /qualityClass: itemQualityClass\(/, 'item names reuse the existing quality classification');
assert.match(source, /renderMobileDropHistory\(\);/, 'battle rendering updates the mobile history');
assert.match(source, /document\.querySelector\('#mobile-drop-history'\)/, 'mobile history has its own rendering target');
assert.doesNotMatch(source, /recordMobileDropHistory[\s\S]{0,500}(Math\.random|grant[A-Z])/, 'history does not reroll or grant rewards');
const renderBody = source.slice(source.indexOf('function renderMobileDropHistory()'), source.indexOf('function getNextAdventureMap'));
assert.doesNotMatch(renderBody, /toLocaleTimeString|擊殺 #|occurredAt|killSequence/, 'mobile display omits time, kill number and other metadata');

console.log('mobile per-kill drop history: assertions passed');
