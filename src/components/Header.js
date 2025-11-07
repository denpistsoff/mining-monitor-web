import React from 'react';
import '../styles/components/Header.css';

const Header = ({ activeTab, onTabChange, farmName, onLogout }) => {
    const tabs = [
        { id: 'dashboard', label: 'Дашборд' },
        { id: 'miners', label: 'Асики' },
        { id: 'alerts', label: 'Оповещения' }
    ];

    return (
        <header className="header">
            <div className="header-top">
                <div className="header-left">
                    <button
                        className="back-button"
                        onClick={() => window.history.back()}
                    >
                        НАЗАД
                    </button>
                    <h1 className="header-title">MINING MONITOR</h1>
                </div>

                <div className="header-controls">
                    <div className="farm-name">{farmName}</div>

                    <div className="action-buttons">
                        <button
                            className="action-btn"
                            onClick={() => alert('Функция в разработке')}
                            title="Перезапуск"
                        >
                            ПЕРЕЗАПУСК
                        </button>
                        <button
                            className="action-btn"
                            onClick={() => alert('Функция в разработке')}
                            title="Диагностика"
                        >
                            ДИАГНОСТИКА
                        </button>
                    </div>

                    <button
                        className="logout-button"
                        onClick={onLogout}
                        title="Выйти"
                    >
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
                        {tab.label}
                    </button>
                ))}
            </nav>
        </header>
    );
};

export default Header;