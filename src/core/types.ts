// 放置タイクーン 共通型定義
export type ProducerState = {
  id: string;
  count: number;
};

export type UpgradeState = {
  id: string;
  purchased: boolean;
};

export type GameState = {
  themeId: 'ai_secretary' | 'junk_repair' | 'pet_room';
  coins: number;
  incomePerSecond: number;
  level: number;
  elapsedMs: number;
  producers: Record<string, ProducerState>;
  upgrades: Record<string, UpgradeState>;
  milestonesUnlocked: string[];
  scenarioActive: boolean;
  scenarioDone: boolean;
};

export type ProducerConfig = {
  id: string;
  name: string;
  baseIncome: number;
  baseCost: number;
  icon: string;
  description: string;
};

export type UpgradeConfig = {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: number; // 倍率
  targetProducerId: string;
};

export type MilestoneConfig = {
  id: string;
  condition: { coins: number };
  visualState: string;
  title: string;
  description: string;
};

export type ScenarioStep = {
  atMs: number;
  action: 'addCoins' | 'buyUpgrade' | 'showPopup' | 'unlockMilestone' | 'changeScene';
  payload: Record<string, unknown>;
};

export type ThemeConfig = {
  id: string;
  title: string;
  hookText: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  producers: ProducerConfig[];
  upgrades: UpgradeConfig[];
  milestones: MilestoneConfig[];
  scenario: ScenarioStep[];
  labels: Record<string, string>;
};

export function createInitialState(themeId: GameState['themeId']): GameState {
  return {
    themeId,
    coins: 0,
    incomePerSecond: 0,
    level: 1,
    elapsedMs: 0,
    producers: {},
    upgrades: {},
    milestonesUnlocked: [],
    scenarioActive: false,
    scenarioDone: false,
  };
}

export function formatCoins(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString();
}