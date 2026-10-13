# 第一階段 D-4：所有權核對、切換與安全回復

日期：2026-10-14。分支：dev。正式入口、新角色系統及三人離線仍未啟用；正式玩家存檔未遷移；沒有 commit 或 push。

## 1. 舊資料所有權與衝突處理

新增 `permanent-cutover-policy.js` 的 `legacyAudit`。記錄四名角色的永久 ID／姓名／舊槽位，以及每個背包位置、裝備欄、模板 ID、明確實例 ID、尚未確定語意的舊 ID、數量與完整物品 payload。詞綴、數值、符文與其他欄位原樣保留，不按名稱合併裝備。

明確 instanceId 重複、裸舊 ID 在多個位置出現、裸 ID 與明確實例 ID 衝突、裝備數量異常、藥水鏡像不一致、材料等堆疊 metadata 不一致、數量未知／溢位、角色 ID／編組問題，都停止遷移。已選用的共用背包整理政策只合併 metadata 完全一致的可堆疊物品。沒有數量的材料、消耗品、配方或符文不自行當成一個；核對紀錄標為未知。

`migrationBackup` 保存完整來源及 audit，狀態 `requires-review`；沒有 permanent 模型，也不啟用切換標記。不會自動刪除、補造或分配爭議裝備。可人工確認的方案：依完整來源逐位置核對實際物品歷史、確認模板／實例語意及所屬角色，提出另外一份經確認的修正副本，再完整重跑核對。服務不提供自動「消除重複」按鈕。原資料不同於指定副本時，必須先处理来源版本，不可偷偷替換正在使用的來源。

## 2. 切換機制與版本

永久服務強制使用 IndexedDB schema 2，不允許把 schema 1 連線包裝成永久權威。IndexedDB schema 升為 2，保留原 `accounts`／`runs` 物件庫及記錄，不重建資料。已測試真實 schema 1 四角色資料原地升級。舊 schema 1 客戶端重開時收到 VersionError；現有新版連線在 versionchange 關閉，舊版未關閉連線會阻擋升級，必須關閉後重試。被阻擋的 open 即使稍後升級成功，也會關閉該連線，不假裝第一次呼叫已成功。

每個切換帳號有 `cutover.version=1`、`minimumClientVersion=2`、來源 SHA-256、來源／啟用 revision、備份版本及狀態。共用交易邊界拒絕過期客戶端；所有永久服务操作使用協定 2。

順序是：保留完整備份 → 完整 audit／既有模型驗證 → 拒絕尚有 prepared 離線工作的來源 → 以 metadata 交易寫入 `preparing` → 原子提交四角色、共用背包、權威標記及設定 → `active`。`preparing` 時舊槽位仍完整保留，普通寫入被拒絕。失敗重試使用同一備份與來源 digest。成功後帳號不再有 `slots`，只有 permanent 權威。並行切換只導入一次；另一個分頁讀取已完成結果，不再匯入。

設定已有獨立權威記錄時，不用舊備份覆蓋它；未建立時才原子匯入舊設定。schema 不支援降回 1；相容回復使用支援 schema 2 的程式，不能部署舊資料庫客戶端後強制降級或重建資料庫。

## 3. 切換後的回復方式

採用保留最新資料的前向回復。切換前備份、切換後有效模型、交易收據與離線 journal 分開；不把舊備份還原成最新模型。新增接口：

| 接口 | 作用 |
| --- | --- |
| `recoveryReport(accountId)` | 同一唯讀交易讀取目前權威與該帳號 journals，輸出核對報告及完整 bundle。 |
| `beginRecovery(accountId, revision, token)` | 以 CAS 建立回復身分及 `recovering`。只變更管理 metadata，保留 prepared 工作的來源 revision。 |
| `resumeRecoverySettlement(accountId, token, runId, calculate)` | 驗證原始工作與目前權威，以原本 calculator、快照、時間、角色和種子恢復。完成紀錄只回傳結果，不再計算。 |
| `finishRecovery(accountId, revision, token)` | 在同一寫入交易重驗最新模型、所有權、隊伍／占用與 journals；沒有未完成或未知紀錄才解除暫停。 |

回復期間普通保存、隊伍操作及新結算被拒絕。只有相符回復 token 可以提交原本待完成的單人離線工作。完整角色與背包結果、藥水消耗、結算完成 journal 在同一交易提交；不會出現只扣藥水或只發獎勵。正在使用的角色占用不由回復程序強制解除，不免費回血、復活或重置冷卻。隔離戰鬥入口讀到 `recovering` 會停止載入。

