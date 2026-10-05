# 第三章 3-4～3-6 正式接線前數值核對

測試基準提交：687198a（dev）。以下記錄接線前的數值來源；後三區現已接入正式戰鬥，基礎數值未重新平衡。3-6 赤岩古神採使用者確認的第一版實測數值，技能與階段依正式規劃。

模擬攻速單位為次／秒；攻擊間隔 = 1／攻速。閃避、格擋、減傷單位為百分比。每隻怪物未獨立設定命中；共用模擬公式為 clamp(0.898 − 玩家閃避, 0.45, 0.99)。基礎技能倍率、冷卻不包含條件技能變化。

## 3-4 碎顱戰爭營地

模擬數值來源：tests/simulations/chapter-three-34-rules.js。正式技能來源：skullcrusher-war-camp-policy.js。

|怪物|階級|HP|攻擊|防禦|閃避%|格擋%|減傷%|攻速|間隔秒|模擬技能倍率|模擬技能冷卻秒|
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|碎顱狂戰士|normal|1180|111|68|4|8|10|0.92|1.087|1.4|10|
|碎顱薩滿|normal|960|87|58|5|0|8|0.88|1.136|未設定／功能型|12|
|碎顱重甲衛士|normal|1520|96|112|1|20|22|0.66|1.515|1.25|10|
|碎顱戰狼騎兵|normal|1230|116|72|8|5|10|1.05|0.952|1.45|10|
|碎顱勇士|elite|3950|150|128|4|18|26|0.84|1.190|1.6|10|
|碎顱大酋長|boss|20000|180|148|3|20|28|0.82|1.220|1.65|10|

已規劃正式技能的原始數值（毫秒為時間單位；比例 .15 表示 15%）：

```json
{
  "heavy-armor-line": {
    "id": "heavy-armor-line",
    "name": "重甲防線",
    "passive": true,
    "defenseBonus": 0.3,
    "criticalDamageReduction": 0.2,
    "selfOnly": true
  },
  "warwolf-assault": {
    "id": "warwolf-assault",
    "name": "戰狼突襲",
    "firstDelayMs": 2000,
    "cooldownMs": 10000,
    "damageMultiplier": 1.7,
    "target": "random-alive-non-frontline-or-primary",
    "debuff": {
      "type": "defense-down",
      "value": 0.15,
      "durationMs": 5000,
      "stacking": "refresh-by-source"
    }
  },
  "champion-slash": {
    "id": "champion-slash",
    "name": "勇士猛斬",
    "cooldownMs": 7000,
    "damageMultiplier": 2.1,
    "defenseIgnore": 0.2,
    "target": "primary"
  },
  "unyielding-will": {
    "id": "unyielding-will",
    "name": "不屈戰意",
    "passive": true,
    "thresholds": [
      0.75,
      0.5,
      0.25
    ],
    "attackBonusPerStack": 0.06,
    "damageReductionPerStack": 0.05,
    "maxStacks": 3,
    "permanent": true
  },
  "chieftain-earthsplitter": {
    "id": "chieftain-earthsplitter",
    "name": "酋長裂地斬",
    "cooldownMs": 6000,
    "damageMultiplier": 2,
    "target": "primary",
    "debuffs": [
      {
        "type": "defense-down",
        "value": 0.15,
        "durationMs": 5000,
        "stacking": "refresh-by-source"
      },
      {
        "type": "healing-received-down",
        "value": 0.15,
        "durationMs": 5000,
        "stacking": "refresh-by-source"
      }
    ]
  },
  "fallen-warrior-rage": {
    "id": "fallen-warrior-rage",
    "name": "戰死者之怒",
    "passive": true,
    "attackBonusPerStack": 0.06,
    "attackSpeedBonusPerStack": 0.05,
    "maxStacks": 4,
    "permanent": true,
    "trigger": "other-enemy-death"
  },
  "skullcrusher-overlord": {
    "id": "skullcrusher-overlord",
    "name": "碎顱霸主",
    "passive": true,
    "threshold": 0.3,
    "attackBonus": 0.2,
    "damageReduction": 0.15,
    "permanent": true,
    "once": true
  }
}
```

## 3-5 遠古祭壇

模擬數值來源：tests/simulations/chapter-three-35-rules.js。正式技能來源：ancient-altar-policy.js。

|怪物|階級|HP|攻擊|防禦|閃避%|格擋%|減傷%|攻速|間隔秒|模擬技能倍率|模擬技能冷卻秒|
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|碎顱祭司|normal|1080|92|64|5|0|9|0.82|1.220|未設定／功能型|12|
|碎顱狂信者|normal|1260|122|70|5|5|10|0.96|1.042|1.45|10|
|遠古石衛|normal|1620|101|120|0|12|23|0.64|1.563|1.3|10|
|符文守衛|normal|1340|108|91|3|12|16|0.78|1.282|1.35|10|
|覺醒守衛|elite|4300|156|136|2|18|27|0.78|1.282|1.6|10|
|墮落大祭司|boss|22500|187|154|4|15|29|0.8|1.250|1.65|10|

