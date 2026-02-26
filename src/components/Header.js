// src/components/Header.js
import React, { useState, useEffect } from 'react';
import '../styles/components/Header.css';

const Header = ({
                    activeTab,
                    onTabChange,
                    farmName,
                    onLogout,
                    onBack,
                    unreadAlertsCount = 0,
                    onAlertsClick
                }) => {
    const [showAlertBadge, setShowAlertBadge] = useState(unreadAlertsCount > 0);
    const tabs = [
        { id: 'dashboard', label: 'ДАШБОРД' },
        { id: 'miners', label: 'АСИКИ' }
    ];

    useEffect(() => {
        setShowAlertBadge(unreadAlertsCount > 0);
    }, [unreadAlertsCount]);

    const handleBack = () => {
        console.log('🔙 Back button clicked');
        if (onBack) {
            onBack();
        }
    };

    const handleAction = (action) => {
        alert(`Функция "${action}" в разработке`);
    };

    const handleAlertsClick = () => {
        // Если есть обработчик алертов, вызываем его
        if (onAlertsClick) {
            onAlertsClick();
        } else {
            // Иначе просто переключаем вкладку
            onTabChange('alerts');
        }
    };

    return (
        <header className="header">
            <div className="header-top">
                <div className="header-left">
                    <button className="back-button" onClick={handleBack}>
                        ← НАЗАД К ФЕРМАМ
                    </button>
                    <div className="header-title-section">
                        <h1 className="header-title">MINING MONITOR</h1>
                        <div className="farm-display">{farmName}</div>
                    </div>
                </div>

                <div className="header-controls">
                    <div className="action-buttons">
                        <button
                            className={`alerts-button ${showAlertBadge ? 'has-alerts' : ''}`}
                            onClick={handleAlertsClick}
                            title="Оповещения"
                        >
                            🔔
                            {showAlertBadge && (
                                <span className="alerts-badge">{unreadAlertsCount}</span>
                            )}
                        </button>

                        <button
                            className="action-btn small"
                            onClick={() => handleAction('Перезапуск')}
                            title="Перезапуск"
                        >
                            🔄
                        </button>
                        <button
                            className="action-btn small"
                            onClick={() => handleAction('Диагностика')}
                            title="Диагностика"
                        >
                            ⚡
                        </button>
                    </div>

                    <button className="logout-button" onClick={onLogout}>
                        ВЫХОД
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
                        <span className="tab-text">{tab.label}</span>
                        <div className="tab-indicator"></div>
                    </button>
                ))}
            </nav>
        </header>
    );
};

export default Header;