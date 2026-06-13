import type { MilestoneConfig, GameState } from './types';

export function checkMilestones(
  state: GameState,
  milestones: MilestoneConfig[]
): MilestoneConfig[] {
  const newlyUnlocked: MilestoneConfig[] = [];
  for (const ms of milestones) {
    if (!state.milestonesUnlocked.includes(ms.id)) {
      if (state.coins >= ms.condition.coins) {
        newlyUnlocked.push(ms);
      }
    }
  }
  return newlyUnlocked;
}

export function getCurrentVisualState(
  milestonesUnlocked: string[],
  milestones: MilestoneConfig[]
): string {
  // Return the most advanced visual state
  let state = 'default';
  for (const ms of milestones) {
    if (milestonesUnlocked.includes(ms.id)) {
      state = ms.visualState;
    }
  }
  return state;
}