import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FarmSelection from './components/FarmSelection';
import FarmLayout from './components/FarmLayout';
import Login from './components/Login';
import './styles/dark-theme.css';
import './styles/components/FarmLayout.css';
import './App.css';

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
        if (success) {
            const authData = {
                timestamp: Date.now(),
                authenticated: true
            };
            localStorage.setItem('miningAuth', JSON.stringify(authData));
        }
    };

    if (isLoading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner large"></div>
                <p>Загрузка...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <Router basename="/mining-monitor-web">
            <div className="app">
                <Routes>
                    <Route path="/" element={<FarmSelection />} />
                    <Route path="/farm/:farmName/*" element={<FarmLayout />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;