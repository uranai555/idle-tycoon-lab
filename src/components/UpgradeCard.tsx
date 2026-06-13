import React from 'react';

interface UpgradeCardProps {
  icon: string;
  name: string;
  description: string;
  cost: number;
  canAfford: boolean;
  purchased: boolean;
  colors: { primary: string; surface: string; text: string };
  onBuy: () => void;
}

const formatCost = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const UpgradeCard: React.FC<UpgradeCardProps> = ({
  icon, name, description, cost, canAfford, purchased, colors, onBuy
}) => {
  if (purchased) return null;

  const disabled = !canAfford;

  return (
    <div
      className={`upgrade-card ${disabled ? 'disabled' : ''}`}
      style={{
        background: colors.surface,
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : colors.primary}`,
      }}
      onClick={() => !disabled && onBuy()}
    >
      <div className="upgrade-card-icon">{icon}</div>
      <div className="upgrade-card-name" style={{ color: colors.text }}>
        {name}
      </div>
      <div className="upgrade-card-desc" style={{ color: colors.text }}>
        {description}
      </div>
      <div
        className="upgrade-card-cost"
        style={{
          background: disabled ? 'rgba(255,255,255,0.1)' : colors.primary,
          color: disabled ? 'rgba(255,255,255,0.5)' : '#fff',
        }}
      >
        💰 {formatCost(cost)}
      </div>
    </div>
  );
};

export default UpgradeCard;