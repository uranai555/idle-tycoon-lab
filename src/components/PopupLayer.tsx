import React from 'react';

interface PopupItem {
  id: string;
  text: string;
}

interface PopupLayerProps {
  popups: PopupItem[];
}

const PopupLayer: React.FC<PopupLayerProps> = ({ popups }) => {
  if (popups.length === 0) return null;

  return (
    <div className="popup-layer">
      {popups.map((popup, index) => (
        <div
          key={popup.id}
          className="popup-item"
          style={{
            top: `${40 + index * 50}px`,
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
          }}
        >
          {popup.text}
        </div>
      ))}
    </div>
  );
};

export default React.memo(PopupLayer);