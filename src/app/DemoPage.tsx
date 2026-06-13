import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTheme, themes } from '../themes';
import type { GameState } from '../core/types';
import { createInitialState } from '../core/types';
import { GameLoop } from '../core/gameLoop';
import { createScenarioChecker } from '../core/scenarioRunner';
import { buyProducer, canAfford, getBuyCost } from '../core/economy';
import { buyUpgrade as doBuyUpgrade } from '../core/upgrades';
import { trackEvent } from '../core/analytics';
import PhoneFrame from '../components/PhoneFrame';
import Hud from '../components/Hud';
import MainScene from '../components/MainScene';
import UpgradeCard from '../components/UpgradeCard';
import PopupLayer from '../components/PopupLayer';
import CtaButton from '../components/CtaButton';
import '../styles/globals.css';
import '../styles/animations.css';

interface PopupItem {
  id: string;
  text: string;
}

let popupCounter = 0;

const DemoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const themeId = (searchParams.get('theme') || 'junk_repair') as GameState['themeId'];
  const theme = getTheme(themeId) || themes.junk_repair;

  const [coins, setCoins] = useState(0);
  const [incomePerSecond, setIncomePerSecond] = useState(0);
  const [level, setLevel] = useState(1);
  const [milestonesUnlocked, setMilestonesUnlocked] = useState<string[]>([]);
  const [upgrades, setUpgrades] = useState<Record<string, { id: string; purchased: boolean }>>({});
  const [producers, setProducers] = useState<Record<string, { id: string; count: number }>>({});
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [scenarioActive, setScenarioActive] = useState(false);
  const [scenarioDone, setScenarioDone] = useState(false);

  const gameLoopRef = useRef<GameLoop | null>(null);
  const stateRef = useRef<GameState>(createInitialState(themeId));

  const addPopup = useCallback((text: string) => {
    popupCounter++;
    const id = `popup-${popupCounter}`;
    setPopups(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 2500);
  }, []);

  const syncState = useCallback((state: GameState) => {
    stateRef.current = state;
    setCoins(state.coins);
    setIncomePerSecond(state.incomePerSecond);
    setLevel(state.level);
    setMilestonesUnlocked([...state.milestonesUnlocked]);
    setUpgrades({ ...state.upgrades });
    setProducers({ ...state.producers });
    setScenarioActive(state.scenarioActive);
    setScenarioDone(state.scenarioDone);
  }, []);

  useEffect(() => {
    const state = createInitialState(themeId);
    stateRef.current = state;

    const gl = new GameLoop(state, theme, {
      onTick: (s) => {
        syncState(s);
        // Scenario checker runs inside the game loop
        if (s.scenarioActive) {
          checkerRef.current?.(s);
        }
      },
      onMilestoneUnlock: (mid) => {
        trackEvent('milestone_unlock', themeId, { milestone: mid });
      },
      onPopup: (text) => {
        addPopup(text);
      },
    });

    const scenarioChecker = createScenarioChecker(gl, theme.scenario, () => {
      trackEvent('scenario_complete', themeId, {});
      setScenarioDone(true);
    });
    checkerRef.current = scenarioChecker;

    gameLoopRef.current = gl;
    gl.start();

    return () => {
      gl.stop();
      gameLoopRef.current = null;
    };
  }, [themeId]);

  const checkerRef = useRef<((state: GameState) => void) | null>(null);

  const handleBuyProducer = useCallback((producerId: string) => {
    const gl = gameLoopRef.current;
    if (!gl || gl.state.scenarioActive) return;

    const config = theme.producers.find(p => p.id === producerId);
    if (!config) return;

    const result = buyProducer(gl.state, config);
    if (result.success) {
      gl.state = result.newState;
      gl.state.incomePerSecond = 0; // Will recalculate on next tick
      syncState(gl.state);
      addPopup(`🛒 ${config.name} 購入！`);
      trackEvent('buy_producer', themeId, { producer: producerId });
    }
  }, [theme, themeId, syncState, addPopup]);

  const handleBuyUpgrade = useCallback((upgradeId: string) => {
    const gl = gameLoopRef.current;
    if (!gl || gl.state.scenarioActive) return;

    const config = theme.upgrades.find(u => u.id === upgradeId);
    if (!config) return;

    const result = doBuyUpgrade(gl.state, config);
    if (result.success) {
      gl.state = result.newState;
      gl.upgradeMultipliers[config.targetProducerId] =
        (gl.upgradeMultipliers[config.targetProducerId] ?? 1) * result.multiplierDelta;
      syncState(gl.state);
      addPopup(`⬆️ ${config.name}`);
      trackEvent('buy_upgrade', themeId, { upgrade: upgradeId });
    }
  }, [theme, themeId, syncState, addPopup]);

  const handleCtaClick = useCallback(() => {
    trackEvent('cta_click', themeId, {});
    addPopup('📝 ご意見ありがとうございます！');
  }, [themeId, addPopup]);

  // Compute visual state
  const currentVisualState = (() => {
    let state = 'default';
    for (const ms of theme.milestones) {
      if (milestonesUnlocked.includes(ms.id)) {
        state = ms.visualState;
      }
    }
    return state;
  })();

  return (
    <PhoneFrame>
      <Hud
        coins={coins}
        incomePerSecond={incomePerSecond}
        level={level}
        colors={theme.colors}
      />
      <MainScene
        visualState={currentVisualState}
        themeId={themeId}
        title={theme.title}
      />

      <div className="upgrade-area">
        {/* Producer buy cards */}
        {theme.producers.map((prod) => {
          const count = producers[prod.id]?.count ?? 0;
          const cost = getBuyCost(prod, count);
          const aff = canAfford(cost, coins);
          return (
            <UpgradeCard
              key={prod.id}
              icon={prod.icon}
              name={prod.name}
              description={prod.description}
              cost={cost}
              canAfford={!scenarioActive && aff}
              purchased={false}
              colors={theme.colors}
              onBuy={() => handleBuyProducer(prod.id)}
            />
          );
        })}
        {/* Upgrade cards */}
        {theme.upgrades.map((upg) => {
          const purchased = upgrades[upg.id]?.purchased ?? false;
          const aff = canAfford(upg.cost, coins);
          return (
            <UpgradeCard
              key={upg.id}
              icon="⬆️"
              name={upg.name}
              description={upg.description}
              cost={upg.cost}
              canAfford={!scenarioActive && aff}
              purchased={purchased}
              colors={theme.colors}
              onBuy={() => handleBuyUpgrade(upg.id)}
            />
          );
        })}
      </div>

      <PopupLayer popups={popups} />

      {!scenarioActive && (
        <CtaButton
          text="このゲーム、遊んでみたい？"
          colors={theme.colors}
          onClick={handleCtaClick}
        />
      )}

      {scenarioActive && (
        <div className="scenario-badge" style={{ color: theme.colors.text }}>
          ▶ デモ再生中 {scenarioDone ? '✓' : '...'}
        </div>
      )}
    </PhoneFrame>
  );
};

export default DemoPage;