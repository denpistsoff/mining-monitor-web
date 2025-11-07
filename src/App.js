import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FarmSelection from './components/FarmSelection';
import Dashboard from './components/Dashboard';
import MinersView from './components/MinersView';
import AlertsPanel from './components/AlertsPanel';
import Login from './components/Login';
import Header from './components/Header';
import './styles/dark-theme.css';
import './App.css';

// Компонент-обертка для страниц с Header
const FarmPageWrapper = ({ children, farmName, activeTab }) => {
    const navigate = useNavigate();

    const handleTabChange = (tabId) => {
        navigate(`/farm/${farmName}/${tabId}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('miningAuth');
        window.location.href = '/';
    };

    return (
        <div className="farm-layout">
            <Header
                farmName={farmName}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onLogout={handleLogout}
            />
            {children}
        </div>
    );
};

// Простые компоненты страниц
const DashboardPage = () => {
    const pathFarmName = window.location.pathname.split('/')[2];
    return (
        <FarmPageWrapper farmName={pathFarmName} activeTab="dashboard">
            <Dashboard farmNameProp={pathFarmName} />
        </FarmPageWrapper>
    );
};

const MinersPage = () => {
    const pathFarmName = window.location.pathname.split('/')[2];
    return (
        <FarmPageWrapper farmName={pathFarmName} activeTab="miners">
            <MinersView farmNameProp={pathFarmName} />
        </FarmPageWrapper>
    );
};

const AlertsPage = () => {
    const pathFarmName = window.location.pathname.split('/')[2];
    return (
        <FarmPageWrapper farmName={pathFarmName} activeTab="alerts">
            <AlertsPanel farmNameProp={pathFarmName} />
        </FarmPageWrapper>
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