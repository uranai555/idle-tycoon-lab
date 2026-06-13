import type { GameState } from './types';
import { calculateIncomePerSecond } from './economy';
import type { ThemeConfig } from './types';

export type GameLoopCallbacks = {
  onTick: (state: GameState) => void;
  onMilestoneUnlock: (milestoneId: string, theme: ThemeConfig) => void;
  onPopup: (text: string) => void;
};

export class GameLoop {
  private animFrameId: number | null = null;
  private lastTimestamp = 0;
  private accumulatedTime = 0;
  private readonly TICK_MS = 1000 / 60; // ~60fps logic ticks

  state: GameState;
  theme: ThemeConfig;
  upgradeMultipliers: Record<string, number> = {};
  private callbacks: GameLoopCallbacks;
  private running = false;

  constructor(initialState: GameState, theme: ThemeConfig, callbacks: GameLoopCallbacks) {
    this.state = { ...initialState };
    this.theme = theme;
    this.callbacks = callbacks;
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

    while (this.accumulatedTime >= this.TICK_MS) {
      this.accumulatedTime -= this.TICK_MS;
      this.logicTick();
    }

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  private logicTick(): void {
    // Update elapsed time
    this.state.elapsedMs += this.TICK_MS;

    // Calculate and apply income
    const ips = calculateIncomePerSecond(
      this.state.producers,
      this.theme.producers,
      this.upgradeMultipliers
    );
    this.state.incomePerSecond = ips;
    this.state.coins += ips / 60;

    // Check milestones
    for (const milestone of this.theme.milestones) {
      if (!this.state.milestonesUnlocked.includes(milestone.id)) {
        if (this.state.coins >= milestone.condition.coins) {
          this.state.milestonesUnlocked.push(milestone.id);
          this.callbacks.onMilestoneUnlock(milestone.id, this.theme);
          this.callbacks.onPopup(`🏆 ${milestone.title}`);
        }
      }
    }

    // Level up check (every 10x coins milestone roughly)
    const newLevel = Math.max(1, Math.floor(Math.log10(Math.max(1, this.state.coins))) + 1);
    if (newLevel > this.state.level) {
      this.state.level = newLevel;
    }

    // Notify tick
    this.callbacks.onTick({ ...this.state });
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
          // Update multiplier
          const upgrade = this.theme.upgrades.find(u => u.id === upgradeId);
          if (upgrade) {
            this.upgradeMultipliers[upgrade.targetProducerId] =
              (this.upgradeMultipliers[upgrade.targetProducerId] ?? 1) * upgrade.effect;
          }
          const upgradeName = this.theme.upgrades.find(u => u.id === upgradeId)?.name ?? upgradeId;
          this.callbacks.onPopup(`⬆️ ${upgradeName}`);
        }
        break;
      }
      case 'unlockMilestone': {
        const msId = payload.milestoneId as string;
        if (msId && !this.state.milestonesUnlocked.includes(msId)) {
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
        // Visual state change — handled by UI via milestone unlock
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