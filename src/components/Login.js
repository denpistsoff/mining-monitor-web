import React, { useState, useEffect } from 'react';
import '../styles/components/Login.css';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Правильный путь к credentials.json
    const getCredentialsPath = () => {
        // Для GitHub Pages
        if (window.location.hostname.includes('github.io')) {
            return '/mining-monitor-web/data/auth/credentials.json';
        }
        // Для локальной разработки
        return '/data/auth/credentials.json';
    };

    useEffect(() => {
        const savedAuth = localStorage.getItem('miningAuth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                if (Date.now() - authData.timestamp < 30 * 24 * 60 * 60 * 1000) {
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
            const credentialsPath = getCredentialsPath();
            const response = await fetch(credentialsPath + '?t=' + Date.now());
            if (!response.ok) throw new Error('Auth file not found');

            const authData = await response.json();
            const validUser = authData.users.find(u =>
                u.username === savedUser && u.password === savedPass
            );

            if (validUser) {
                onLogin(true);
            } else {
                localStorage.removeItem('miningAuth');
            }
        } catch (error) {
            console.error('Auto-login failed:', error);
            localStorage.removeItem('miningAuth');
        }
        setIsLoading(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const credentialsPath = getCredentialsPath();
            const response = await fetch(credentialsPath + '?t=' + Date.now());
            if (!response.ok) throw new Error('Auth file not found');

            const authData = await response.json();
            const validUser = authData.users.find(u =>
                u.username === username && u.password === password
            );

            if (validUser) {
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
            console.error('Login error:', error);
        }
        setIsLoading(false);
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

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'ВХОД...' : 'ВОЙТИ В СИСТЕМУ'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;