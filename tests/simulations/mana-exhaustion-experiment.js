// TEST ONLY. Preserve incoming damage/low-HP triggers; prevent death at 1 HP.
function createExperiment(enabled) {
  return {
    initialize(p) {
      p.exhaustionExperiment = true;
      p.manaExhausted = false;
      p.testSkillCasts = p.testBasics = p.exhaustedSeconds = p.exhaustionEntries = p.preventedDeaths = 0;
      p.minimumResource = p.resource;
      let hp = p.hp;
      Object.defineProperty(p, 'hp', { enumerable: true, configurable: true,
        get() { return hp; }, set(value) { if (value < 1) p.preventedDeaths++; hp = Math.max(1, value); } });
    },
    update(p, dt) {
      p.minimumResource = Math.min(p.minimumResource, p.resource);
      if (enabled && ['mage', 'priest'].includes(p.job)) {
        if (!p.manaExhausted && p.resource / p.resourceMax <= .15) { p.manaExhausted = true; p.exhaustionEntries++; }
        else if (p.manaExhausted && p.resource / p.resourceMax >= .45) p.manaExhausted = false;
      }
      if (p.manaExhausted) p.exhaustedSeconds += dt;
    }
  };
}
module.exports = { createExperiment };
