(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SkillDescriptionPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const percent = (value) => `${Math.round(Number(value) * 100)}%`;
  const number = (value) => Number.isInteger(Number(value)) ? String(Number(value)) : String(Number(value).toFixed(1));
  const enabled = (value) => value !== false && value !== 0 && value !== '' && value != null;
  const text = (label, value) => `${label}${value}`;
  const pct = (label, value) => text(label, percent(value));
  const seconds = (label, value) => text(label, `${number(value)} 秒`);

  const formatters = Object.freeze({
    power: (v) => pct('造成攻擊力 ', v), healPower: (v) => pct('治療量為魔法攻擊 ', v), targets: (v) => text('最多攻擊 ', `${v} 個目標`),
    stun: (v) => seconds('暈眩 ', v), slow: (v) => pct('緩速 ', v), duration: (v) => seconds('持續 ', v), attackDown: (v) => pct('降低攻擊 ', v),
    reduction: (v) => pct('受到傷害降低 ', v), controlResistance: (v) => pct('控制抗性提高 ', v), maxHp: (v) => pct('最大生命提高 ', v),
    healingReceived: (v) => pct('受到治療提高 ', v), weaponDamage: (v) => pct('武器傷害提高 ', v), criticalDamage: (v) => pct('暴擊傷害提高 ', v),
    parry: (v) => pct('招架機率 ', v), counterPower: (v) => pct('反擊傷害為攻擊力 ', v), attackSpeed: (v) => pct('攻擊速度提高 ', v),
    basicDamage: (v) => pct('普通攻擊傷害提高 ', v), crit: (v) => pct('暴擊率提高 ', v), companionAttack: (v) => pct('戰寵攻擊提高 ', v),
    companionSpeed: (v) => pct('戰寵攻速提高 ', v), armorIgnore: (v) => pct('無視防禦 ', v), basicArrowRecoveryChance: (v) => pct('普攻回復箭矢機率 ', v),
    interval: (v) => text('每第 ', `${v} 次攻擊觸發`), guaranteedCrit: () => '必定暴擊', cooldownReduction: (v) => seconds('冷卻縮短 ', v),
    bleedDuration: (v) => seconds('流血持續 ', v), poisonDuration: (v) => seconds('中毒延長 ', v), poisonStacks: (v) => text('施加中毒 ', `${v} 層`),
    dodge: (v) => pct('閃避率提高 ', v), attack: (v) => pct('攻擊提高 ', v), speed: (v) => pct('攻擊速度提高 ', v), magicDamage: (v) => pct('魔法傷害提高 ', v),
    skillCriticalDamage: (v) => pct('技能暴擊傷害提高 ', v), chance: (v) => pct('觸發機率 ', v), invulnerable: (v) => seconds('無敵 ', v),
    paralysis: () => '命中施加麻痺', paralysisDuration: (v) => seconds('麻痺持續 ', v), elementDamage: (v) => pct('元素傷害提高 ', v),
    shield: (v) => pct('護盾為最大生命 ', v), damageReduction: (v) => pct('受到傷害降低 ', v), manaCost: (v) => pct('消耗最大魔力 ', v),
    internalCooldown: (v) => seconds('內建冷卻 ', v), healing: (v) => pct('治療效果提高 ', v), cooldown: (v) => seconds('冷卻 ', v),
    count: (v) => text('每施放 ', `${v} 次治療觸發`), bonus: (v) => pct('額外效果 ', v), cooldownSpeed: (v) => pct('技能冷卻速度提高 ', v),
    skillCrit: (v) => pct('此技能暴擊率提高 ', v), swordCrit: (v) => pct('劍類暴擊率提高 ', v), swordSpeed: (v) => pct('劍類攻速提高 ', v),
    axeDamage: (v) => pct('斧類傷害提高 ', v), axePenetration: (v) => pct('斧類護甲穿透提高 ', v), skillDamage: (v) => pct('技能傷害提高 ', v),
    armorBreak: (v) => pct('降低目標防禦 ', v), armorBreakDuration: (v) => seconds('破甲持續 ', v), hpCost: (v) => pct('消耗目前生命 ', v),
    killHeal: (v) => pct('擊殺恢復最大生命 ', v), belowHalfDamage: (v) => pct('生命低於 50% 時傷害提高 ', v), belowThirtyDamage: (v) => pct('生命低於 30% 時傷害提高 ', v),
    belowThirtyPenetration: (v) => pct('生命低於 30% 時護甲穿透提高 ', v), damageTiers: (v) => `生命低於 70%／50%／30% 時傷害提高 ${v.map(percent).join('／')}`,
    offhandAttackContribution: (v) => pct('副手雙手武器提供攻擊 ', v), offhandDamage: (v) => pct('副手傷害提高 ', v), offhandCrit: (v) => pct('副手暴擊率提高 ', v),
    dualTwoHandSpeed: (v) => pct('雙持雙手武器攻速提高 ', v), offhandChance: (v) => pct('追加副手攻擊機率 ', v),
    bleedingDamage: (v) => pct('對流血目標傷害提高 ', v), energyCost: (v) => text('消耗能量 ', v), damage: (v) => pct('標記增傷 ', v),
    killCooldownReduction: (v) => seconds('擊殺使冷卻縮短 ', v), criticalChance: (v) => pct('暴擊率提高 ', v), nextBasic: (v) => pct('強化下一次普攻 ', v),
    bleedingAttack: (v) => pct('攻擊流血目標傷害提高 ', v), bleedingAttackSpeed: (v) => pct('攻擊流血目標時攻速提高 ', v),
    poisonBonusPerStack: (v) => pct('每層中毒追加傷害 ', v), offhandPoisonThreshold: (v) => text('中毒達 ', `${v} 層時追加副手攻擊`),
    bleedTick: (v) => pct('每次流血傷害為攻擊力 ', v), bleedTickInterval: (v) => seconds('流血觸發間隔 ', v), bleedStacks: (v) => text('施加流血 ', `${v} 層`),
    poisonedBonusStacks: (v) => text('中毒目標額外施加流血 ', `${v} 層`), bloodDotDamage: (v) => pct('中毒與流血傷害提高 ', v),
    poisonMaxStacks: (v) => text('中毒上限 ', `${v} 層`), bleedMaxStacks: (v) => text('流血上限 ', `${v} 層`), dotDamage: (v) => pct('持續傷害提高 ', v),
    basicDamage: (v) => pct('普攻傷害提高 ', v), shootingCriticalDamage: (v) => pct('射擊技能暴擊傷害提高 ', v), nextBasicDamage: (v) => pct('下一次普攻傷害提高 ', v),
    petDamage: (v) => pct('戰寵傷害提高 ', v), petAttackSpeed: (v) => pct('戰寵攻速提高 ', v), bleedTick: (v) => pct('流血每跳傷害為攻擊力 ', v),
    petCrit: (v) => pct('戰寵暴擊率提高 ', v), maxPets: (v) => text('最多同時召喚 ', `${v} 隻戰寵`), guardChance: (v) => pct('戰寵護衛機率 ', v),
    guardIcd: (v) => seconds('護衛內建冷卻 ', v), guardUses: (v) => text('每隻戰寵可護衛 ', `${v} 次`), guardShare: (v) => pct('戰寵承擔傷害 ', v),
    resonanceDamage: (v) => pct('元素共鳴傷害提高 ', v), resonanceDuration: (v) => seconds('元素共鳴持續 ', v), resonanceCrit: (v) => pct('共鳴期間暴擊率提高 ', v),
    missiles: (v) => text('發射 ', `${v} 枚飛彈`), missilePower: (v) => pct('每枚飛彈傷害為攻擊力 ', v), markDuration: (v) => seconds('奧術印記持續 ', v),
    markMaxStacks: (v) => text('奧術印記上限 ', `${v} 層`), markManaDamage: (v) => pct('每層印記依最大魔力追加傷害 ', v), firstTargetMana: (v) => pct('首個目標依最大魔力追加傷害 ', v),
    extraTargetMana: (v) => pct('每個額外目標依最大魔力追加傷害 ', v), arcaneDamage: (v) => pct('奧術傷害提高 ', v), maxMana: (v) => pct('最大魔力提高 ', v),
    killMana: (v) => pct('擊殺恢復最大魔力 ', v), midHpBonus: (v) => pct('中血量目標額外治療 ', v), lowHpBonus: (v) => pct('低血量目標額外治療 ', v),
    tickHealPower: (v) => pct('每次治療為魔法攻擊 ', v), tickInterval: (v) => seconds('效果間隔 ', v), lowHpThreshold: (v) => pct('低血量判定 ', v),
    healingBonus: (v) => pct('低血量治療提高 ', v), effectiveHealingRatio: (v) => pct('有效治療轉為光能 ', v), thresholdPower: (v) => pct('觸發門檻為魔法攻擊 ', v),
    damageHealing: (v) => pct('造成傷害轉為治療 ', v), partyHealPerHit: (v) => pct('每命中一名敵人治療隊伍 ', v), magicDamagePerStack: (v) => pct('每層提高魔法傷害 ', v),
    maxStacks: (v) => text('最多疊加 ', `${v} 層`), directDamageHealing: (v) => pct('直接傷害轉為治療 ', v), breakthrough: (v) => text('Lv6 突破：', v)
  });

  const ignoredKeys = new Set(['element', 'randomElement', 'fireBurn', 'lightningParalysis', 'mastery', 'unlockTwoHandedOffhand', 'offhandFollowupChance', 'party', 'faith', 'resonance', 'cleanse', 'refresh', 'offhandProcs']);

  function format(job, skill, effect = {}) {
    const lead = skill?.detail && skill.detail !== skill.name ? skill.detail : '';
    const values = Object.entries(effect).filter(([, value]) => enabled(value)).map(([key, value]) => {
      if (formatters[key]) return formatters[key](value);
      if (ignoredKeys.has(key) && value === true) return null;
      return `其他效果（${key}）：${Array.isArray(value) ? value.join('／') : value}`;
    }).filter(Boolean);
    const body = values.join('；');
    if (lead && body) return `${lead} 目前等級：${body}。`;
    if (body) return `${body}。`;
    return lead || `${skill?.name || '此技能'}目前沒有可顯示的數值效果。`;
  }

  return Object.freeze({ format });
}));
