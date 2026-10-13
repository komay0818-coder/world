# 第一階段 A／B／C：正式切換前驗收報告

日期：2026-10-12（台灣時間）。工作分支 dev。結論：隔離功能與交易驗收通過，但目前不具備直接正式切換條件。本輪未啟用正式新角色／共用背包，未遷移正式存檔，未提交 commit，未修改在線平衡、裝備 UI 或離線第四批 B。

## 1. 完整驗收結果

| 範圍 | 本輪結果 | 實際涵蓋與限制 |
|---|---|---|
| A 永久角色政策 | 38 個案例通過 | ID、刪除重建、隊伍引用、裝備所有權、來源衝突 |
| A 真實 IndexedDB | 18 個檢查通過 | 備份、遷移回滾、重試、過期版本、舊 pending 紀錄恢復 |
| B 在線整合 | 45 個案例通過 | 真實遊戲函式、共用背包、招募、換裝、槽位移動、戰鬥動態狀態 |
| B 真實瀏覽器 | 31 個檢查通過 | 隊伍離隊／重招、角色切換、屬性更新、HP/MP/死亡/護盾/冷卻保留、保存中查看裝備 |
| C 切換整合 | 新增 31 個案例通過 | 三角色建立、經驗技能轉職資料保留、同名不同裝備、材料／配方／藥水、舊 alias、重開與不相容舊格式阻擋、轉職副手限制 |
| C 真實交易 | 新增 17 個檢查通過 | 遷移中斷／回滾／重試、在線角色與背包原子回滾、舊寫入阻擋、舊離線 journal 中斷恢復及收益只結算一次 |
| 完整回歸 | 209 個測試檔案通過，0 失敗 | 原 208 加 1 新測試檔案；個別案例數不能與測試檔案數混加 |

實際透過原角色 UI，從空白隔離存檔建立「驗收戰士、驗收法師、驗收牧師」。三個 UUID 互異，6 件裝備、15 瓶共用 HP 藥水，原正式資料未變。將試玩文件完全導向空白頁後重新載入，已提交的模型完全相同（僅排除 lastActiveAt）。這驗證文件關閉／重開與資料庫連線關閉／重開，不等於強制終止瀏覽器或斷電驗證。

三人在線隊伍檢查使用 20 級隔離角色，因此不繞過原本隊伍等級解鎖規則。重新招募讀最新資料；查看角色不切換主角、不結算離線。重新整理後編組與角色狀態相同。死亡角色的 HP=0、MP=3、護盾=17 與冷卻／復活時間保留；換裝與成長更新不免費復活或補滿。

兩個真正獨立分頁同時穿戴 fixture-bag-0：一頁 revision 4 提交成功，另一頁 Concurrent save conflict 停止；裝備實例仍為 6。此結果是版本衝突保護，不是自動合併兩頁所有操作。

## 2. 舊存檔副本與恢復驗證

實際舊副本：2 名角色、4 件裝備、7 瓶 HP 藥水。新增核對全部非裝備 item kind/id 總量，包括材料、藥水、配方；裝備排除新 identity 欄位後，詞綴、數值、符文及其餘 metadata 的完整多重集合一致。遷移來源備份與輸入逐字一致，5 個正式核心 localStorage 值前後相同。

遷移交易 failAt=after-account 後，仍只有原 slots 權威、無 permanent；備份先成功保存。重新開啟資料庫與重試不重複匯入。在線模型寫入失敗時，金幣與黑礦一起回滾。舊離線 failAt=after-journal 後，原 job 仍為 prepared；重試成功後再提交回傳 duplicate，只加一次金幣。此 browser 測試使用合成結果驗證 journal 原子性；實際收益公式另外由完整回歸內的 offline-settlement-rewards 等測試涵蓋。

不相容四槽來源、重複裝備 instanceId、藥水 counter 不一致與 metadata 衝突都會阻擋，而不是刪除物品或角色。尚未驗證每一種歷史存檔，不能承諾所有舊存檔可自動轉換。

## 3. 正式舊路徑盤點與未完成接線

根目錄 JavaScript 直接存取清單已存於 tmp/permanent-phase-c-storage-inventory.json：97 個呼叫點，80 個 localStorage、17 個 sessionStorage，均在 script.js。這是語法呼叫點數，不是 97 個獨立功能。具體程式行號與原碼在該清單中。

