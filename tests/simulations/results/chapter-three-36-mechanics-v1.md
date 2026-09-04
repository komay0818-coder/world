# 3-6 TEST V1：舊B1機制驗證

本次恰好600場（400長掛、200Boss），不是正式平衡證據。Lv30人類、第二章B1裝備、技能Lv1，每人一條2%擊殺回血；未納入第三章實際成長。正式數值未修改。

模擬器為既有測試戰鬥模型，並非完整正式遊戲引擎。每場seed、HP、死亡時間及機制計數保存在同名JSON。時間單位秒，比例0～1，傷害／治療為實際值；每分鐘數值以總量／總模擬時間計算。存活HP比例以整隊最大HP為分母（死亡成員為0），僅平均未全滅場次。全滅時間僅平均全滅場次；無樣本為null。

## 機制檢查

純規則測試及600場資料完整性檢查通過。古老石軀只在直接傷害路徑計數，每第5次有效直接攻擊減傷30%；DOT不走此路徑。符文DEF降幅固定8%、刷新5秒且僅作用命中者。處決斬以命中前HP選擇1.5或1.7，未額外相乘。

治療最低血量比例的其他存活受傷敵人，上限6%最大HP；無合法目標跳過。實測沒有自療或復活。治療目標中的ancient-priest代表另一隻祭司，不是施法者自身。

壁壘每隻最多1次；149次治療後再次跨半血線均未重觸發。Boss兩隊三階段觸發率皆100%，前兩階段均持續10秒，核心基礎值DEF132／DR26%／ATK221.76／AS0.8736經單元驗證，不與前階段疊乘。AoE每場7次、最多4個目標，沿用既有命中／減傷規則。

處決強化檔平均實際傷害較低：不同樣本的目標、防禦與護盾吸收不同，不能直接從平均實傷反推倍率；單元測試已確認使用1.70取代1.50。承傷統計扣除護盾吸收，但不扣除過量傷害。

## 每格完整統計

以下欄位保留英文名稱便於與JSON核對；A為獵人隊，B為法師隊。

### loop-A-14

```json
{
  "id": "loop-A-14",
  "mode": "loop",
  "party": "A",
  "stage": "14/35",
  "runs": 100,
  "fullPartySurvivalRate": 0,
  "survivalRate": 0,
  "averageWipeSeconds": 209.30699999999996,
  "survivorHpPercent": null,
  "dps": 292.0793380058957,
  "killsPerMinute": 9.927044962662503,
  "deathRates": {
    "warrior": 1,
    "assassin": 1,
    "hunter": 1,
    "priest": 1
  },
  "shellProcsPerMinute": 21.803379724519488,
  "defenseRuneCoverage": 0.19062190944402102,
  "normalExecutionHits": 475,
  "boostedExecutionHits": 412,
  "boostedExecutionRate": 0.4644870349492672,
  "normalExecutionDamagePerHit": 14.023157894736842,
  "boostedExecutionDamagePerHit": 11.320388349514563,
  "healCastsPerMinute": 3.29085983746363,
  "enemyHealingPerMinute": 462.2121572618212,
  "healTargetCounts": {
    "temple-stone-guard": 334,
    "rune-golem": 208,
    "temple-executor": 179,
    "ancient-priest": 144,
    "temple-guardian": 283
  },
  "noTargetSkips": 0,
  "selfHeals": 0,
  "resurrections": 0,
  "elitesPerMinute": 0.5303214894867349,
  "elitePresence": 0.33442503117429684,
  "eliteDamageShare": 0.1074024009127437,
  "barrierTriggerRate": 0.8,
  "barrierDuration": 5.974662162162162,
  "guardianHealedAboveHalfCount": 19,
  "guardianRecrossings": 19,
  "maxBarrierTriggers": 1
}
```

### loop-A-21

