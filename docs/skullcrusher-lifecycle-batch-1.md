# 副本・碎顱禁地：第一批生命週期

本批沒有正式怪物、掉落、Boss、飾品或通關獎勵。一般地圖與其他副本使用原有規則。

## 開發測試入口

僅 `http://localhost:<port>/?skullcrusher-lifecycle=1` 或本機迴圈位址顯示測試面板。需要已登入的永久帳號、三人隊伍、已解鎖3-4、真正持有一張 `skullcrusher-dungeon-pass`，並停止衝突戰鬥／掛機。沒有注入或免費發放憑證的功能。自動化測試的憑證只建立在記憶體IndexedDB。

面板可以入場、手動前進六個測試步驟（第一階段三波＋隊長、第二階段、第三階段）、擊倒角色及退出。這些不是正式怪物波次；沒有自動通關與發獎。生命與資源正常恢復使用既有函式。

## 持久化

帳號根層新增可選的 `skullcrusherDungeon`，沒有該欄位的舊帳號無需遷移：

```js
{
  version: 1,
  activeRunId: "uuid-or-null",
  runs: {
    "uuid": {
      dungeonId: "skullcrusher-forbidden-dungeon",
      runId: "uuid", accountId: "supabase:uuid", leaderId: "character-id",
      characterIds: ["a", "b", "c"], returnMapId: "original-map",
      status: "active", // succeeded / failed / exited / aborted
      ticket: { itemId: "skullcrusher-dungeon-pass", quantity: 1, consumed: true },
      enteredAt: 0, endedAt: null, endReason: null,
      settlementId: "skullcrusher-settlement:uuid",
      rewardStatus: "not-implemented", testOnly: true
    }
  }
}
```

扣票、首次滿血滿資源的三人狀態與場次建立使用同一個帳號交易。重複請求或回應遺失沿用同一runId。結束狀態、返回地圖、停止自動戰鬥旗標亦在同一交易保存。場次紀錄獨立於有限的交易receipt保留，用於長期去重。

頁面載入在建立遊戲Runtime前，將未完成場次中止，不扣票、不恢復挑戰。Runtime正常停用時先停止測試計時器並保存中止；無法完成寫入時保留進行中紀錄，待下次載入安全中止。暫時API失敗不直接觸發退出，入場與結束請求可重試。

## 戰鬥隔離

只有帶 `battle.skullcrusherRunId` 的測試場次略過主角死亡立即結束、隊友藥水復活及原有全滅重置；原本保命技能不變。首次使用新建的角色戰鬥實例，捨棄舊partyMemberState暫時狀態，再補滿HP與所有主要資源。換測試步驟保留同一組角色實例。

退出／失敗先停止計時器、清空敵方與測試狀態、更新場次世代，再保存終止紀錄；返回原地圖並要求手動重新選圖，不自行恢復掛機。本批沒有擊殺收益。

## 驗證

`node tests/skullcrusher-dungeon-lifecycle.test.js`

涵蓋入場驗證、IndexedDB回滾、相同／不同runId並行、請求回應遺失、滿血滿資源、階段保留狀態、實際死亡／藥水函式、全滅、退出、重登恢復、Session停用、憑證與獎勵不重複。

下一批才接入正式波次與副本怪物數值；本批的 `succeeded` 僅是預留的終態，不代表已完成Boss通關與結算。
