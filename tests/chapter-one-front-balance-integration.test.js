const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(script, /const enemyLimit = ChapterOneLevelPolicy\.getConcurrentEnemyLimit\(activeMapId\)/, 'live enemy generation uses the formal map limit');
assert.match(script, /activeMapId === 'plains-entrance'[\s\S]*Array\.from\(\{ length: enemyLimit \}/, 'plains entrance uses the formal three-slot limit');
assert.match(script, /const types = \[\.\.\.getMonsterPool\(playerLevel\)\.normal\]\.slice\(0, enemyLimit\)/, 'wolf den and later maps cap their initial slots through the same policy');
assert.match(script, /while \(types\.length < enemyLimit\)/, 'enemy generation cannot refill beyond the formal limit');
assert.match(script, /const AUTO_HEALING_POTION_PURCHASE_AMOUNT = 15;/, 'automatic healing-potion purchases grant fifteen bottles');
assert.match(script, /const AUTO_HEALING_POTION_PURCHASE_COST = 50;/, 'automatic healing-potion purchases still cost fifty gold');
assert.match(script, /purchaseAmount = AUTO_HEALING_POTION_PURCHASE_AMOUNT/, 'the live purchase flow uses the approved amount');
assert.match(script, /purchaseCost = AUTO_HEALING_POTION_PURCHASE_COST/, 'the live purchase flow uses the approved cost');

console.log('chapter-one-front-balance-integration: 8 assertions passed');
