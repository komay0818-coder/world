(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ClassSkillPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const skill = (level, type, id, name, cooldown, levels, extra = {}) => Object.freeze({
    level, type, id, name, cooldown: cooldown || 0, levels: Object.freeze(levels.map(Object.freeze)), ...extra
  });
  const passive = (level, id, name, levels) => skill(level, 'passive', id, name, 0, levels);
  const active = (level, id, name, cooldown, levels, extra) => skill(level, 'active', id, name, cooldown, levels, extra);

  const SKILLS = Object.freeze({
    warrior: Object.freeze([
      active(1, 'heavy-strike', '重擊', 4, [
        { power: 1.6, stun: 1 }, { power: 1.75, stun: 1 }, { power: 1.9, stun: 1.2 },
        { power: 2.05, stun: 1.2 }, { power: 2.25, stun: 1.5 },
        { power: 2.5, stun: 1.5, controlledBonus: .3, breakthrough: '對受控目標額外造成 30% 傷害' }
      ]),
      passive(3, 'iron-will', '鋼鐵意志', [5, 6, 7, 8, 10, 12].map((reduction, i) => ({ reduction: reduction / 100, controlResistance: i === 5 ? .2 : 0 }))),
      active(5, 'whirlwind', '旋風斬', 7, [
        { power: .7, targets: 5 }, { power: .8, targets: 5 }, { power: .9, targets: 5 },
        { power: 1, targets: 5 }, { power: 1.15, targets: 5 },
        { power: 1.3, targets: 6, perExtraTargetBonus: .05, maxTargetBonus: .25, breakthrough: '每多命中 1 名敵人，本次傷害 +5%' }
      ], { targets: 5 }),
      passive(8, 'robust-body', '強健體魄', [5, 8, 11, 14, 17, 20].map((hp, i) => ({ maxHp: hp / 100, healingReceived: i === 5 ? .1 : 0 }))),
      active(10, 'charge', '衝鋒', 9, [
        { power: 1.2, attackSpeed: .1, duration: 3 }, { power: 1.35, attackSpeed: .1, duration: 3 },
        { power: 1.5, attackSpeed: .12, duration: 3 }, { power: 1.65, attackSpeed: .15, duration: 3 },
        { power: 1.8, attackSpeed: .15, duration: 4 }, { power: 2, attackSpeed: .2, basicDamage: .15, duration: 5, breakthrough: '獲得戰意：攻速 +20%、普攻傷害 +15%' }
      ]),
      passive(15, 'weapon-mastery', '武器專精', [4, 6, 8, 10, 12, 15].map((damage, i) => ({ weaponDamage: damage / 100, criticalDamage: i === 5 ? .1 : 0 }))),
      passive(20, 'parry', '招架', [
        { parry: .05, counterPower: .6 }, { parry: .06, counterPower: .7 }, { parry: .07, counterPower: .8 },
        { parry: .08, counterPower: .9 }, { parry: .09, counterPower: 1 }, { parry: .1, counterPower: 1.5, breakthrough: '成功招架後立即反擊' }
      ])
    ]),
    hunter: Object.freeze([
      active(1, 'power-shot', '強力射擊', 4, [
        { power: 1.6, slow: .2, duration: 3 }, { power: 1.75, slow: .2, duration: 3 }, { power: 1.75, slow: .25, duration: 3 },
        { power: 1.9, slow: .25, duration: 3 }, { power: 2, slow: .25, duration: 3, slowedBonus: .15 },
        { power: 2.2, mark: .15, duration: 6, breakthrough: '獵殺標記 6 秒：獵人與寵物造成傷害 +15%' }
      ], { arrowCost: 1 }),
      passive(3, 'precision-shot', '精準射擊', [3, 4, 5, 6, 8, 10].map((crit, i) => ({ crit: crit / 100, criticalDamage: i === 5 ? .2 : 0 }))),
      active(5, 'multi-shot', '多重射擊', 7, [
        { power: .75, targets: 3 }, { power: .85, targets: 3 }, { power: .85, targets: 4 }, { power: .95, targets: 4 },
        { power: 1.05, targets: 4, nextBasicPerTarget: .05, maxNextBasic: .2 },
        { power: 1.15, targets: 5, nextBasicPerTarget: .05, maxNextBasic: .2, killCooldownReduction: .5, maxCooldownReduction: 2, breakthrough: '每擊殺 1 名敵人，剩餘冷卻 -0.5 秒' }
      ], { arrowCost: 3, targets: 5 }),
      passive(8, 'wild-bond', '野性羈絆', [
        { companionAttack: .25 }, { companionAttack: .3 }, { companionAttack: .3, companionSpeed: .1 },
        { companionAttack: .35, companionSpeed: .1 }, { companionAttack: .4, beastSlam: 1.8 },
        { companionAttack: .45, beastSlam: 2.2, nextHunterAttack: .25, breakthrough: '強化野獸猛擊並強化獵人下一次攻擊' }
      ]),
      active(10, 'piercing-shot', '穿透射擊', 9, [
        { power: 1.3, targets: 3 }, { power: 1.45, targets: 3 }, { power: 1.45, targets: 3, armorIgnore: .1 },
        { power: 1.6, targets: 3, armorIgnore: .1 }, { power: 1.75, targets: 3, armorIgnore: .2 },
        { power: 2, targets: 4, armorIgnore: .2, singleTargetBonus: .25, breakthrough: '單一目標時最終傷害 +25%' }
      ], { arrowCost: 2, targets: 4 }),
      passive(15, 'quick-reload', '快速裝填', [3, 5, 7, 9, 12, 15].map((speed, i) => ({ attackSpeed: speed / 100, basicArrowRecoveryChance: i === 5 ? .2 : 0 }))),
      passive(20, 'hunting-instinct', '獵殺本能', [1.4, 1.5, 1.6, 1.75, 2, 2.5].map((power, i) => ({ interval: 6, power, guaranteedCrit: i === 5, cooldownReduction: i === 5 ? 1 : 0 })))
    ]),
    assassin: Object.freeze([
      active(1, 'backstab', '背刺', 4, [{ power: 1.8 }, { power: 1.95 }, { power: 1.95, bleedingCrit: .1 }, { power: 1.95, bleedBonus: .25 }, { power: 1.95, critBleedDuration: 2 }, { power: 2.3, bleedTrigger: .5, breakthrough: '攻擊已流血目標時額外觸發 50% 流血傷害' }]),
      passive(3, 'deadly-strike', '致命一擊', [{ crit: .1 }, { crit: .1, criticalDamage: .1 }, { crit: .1, critSpeed: .05 }, { crit: .1, critSpeed: .08 }, { crit: .1, critSpeed: .08, refresh: true }, { crit: .1, critSpeed: .15, duration: 4, refresh: true, breakthrough: '暴擊後攻速 +15%，可持續刷新' }]),
      active(5, 'shadow-dance', '影刃旋舞', 7, [{ power: .75, targets: 5 }, { power: .85, targets: 5 }, { power: .85, targets: 5, speedPerTarget: .03 }, { power: .85, targets: 5, cooldown: 6, speedPerTarget: .03 }, { power: .85, targets: 5, offhandChance: .2 }, { power: 1.1, targets: 5, offhandChance: .2, offhandPerTarget: .05, breakthrough: '敵人越多，追加副手攻擊機率越高' }], { targets: 5 }),
      passive(8, 'evasion', '閃避', [{ dodge: .1 }, { dodge: .1, nextDamage: .1 }, { dodge: .1, speed: .1 }, { dodge: .15, speed: .1 }, { dodge: .15, guaranteedCrit: true }, { dodge: .15, counterPower: .5, breakthrough: '閃避後立即進行暗影反擊' }]),
      active(10, 'poison-blade', '毒刃', 9, [{ power: 1.25, poisonStacks: 1 }, { power: 1.25, poisonBonus: .2, poisonStacks: 1 }, { power: 1.25, poisonBonus: .2, poisonDuration: 2, poisonStacks: 1 }, { power: 1.25, poisonedDamage: .08, poisonStacks: 1 }, { power: 1.25, poisonedDamage: .08, poisonStacks: 2 }, { power: 1.25, poisonedDamage: .08, poisonStacks: 3, defensePerStack: .03, breakthrough: '中毒可疊 3 層，每層降低 3% 防禦' }]),
      passive(15, 'dagger-mastery', '匕首專精', [{ weaponDamage: .1 }, { weaponDamage: .1, offhandDamage: .1 }, { weaponDamage: .1, offhandDamage: .1, offhandCrit: .05 }, { weaponDamage: .1, offhandDamage: .1, offhandCrit: .05, attackSpeed: .08 }, { weaponDamage: .1, offhandDamage: .1, offhandCrit: .05, attackSpeed: .08, offhandProcs: true }, { weaponDamage: .1, offhandDamage: .1, offhandCrit: .05, attackSpeed: .08, offhandProcs: true, offhandChance: .2, breakthrough: '主手普攻可追加一次副手攻擊' }]),
      passive(20, 'desperate-counter', '絕境反擊', [{ attack: .1, speed: .05 }, { attack: .1, speed: .05, crit: .05 }, { attack: .1, speed: .05, crit: .05, entryDodge: .2 }, { attack: .15, speed: .1, crit: .05, entryDodge: .2 }, { attack: .15, speed: .1, crit: .05, entryDodge: .2, killHeal: .05 }, { attack: .25, speed: .15, crit: .05, entryDodge: .4, entryDuration: 2, breakthrough: '低血時大幅提升攻擊與攻速' }])
    ]),
    mage: Object.freeze([
      active(1, 'fireball', '火球術', 4, [{ power: 1.7 }, { power: 1.85 }, { power: 1.85, burnBonus: .2 }, { power: 2, burnBonus: .2 }, { power: 2, burnBonus: .2, burnDuration: 2 }, { power: 2.2, explosionPower: .8, explosionTargets: 3, breakthrough: '命中後爆炸，對附近 3 名敵人造成 80% 傷害' }]),
      passive(3, 'mana-amplification', '魔力增幅', [5, 7, 9, 11, 13, 15].map((magicDamage, i) => ({ magicDamage: magicDamage / 100, skillCriticalDamage: i === 5 ? .1 : 0 }))),
      active(5, 'blizzard', '暴風雪', 7, [{ power: .8, targets: 5 }, { power: .85, targets: 5 }, { power: .85, targets: 5, slow: .15 }, { power: .9, targets: 5, slow: .15 }, { power: .9, targets: 5, slow: .25 }, { power: 1, targets: 5, slow: .25, freezeChance: .2, freezeDuration: 1.5, breakthrough: '20% 機率冰凍敵人 1.5 秒' }], { targets: 5 }),
      passive(8, 'blink', '閃現', [{ chance: .05, invulnerable: 1 }, { chance: .06, invulnerable: 1 }, { chance: .07, invulnerable: 1 }, { chance: .08, invulnerable: 1 }, { chance: .1, invulnerable: 1.5 }, { chance: .1, invulnerable: 2, nextCooldownReduction: .3, internalCooldown: 10, breakthrough: '閃現後下一個技能冷卻 -30%' }]),
      active(10, 'chain-lightning', '閃電鏈', 9, [{ power: 1.3, targets: 4 }, { power: 1.4, targets: 4 }, { power: 1.4, targets: 5 }, { power: 1.5, targets: 5 }, { power: 1.5, targets: 5, enhancedParalysis: true }, { power: 1.6, targets: 5, bounceBonus: .05, breakthrough: '每次彈射傷害 +5%' }], { targets: 5 }),
      passive(15, 'elemental-mastery', '元素精通', [4, 6, 8, 10, 12, 12].map((elementDamage, i) => ({ elementDamage: elementDamage / 100, resonance: i === 5 }))),
      passive(20, 'mana-shield', '魔力護盾', [10, 12, 14, 16, 20, 20].map((shield, i) => ({ shield: shield / 100, damageReduction: i === 5 ? .1 : 0, manaCost: .15, internalCooldown: 20 })))
    ]),
    priest: Object.freeze([
      active(1, 'holy-light', '神聖之光', 4, [{ power: 1.7, attackDown: .1, duration: 4 }, { power: 1.8, attackDown: .1, duration: 4 }, { power: 1.8, attackDown: .12, duration: 4 }, { power: 1.9, attackDown: .12, duration: 4 }, { power: 2, attackDown: .12, duration: 6 }, { power: 2.1, attackDown: .15, duration: 6, magicVulnerability: .1, vulnerabilityDuration: 5, breakthrough: '目標受到的魔法傷害 +10%' }]),
      passive(3, 'holy-faith', '神聖信仰', [4, 6, 8, 10, 12, 15].map((bonus, i) => ({ magicDamage: bonus / 100, healing: bonus / 100, faith: i === 5 }))),
      active(5, 'holy-nova', '神聖新星', 7, [{ power: .8, targets: 5 }, { power: .85, targets: 5 }, { power: .85, targets: 5, selfHealPerTarget: .01 }, { power: .9, targets: 5, selfHealPerTarget: .01 }, { power: .95, targets: 5, selfHealPerTarget: .01, cooldown: 6 }, { power: 1.05, targets: 5, selfHealPerTarget: .015, cooldown: 6, shieldAtTargets: 3, shield: .1, breakthrough: '命中 3 名以上敵人時獲得 10% 生命護盾' }], { targets: 5 }),
      passive(8, 'holy-protection', '神聖庇護', [10, 12, 14, 16, 18, 22].map((shield, i) => ({ shield: shield / 100, cooldown: [22,22,21,21,20,18][i], cleanse: i === 5 }))),
      active(10, 'heal', '治癒術', 9, [{ healPower: 1.5 }, { healPower: 1.65 }, { healPower: 1.75, overhealShield: .5 }, { healPower: 1.9, overhealShield: .5 }, { healPower: 2.05, overhealShield: .5, cooldown: 8 }, { healPower: 2.2, overhealShield: .6, cooldown: 8, afterglow: .2, breakthrough: '3 秒後額外恢復實際治療量 20%' }]),
      passive(15, 'divine-grace', '神恩', [{ count: 5, bonus: .15 }, { count: 5, bonus: .2 }, { count: 4, bonus: .2 }, { count: 4, bonus: .25 }, { count: 4, bonus: .3 }, { count: 4, bonus: .35, spread: .15, maxAllies: 3, breakthrough: '神恩觸發時治療其他隊友' }]),
      passive(20, 'light-grace', '聖光恩典', [4, 5, 6, 7, 8, 10].map((speed, i) => ({ attackSpeed: speed / 100, duration: [3,3,4,4,5,5][i], party: i === 5, cooldownSpeed: i === 5 ? .05 : 0 })))
    ])
  });

  function getSkills(job) { return SKILLS[job] || []; }
  function getSkill(job, id) { return getSkills(job).find((entry) => entry.id === id) || null; }
  function getEffect(job, id, level) {
    const definition = getSkill(job, id);
    if (!definition) return null;
    return definition.levels[Math.max(1, Math.min(6, Number(level) || 1)) - 1];
  }
  function getSpecialization(skillLevels, job, type) {
    return getSkills(job).find((entry) => entry.type === type && Number(skillLevels?.[`${job}:${entry.id}`]) >= 6) || null;
  }
  function canSpecialize(skillLevels, job, id) {
    const definition = getSkill(job, id);
    if (!definition) return { ok: false, reason: 'unknown-skill' };
    const occupied = getSpecialization(skillLevels, job, definition.type);
    return occupied && occupied.id !== id
      ? { ok: false, reason: 'specialization-occupied', occupied }
      : { ok: true, reason: '', occupied };
  }
  function normalizeSkillLevels(skillLevels) {
    const normalized = { ...(skillLevels && typeof skillLevels === 'object' ? skillLevels : {}) };
    Object.keys(SKILLS).forEach((job) => ['active', 'passive'].forEach((type) => {
      let kept = false;
      getSkills(job).filter((entry) => entry.type === type).forEach((entry) => {
        const key = `${job}:${entry.id}`;
        const level = Math.max(1, Math.min(6, Number(normalized[key]) || 1));
        normalized[key] = level === 6 && kept ? 5 : level;
        if (level === 6 && !kept) kept = true;
      });
    }));
    return normalized;
  }

  return Object.freeze({ FIRST_JOB_CHANGE_LEVEL: 45, MAX_SKILL_LEVEL: 6, SKILLS, getSkills, getSkill, getEffect, getSpecialization, canSpecialize, normalizeSkillLevels });
}));
