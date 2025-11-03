import React from 'react';
import '../styles/components/Header.css';

const Header = ({ activeTab, onTabChange, farmName }) => {
  const tabs = [
    { id: 'dashboard', label: '📊 Дашборд', icon: '📊' },
    { id: 'miners', label: '⛏️ Майнеры', icon: '⛏️' },
    { id: 'alerts', label: '🚨 Оповещения', icon: '🚨' },
    { id: 'stats', label: '📈 Статистика', icon: '📈' }
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <div className="logo">
            <span className="logo-icon">🏭</span>
            <div className="logo-text">
              <h1>Mining Monitor</h1>
              <span className="farm-name">{farmName}</span>
            </div>
          </div>
        </div>

        <nav className="header-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <div className="status-indicator">
            <div className="status-dot online"></div>
            <span>Online</span>
          </div>
          {window.tgApp?.isTelegram && (
            <span className="tg-badge">Telegram</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;