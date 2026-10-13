# 三人永久培養第一階段：資料層驗收

本輪實作版本：permanent model v1。未提交 commit。正式三人離線掛機仍關閉。

## 已實作

- 新建角色改用 crypto.randomUUID，ID 不再從槽位推導；既有角色 ID 保留。
- permanent-party-policy.js：characters 保存唯一成長資料；slotOrder 只引用 ID；parties 保存 mainId 和有序 memberIds。招募／離隊不複製成長，重新建立戰鬥快照時讀取最新永久資料。activeMainId 保存目前主角；switch-main 是明確切換命令。selectedCharacter 是查看接口，不會切換主角。
- bag.items 保存帳號共用物品。裝備以 instanceId 唯一識別；equipmentOwners 對照唯一位置。穿戴、卸下、跨角色交換均產生完整待交易模型，沿用 EquipmentPolicy／WarriorAdvancementPolicy 的穿戴限制。
- 等級、經驗、裝備、技能、轉職、其他角色狀態完整複製。金幣、魔法結晶仍屬原角色；原 accountResources 保留原帳號歸屬。未更改經驗公式。
- 刪除前要求卸下裝備；刪除 ID 記入 retiredIds，不得重用。deletedCharacters 留存原成長與貨幣的審計備份，不會自動轉給新角色。

## 交易與遷移

延用第四批 A 同一 IndexedDB accounts/runs stores，未新增另一個正式收益資料庫。transactAccount 在同一 readwrite transaction 中讀版本、驗證、寫入整個角色／背包／隊伍模型及命令收據。過期版本拒絕；相同命令 ID 與內容重試不再執行，不同內容重用 ID 拒絕。不是 localStorage 的讀取／檢查／寫入鎖。

PermanentPartyStore.migrate 接收明確的舊存檔來源；先寫完整 migrationBackup，成功前 slots 仍是原權威。轉換成功後移除 accounts.slots，僅 permanent 成為該帳號交易資料的權威。重試已完成遷移不再次匯入。舊接口不能覆蓋 permanent。

備份及審計交易不推進戰鬥資料 revision，也不得修改權威資料，因此舊 prepared run 可依原 revision／snapshot／seed 恢復。存在 prepared run 時阻擋遷移，先使用原第四批 A 恢復流程結算，再以更新後來源重試；歷次備份保留。

明確實例 ID 重複、重複舊角色 ID、裸裝備 ID 出現在多處（包括 starter 範本 ID）、藥水背包數量與計數不一致、缺失隊伍引用、無效數量等會阻擋遷移。保留原始資料與 issues，不刪除、不自行猜測所有權。不確定的範本 ID 必須先人工核對。

## 接線狀態與限制

新資料模組已在 index.html 載入，但沒有在正式頁面自動呼叫 migrate 或啟用永久帳號存檔。現有正式招募、裝備與 saveProgress 仍沿用舊流程。這是資料層的隔離驗收，不能宣稱正式玩家資料已遷移或正式共用背包已生效。

正式切換前須將在線存檔寫入者、主角切換、裝備操作及舊 localStorage 別名投影統一改走交易協調接口，並在資料庫成功寫入後更新畫面。否則舊在線寫入者仍可能覆蓋新模型或產生兩個收益權威。不能把目前的跨分頁測試結果延伸解讀為現有所有 localStorage 操作已安全。

未修改裝備／背包 UI，未開放隊友獨立升級／技能／轉職操作，未開始第二階段或離線第四批 B。新經驗分配及離線收益整合必須在正式權威切換完成後接入。

## 驗證

- tests/permanent-party-policy.test.js：38 個精確案例。
- tools/permanent-party-browser-check.html：18 個真實 IndexedDB 交易檢查，包括故障回滾、備份重開、遷移重試、衝突保留、裝備所有權及舊 prepared run 恢復。
- 兩個獨立瀏覽器分頁同時穿戴同一件裝備：一筆 committed/revision 2，另一筆 Concurrent save conflict；無第二件裝備。
- 完整回歸統計見 tmp/permanent-phase-one-regression.json（以 .test.js 檔案為計數單位；新增案例包含在該檔案內，不重複加總）。
- 新建角色 ID 修改前後比較應只有建立 ID 來源改變；未修改在線戰鬥或舊離線收益算法。

驗收頁只使用隨機名稱的隔離資料庫，不讀寫正式 localStorage。
