// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FarmSelection from './components/FarmSelection';
import FarmLayout from './components/FarmLayout';
import Login from './components/Login';
import authManager from './utils/auth';
import './styles/dark-theme.css';
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const user = await authManager.checkAuth();
            if (user) {
                setIsAuthenticated(true);
                setCurrentUser(user);
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

    const handleLogin = (success, user) => {
        setIsAuthenticated(success);
        setCurrentUser(user);
    };

    const handleLogout = () => {
        authManager.logout();
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    if (isLoading) {
        return (
            <div className="app">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p style={{ color: '#ff8c00', marginTop: '16px' }}>
                        Загрузка системы...
                    </p>
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
                            !isAuthenticated ? (
                                <Login onLogin={handleLogin} />
                            ) : (
                                <Navigate to="/" replace />
                            )
                        }
                    />
                    <Route
                        path="/"
                        element={
                            isAuthenticated ? (
                                <FarmSelection
                                    currentUser={currentUser}
                                    onLogout={handleLogout}
                                />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/farm/:farmName/*"
                        element={
                            isAuthenticated ? (
                                <FarmLayout
                                    currentUser={currentUser}
                                />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;