| 路徑／功能 | 隔離版狀態 | 正式入口的差距 |
|---|---|---|
| getActiveCharacter／getProgress／getCharacterSlots | 已由永久服務投影 | 正式仍讀舊 character/progress/slots；舊進度修復會寫回 |
| saveProgress／syncActiveCharacterSlot／persistPartyRuntimeState | 經隔離 facade 寫入同一交易 | 正式仍保存 progress+slots 兩份別名，不能直接混用新權威 |
| 主角切換、招募、離隊、重新招募 | ID 引用與最新資料已接線 | 正式啟動尚無權威選擇與版本切換協調器 |
| 新角色建立與槽位 | 三個永久角色已實測 | 舊 UI 仍顯示第 4 槽；新資料只接受 3 槽，不能直接丟棄第 4 角色 |
| 重設存檔／移除角色別名 | 新 facade 拒絕破壞性 alias 清除 | 舊 reset handler 尚未換成交易命令，不能正式照用 |
| claimOfflineRewards／登入／visibility 恢復 | 新隔離入口直接 return null | 正式仍有原單人離線收益；新角色資料切換後尚未接入原單人政策，也未建立最後結算邊界 |
| 第四批 A prepared/runs | 遷移前阻擋並可恢復 | 正式啟動需要掃描／恢復協調，不是單純更換 script 標籤 |
| 背包、裝備、出售、合成、煉金、符文、技能材料升級、村莊與地圖收益 | 原 handler 經 saveProgress 可走相容接口 | 部分只做路徑核對及原功能回歸，並未逐一做新權威 UI 端到端失敗注入驗收；不能一概宣稱正式完成 |
| 帳號 dungeonKeys 等資源、個人金幣／結晶 | 維持既有歸屬 | 正式 bootstrap 尚未匯入設定及帳號快照；貨幣不改共用 |
| 登入名、戰場布局／欄寬／紀錄尺寸等設定 | 隔離 settings 寫入新服務 | 正式仍在 localStorage，需明確選定非成長設定權威及完整備份範圍 |
| 延遲治療、波次轉換、消耗操作 | interval 在隔離版有 busy guard | setTimeout 與其他異步回呼尚未全面排入交易邊界；需要再做保存中事件與 session 變更驗證 |

目前正式 index 沒有載入 permanent-party-runtime.js 或隔離 bootstrap。現況不存在正式啟用後又反向投影的行為；但只要直接啟用新系統而保留舊登入／離線／reset／別名修復，仍有雙來源或錯誤回寫的風險。IndexedDB 的 CAS 只能保護其內部交易，不能自動制止未升級的舊分頁寫 localStorage。

## 4. 阻擋正式切換的問題

1. **交易收據無上限並保存完整模型**：offline-settlement-store.js 的 transactAccount 保留 payload=JSON.stringify(payload)；commitOnline 每次傳入整個 model/settings，所有收據又隨 accounts 保存。真實 IndexedDB 觀察：20 次保存，帳號從 32,136 bytes 增至 240,654 bytes，23 筆收據。需制定可驗證的去重摘要、收據保留／歸檔政策與長時間／quota 失敗測試，不能直接刪除收據使舊命令重新領取。本輪只記錄，不改實作。
2. **正式啟動與切換協調器尚未完成**：需單一權威標記、來源版本、跨分頁停止舊寫入、備份與切換 gate；不得將 window.localStorage shadow 當成整個正式站的升級策略。
3. **既有單人離線收益尚未接線新角色權威**：本輪隔離停用收益是限制，不能正式讓玩家離線收益消失，也不能重開已結算時間。第四批 A prepared 恢復與正式單人收益是兩條不同路徑。
4. **舊 reset、第四槽及異步交易邊界尚未完成**：需阻擋／替換不支援操作並審核历史四槽資料。保存失敗後仍需安全 UI 引導與重試規則。目前失敗頁凍結等待重新載入，不可宣稱全部行為可自動恢復。
5. **完整備份與正式回退工具未完成**：現有核心資料來源備份可回滾尚未切換的遷移；正式全帳號匯出、設定／journal 快照與切換後回復新培養成果仍需實作。切換後若已有新交易，不能直接覆蓋回舊備份。

## 5. 建議正式切換操作流程（方案，尚未執行）

