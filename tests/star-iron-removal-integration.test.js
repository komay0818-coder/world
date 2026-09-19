const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const progress = fs.readFileSync(path.join(root, 'DEVELOPMENT_PROGRESS.md'), 'utf8');

assert.doesNotMatch(script, /星鐵碎片|star-iron/, 'removed star iron must not appear in UI or loot settlement');
assert.doesNotMatch(script, /resources\.starIron/, 'removed star iron must not be awarded');
assert.match(script, /delete saved\.starIron/, 'legacy account saves delete the removed star iron field');
assert.match(script, /delete sanitized\.starIron/, 'account resource writes cannot restore the removed field');
assert.match(progress, /星鐵碎片的掉落、介面與帳號存檔欄位亦已移除/, 'development record documents the removal');

console.log('star-iron-removal-integration: assertions passed');
