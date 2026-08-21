const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const style = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(script, /item\.image\s*\?\s*`<img src="\$\{itemImagePath\(item\)\}" alt="" class="inventory-item-image">`/, '背包應優先顯示道具圖片');
assert.match(script, /item\.image\s*\?\s*`<img src="\$\{item\.image\}" alt="" class="drop-result-image">`/, '掉落查詢應優先顯示道具圖片');
assert.match(style, /\.inventory-item-image\{[^}]*object-fit:contain/, '背包道具圖片應完整縮放');
assert.match(style, /\.drop-result-image\{[^}]*object-fit:contain/, '掉落查詢圖片應完整縮放');
assert.match(html, /href="style\.css\?v=20260822-inventory-image-containment-v1"/, '背包圖片限制應從目前部署版本載入，不可引用舊版遠端樣式');
assert.doesNotMatch(html, /raw\.githack\.com\/[^"']+\/style\.css/, '主樣式不可鎖定到舊 commit');

for (const file of ['wolf-fur.png', 'wolf-fang.png', 'hard-hide.png', 'boar-tusk.png', 'iron-ore.png', 'black-ore.png']) {
  assert.ok(fs.existsSync(path.join(root, 'assets', file)), `${file} 應存在`);
}

console.log('material image rendering tests passed');
