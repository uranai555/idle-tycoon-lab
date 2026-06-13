import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getTheme, themes } from '../themes';
import { formatCoins } from '../core/types';
import { trackEvent } from '../core/analytics';
import '../styles/globals.css';

// Simple CSS for LP
const lpStyles = `
.lp-container {
  width: 100%;
  min-height: 100vh;
  background: #0a0a1a;
  color: #e8e8e8;
  font-family: system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
}

.lp-header {
  text-align: center;
  padding: 60px 20px 40px;
  max-width: 480px;
}

.lp-badge {
  display: inline-block;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 16px;
  font-weight: 600;
}

.lp-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.3;
  margin-bottom: 12px;
}

.lp-subtitle {
  font-size: 14px;
  opacity: 0.7;
  line-height: 1.6;
}

.lp-preview {
  width: 260px;
  height: 460px;
  border-radius: 30px;
  border: 2px solid rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 20px auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.lp-preview-hud {
  display: flex;
  justify-content: space-between;
  padding: 16px 12px 8px;
  font-size: 11px;
}

.lp-preview-scene {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.lp-preview-bottom {
  padding: 8px;
  display: flex;
  gap: 4px;
  justify-content: center;
}

.lp-preview-card {
  width: 70px;
  height: 60px;
  border-radius: 8px;
  opacity: 0.7;
}

.lp-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 20px;
  max-width: 400px;
  width: 100%;
  margin: 20px 0;
}

.lp-feature {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.lp-feature-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.lp-feature-text {
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.8;
}

.lp-form {
  width: 100%;
  max-width: 400px;
  padding: 0 20px;
  margin: 20px 0;
}

.lp-form-title {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 16px;
}

.lp-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: white;
  font-size: 14px;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.lp-input::placeholder {
  color: rgba(255,255,255,0.3);
}

.lp-submit {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.lp-submit:hover {
  transform: scale(1.02);
}

.lp-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lp-registered {
  text-align: center;
  padding: 30px;
}

.lp-registered-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.lp-registered-text {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.lp-registered-sub {
  font-size: 13px;
  opacity: 0.6;
}

.lp-footer {
  padding: 40px 20px;
  text-align: center;
  font-size: 12px;
  opacity: 0.4;
}

.lp-back-link {
  display: inline-block;
  margin-top: 20px;
  padding: 8px 20px;
  border-radius: 20px;
  text-decoration: none;
  color: inherit;
  font-size: 13px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.lp-back-link:hover {
  opacity: 1;
}
`;

const sceneIcons: Record<string, string> = {
  'default': '📦', 'small_shop': '🏪', 'warehouse': '🏭',
  'office_desk': '🪑', 'modern_office': '🏢', 'highrise': '🏙️',
  'cozy': '🛋️', 'paradise': '🌺', 'mansion': '🏰',
};

const themeFeatures: Record<string, { icon: string; text: string }[]> = {
  junk_repair: [
    { icon: '🔧', text: '100円のジャンク品を修理して高く売る快感' },
    { icon: '📈', text: '利益がじわじわ増える放置系成長システム' },
    { icon: '🏪', text: '小さな修理台から旗艦店までの店舗拡張' },
    { icon: '⭐', text: 'レア商品や高級修理ツールの解放要素' },
  ],
  ai_secretary: [
    { icon: '🤖', text: 'ポンコツAI秘書を育てて会社を大きくする' },
    { icon: '📊', text: '自動でタスク処理→収益UPの放置ループ' },
    { icon: '🏢', text: '段ボールオフィスから高層ビルまで進化' },
    { icon: '🎯', text: '新しいAI社員やスキンで差別化できる' },
  ],
  pet_room: [
    { icon: '🐾', text: 'かわいいペットたちが部屋を自動で飾り付け' },
    { icon: '💖', text: '癒しのグラフィックと快適度UPの達成感' },
    { icon: '🏰', text: 'ボロ部屋から豪邸へ変化するビフォーアフター' },
    { icon: '🎀', text: '家具ガチャや限定ペットでコレクション要素も' },
  ],
};

const LandingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const themeId = (searchParams.get('theme') || 'junk_repair') as string;
  const theme = getTheme(themeId) || themes.junk_repair;

  const [email, setEmail] = useState('');
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  const features = themeFeatures[themeId] || themeFeatures.junk_repair;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    trackEvent('lp_register', themeId, { email: email.trim() });

    // Send to Discord webhook
    try {
      await fetch(
        'https://discord.com/api/webhooks/1359392915642847243/7qFLwyG8YSYq77ibGQr-9AxeSl-FKfrBVllKny6nVbv212jJ600R3sJob8dQ7C3RXDrI',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🎮 **新規登録！**\n**テーマ:** ${theme.title}\n**メール:** ${email.trim()}\n**時間:** ${new Date().toLocaleString('ja-JP')}`,
          }),
        }
      );
    } catch {}

    setRegistered(true);
    setLoading(false);
  };

  return (
    <div className="lp-container">
      <style>{lpStyles}</style>

      {/* Header */}
      <div className="lp-header">
        <div
          className="lp-badge"
          style={{ background: theme.colors.primary + '33', color: theme.colors.primary }}
        >
          {theme.title}
        </div>
        <h1 className="lp-title" style={{ color: theme.colors.text }}>
          {theme.hookText}
        </h1>
        <p className="lp-subtitle">
          スマホ1つで遊べる放置タイクーンゲーム。
          あなたのフィードバックで一緒に育てていきましょう！
        </p>
      </div>

      {/* Preview */}
      <div
        className="lp-preview"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.background}, ${theme.colors.surface})`,
        }}
      >
        <div className="lp-preview-hud" style={{ color: theme.colors.text }}>
          <span style={{ color: theme.colors.accent }}>💰 {formatCoins(15280)}</span>
          <span style={{ color: theme.colors.primary }}>📈 +{formatCoins(47)}</span>
          <span style={{ color: theme.colors.secondary }}>Lv.5</span>
        </div>
        <div className="lp-preview-scene">
          {sceneIcons[theme.milestones[1]?.visualState || 'default'] || '🎮'}
        </div>
        <div className="lp-preview-bottom">
          {theme.producers.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="lp-preview-card"
              style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.primary}44` }}
            >
              <div style={{ fontSize: 20, textAlign: 'center', paddingTop: 8 }}>{p.icon}</div>
              <div style={{ fontSize: 9, textAlign: 'center', opacity: 0.6, marginTop: 4 }}>{p.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="lp-features">
        {features.map((f, i) => (
          <div className="lp-feature" key={i}>
            <div className="lp-feature-icon">{f.icon}</div>
            <div className="lp-feature-text">{f.text}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="lp-form">
        {!registered ? (
          <>
            <h2 className="lp-form-title" style={{ color: theme.colors.text }}>
              🎮 リリース通知を受け取る
            </h2>
            <form onSubmit={handleSubmit}>
              <input
                className="lp-input"
                type="email"
                placeholder="メールアドレスを入力"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                className="lp-submit"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                }}
                disabled={loading}
                type="submit"
              >
                {loading ? '送信中...' : 'リリース通知を受け取る ✨'}
              </button>
            </form>
          </>
        ) : (
          <div className="lp-registered">
            <div className="lp-registered-icon">🎉</div>
            <div className="lp-registered-text">登録ありがとうございます！</div>
            <div className="lp-registered-sub">
              リリース時にお知らせします。しばしお待ちください！
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="lp-footer">
        <p>本ページはプロトタイプの需要検証用です</p>
        <Link to={`/demo?theme=${themeId}`} className="lp-back-link">
          ← デモを再プレイ
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;