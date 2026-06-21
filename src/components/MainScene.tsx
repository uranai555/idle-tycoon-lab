import React from 'react';

interface MainSceneProps {
  visualState: string;
  themeId: string;
  title: string;
}

const sceneIcons: Record<string, string> = {
  'default': '📦',
  'small_shop': '🏪',
  'warehouse': '🏭',
  'flagship': '🏬',
  'office_desk': '🪑',
  'modern_office': '🏢',
  'highrise': '🏙️',
  'cozy': '🛋️',
  'paradise': '🌺',
  'mansion': '🏰',
};

const sceneTitles: Record<string, string> = {
  'default': 'はじめの一歩',
  'small_shop': '小さな店舗',
  'warehouse': '拡張倉庫',
  'flagship': '旗艦店',
  'office_desk': 'ちゃんとしたデスク',
  'modern_office': 'モダンオフィス',
  'highrise': '高層ビル',
  'cozy': 'かわいい部屋',
  'paradise': 'ペットパラダイス',
  'mansion': 'ペットのお城',
};

const MainScene: React.FC<MainSceneProps> = ({ visualState, title }) => {
  const stateClass = `scene-${visualState}`;
  const icon = sceneIcons[visualState] || sceneIcons['default'];
  const sceneTitle = sceneTitles[visualState] || sceneTitles['default'];

  return (
    <div className={`main-scene ${stateClass}`}>
      <div className="scene-content">
        <div className="scene-icon">{icon}</div>
        <div className="scene-title">{sceneTitle}</div>
        <div className="scene-subtitle">{title}</div>
      </div>
    </div>
  );
};

export default React.memo(MainScene);