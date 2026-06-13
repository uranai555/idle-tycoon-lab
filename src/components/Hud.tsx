import React from 'react';
import { formatCoins } from '../core/types';

interface HudProps {
  coins: number;
  incomePerSecond: number;
  level: number;
  colors: { primary: string; secondary: string; accent: string; text: string };
}

const Hud: React.FC<HudProps> = ({ coins, incomePerSecond, level, colors }) => {
  return (
    <div className="hud" style={{ color: colors.text }}>
      <div className="hud-item">
        <span className="hud-label">💰 COINS</span>
        <span className="hud-value coins" style={{ color: colors.accent }}>
          {formatCoins(coins)}
        </span>
      </div>
      <div className="hud-item">
        <span className="hud-label">📈 INCOME/S</span>
        <span className="hud-value" style={{ color: colors.primary }}>
          +{formatCoins(incomePerSecond)}
        </span>
      </div>
      <div className="hud-item">
        <span className="hud-label">📊 LEVEL</span>
        <span className="hud-value" style={{ color: colors.secondary }}>
          {level}
        </span>
      </div>
    </div>
  );
};

export default Hud;