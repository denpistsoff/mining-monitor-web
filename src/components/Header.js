import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/Header.css';

const Header = ({ activeTab, onTabChange, farmName }) => {
    const navigate = useNavigate();

    const tabs = [
        { id: 'dashboard', label: 'ДАШБОРД' },
        { id: 'miners', label: 'АСИКИ' },
        { id: 'alerts', label: 'ОПОВЕЩЕНИЯ' }
    ];

    const handleTabChange = (tabId) => {
        navigate(`/farm/${farmName}/${tabId}`);
    };

    const handleBack = () => {
        navigate('/');
    };

    const handleLogout = () => {
        localStorage.removeItem('miningAuth');
        window.location.href = '/';
    };

    const handleAction = (action) => {
        alert(`Функция "${action}" в разработке`);
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
                            className="action-btn"
                            onClick={() => handleAction('Перезапуск')}
                        >
                            ПЕРЕЗАПУСК
                        </button>
                        <button
                            className="action-btn"
                            onClick={() => handleAction('Диагностика')}
                        >
                            ДИАГНОСТИКА
                        </button>
                    </div>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
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
                        onClick={() => handleTabChange(tab.id)}
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