一旦发现最新模型所有權衝突、未知 journal 狀態、prepared 快照與版本不一致、占用／session 不一致，就輸出完整證據並保持停止。沒有根據舊備份猜測最新掉落或重分配裝備的修復演算法。對於資料庫整份被刪除或最新權威已不可讀，不能宣稱此機制能重建所有新成果。

完成回復的 metadata 收據也納入最近 32 筆一般歷史窗口，保留防過期來源的水位；不重新造成每次回復追加完整角色快照的容量膨脹。同一來源與同一衝突的重試使用固定摘要身分，不反覆追加稽核收據。必要備份、原始未完成／已完成離線 journals 維持既有保留政策。失敗的 IndexedDB 交易整筆 abort，不會有成功收據。已進入永久交易的失敗嘗試另存 failed 管理紀錄，只含命令身分、摘要、版本與原因，不含整份角色／背包快照；每帳號最多 32 筆，重複原因重試不重複追加。50 次失敗清理後原 prepared 工作與模型仍完整。這些 failed 紀錄不可作為重發收益依據；prepared、committed 的原結算 journal 不受清理影響。若連失敗紀錄也因儲存限制寫入失敗，仍回報原保存錯誤及診斷，不宣稱已記錄成功。`prepared` 代表等待安全重試，不代表玩家已領取。

## 4. 可操作的切換／回復流程

切換前：停止在線戰鬥、確認所有舊分頁已關閉，取得最後成功來源副本及完整備份；檢查角色、實例、數量、隊伍引用與待完成工作。舊第四批 A 工作仍以原快照／政策在原 slots 權威下恢復後，才遷移，不把它轉換成三人正式工作。

隔離演練入口：`http://127.0.0.1:8766/tools/permanent-recovery-check.html`。「執行完整演練」每次建立新的 `permanent-d4-*` 測試資料庫；「完整核對紀錄」及下載按鈕可保留所有来源與核對證據。頁面不讀取或遷移正式角色內容，僅比對正式 key 是否保持不變。

啟用後若保存失敗：停止使用舊記憶體資料；用 `recoveryReport` 匯出最新 bundle。以讀回 revision 和持續使用的 token 執行 `beginRecovery`。若有 prepared 工作，交給原本計算政策 `resumeRecoverySettlement`；不能改時間、seed 或角色，也不能直接標為完成。重新讀報告，確認没有未知／未完成交易，逐項核對新角色成長、裝備／符文、材料、藥水及配方，再以最新 revision 執行 `finishRecovery`。

若中斷，重新讀取目前 `cutover.recovery.token` 與權威 revision，繼續原回復；完成步驟保留相同 command 身分可安全重試。若 `preparing` 但尚無 permanent，使用 `migrationBackup.source` 重跑同一遷移，不拿舊副本去覆蓋已存在的 permanent。若有不明衝突，停止並保留最新 bundle；人工處理是另一個待批准動作。

## 5. 驗收與成果核對

| 測試 | 結果 |
| --- | --- |
| 完整回歸 | 213／213；原 212 項全部保留，新增一個政策測試檔。 |
| D-4 政策檢查 | 40 項通過，含所有權歧義、未知數量、metadata 衝突、占用異常與歷史有界。 |
| D-4 真實 IndexedDB 完整演練 | 81 項通過；schema 升級、遷移中斷／重試、四角色、收益與回復。 |
| 在線／招募／異步／掛機互斥重新驗收 | 42 項通過；正式存檔不變。 |
| 真正兩分頁保存 | 一筆成功、另一筆 Concurrent save conflict。 |
| 真正兩分頁恢復切換 | 一筆導入成功，另一筆 duplicate；均讀到 revision 1，不重複匯入。 |
| 舊隔離分頁阻擋升級 | 已實際觀察拒絕；關閉舊連線後重試成功。 |

副本最初為四名角色、八件獨立裝備、80 HP 藥水、40 MP 藥水與 11 黑礦。切換後換裝、離隊／再招募、刪除並建立第四角色；新增主角 Lv21、88.25 XP、技能 Lv6、轉職、新配方、新材料七份及含符文的新裝備。回復後四角色仍正確，舊 ID 已退休、新 ID 不重複，裝備九件，HP 藥水 78、MP 藥水 40、黑礦 11。藥水只因驗收中的一次離線消耗減少兩瓶；在線收入 41 金幣、離線收入 17 金幣只發放一次。三人經驗分配及原來戰鬥計算未修改。

