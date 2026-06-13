import type { UpgradeConfig, GameState } from './types';

export function canBuyUpgrade(
  upgrade: UpgradeConfig,
  state: GameState
): boolean {
  return state.coins >= upgrade.cost && !state.upgrades[upgrade.id]?.purchased;
}

export function buyUpgrade(
  state: GameState,
  upgrade: UpgradeConfig
): { success: boolean; newState: GameState; multiplierDelta: number } {
  if (!canBuyUpgrade(upgrade, state)) {
    return { success: false, newState: state, multiplierDelta: 0 };
  }

  const newUpgrades = { ...state.upgrades };
  newUpgrades[upgrade.id] = { id: upgrade.id, purchased: true };

  return {
    success: true,
    newState: {
      ...state,
      coins: state.coins - upgrade.cost,
      upgrades: newUpgrades,
    },
    multiplierDelta: upgrade.effect,
  };
}