1. 完成上述阻擋項目與端到端驗收，確認發布版本與資料格式；新系統仍預設關閉。
2. 在所有遊戲分頁協調暫停，刷新到支援切換的版本，拒絕舊寫入。建立單一 accountId、版本與 lease；無法控制的舊頁需關閉後才能切換。
3. 收集完整遊戲存檔：所有 stardust-* 遊戲鍵、當前角色與編組、設定、帳號資源，以及相關 accounts/runs 紀錄。備份至獨立持久化位置並核對校驗值／可讀性。此方案不在本輪讀寫正式帳號。
4. 先處理未完成舊離線 job，沿用原快照／種子／政策；將單人離線最後成功結算時間與新權威一致記錄，避免一次在 localStorage、一次在 IndexedDB 加收益。
5. 對一致來源副本生成候選模型。核對每角色成長、貨幣、裝備 metadata、多重集合、物品總量、隊伍引用與所有權。任何衝突保持舊權威並停止。
6. 同一 IndexedDB 交易寫候選模型、版本、來源 fingerprint、切換收據與結算邊界；未提交成功不顯示完成。所有新頁面先讀權威標記，再決定可用路徑；舊別名只保留唯讀備份，不二次匯入。
7. 重新整理、切換主角、保存／讀回、離線再登入及雙分頁交易驗證通過後，才解除暫停。

失敗回復：交易提交前，停止新寫入並保留原来源，使用已有備份重试；一筆原子交易失敗不會留下半個 permanent 模型。交易提交後但未解鎖，若可證明沒有後續新交易，可由專用回退程序恢復來源版本與權威標記。解鎖後已有新培養或收益，必須先備份最新模型／journal，再用已驗證的版本回退或資料轉換；不能用舊 localStorage 全量覆蓋。現有 API 不提供這個完整正式回退工具，因此仍是阻擋項目。

## 6. 未提交內容與 commit 建議

工作區包含之前離線第二批～第四批 A、UI／地圖文字及素材修改，不能 git add . 一次提交。完整 status 快照：tmp/permanent-phase-c-working-tree.txt；本輪只新增／修改測試工具、整合測試及報告，不修改正式 runtime。

建議先核對並獨立保存離線批次前置依賴，再把 A／B／C 拆成以下三個聚焦提交（每組含 2–4 個相關議題，不等於只限 2–4 檔案）：

1. **永久模型與交易服務**：permanent-party-policy.js、permanent-party-store.js、offline-settlement-store.js 的永久交易支援；tests/permanent-party-policy.test.js、tools/permanent-party-browser-check.html/js、docs/permanent-party-phase-one.md。offline-settlement-store.js 目前整檔尚未追蹤，依賴第四批 A 基礎；需先拆分／提交該前置基準，不能把未驗收的離線變更夾帶為 A。
2. **隔離在線接線與狀態保留**：permanent-online-policy.js、permanent-party-runtime.js、script.js 內永久服務及 UUID 相關 hunks、index.html 的 A 依賴標籤 hunks；tools/build-permanent-playtest.js、permanent-party-playtest.html、permanent-party-playtest-bootstrap.js、permanent-party-fixture.js、permanent-party-runtime-check.html/js；tests/permanent-online-runtime.test.js、docs/permanent-party-phase-b.md。script/index 有其他早先功能，必須逐 hunk 檢查，不整檔盲目提交。
3. **正式切換前驗收**：tests/permanent-cutover-integration.test.js、tools/permanent-party-cutover-check.html/js、本報告、runtime-check 的完整副本核對補強 hunks。依賴前兩組；不啟用正式系統。

排除範圍：tmp/執行日誌與暫存備份、__pycache__、人類戰士 GIF、精靈獵人 PNG 刪除、半獸人法師校正資料、無關 CSS／地圖／字體改動。其他離線政策與 generated 檔需要其原批次獨立提交，而不是在 A／B／C 中順便整理。

## 7. 本輪輸出與停止點

新增 tests/permanent-cutover-integration.test.js、tools/permanent-party-cutover-check.html/js；補強 tools/permanent-party-runtime-check.js 的全物品及裝備資料核對，HTML 僅測試腳本快取版本更新。正式程式及平衡本輪未改。

結果檔案：tmp/permanent-phase-c-regression.json（209／209），資料讀寫 inventory、working-tree 快照與三份瀏覽器截圖。報告明確區分測試通過與正式切換 gate：A／B／C 隔離驗收通過，不代表可以啟用正式入口。停止，等待使用者確認後再處理阻擋項目或提出 commit。
