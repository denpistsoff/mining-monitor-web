// App.js - Обновленная версия с улучшенной логикой авторизации
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FarmSelection from './components/FarmSelection';
import FarmLayout from './components/FarmLayout';
import Login from './components/Login';
import './styles/dark-theme.css';
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
                    // Проверяем, не устарели ли данные (больше 7 дней)
                    if (authData.username && authData.password &&
                        (Date.now() - authData.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem('miningAuth');
                        setIsAuthenticated(false);
                    }
                } catch (e) {
                    localStorage.removeItem('miningAuth');
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
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
        if (!success) {
            localStorage.removeItem('miningAuth');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('miningAuth');
    };

    if (isLoading) {
        return (
            <div className="app">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p style={{ color: '#ff8c00', marginTop: '16px' }}>Загрузка системы...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <div className="app">
                <Routes>
                    <Route
                        path="/login"
                        element={
                            !isAuthenticated ?
                                <Login onLogin={handleLogin} /> :
                                <Navigate to="/" replace />
                        }
                    />
                    <Route
                        path="/"
                        element={
                            isAuthenticated ?
                                <FarmSelection onLogout={handleLogout} /> :
                                <Navigate to="/login" replace />
                        }
                    />
                    <Route
                        path="/farm/:farmName/*"
                        element={
                            isAuthenticated ?
                                <FarmLayout /> :
                                <Navigate to="/login" replace />
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;