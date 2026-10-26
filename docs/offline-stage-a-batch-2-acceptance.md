# 第二階段 A 第二批：驗收補強結果

本輪在 dev 完成，未提交 commit。沒有加入第三批怪物技能、藥水、復活，沒有修改在線技能平衡，也沒有啟用正式三人離線掛機。

## 完整回歸

完整頂層套件：202 個測試檔，202 通過、0 失敗。原始結果：`tmp/offline-acceptance-regression.json`。最後追加的 DOM 插入／移動斷言已另行重跑通過。

測試環境新增節點父子關係、插入、移動、屬性與選單基本資料，讓原本 16 個初始化失敗的整合測試實際執行。4 個快取測試保留腳本版本參數檢查，解除與功能無關的舊版本字串綁定；第二章檢查納入正式模式條件。

完整執行後發現的另 4 個過期案例也修正：兩個圖片展示條件檢查納入現有怪物輪播模式；隊伍測試提供該模式的環境依賴；後三區實測案例配合目前「同地圖不重入」及 350 毫秒旅行鎖，明確初始化戰鬥並只讀取有效敵人位置。不修改正式戰鬥邏輯來配合測試。

## 技能精確驗證

- 35 個主動技能 × 六個等級，共 210 個案例，實際呼叫在線處理器，比對離線精確資源扣除、技能冷卻、全域冷卻與立即治療；確認技能不能在冷卻結束前重施放。
- 火球、毒刃與背刺六個等級另與在線 DOT 實際推進結果比對總傷害與次數。
- 六級範圍的燃燒、毒、流血、聖域治療驗證精確時間、傷害／治療量、到期後不再結算。
- 驗證六秒護盾到期、信仰到期、共振到期、三秒餘光只結算一次與死亡目標不接受治療。
- 五種職業與十條轉職路線，三個固定種子、兩種時長，共 90 組優化前後比對；完整結果及全部事件歷程雜湊一致。另有主角致死案例。

210 指技能等級案例，不與 202 個測試檔相加。

## 優化範圍

- 每次模擬独立快取離開時不變的技能定義、效果、主動清單、優先順序與基礎資源成本。
- 根據共用程式產生到期欄位查詢，保留快照內額外到期欄位，減少每輪全角色物件掃描。
- 減少事件排程暫存陣列、重複篩選與未開啟診斷時的事件配置。
- 地圖及中立效果使用不變資料，減少重複配置。

所有快取值來自原本在線政策；沒有快取動態伤害、HP、冷卻、怒氣、MP、增益或敵人狀態。原處理器的計算與必要結算次數不變。產生器的來源一致測試與直接在線技能比對均通過。

## 固定快照、種子 12345 的單獨效能測試

| 模擬時間 | 優化前 | 優化後 | 事件迴圈數 | 擊殺數 |
| --- | ---: | ---: | ---: | ---: |
| 1 小時 | 2.681 秒 | 1.419 秒 | 20,902 | 367 |
| 6 小時 | 10.715 秒 | 6.114 秒 | 121,578 | 2,206 |
| 12 小時 | 18.015 秒 | 10.278 秒 | 248,112 | 4,413 |

快照為劇毒盜賊、獸王獵人、神聖牧師，每次從相同初始快照、相同種子重新模擬；三個時長均完整跑完，未因死亡提前结束。比對的是整份結果，包含所有角色狀態、資源、冷卻、技能／DOT／寵物／治療統計、死亡、擊殺及剩餘敵人 HP，均完全一致。

優化前排程器保存在 `tests/offline-skill-events-reference.fixture.js`，測試產生器以 `--reference` 建立未快取的共用處理器。兩版在同一 Node 執行環境量測，非 VM 與原生執行的交叉比較。數據保存在 `tmp/offline-optimization-comparison.json`，可用 `node tests/offline-skill-performance.js` 重現。效能是本機基準，會受硬體及其他工作負載影響。

12 小時約縮短 43%，仍未達到 3～5 秒目標。計算仍同步執行，主畫面阻塞問題仍存在；Web Worker 可改善畫面回應，但不保證把 CPU 計算時間降到 3～5 秒。

## 正式流程與剩餘限制

既有單人離線政策未改動、相關測試通過。三人離線仍只供本機 opt-in 預覽，不寫入正式戰鬥結果、不發正式收益。因第二批尚無收益結算，不能將擊殺數一致宣稱為金幣、經驗、裝備掉落分配已驗證；完整收益對照屬第四批。

本輪剩餘問題：效能未達 3～5 秒、同步阻塞未解除、第三批生存事件與第四批正式結算仍待開發。已停止等待使用者確認。

## 本輪修改檔案

- `tools/headless-game-runtime.js`、`tests/headless-game-runtime.test.js`。
- `tests/black-ore-drop-integration.test.js`、`equipment-affix-integration.test.js`、`equipment-drop-integration.test.js`、`chapter-two-map-integration.test.js`。
- `tests/chapter-three-33-integration.test.js`、`chapter-two-balance-playtest-policy.test.js`、`party-integration.test.js`、`chapter-three-late-runtime.test.js`。
- `offline-skill-events.js`、`tools/build-offline-shared-runtime.js`、`offline-shared-runtime.generated.js`。
- `tests/offline-skill-exact-online.test.js`、`offline-skill-timing-exact.test.js`、`offline-optimization-parity.test.js`。
- `tests/offline-skill-events-reference.fixture.js`、`offline-optimization-reference.js`、`offline-skill-performance.js`。
