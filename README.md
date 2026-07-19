# 星塵放置所

以原生 HTML、CSS、JavaScript 製作的放置 RPG 網頁遊戲。遊戲進度儲存在瀏覽器的 `localStorage`，不需要後端服務。

## 開始遊戲

直接開啟 `index.html` 即可。若瀏覽器限制本機資源，請在專案根目錄啟動任一靜態檔案伺服器，例如：

```powershell
python -m http.server 8000
```

然後開啟 `http://localhost:8000/`。

## 專案結構

- `index.html`：頁面結構與各遊戲畫面
- `style.css`：全站基礎樣式與登入／主選單外觀
- `styles/game.css`：角色、戰鬥、背包、地圖等遊戲元件樣式
- `script.js`：遊戲資料、戰鬥流程、畫面互動與存檔
- `assets/`：角色、怪物、裝備與地圖圖片
- `版本備份/`：目前版本的人工快照
- `UnityIdleRPG/`：Unity 移植專案，與網頁版分開維護

## 維護提醒

- 請勿任意更改 `stardust-*` 開頭的 `localStorage` key，否則舊存檔可能無法讀取。
- 新增介面樣式時請放在 `styles/game.css`，不要再寫回 `index.html`。
- 修改玩法前，建議先複製一份到 `版本備份/`。