已規劃正式技能的原始數值（毫秒為時間單位；比例 .15 表示 15%）：

```json
{
  "fel-prayer": {
    "id": "fel-prayer",
    "name": "邪能祈禱",
    "cooldownMs": 10000,
    "target": "lowest-hp-ratio-alive-enemy",
    "healMaxHpRatio": 0.1
  },
  "death-sacrifice": {
    "id": "death-sacrifice",
    "name": "死亡獻祭",
    "trigger": "self-death",
    "target": "all-other-alive-enemies",
    "buff": {
      "type": "death-sacrifice",
      "attackBonus": 0.1,
      "durationMs": 6000,
      "stacking": "refresh-by-name"
    }
  },
  "petrified-body": {
    "id": "petrified-body",
    "name": "石化之軀",
    "passive": true,
    "defenseBonus": 0.25,
    "dotDamageReduction": 0.2,
    "selfOnly": true
  },
  "rune-shield": {
    "id": "rune-shield",
    "name": "符文護盾",
    "firstDelayMs": 3000,
    "cooldownMs": 10000,
    "shieldMaxHpRatio": 0.1,
    "durationMs": 5000,
    "shieldSource": "rune-shield",
    "stacking": "replace-by-source"
  },
  "awakened-smash": {
    "id": "awakened-smash",
    "name": "覺醒重擊",
    "cooldownMs": 7000,
    "damageMultiplier": 2.1,
    "target": "primary",
    "debuff": {
      "type": "attack-down",
      "value": 0.15,
      "durationMs": 5000,
      "stacking": "refresh-by-source"
    }
  },
  "awakened-rune": {
    "id": "awakened-rune",
    "name": "覺醒符文",
    "passive": true,
    "threshold": 0.5,
    "shieldMaxHpRatio": 0.2,
    "shieldSource": "awakened-rune",
    "attackBonus": 0.2,
    "buffWhileShield": true,
    "once": true
  },
  "fallen-flame": {
    "id": "fallen-flame",
    "name": "墮落之火",
    "cooldownMs": 6000,
    "damageMultiplier": 1.5,
    "target": "random-alive-player",
    "dot": {
      "type": "fallen-burn",
      "attackRatio": 0.25,
      "durationMs": 6000,
      "tickMs": 2000,
      "ticks": 3,
      "stacking": "refresh-by-source"
    }
  },
  "blood-sacrifice": {
    "id": "blood-sacrifice",
    "name": "血祭",
    "cooldownMs": 15000,
    "target": "lowest-hp-ratio-other-alive-enemy",
    "currentHpCostRatio": 0.2,
    "minRemainingHp": 1,
    "shieldMaxHpRatio": 0.08,
    "shieldSource": "blood-sacrifice",
    "attackBonus": 0.15,
    "durationMs": 6000,
    "stacking": "replace-by-source"
  },
  "forbidden-ritual": {
    "id": "forbidden-ritual",
    "name": "禁忌儀式",
    "passive": true,
    "threshold": 0.3,
    "shieldMaxHpRatio": 0.15,
    "shieldSource": "forbidden-ritual",
    "attackBonus": 0.25,
    "buffWhileShield": true,
    "once": true
  }
}
```

## 3-6 赤岩聖殿

模擬數值來源：tests/simulations/chapter-three-36-rules.js。正式技能來源：redrock-temple-policy.js。

|怪物|階級|HP|攻擊|防禦|閃避%|格擋%|減傷%|攻速|間隔秒|模擬技能倍率|模擬技能冷卻秒|
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|聖殿石衛|normal|1780|108|128|0|14|24|0.62|1.613|1.35|10|
|符文魔像|normal|1620|116|105|0|10|19|0.7|1.429|1.3|11|
|聖殿執行者|normal|1430|132|82|5|8|12|0.9|1.111|1.5|10|
|遠古祭司|normal|1150|94|68|5|0|10|0.8|1.250|未設定／功能型|12|
|聖殿守護者|elite|4750|164|145|2|20|29|0.76|1.316|1.65|10|
|赤岩聖殿守護神|boss|26000|198|165|2|18|31|0.78|1.282|1.7|10|

已規劃正式技能的原始數值（毫秒為時間單位；比例 .15 表示 15%）：

