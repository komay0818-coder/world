# 第一階段 D-1：交易紀錄容量與存檔效能

2026-10-12。dev 分支；未提交 commit、未遷移正式存檔、未啟用正式永久角色或三人離線系統。本批只處理已完成在線交易收據的容量與存檔效能。

## 原因與資料分類

舊 transactAccount 在 accounts.commands 中保存 JSON.stringify(payload)。在線 payload 包含完整永久角色、背包、裝備及設定；每次保存都新增一份，接著 copy(account) 又複製整份累積歷史。讀取也使用 readwrite 交易。Runtime 與 store 之間另有重複模型複製。

必須保存：目前角色／背包／裝備所有權／編組／資源、目前 revision、遷移原始備份及稽核、來源切換識別。離線 runs 的 prepared 原快照／種子及 committed 防重複領取紀錄均完整保留，不清理或壓縮。一般已完成在線交易只需要識別、原始 revision、結果 revision 及輸入指紋，不需要重複的完整快照。

## 實作

- 收據改為 SHA-256 指紋、sourceRevision、revision、metadataOnly；一般完成交易保留最近 32 筆。遷移、backup、migration-review 與 metadata 收據另外保留，測試資料是 32+1=33 筆。
- receiptFloorRevision 保存已清理的版本界線。仍保留的相同 ID／內容重試回傳 duplicate；內容不同拒絕。已清理的原版本重試拒絕執行並要求讀取最新權威資料，不假裝可回傳已刪除結果。新在線 ID 綁定 source revision，不能改用最新 revision 重送過期 ID。
- compactHistory 在同一 readwrite 交易中更新收據及界線。指紋在交易外計算；提交前核對 revision、原收據及界線，避免清理覆蓋其他分頁更新。清理先選保留項目，再雜湊，避免替將被移除的快照做無用計算。失敗回滾、重試無額外收據。
- 首次寫入舊 payload 格式會安全轉換；未完成離線 job 不受整理影響，仍阻擋新角色修改直到原結算恢復。已有遷移備份不刪除。
- 使用 IndexedDB 已隔離的 record，取消額外 copy(account)；runtime 不再先複製整份模型，store 僅建立一次穩定模型快照。必要的目前有效模型仍原子保存一次，未改成不安全的部分寫入。
- read／recover 改 readonly。相同資料經 runtime 重存不發起交易；直接低階 API 重存仍留下版本收據，但數量有界。

IndexedDB schema 仍為版本 1、accounts/runs 兩個 store，不新增或遷移 store。receiptVersion=2 只是 record 表示格式。舊資料可轉換，原角色及原始備份不變。若回退版本，需要保留支援 v2 收據的 storage adapter，不能把 SHA 指紋還原成已刪除快照；隔離環境另保留優化前 fixture 與獨立資料庫，不在正式資料上做回退。

## 容量比較

同一份三角色快照，每次只增加測試 lastActiveAt；兩版結果模型一致。下表為 UTF-8 JSON 邏輯大小，KB=1000 bytes，不是瀏覽器磁碟檔案或 quota 占用估算。

| 保存次數 | 舊有效存檔 KB | 新有效存檔 KB | 舊歷史收據 KB | 新歷史收據 KB | 新帳號合計 KB |
|---:|---:|---:|---:|---:|---:|
| 20 | 4.517 | 4.561 | 206.794 | 3.142 | 16.182 |
| 100 | 4.518 | 4.563 | 1014.318 | 4.994 | 18.036 |
| 500 | 4.518 | 4.564 | 5053.118 | 5.117 | 18.160 |
| 1000 | 4.519 | 4.565 | 10101.622 | 5.122 | 18.166 |

每組必要备份另為 8.476 KB，兩版皆保留。有效大小排除 commands、migrationBackup、backupHistory、permanent.migration.backup；包含帳號版本標記，因此新版多約 46 bytes，不代表角色物品增加。1000 次後歷史約縮小 99.95%，不再隨每次保存累積全量快照。

