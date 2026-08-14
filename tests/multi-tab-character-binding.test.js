const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(script, /const TAB_ACTIVE_CHARACTER_SLOT_KEY = 'stardust-tab-active-character-slot'/, 'active character binding has a tab-scoped key');
assert.match(script, /sessionStorage\.getItem\(TAB_ACTIVE_CHARACTER_SLOT_KEY\)/, 'each tab reads its own active slot');
assert.match(script, /sessionStorage\.setItem\(TAB_ACTIVE_CHARACTER_SLOT_KEY, String\(index\)\)/, 'character switching updates only the current tab binding');
assert.match(script, /const slotProgress = Array\.isArray\(slots\) \? slots\[getActiveCharacterSlotIndex\(\)\]\?\.progress : null/, 'progress is loaded from the tab-bound character slot');
assert.match(script, /function activateCharacterSlot\(index\)[\s\S]*setActiveCharacterSlotIndex\(index\)/, 'roster switching uses the tab-scoped binding');
assert.match(script, /function syncActiveCharacterSlot[\s\S]*const activeIndex = getActiveCharacterSlotIndex\(\)/, 'saving targets the current tab character slot');
assert.match(index, /VER\. 0\.6\.26/, 'the current game version retains tab-scoped character binding');

console.log('multi-tab-character-binding: assertions passed');
