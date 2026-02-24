// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import FarmSelection from './components/FarmSelection';
import FarmLayout from './components/FarmLayout';
import Login from './components/Login';
import authManager from './utils/auth';
import './styles/dark-theme.css';
import './App.css';

// Компонент для отслеживания и восстановления пути
function RouteTracker({ children }) {
    const location = useLocation();

    useEffect(() => {
        // Сохраняем текущий путь в sessionStorage при каждом изменении
        // Убираем basename из пути для хранения
        const path = location.pathname.replace('/mining-monitor-web', '') || '/';
        if (path !== '/') {
            sessionStorage.setItem('lastPath', path);
            console.log('📍 Path saved:', path);
        }
    }, [location]);

    return children;
}

// Компонент для обработки редиректов
function RedirectHandler() {
    const location = useLocation();

    useEffect(() => {
        // Проверяем, есть ли сохраненный путь после редиректа с 404
        const redirectPath = sessionStorage.getItem('redirectPath');
        if (redirectPath && redirectPath !== location.pathname) {
            console.log('🔄 Restoring path from redirect:', redirectPath);
            sessionStorage.removeItem('redirectPath');
            // Используем replace, чтобы не плодить записи в истории
            window.history.replaceState(null, null,
                `/mining-monitor-web${redirectPath}`);
        }
    }, [location]);

    return null;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log('🔍 Checking authentication...');
                const user = await authManager.checkAuth();
                if (user) {
                    console.log('✅ User authenticated:', user);
                    setIsAuthenticated(true);
                    setCurrentUser(user);

                    // Восстанавливаем последний путь после авторизации
                    const lastPath = sessionStorage.getItem('lastPath');
                    if (lastPath && lastPath !== '/') {
                        console.log('🔄 Restoring last path:', lastPath);
                        // Даем время на загрузку приложения
                        setTimeout(() => {
                            window.history.replaceState(null, null,
                                `/mining-monitor-web${lastPath}`);
                        }, 100);
                    }
                } else {
                    console.log('❌ No authenticated user');
                }
            } catch (error) {
                console.error('❌ Auth check error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Настройка Telegram WebApp если есть
        if (window.Telegram?.WebApp) {
            const tgApp = window.Telegram.WebApp;
            tgApp.ready();
            tgApp.expand();
        }

        document.title = 'Mining Monitor';
        checkAuth();
    }, []);

    const handleLogin = (success, user) => {
        console.log('🔑 Login handler:', success ? 'success' : 'failed');
        setIsAuthenticated(success);
        setCurrentUser(user);

        if (success) {
            // После успешного логина, проверяем есть ли сохраненный путь
            const lastPath = sessionStorage.getItem('lastPath');
            if (lastPath && lastPath !== '/') {
                console.log('➡️ Redirecting to saved path:', lastPath);
                // Используем window.location для полной перезагрузки
                window.location.href = `/mining-monitor-web${lastPath}`;
            }
        }
    };

    const handleLogout = () => {
        console.log('🚪 Logging out');
        authManager.logout();
        setIsAuthenticated(false);
        setCurrentUser(null);
        // Очищаем сохраненные пути при выходе
        sessionStorage.removeItem('lastPath');
        sessionStorage.removeItem('redirectPath');
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
        <Router basename="/mining-monitor-web">
            <RedirectHandler />
            <RouteTracker>
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
                        {/* Добавляем обработку всех остальных путей */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </RouteTracker>
        </Router>
    );
}

export default App;