```json
{
  "id": "loop-A-21",
  "mode": "loop",
  "party": "A",
  "stage": "21/35",
  "runs": 100,
  "fullPartySurvivalRate": 0,
  "survivalRate": 0.26,
  "averageWipeSeconds": 431.58310810810815,
  "survivorHpPercent": 0.03874357874356974,
  "dps": 277.260963267676,
  "killsPerMinute": 9.4688049241488,
  "deathRates": {
    "warrior": 1,
    "assassin": 0.95,
    "hunter": 0.99,
    "priest": 0.74
  },
  "shellProcsPerMinute": 19.34781534021287,
  "defenseRuneCoverage": 0.19241161912314428,
  "normalExecutionHits": 811,
  "boostedExecutionHits": 1222,
  "boostedExecutionRate": 0.6010821446138711,
  "normalExecutionDamagePerHit": 12.850801479654747,
  "boostedExecutionDamagePerHit": 11.346808510638295,
  "healCastsPerMinute": 3.6565086463955043,
  "enemyHealingPerMinute": 508.3569376792679,
  "healTargetCounts": {
    "temple-stone-guard": 763,
    "rune-golem": 567,
    "temple-executor": 427,
    "ancient-priest": 432,
    "temple-guardian": 708
  },
  "noTargetSkips": 1,
  "selfHeals": 0,
  "resurrections": 0,
  "elitesPerMinute": 0.46700317541123115,
  "elitePresence": 0.33659253867765726,
  "eliteDamageShare": 0.10581956745926234,
  "barrierTriggerRate": 0.9108108108108108,
  "barrierDuration": 6,
  "guardianHealedAboveHalfCount": 60,
  "guardianRecrossings": 54,
  "maxBarrierTriggers": 1
}
```

### boss-A-21

```json
{
  "id": "boss-A-21",
  "mode": "boss",
  "party": "A",
  "stage": "21/35",
  "runs": 100,
  "fullPartySurvivalRate": 1,
  "survivalRate": 1,
  "averageWipeSeconds": null,
  "survivorHpPercent": 0.5938738738737297,
  "dps": 201.362,
  "killsPerMinute": 0,
  "deathRates": {
    "warrior": 0,
    "assassin": 0,
    "hunter": 0,
    "priest": 0
  },
  "killRate": 0,
  "fullPartyKillRate": 0,
  "averageKillSeconds": null,
  "wipeRate": 0,
  "timeoutRate": 1,
  "hpAtKill": null,
  "hpAtTimeout": 0.5938738738737297,
  "bossDamagePerRun": 737,
  "priestHealingPerRun": 1497.06,
  "heavyHitsPerRun": 6.15,
  "heavyDamagePerHit": 20.359349593495935,
  "pulseCastsPerRun": 7,
  "pulseMaxTargets": 4,
  "pulseDamagePerJob": {
    "warrior": 38.74,
    "assassin": 35.41,
    "hunter": 40.59,
    "priest": 58.98
  },
  "defensePhase": {
    "rate": 1,
    "at": 38.37150000000001,
    "duration": 10,
    "maxTriggers": 1
  },
  "rampagePhase": {
    "rate": 1,
    "at": 79.334,
    "duration": 10,
    "maxTriggers": 1
  },
  "corePhase": {
    "rate": 1,
    "at": 105.92350000000008,
    "duration": 14.076499999999992,
    "maxTriggers": 1
  }
}
```

### loop-B-14

```json
{
  "id": "loop-B-14",
  "mode": "loop",
  "party": "B",
  "stage": "14/35",
  "runs": 100,
  "fullPartySurvivalRate": 0,
  "survivalRate": 0,
  "averageWipeSeconds": 219.4529999999999,
  "survivorHpPercent": null,
  "dps": 326.3864699958535,
  "killsPerMinute": 10.92808027231344,
  "deathRates": {
    "warrior": 1,
    "assassin": 1,
    "mage": 1,
    "priest": 1
  },
  "shellProcsPerMinute": 19.35448592637149,
  "defenseRuneCoverage": 0.1653543127685646,
  "normalExecutionHits": 411,
  "boostedExecutionHits": 531,
  "boostedExecutionRate": 0.5636942675159236,
  "normalExecutionDamagePerHit": 14.369829683698297,
  "boostedExecutionDamagePerHit": 8.391713747645953,
  "healCastsPerMinute": 3.3164276633265453,
  "enemyHealingPerMinute": 450.2986972153495,
  "healTargetCounts": {
    "temple-stone-guard": 339,
    "rune-golem": 242,
    "temple-executor": 177,
    "ancient-priest": 184,
    "temple-guardian": 271
  },
  "noTargetSkips": 0,
  "selfHeals": 0,
  "resurrections": 0,
  "elitesPerMinute": 0.6452406665664178,
  "elitePresence": 0.36833855085142614,
  "eliteDamageShare": 0.12234418687533677,
  "barrierTriggerRate": 0.8728813559322034,
  "barrierDuration": 5.927912621359223,
  "guardianHealedAboveHalfCount": 22,
  "guardianRecrossings": 22,
  "maxBarrierTriggers": 1
}
```

