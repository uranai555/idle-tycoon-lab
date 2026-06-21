import type { GameState } from './types';
import { calculateIncomePerSecond } from './economy';
import type { ThemeConfig } from './types';

export type GameLoopCallbacks = {
  onTick: (state: GameState) => void;
  onMilestoneUnlock: (milestoneId: string, theme: ThemeConfig) => void;
  onPopup: (text: string) => void;
};

const UI_INTERVAL_MS = 100; // ~10fps for React updates

export class GameLoop {
  private animFrameId: number | null = null;
  private lastTimestamp = 0;
  private accumulatedTime = 0;
  private uiAccumulated = 0;
  private readonly TICK_MS = 1000 / 60;

  state: GameState;
  theme: ThemeConfig;
  upgradeMultipliers: Record<string, number> = {};
  private callbacks: GameLoopCallbacks;
  private running = false;

  private incomeDirty = true;
  private cachedIncome = 0;
  private unlockedSet: Set<string>;

  constructor(initialState: GameState, theme: ThemeConfig, callbacks: GameLoopCallbacks) {
    this.state = { ...initialState };
    this.theme = theme;
    this.callbacks = callbacks;
    this.unlockedSet = new Set(initialState.milestonesUnlocked);
  }

  markIncomeDirty(): void {
    this.incomeDirty = true;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.tick(this.lastTimestamp);
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private tick = (timestamp: number): void => {
    if (!this.running) return;

    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.accumulatedTime += delta;
    this.uiAccumulated += delta;

    while (this.accumulatedTime >= this.TICK_MS) {
      this.accumulatedTime -= this.TICK_MS;
      this.logicTick();
    }

    if (this.uiAccumulated >= UI_INTERVAL_MS) {
      this.uiAccumulated = 0;
      this.callbacks.onTick({
        ...this.state,
        milestonesUnlocked: [...this.state.milestonesUnlocked],
        producers: { ...this.state.producers },
        upgrades: { ...this.state.upgrades },
      });
    }

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  private logicTick(): void {
    this.state.elapsedMs += this.TICK_MS;

    if (this.incomeDirty) {
      this.cachedIncome = calculateIncomePerSecond(
        this.state.producers,
        this.theme.producers,
        this.upgradeMultipliers
      );
      this.incomeDirty = false;
    }
    this.state.incomePerSecond = this.cachedIncome;
    this.state.coins += this.cachedIncome * (this.TICK_MS / 1000);

    for (const milestone of this.theme.milestones) {
      if (!this.unlockedSet.has(milestone.id)) {
        if (this.state.coins >= milestone.condition.coins) {
          this.unlockedSet.add(milestone.id);
          this.state.milestonesUnlocked.push(milestone.id);
          this.callbacks.onMilestoneUnlock(milestone.id, this.theme);
          this.callbacks.onPopup(`🏆 ${milestone.title}`);
        }
      }
    }

    const newLevel = Math.max(1, Math.floor(Math.log10(Math.max(1, this.state.coins))) + 1);
    if (newLevel > this.state.level) {
      this.state.level = newLevel;
    }
  }

  applyScenarioStep(action: string, payload: Record<string, unknown>): void {
    switch (action) {
      case 'addCoins': {
        const amount = (payload.amount as number) ?? 100;
        this.state.coins += amount;
        this.callbacks.onPopup(`+${amount}💰`);
        break;
      }
      case 'buyUpgrade': {
        const upgradeId = payload.upgradeId as string;
        if (upgradeId && !this.state.upgrades[upgradeId]?.purchased) {
          this.state.upgrades[upgradeId] = { id: upgradeId, purchased: true };
          const upgrade = this.theme.upgrades.find(u => u.id === upgradeId);
          if (upgrade) {
            this.upgradeMultipliers[upgrade.targetProducerId] =
              (this.upgradeMultipliers[upgrade.targetProducerId] ?? 1) * upgrade.effect;
            this.incomeDirty = true;
          }
          const upgradeName = this.theme.upgrades.find(u => u.id === upgradeId)?.name ?? upgradeId;
          this.callbacks.onPopup(`⬆️ ${upgradeName}`);
        }
        break;
      }
      case 'unlockMilestone': {
        const msId = payload.milestoneId as string;
        if (msId && !this.unlockedSet.has(msId)) {
          this.unlockedSet.add(msId);
          this.state.milestonesUnlocked.push(msId);
          const ms = this.theme.milestones.find(m => m.id === msId);
          if (ms) {
            this.callbacks.onPopup(`🏆 ${ms.title}`);
            this.callbacks.onMilestoneUnlock(msId, this.theme);
          }
        }
        break;
      }
      case 'changeScene': {
        break;
      }
      case 'showPopup': {
        const text = payload.text as string;
        if (text) this.callbacks.onPopup(text);
        break;
      }
    }
  }

  setCoins(amount: number): void {
    this.state.coins = amount;
  }
}
