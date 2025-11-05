import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MinersView from './components/MinersView';
import AlertsPanel from './components/AlertsPanel';
import Login from './components/Login';
import './styles/dark-theme.css';
import './App.css';

function App() {
    const [farmName, setFarmName] = useState('main-farm');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Проверяем авторизацию при загрузке
        const checkAuth = () => {
            const savedAuth = localStorage.getItem('miningAuth');
            if (savedAuth) {
                try {
                    const authData = JSON.parse(savedAuth);
                    // Если прошло меньше 30 дней, автоматически авторизуем
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

        // Настройка Telegram Web App
        if (window.Telegram?.WebApp) {
            const tgApp = window.Telegram.WebApp;
            if (tgApp.initDataUnsafe?.user?.username) {
                setFarmName(tgApp.initDataUnsafe.user.username);
            }

            tgApp.ready();
            tgApp.expand();
        }

        document.title = 'Mining Monitor 🏭';
        checkAuth();
    }, []);

    const handleLogin = (success) => {
        setIsAuthenticated(success);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard farmName={farmName} />;
            case 'miners':
                return <MinersView farmName={farmName} />;
            case 'alerts':
                return <AlertsPanel farmName={farmName} />;
            default:
                return <Dashboard farmName={farmName} />;
        }
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
        <div className="app">
            <Header
                activeTab={activeTab}
                onTabChange={setActiveTab}
                farmName={farmName}
                onLogout={() => {
                    localStorage.removeItem('miningAuth');
                    setIsAuthenticated(false);
                }}
            />

            <main className="main-content">
                {renderContent()}
            </main>
        </div>
    );
}

export default App;