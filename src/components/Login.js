// Login.js - Улучшенная версия
import React, { useState, useEffect } from 'react';
import '../styles/components/Login.css';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Проверяем сохраненные данные при загрузке
        const savedAuth = localStorage.getItem('miningAuth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                // Автоматический вход если не прошло 7 дней
                if (Date.now() - authData.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    handleAutoLogin(authData.username, authData.password);
                } else {
                    localStorage.removeItem('miningAuth');
                }
            } catch (e) {
                localStorage.removeItem('miningAuth');
            }
        }
    }, []);

    const handleAutoLogin = async (savedUser, savedPass) => {
        setIsLoading(true);
        try {
            // Демо-авторизация - в реальном приложении здесь будет запрос к API
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (savedUser === 'demo' && savedPass === 'demo') {
                onLogin(true);
            } else {
                localStorage.removeItem('miningAuth');
                setError('Сохраненные данные устарели');
            }
        } catch (error) {
            console.error('Auto-login failed:', error);
            localStorage.removeItem('miningAuth');
            setError('Ошибка автоматического входа');
        }
        setIsLoading(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Имитация запроса к серверу
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Демо-авторизация
            if (username === 'demo' && password === 'demo') {
                if (rememberMe) {
                    localStorage.setItem('miningAuth', JSON.stringify({
                        username: username,
                        password: password,
                        timestamp: Date.now()
                    }));
                }
                onLogin(true);
            } else {
                setError('Неверный логин или пароль');
            }
        } catch (error) {
            setError('Ошибка авторизации. Проверьте подключение.');
        }
        setIsLoading(false);
    };

    const handleDemoLogin = () => {
        setUsername('demo');
        setPassword('demo');
    };

    if (isLoading) {
        return (
            <div className="login-container">
                <div className="login-form">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p style={{ color: '#ff8c00', marginTop: '16px' }}>Проверка авторизации...</p>
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
                    <p className="login-subtitle">Система мониторинга майнинг ферм</p>
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

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading || !username || !password}
                    >
                        {isLoading ? 'ВХОД...' : 'ВОЙТИ В СИСТЕМУ'}
                    </button>
                </form>

                <div className="demo-credentials">
                    <div className="demo-title">Демо доступ:</div>
                    <div className="demo-info">Логин: demo | Пароль: demo</div>
                </div>
            </div>
        </div>
    );
};

export default Login;