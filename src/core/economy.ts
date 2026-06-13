import type { ProducerConfig, GameState } from './types';

export function calculateIncomePerSecond(
  producers: Record<string, { count: number }>,
  producerConfigs: ProducerConfig[],
  upgradeMultipliers: Record<string, number>
): number {
  let total = 0;
  for (const config of producerConfigs) {
    const prod = producers[config.id];
    const count = prod?.count ?? 0;
    const multiplier = upgradeMultipliers[config.id] ?? 1;
    total += config.baseIncome * count * multiplier;
  }
  return total;
}

export function getBuyCost(config: ProducerConfig, currentCount: number): number {
  return Math.floor(config.baseCost * Math.pow(1.15, currentCount));
}

export function canAfford(cost: number, coins: number): boolean {
  return coins >= cost;
}

export function buyProducer(
  state: GameState,
  config: ProducerConfig
): { success: boolean; newState: GameState } {
  const currentCount = state.producers[config.id]?.count ?? 0;
  const cost = getBuyCost(config, currentCount);
  if (!canAfford(cost, state.coins)) return { success: false, newState: state };

  const newProducers = { ...state.producers };
  newProducers[config.id] = {
    id: config.id,
    count: currentCount + 1,
  };

  return {
    success: true,
    newState: {
      ...state,
      coins: state.coins - cost,
      producers: newProducers,
    },
  };
}