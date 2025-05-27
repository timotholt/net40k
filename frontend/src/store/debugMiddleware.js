const debugMiddleware = (store) => (next) => (action) => {
  // Skip logging for certain high-frequency actions
  const skipLogging = [
    'game/updateGameState',
    'game/updatePlayerState',
    'game/updateGameList',
    'game/updateGameTime',
    'game/updatePlayerPosition',
    'game/updateCameraPosition',
    'game/updateFPS',
    'game/updatePing',
    'game/updateLatency',
    'game/updateNetworkStats',
    'game/updateEntityPosition',
    'game/updateEntityState',
    'game/updateEntityAnimation',
    'game/updateEntityStats',
    'game/updateEntityInventory',
    'game/updateEntityEquipment',
    'game/updateEntityEffects',
    'game/updateEntityCooldowns',
    'game/updateEntityTarget',
    'game/updateEntityTargetOf',
    'game/updateEntityAggro',
    'game/updateEntityCombat',
    'game/updateEntityMovement',
    'game/updateEntityPathing',
    'game/updateEntityAI',
    'game/updateEntityDialog',
    'game/updateEntityQuest',
    'game/updateEntityReputation',
    'game/updateEntityFaction',
    'game/updateEntityGuild',
    'game/updateEntityParty',
    'game/updateEntityRaid',
    'game/updateEntityGroup',
    'game/updateEntitySocial',
    'game/updateEntityTrade',
    'game/updateEntityMail',
    'game/updateEntityAuction',
    'game/updateEntityBank',
    'game/updateEntityVoidStorage',
    'game/updateEntityTransmogrify',
    'game/updateEntityCollection',
    'game/updateEntityAchievement',
    'game/updateEntityPet',
    'game/updateEntityMount',
    'game/updateEntityToy',
    'game/updateEntityHeirloom',
    'game/updateEntityTransmog',
    'game/updateEntityCurrency',
    'game/updateEntityReputation',
    'game/updateEntityQuest',
    'game/updateEntitySpell',
    'game/updateEntityTalent',
    'game/updateEntityGlyph',
    'game/updateEntityAura',
    'game/updateEntityBuff',
    'game/updateEntityDebuff',
    'game/updateEntityCooldown',
    'game/updateEntityGCD',
    'game/updateEntitySwing',
    'game/updateEntityCast',
    'game/updateEntityChannel',
    'game/updateEntityPower',
    'game/updateEntityHealth',
    'game/updateEntityMana',
    'game/updateEntityEnergy',
    'game/updateEntityRage',
    'game/updateEntityFocus',
    'game/updateEntityRunicPower',
    'game/updateEntitySoulShards',
    'game/updateEntityLunarPower',
    'game/updateEntityHolyPower',
    'game/updateEntityMaelstrom',
    'game/updateEntityInsanity',
    'game/updateEntityFury',
    'game/updateEntityPain',
    'game/updateEntityEssence',
    'game/updateEntityRage',
    'game/updateEntityComboPoints',
    'game/updateEntityChi',
    'game/updateEntitySoulShards',
    'game/updateEntityRunes',
    'game/updateEntityRunicPower',
    'game/updateEntityAstralPower',
    'game/updateEntityLunarPower',
    'game/updateEntityHolyPower',
    'game/updateEntityMaelstrom',
    'game/updateEntityInsanity',
    'game/updateEntityFury',
    'game/updateEntityPain',
    'game/updateEntityEssence',
    'game/updateEntityRage',
    'game/updateEntityComboPoints',
    'game/updateEntityChi',
    'game/updateEntitySoulShards',
    'game/updateEntityRunes',
    'game/updateEntityRunicPower',
    'game/updateEntityAstralPower',
    'game/updateEntityLunarPower',
    'game/updateEntityHolyPower',
    'game/updateEntityMaelstrom',
    'game/updateEntityInsanity',
    'game/updateEntityFury',
    'game/updateEntityPain',
    'game/updateEntityEssence'
  ];

  const shouldLog = !skipLogging.some(pattern => action.type.includes(pattern));

  if (shouldLog) {
    console.group(`ACTION: ${action.type}`);
    console.log('Action:', action);
    console.log('State before:', store.getState().auth);
  }

  // Call the next dispatch method in the middleware chain
  const result = next(action);

  if (shouldLog) {
    console.log('State after:', store.getState().auth);
    console.groupEnd();
  }

  return result;
};

export default debugMiddleware;