```json
{
  "temple-bulwark": {
    "id": "temple-bulwark",
    "name": "聖殿壁壘",
    "passive": true,
    "defenseBonus": 0.25,
    "allyDamageReduction": 0.1,
    "selfExcluded": true,
    "requiresLivingSource": true,
    "stacking": "maximum-by-name"
  },
  "rune-overload": {
    "id": "rune-overload",
    "name": "符文過載",
    "cooldownMs": 10000,
    "durationMs": 4000,
    "attackBonus": 0.25,
    "attackSpeedBonus": 0.2,
    "stacking": "refresh-by-name"
  },
  "execution": {
    "id": "execution",
    "name": "處決",
    "cooldownMs": 8000,
    "target": "lowest-hp-ratio-alive-player",
    "damageMultiplier": 1.6,
    "lowHpThreshold": 0.3,
    "lowHpDamageMultiplier": 2.2
  },
  "rune-blessing": {
    "id": "rune-blessing",
    "name": "符文祝禱",
    "cooldownMs": 12000,
    "target": "lowest-hp-ratio-alive-enemy",
    "shieldMaxHpRatio": 0.12,
    "durationMs": 6000,
    "shieldSource": "rune-blessing",
    "stacking": "replace-by-source"
  },
  "guardian-smash": {
    "id": "guardian-smash",
    "name": "守護重擊",
    "cooldownMs": 7000,
    "damageMultiplier": 2.2,
    "target": "primary",
    "debuff": {
      "type": "defense-down",
      "value": 0.15,
      "durationMs": 5000,
      "stacking": "refresh-by-source"
    }
  },
  "guardian-rune": {
    "id": "guardian-rune",
    "name": "守護符文",
    "passive": true,
    "threshold": 0.5,
    "shieldMaxHpRatio": 0.25,
    "shieldSource": "temple-guardian-rune",
    "damageBonus": 0.2,
    "attackSpeedBonus": 0.15,
    "buffWhileShield": true,
    "once": true
  },
  "shield-shatter": {
    "id": "shield-shatter",
    "name": "護盾破裂",
    "triggerShieldSource": "temple-guardian-rune",
    "selfMaxHpDamageRatio": 0.05,
    "damageType": "special",
    "canCrit": false,
    "once": true
  },
  "ancient-god-smash": {
    "id": "ancient-god-smash",
    "name": "古神重擊",
    "cooldownMs": 6000,
    "damageMultiplier": 2,
    "target": "primary",
    "mark": {
      "maxStacks": 3,
      "damageTakenPerStack": 0.05,
      "durationMs": 10000,
      "sourceBossId": "redrock-ancient-god"
    }
  },
  "ancient-rune": {
    "id": "ancient-rune",
    "name": "遠古符文",
    "cooldownMs": 12000,
    "awakenedCooldownMs": 10000,
    "durationMs": 6000,
    "variants": [
      "war",
      "guardian",
      "weakening"
    ],
    "warAttackBonus": 0.2,
    "guardianShieldMaxHpRatio": 0.1,
    "guardianShieldSource": "ancient-rune-guardian",
    "weakeningAttackPenalty": 0.1,
    "singleActive": true
  },
  "ancient-awakening": {
    "id": "ancient-awakening",
    "name": "古神甦醒",
    "passive": true,
    "threshold": 0.7,
    "attackSpeedBonus": 0.15,
    "permanent": true,
    "once": true
  },
  "redrock-divine-wrath": {
    "id": "redrock-divine-wrath",
    "name": "赤岩神怒",
    "passive": true,
    "threshold": 0.3,
    "shieldMaxHpRatio": 0.15,
    "shieldSource": "redrock-divine-wrath",
    "attackBonus": 0.2,
    "attackSpeedBonus": 0.15,
    "buffWhileShield": true,
    "once": true
  }
}
```

## 接線衝突與待確認

- 3-4：模擬重甲衛士為半血以上減傷 +5%；正式重甲防線為防禦 +30%、受暴擊傷害 -20%。模擬勇士半血攻擊／攻速 +8%，正式不屈戰意為 75%／50%／25% 三階段。模擬大酋長在 70%／40% 召喚援軍、25% 狂暴；正式大酋長為盟友死亡疊戰死者之怒與 30% 碎顱霸主。
- 3-5：模擬祭司自損 8% 為盟友加減傷，正式邪能祈禱為治療。模擬狂信者 30% 狂暴，正式為死亡獻祭。模擬墮落大祭司為 70%／40% 儀式與 20% 禁忌階段，正式為墮落之火、血祭、30% 禁忌儀式護盾。
- 3-6：模擬檔明確標註並非平衡基準。模擬 Boss 名稱／ID 為赤岩聖殿守護神 temple-deity，正式為赤炎古神 redrock-ancient-god；模擬 70%／40%／20% 防禦、狂暴與核心階段，正式 70% 古神甦醒、30% 神怒護盾及隨機遠古符文。普通怪與菁英的技能亦不同。
- 命中：模擬使用共用命中公式，不能當成每隻怪物的獨立 accuracy 數值直接移植。
- 正式戰鬥目前後三區使用初階怪物數值作為 fallback，技能政策尚未接入 script.js。
- 3-4 尚標 dungeon，但未定義波次與入場費；依使用者決定，正式開放時改為一般探索，不消耗祭壇鑰匙。
- HP／攻防等純數值可逐項保留；技能、命中與 Boss 機制來源需先確定，不能聲稱整套原模擬平衡已沿用。
