// src/components/Login.js
import React, { useState, useEffect } from 'react';
import authManager from '../utils/auth';
import '../styles/components/Login.css';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(true);

    useEffect(() => {
        // Предзагружаем конфиг при монтировании
        const preloadConfig = async () => {
            await authManager.loadConfig();
            setConfigLoading(false);

            // Проверяем, есть ли сохраненная авторизация
            const user = await authManager.checkAuth();
            if (user) {
                onLogin(true, user);
            }
        };

        preloadConfig();
    }, [onLogin]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setWarning('');
        setIsLoading(true);

        try {
            const result = await authManager.login(username, password);

            if (result.success) {
                if (result.isTemporary) {
                    setWarning(result.message);
                }
                onLogin(true, result.user);
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError('Ошибка подключения к серверу');
            console.error('Login error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (configLoading) {
        return (
            <div className="login-container">
                <div className="login-form">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p style={{ color: '#ff8c00', marginTop: '16px' }}>
                            Загрузка конфигурации...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="login-header">
                    <h1 className="login-title">MINING MONITOR</h1>
                    <p className="login-subtitle">Многопользовательская система мониторинга</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Логин"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="username"
                        />
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="login-options">
                        <label className="remember-me">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isLoading}
                            />
                            <span>Запомнить меня</span>
                        </label>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {warning && <div className="warning-message">{warning}</div>}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'ВХОД...' : 'ВОЙТИ В СИСТЕМУ'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Версия 5.0 | Многопользовательский режим</p>
                </div>
            </div>
        </div>
    );
};

export default Login;