另一份資料刻意注入重複實例與新 XP。回復被拒絕，但最新 XP、全部爭議物品和舊備份均保留，没有任何自動刪除或回滾。演練過程曾發現測試工具關閉連線後仍使用舊參考，已修正工具的重開流程；最終沒有未解決測試失敗。

結果：`tmp/permanent-phase-d4-regression.json`、`tmp/d4-browser-result.json`、`tmp/d4-multitab-race.json`、`tmp/d4-multitab-final.json`、`tmp/d4-multitab-cutover.json`、`tmp/d4-schema-blocked.json`、`tmp/d4-online-regression.json`。tmp 為驗收證據，不建議提交所有暫存檔。

## 6. 正式切換條件與剩餘限制

A～D 已具備隔離資料層及接線的整體驗收條件，驗收副本没有未處理阻擋問題；不代表本輪已批准或執行正式啟用。

正式切換仍必須另行批准並用正式資料的**副本**完成 audit，實際有爭議的物品需人工確認。所有仍執行舊 localStorage 原始程式的分頁必須停止／關閉；IndexedDB 的 schema 與協定屏障能阻止舊資料庫客戶端，却無法遠端改寫已在執行的舊 localStorage JavaScript。新入口必須始終選擇新權威、不得再匯入其後的舊 key；部署與正式入口開關的驗證留在正式啟用步驟，本批沒有打開它。

回復限於保留可讀且可驗證的最新權威、恢復已保存的原工作；未落盤的最後記憶體事件、資料庫被清除或任意資料損壞不保證可自動重建。多分頁衝突仍以拒絕並要求讀最新資料處理，沒有把不同候選模型自動合併。Web Locks／IndexedDB／Web Crypto 不足時不降級成不安全的保存。跨裝置同步不在現有本地架構範圍。

三人經驗分配、隊友技能／轉職介面、角色與背包 UI、正式三人離線、第四批 B 全部維持原階段限制。

## 7. 修改範圍及建議 commit 分組

本批新增政策、政策測試、D-4 核對頁及本報告；修改 `permanent-party-store.js`、`offline-settlement-store.js`、隔離 bootstrap／產生器。`index.html`、`transaction-receipt-check.html` 及既有 permanent-* 核對頁只增加唯讀政策依賴和更新相關引用版本。D-4 沒有修改 `script.js` 戰鬥公式、怪物、掉落、經驗分配或正式 UI；它先前的未提交內容仍保留。

待批准後，建議按相依順序聚焦提交到 dev：

1. **永久模型與交易基礎、歷史容量、存檔路由（A／B／C／D-1／D-2）**：permanent-party-policy、permanent-online-policy、permanent-party-runtime、permanent-party-store、offline-settlement-store 的相關內容；script／index 的身份與存檔 hunks；對應政策／runtime／路由測試與報告。離線第四批 A 底層若尚未保存版本，先獨立保存已驗收的前置依賴。
2. **四角色與隊伍掛機互斥（D-3）**：permanent-farming-policy／coordinator、掛機橋接、四槽／事件安全的 runtime 及 script hunks、D-3 政策／瀏覽器／多分頁工具與報告；generated 共用程式只包含已驗證的來源同步部分。
3. **所有權核對與切換回復（D-4）**：permanent-cutover-policy、permanent-party-store／offline-settlement-store 的 D-4 hunks、permanent-recovery-policy 測試、permanent-recovery-check.html/js、本報告；依賴載入、schema／快取與 bootstrap 安全停止的相關 hunks。

以上是議題分組，不能把目前最終版檔案直接逐檔拆開：永久服務會引用掛機／切換政策，離線交易又是其前置依賴。實際提交時須使用對應階段的可運行版本，或一併納入所需依賴，並逐組驗證提交內容；不以仍在工作區的未提交檔案掩蓋缺少的依賴。

完整工作區仍含以前的離線、素材、字體、地圖 UI 和測試修改。不能一次提交整個 script／index 或整個工作區；排除 tmp、備份、__pycache__ 與無關素材／CSS。本輪不提交，完成 D-4 後停止等待確認。
