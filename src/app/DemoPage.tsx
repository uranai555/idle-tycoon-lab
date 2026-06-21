import React, { useEffect, useRef, useState, useCallback, useMemo, useReducer } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getTheme, themes } from '../themes';
import type { GameState } from '../core/types';
import { createInitialState } from '../core/types';
import { GameLoop } from '../core/gameLoop';
import { createScenarioChecker } from '../core/scenarioRunner';
import { buyProducer, canAfford, getBuyCost, calculateIncomePerSecond } from '../core/economy';
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

interface UIState {
  coins: number;
  incomePerSecond: number;
  level: number;
  milestonesUnlocked: string[];
  upgrades: Record<string, { id: string; purchased: boolean }>;
  producers: Record<string, { id: string; count: number }>;
  scenarioActive: boolean;
  scenarioDone: boolean;
}

type UIAction = { type: 'sync'; state: GameState };

function uiReducer(_prev: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'sync':
      return {
        coins: action.state.coins,
        incomePerSecond: action.state.incomePerSecond,
        level: action.state.level,
        milestonesUnlocked: action.state.milestonesUnlocked,
        upgrades: action.state.upgrades,
        producers: action.state.producers,
        scenarioActive: action.state.scenarioActive,
        scenarioDone: action.state.scenarioDone,
      };
  }
}

const initialUI: UIState = {
  coins: 0,
  incomePerSecond: 0,
  level: 1,
  milestonesUnlocked: [],
  upgrades: {},
  producers: {},
  scenarioActive: false,
  scenarioDone: false,
};

let popupCounter = 0;

const DemoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const themeId = (searchParams.get('theme') || 'junk_repair') as GameState['themeId'];
  const theme = getTheme(themeId) || themes.junk_repair;

  const [ui, dispatch] = useReducer(uiReducer, initialUI);
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const navigate = useNavigate();

  const gameLoopRef = useRef<GameLoop | null>(null);
  const checkerRef = useRef<((state: GameState) => void) | null>(null);
  const popupTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const addPopup = useCallback((text: string) => {
    popupCounter++;
    const id = `popup-${popupCounter}`;
    setPopups(prev => [...prev, { id, text }]);
    const timer = setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
      popupTimersRef.current.delete(timer);
    }, 2500);
    popupTimersRef.current.add(timer);
  }, []);

  useEffect(() => {
    const state = createInitialState(themeId);

    const gl = new GameLoop(state, theme, {
      onTick: (s) => {
        dispatch({ type: 'sync', state: s });
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
    });
    checkerRef.current = scenarioChecker;

    gameLoopRef.current = gl;
    gl.start();

    const timers = popupTimersRef.current;
    return () => {
      gl.stop();
      gameLoopRef.current = null;
      for (const t of timers) clearTimeout(t);
      timers.clear();
    };
  }, [themeId, theme, addPopup]);

  const handleBuyProducer = useCallback((producerId: string) => {
    const gl = gameLoopRef.current;
    if (!gl || gl.state.scenarioActive) return;

    const config = theme.producers.find(p => p.id === producerId);
    if (!config) return;

    const result = buyProducer(gl.state, config);
    if (result.success) {
      gl.state = result.newState;
      gl.markIncomeDirty();
      const ips = calculateIncomePerSecond(
        gl.state.producers,
        theme.producers,
        gl.upgradeMultipliers,
      );
      gl.state.incomePerSecond = ips;
      dispatch({ type: 'sync', state: gl.state });
      addPopup(`🛒 ${config.name} 購入！`);
      trackEvent('buy_producer', themeId, { producer: producerId });
    }
  }, [theme, themeId, addPopup]);

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
      gl.markIncomeDirty();
      const ips = calculateIncomePerSecond(
        gl.state.producers,
        theme.producers,
        gl.upgradeMultipliers,
      );
      gl.state.incomePerSecond = ips;
      dispatch({ type: 'sync', state: gl.state });
      addPopup(`⬆️ ${config.name}`);
      trackEvent('buy_upgrade', themeId, { upgrade: upgradeId });
    }
  }, [theme, themeId, addPopup]);

  const handleCtaClick = useCallback(() => {
    trackEvent('cta_click', themeId, {});
    navigate(`/lp?theme=${themeId}`);
  }, [themeId, navigate]);

  const currentVisualState = useMemo(() => {
    let state = 'default';
    for (const ms of theme.milestones) {
      if (ui.milestonesUnlocked.includes(ms.id)) {
        state = ms.visualState;
      }
    }
    return state;
  }, [theme.milestones, ui.milestonesUnlocked]);

  return (
    <PhoneFrame>
      <Hud
        coins={ui.coins}
        incomePerSecond={ui.incomePerSecond}
        level={ui.level}
        colors={theme.colors}
      />
      <MainScene
        visualState={currentVisualState}
        themeId={themeId}
        title={theme.title}
      />

      <div className="upgrade-area">
        {theme.producers.map((prod) => {
          const count = ui.producers[prod.id]?.count ?? 0;
          const cost = getBuyCost(prod, count);
          const aff = canAfford(cost, ui.coins);
          return (
            <UpgradeCard
              key={prod.id}
              icon={prod.icon}
              name={prod.name}
              description={prod.description}
              cost={cost}
              canAfford={!ui.scenarioActive && aff}
              purchased={false}
              count={count}
              colors={theme.colors}
              onBuy={() => handleBuyProducer(prod.id)}
            />
          );
        })}
        {theme.upgrades.map((upg) => {
          const purchased = ui.upgrades[upg.id]?.purchased ?? false;
          const aff = canAfford(upg.cost, ui.coins);
          return (
            <UpgradeCard
              key={upg.id}
              icon="⬆️"
              name={upg.name}
              description={upg.description}
              cost={upg.cost}
              canAfford={!ui.scenarioActive && aff}
              purchased={purchased}
              colors={theme.colors}
              onBuy={() => handleBuyUpgrade(upg.id)}
            />
          );
        })}
      </div>

      <PopupLayer popups={popups} />

      {!ui.scenarioActive && (
        <CtaButton
          text="このゲーム、遊んでみたい？"
          colors={theme.colors}
          onClick={handleCtaClick}
        />
      )}

      {ui.scenarioActive && (
        <div className="scenario-badge" style={{ color: theme.colors.text }}>
          ▶ デモ再生中 {ui.scenarioDone ? '✓' : '...'}
        </div>
      )}
    </PhoneFrame>
  );
};

export default DemoPage;
