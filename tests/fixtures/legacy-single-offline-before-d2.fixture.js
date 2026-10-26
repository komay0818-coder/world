function baselineSingleOfflineRewards() {
  if (getPermanentPartyRuntime()) return null; // Stage B isolated online integration: no new offline rewards.
  if (isOfflinePartyFoundationPreview()) return resumeOfflinePartyPreview();
  const character = getActiveCharacter();
  if (!character) return null;
  const progress = getProgress();
  const now = Date.now();
  const lastActiveAt = Number(progress.lastActiveAt || now);
  const offlineMs = Math.min(offlineLimitMs, Math.max(0, now - lastActiveAt));
  progress.lastActiveAt = now;
  if (offlineMs < offlineMinimumMs) {
    saveProgress(progress);
    return null;
  }

  const stats = getCharacterStats(progress.level, progress, character);
  const activeMap = getActiveMap(progress);
  const attackProfile = getPlayerAttackProfile(character);
  const savedHp = Number(progress.partyMemberState?.currentHp);
  const offlineMonsters = getOfflineCombatMonsters(activeMap, progress.level);
  const simulation = OfflineCombatPolicy.simulate({
    durationMs: offlineMs,
    player: {
      maxHp: stats.hp,
      currentHp: Number.isFinite(savedHp) ? Math.max(0, Math.min(stats.hp, savedHp)) : stats.hp,
      attack: stats.attack,
      defense: Math.round(stats.defense * ChapterThreeSpecialEquipmentPolicy.getDefenseMultiplier(getMainBattleMember(), now)),
      damageReduction: stats.damageReduction,
      attackSpeed: stats.attackSpeed,
      hpRegeneration: stats.hpRegeneration,
      healingPotions: progress.potions,
      ...attackProfile
    },
    monsters: offlineMonsters
  });
  const defeated = simulation.defeated;
  let gainedXp = 0;
  let levelsGained = 0;
  let equipmentFound = 0;
  for (let kill = 0; kill < defeated; kill += 1) {
    const gained = MapExpPolicy.calculate(activeMap.normalXp, progress.level, activeMap).actualExp;
    progress.xp += gained;
    gainedXp += gained;
    while (progress.level < 30 && progress.xp >= requiredXp(progress.level)) {
      progress.xp -= requiredXp(progress.level);
      progress.level += 1;
      levelsGained += 1;
    }
    if (progress.level >= 30) {
      progress.level = 30;
      progress.xp = Math.min(progress.xp, requiredXp(30));
    }
    ChapterOneProgressionPolicy.recordNormalKill(progress, activeMap.id);
    const defeatedMonster = offlineMonsters[kill % offlineMonsters.length];
    if (defeatedMonster) {
      grantCraftingMaterialDrops(progress, activeMap, defeatedMonster);
      if (grantChapterThreeSpecialEquipmentDrop(progress, activeMap, defeatedMonster)) equipmentFound += 1;
    }
  }
  const gainedGold = defeated * 2;
  progress.gold += gainedGold;
  const potionsUsed = Math.min(progress.potions, simulation.potionsUsed || 0);
  progress.potions -= potionsUsed;
  for (let potion = 0; potion < potionsUsed; potion += 1) removePotionItem(progress);
  const finalStats = getCharacterStats(progress.level, progress, character);
  progress.partyMemberState = {
    ...(progress.partyMemberState || {}),
    currentHp: simulation.died ? finalStats.hp : Math.max(1, Math.min(finalStats.hp, simulation.remainingHp)),
    maxHp: finalStats.hp
  };
  if (simulation.died) {
    if (activeMap.dungeon) {
      progress.selectedMapId = progress.dungeonReturnMapId || (activeMap.id === 'black-forest-altar' ? 'black-forest' : 'plains-entrance');
      progress.dungeonAdmission = false;
    }
    progress.requiresMapSelectionAfterDefeat = true;
  }
  saveProgress(progress);
  pendingOfflineReport = { duration: formatOfflineDuration(simulation.effectiveMs), offlineDuration: formatOfflineDuration(offlineMs), defeated, gainedXp, gainedGold, levelsGained, equipmentFound, capped: now - lastActiveAt > offlineLimitMs, potionsUsed, died: simulation.died };
  if (simulation.died) {
    openVillage('menu');
    showToast(`角色在離線戰鬥中戰敗，本次掛機已結束。有效掛機時間：${pendingOfflineReport.duration}`);
  } else showToast(`離線掛機 ${pendingOfflineReport.duration}：獲得 ${gainedXp} EXP、${gainedGold} 金幣`);
  return pendingOfflineReport;
}
