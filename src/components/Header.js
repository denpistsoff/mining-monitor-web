import React from 'react';
import '../styles/components/Header.css';

const Header = ({ activeTab, onTabChange, farmName, onLogout }) => {
    const tabs = [
        { id: 'dashboard', label: '🏠 Дашборд', icon: '🏠' },
        { id: 'miners', label: '🖥️ Асики', icon: '🖥️' },
        { id: 'alerts', label: '🚨 Оповещения', icon: '🚨' }
    ];

    return (
        <header className="header">
            <div className="header-top">
                <h1 className="header-title">⛏️ Mining Monitor</h1>
                <div className="header-controls">
                    <div className="farm-name">🏭 {farmName}</div>
                    <button
                        className="logout-button"
                        onClick={onLogout}
                        title="Выйти"
                    >
                        🚪
                    </button>
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
                        {tab.label}
                    </button>
                ))}
            </nav>
        </header>
    );
};

export default Header;