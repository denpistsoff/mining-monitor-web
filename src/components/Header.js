import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/Header.css';

const Header = ({ activeTab, onTabChange, farmName, onLogout }) => {
    const navigate = useNavigate();
    const tabs = [
        { id: 'dashboard', label: '🏠 Дашборд', icon: '🏠' },
        { id: 'miners', label: '🖥️ Асики', icon: '🖥️' },
        { id: 'alerts', label: '🚨 Оповещения', icon: '🚨' }
    ];

    const handleFarmSelect = () => {
        navigate('/');
    };

    const handleAction = (action) => {
        alert(`Функция "${action}" в разработке`);
    };

    return (
        <header className="header">
            <div className="header-top">
                <div className="header-left">
                    <button
                        className="back-button"
                        onClick={handleFarmSelect}
                        title="Выбор фермы"
                    >
                        ◀️ Назад
                    </button>
                    <h1 className="header-title">⛏️ Mining Monitor</h1>
                </div>

                <div className="header-controls">
                    <div className="farm-name">🏭 {farmName}</div>

                    <div className="action-buttons">
                        <button
                            className="action-btn"
                            onClick={() => handleAction('Перезапуск')}
                            title="Перезапуск"
                        >
                            🔄
                        </button>
                        <button
                            className="action-btn"
                            onClick={() => handleAction('Диагностика')}
                            title="Диагностика"
                        >
                            🔧
                        </button>
                    </div>

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