### loop-B-21

```json
{
  "id": "loop-B-21",
  "mode": "loop",
  "party": "B",
  "stage": "21/35",
  "runs": 100,
  "fullPartySurvivalRate": 0,
  "survivalRate": 0.56,
  "averageWipeSeconds": 437.89545454545447,
  "survivorHpPercent": 0.12115943840353245,
  "dps": 322.5079160314296,
  "killsPerMinute": 10.943984383570974,
  "deathRates": {
    "warrior": 1,
    "assassin": 0.98,
    "mage": 0.53,
    "priest": 0.44
  },
  "shellProcsPerMinute": 17.88852865849276,
  "defenseRuneCoverage": 0.17582763669103738,
  "normalExecutionHits": 817,
  "boostedExecutionHits": 1453,
  "boostedExecutionRate": 0.6400881057268722,
  "normalExecutionDamagePerHit": 12.93170134638923,
  "boostedExecutionDamagePerHit": 7.467928423950449,
  "healCastsPerMinute": 3.590870744542005,
  "enemyHealingPerMinute": 504.93476130848126,
  "healTargetCounts": {
    "temple-stone-guard": 814,
    "rune-golem": 542,
    "temple-executor": 480,
    "ancient-priest": 527,
    "temple-guardian": 801
  },
  "noTargetSkips": 0,
  "selfHeals": 0,
  "resurrections": 0,
  "elitesPerMinute": 0.6276079398646426,
  "elitePresence": 0.38921811929471456,
  "eliteDamageShare": 0.1330244866436102,
  "barrierTriggerRate": 0.9385171790235082,
  "barrierDuration": 5.959248554913294,
  "guardianHealedAboveHalfCount": 58,
  "guardianRecrossings": 54,
  "maxBarrierTriggers": 1
}
```

### boss-B-21

```json
{
  "id": "boss-B-21",
  "mode": "boss",
  "party": "B",
  "stage": "21/35",
  "runs": 100,
  "fullPartySurvivalRate": 1,
  "survivalRate": 1,
  "averageWipeSeconds": null,
  "survivorHpPercent": 0.5794996500436081,
  "dps": 219.78169832449447,
  "killsPerMinute": 0.44116714910519966,
  "deathRates": {
    "warrior": 0,
    "assassin": 0,
    "mage": 0,
    "priest": 0
  },
  "killRate": 0.87,
  "fullPartyKillRate": 0.87,
  "averageKillSeconds": 118.07183908045981,
  "wipeRate": 0,
  "timeoutRate": 0.13,
  "hpAtKill": 0.5804298696378067,
  "hpAtTimeout": 0.5732743342978182,
  "bossDamagePerRun": 865.27,
  "priestHealingPerRun": 1505.96,
  "heavyHitsPerRun": 6.1,
  "heavyDamagePerHit": 21.701639344262293,
  "pulseCastsPerRun": 7,
  "pulseMaxTargets": 4,
  "pulseDamagePerJob": {
    "warrior": 38.19,
    "assassin": 37.1,
    "mage": 61.93,
    "priest": 61.45
  },
  "defensePhase": {
    "rate": 1,
    "at": 35.55249999999998,
    "duration": 10,
    "maxTriggers": 1
  },
  "rampagePhase": {
    "rate": 1,
    "at": 73.15999999999997,
    "duration": 10,
    "maxTriggers": 1
  },
  "corePhase": {
    "rate": 1,
    "at": 97.72399999999998,
    "duration": 20.598500000000005,
    "maxTriggers": 1
  }
}
```

## 結論限制

未觀察到重複階段、錯誤Buff疊加、自療或復活；不能以有限場次證明不存在所有BUG。獵人隊Boss超時100%、法師隊超時13%，均照實保存，不修改S20或怪物。本輪只通過所覆蓋機制檢查，不宣告3-6平衡通過。
