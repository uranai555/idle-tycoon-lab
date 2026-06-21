import React from 'react';

interface CtaButtonProps {
  text: string;
  colors: { primary: string; accent: string };
  onClick: () => void;
}

const CtaButton: React.FC<CtaButtonProps> = ({ text, colors, onClick }) => {
  return (
    <button
      className="cta-button"
      style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
      }}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default React.memo(CtaButton);