import type { ScenarioStep, GameState } from './types';
import type { GameLoop } from './gameLoop';

export function createScenarioChecker(
  gameLoop: GameLoop,
  scenario: ScenarioStep[],
  onComplete: () => void
): (state: GameState) => void {
  if (scenario.length === 0) {
    return () => {
      onComplete();
    };
  }

  gameLoop.state.scenarioActive = true;

  const sorted = [...scenario].sort((a, b) => a.atMs - b.atMs);
  let currentIndex = 0;
  let done = false;

  return (state: GameState) => {
    if (done || !gameLoop.state.scenarioActive) return;

    while (currentIndex < sorted.length && state.elapsedMs >= sorted[currentIndex].atMs) {
      const step = sorted[currentIndex];
      gameLoop.applyScenarioStep(step.action, step.payload);
      currentIndex++;
    }

    if (currentIndex >= sorted.length && !done) {
      done = true;
      gameLoop.state.scenarioDone = true;
      onComplete();
    }
  };
}