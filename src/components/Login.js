// Login.js - Аутентификация через GitHub Repository Secret
import React, { useState, useEffect } from 'react';
import '../styles/components/Login.css';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedAuth = localStorage.getItem('miningAuth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
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
            const isValid = await validateCredentials(savedUser, savedPass);
            if (isValid) {
                onLogin(true);
            } else {
                localStorage.removeItem('miningAuth');
                setError('Сохраненные данные устарели');
            }
        } catch (error) {
            localStorage.removeItem('miningAuth');
            setError('Ошибка автоматического входа');
        }
        setIsLoading(false);
    };

    const validateCredentials = async (user, pass) => {
        try {
            // Получаем секретные учетные данные из переменной окружения
            const secretCredentials = process.env.REACT_APP_AUTH_CREDENTIALS;

            if (!secretCredentials) {
                console.error('AUTH_CREDENTIALS not found in environment');
                return false;
            }

            // Парсим JSON из секрета
            const validUsers = JSON.parse(secretCredentials);

            // Проверяем учетные данные
            return validUsers.some(cred =>
                cred.username === user && cred.password === pass
            );

        } catch (error) {
            console.error('Credential validation error:', error);
            return false;
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('Введите логин и пароль');
            return;
        }

        setIsLoading(true);

        try {
            const isValid = await validateCredentials(username, password);

            if (isValid) {
                if (rememberMe) {
                    // Сохраняем в localStorage (в реальном приложении лучше хранить токен)
                    localStorage.setItem('miningAuth', JSON.stringify({
                        username: username,
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
                    <p className="login-subtitle">Защищенный доступ к системе мониторинга</p>
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
                        disabled={isLoading || !username || !password}
                    >
                        {isLoading ? 'ВХОД...' : 'ВОЙТИ В СИСТЕМУ'}
                    </button>
                </form>

                <div className="security-notice">
                    <div className="security-icon">🔒</div>
                    <div className="security-text">
                        Доступ ограничен. Используйте выданные учетные данные.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;