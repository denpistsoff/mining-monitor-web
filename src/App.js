import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import FarmSelection from './components/FarmSelection';
import Dashboard from './components/Dashboard';
import MinersView from './components/MinersView';
import AlertsPanel from './components/AlertsPanel';
import Login from './components/Login';
import './styles/dark-theme.css';
import './App.css';

// Упрощенный хедер
const SimpleHeader = ({ farmName, activeTab }) => {
    const navigate = useNavigate();

    const tabs = [
        { id: 'dashboard', label: 'Дашборд' },
        { id: 'miners', label: 'Асики' },
        { id: 'alerts', label: 'Оповещения' }
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

    return (
        <header className="header">
            <div className="header-top">
                <div className="header-left">
                    <button className="back-button" onClick={handleBack}>
                        НАЗАД
                    </button>
                    <h1 className="header-title">MINING MONITOR</h1>
                </div>

                <div className="header-controls">
                    <div className="farm-name">{farmName}</div>
                    <button className="logout-button" onClick={handleLogout}>
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
                        {tab.label}
                    </button>
                ))}
            </nav>
        </header>
    );
};

// Простые компоненты страниц
const DashboardPage = () => {
    const pathFarmName = window.location.pathname.split('/')[2];
    return (
        <div className="farm-layout">
            <SimpleHeader farmName={pathFarmName} activeTab="dashboard" />
            <Dashboard farmNameProp={pathFarmName} />
        </div>
    );
};

const MinersPage = () => {
    const pathFarmName = window.location.pathname.split('/')[2];
    return (
        <div className="farm-layout">
            <SimpleHeader farmName={pathFarmName} activeTab="miners" />
            <MinersView farmNameProp={pathFarmName} />
        </div>
    );
};

const AlertsPage = () => {
    const pathFarmName = window.location.pathname.split('/')[2];
    return (
        <div className="farm-layout">
            <SimpleHeader farmName={pathFarmName} activeTab="alerts" />
            <AlertsPanel farmNameProp={pathFarmName} />
        </div>
    );
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const savedAuth = localStorage.getItem('miningAuth');
            if (savedAuth) {
                try {
                    const authData = JSON.parse(savedAuth);
                    if (Date.now() - authData.timestamp < 30 * 24 * 60 * 60 * 1000) {
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem('miningAuth');
                    }
                } catch (e) {
                    localStorage.removeItem('miningAuth');
                }
            }
            setIsLoading(false);
        };

        if (window.Telegram?.WebApp) {
            const tgApp = window.Telegram.WebApp;
            tgApp.ready();
            tgApp.expand();
        }

        document.title = 'Mining Monitor';
        checkAuth();
    }, []);

    const handleLogin = (success) => {
        setIsAuthenticated(success);
    };

    if (isLoading) {
        return (
            <div className="app">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <Router>
            <div className="app">
                <Routes>
                    <Route path="/" element={<FarmSelection />} />
                    <Route path="/farm/:farmName/dashboard" element={<DashboardPage />} />
                    <Route path="/farm/:farmName/miners" element={<MinersPage />} />
                    <Route path="/farm/:farmName/alerts" element={<AlertsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;