低階 API 額外重存相同模型 100 次，歷史由 5122→5341 bytes、收據維持 33，差異是版本／ID 字串長度，模型未變。正常 runtime 的 100 次相同資料保存為 0 次額外提交。

舊歷史整理測試：45 筆舊 payload 及必要遷移收據由 460484 bytes 縮至 6172 bytes；完成 40 輪換裝、離隊、招募、主角切換後仍為 33 筆，角色與背包一致。

## 效能

真實瀏覽器 IndexedDB、同份資料、每次保存串行等待。寫入時間是截至該次數的累計平均；讀取為該檢查點 5 次平均，毫秒。不是戰鬥 FPS、離線戰鬥模擬時間或跨裝置速度保證。

| 次數 | 舊寫入平均 ms | 新寫入平均 ms | 舊讀取平均 ms | 新讀取平均 ms |
|---:|---:|---:|---:|---:|
| 20 | 3.495 | 1.540 | 0.780 | 0.520 |
| 100 | 16.855 | 1.435 | 8.460 | 0.440 |
| 500 | 52.484 | 1.629 | 12.680 | 0.460 |
| 1000 | 92.515 | 1.672 | 17.280 | 0.540 |

1000 次總測量流程：舊約 93.55 秒，新約 1.88 秒，包含檢查點讀取與容量核對。寫入 P95：156.9→2.6 ms。

## 驗證

- 完整回歸：210 個測試檔案全部通過，0 失敗（原 209，加 transaction-receipt-policy.test.js）。
- 收據政策 14 項；原角色 runtime 46 項，含新增 100 次相同保存不寫入；C 整合 31 項。
- 真實 IndexedDB 安全檢查 26 項：清理中斷回滾、清理重試、舊格式首次寫入自動轉換、保留收據重試、內容不符、過期版本及重綁版本拒絕、并發寫入、過期清理快照、角色裝備完整、資料庫重開。
- 未完成離線 job 的原 snapshot／seed 保留。after-journal 中斷仍為 prepared；恢復成功後清理及重複提交仍只發放一次，committed journal 保留。
- 兩個獨立分頁同時保存：一筆 revision 2 成功，金幣 20001、裝備 6 件；另一筆 Concurrent save conflict，沒有重複收入。
- 原在線瀏覽器 31 項全部通過；重新整理模型一致。正式核心 localStorage 值始終未變。

## 修改檔案

核心：offline-settlement-store.js、permanent-party-store.js、permanent-party-runtime.js。

快取版本及隔離入口：index.html（只更新 store 引用版本，不啟用系統）、tools/build-permanent-playtest.js、tools/permanent-party-playtest.html。

測試：tests/transaction-receipt-policy.test.js、tests/permanent-online-runtime.test.js、tests/fixtures/offline-store-before-d1.fixture.js、tools/transaction-receipt-check.html/js、本報告。tmp/d1-*.json 與截圖為實測輸出，不是正式存檔。

## 結論與剩餘風險

已排除一般在線交易每次追加完整模型而持續膨脹的問題；最近收據有界，角色、物品及離線資料未被刪除。它不是把全部帳號資料限制到固定容量：玩家背包、必要遷移備份、metadata 稽核及完整離線 journals 仍會依實際資料增加。現有待恢復檢查仍掃描 runs，若長年保存大量离線 journal，可能有額外成本，本批未改變其保存政策。

SHA-256 需要安全環境下的 Web Crypto；缺少時明確停止，不以不安全指紋替代。過期交易只可拒絕後讀最新資料，不支援無限期回傳所有历史結果；一般 API 重試需維持原 commandId 及來源 revision。未做真正斷電或強制終止瀏覽器測試，也未填滿實際磁碟 quota；中斷測試為交易故障注入及關閉／重開。性能數值只代表本次隔離 fixture。

本批未處理正式切換協調、單人離線接線、第四槽／reset／其他異步邊界及完整正式回退工具。D-1 完成後停止，等待使用者確認 D-2，不自行提交。
