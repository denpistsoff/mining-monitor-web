// src/components/FarmSelection.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authManager from '../utils/auth';
import '../styles/components/FarmSelection.css';

const FarmSelection = ({ currentUser, onLogout }) => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState(null);
    const [retryCount, setRetryCount] = useState({});
    const navigate = useNavigate();

    // Базовый URL для данных
    const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/';

    // Маппинг ID ферм к URL (динамически строится)
    const getFarmUrl = (farmId) => {
        return `${GITHUB_RAW_URL}farm_data_${farmId}.json`;
    };

    // Функция для проверки свежести данных
    const checkDataFreshness = (data) => {
        if (!data || (!data.timestamp && !data.last_update)) {
            return 'offline';
        }

        let dataTime;
        if (data.timestamp) {
            dataTime = new Date(data.timestamp * 1000);
        } else if (data.last_update) {
            dataTime = new Date(data.last_update.replace(' ', 'T'));
        } else {
            return 'offline';
        }

        const now = new Date();
        const diffMinutes = (now - dataTime) / (1000 * 60);

        if (diffMinutes > 60) {
            return 'offline';
        } else if (diffMinutes > 30) {
            return 'stale';
        } else {
            return 'fresh';
        }
    };

    // Функция для проверки существования файла
    const checkFileExists = async (url) => {
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    };

    // Функция для загрузки данных с обходом кэша
    const fetchWithCacheBust = async (url, retries = 2) => {
        const cacheBuster = `${Date.now()}_${Math.random()}`;
        const fetchUrl = `${url}?t=${cacheBuster}`;

        console.log(`📥 Загрузка: ${fetchUrl}`);

        for (let i = 0; i <= retries; i++) {
            try {
                const response = await fetch(fetchUrl, {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return { success: true, data };
                } else if (response.status === 404) {
                    // Файл действительно не найден
                    return { success: false, status: 404 };
                }
            } catch (error) {
                console.log(`⚠️ Попытка ${i + 1} не удалась для ${url}`);
            }

            // Ждем перед повторной попыткой
            if (i < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }

        return { success: false, status: 500 };
    };

    const loadFarmData = async (farmId) => {
        const url = getFarmUrl(farmId);

        try {
            // Сначала проверяем существует ли файл
            const exists = await checkFileExists(url);
            if (!exists) {
                console.log(`📁 Файл для ${farmId} не найден на GitHub`);
                return null;
            }

            // Загружаем данные с обходом кэша
            const result = await fetchWithCacheBust(url);

            if (result.success) {
                const freshness = checkDataFreshness(result.data);
                return { ...result.data, _dataStatus: freshness };
            } else if (result.status === 404) {
                console.log(`📁 Файл для ${farmId} не найден (404)`);
                return null;
            } else {
                console.log(`⚠️ Ошибка загрузки для ${farmId}, пробуем прямой URL...`);

                // Пробуем прямой URL без параметров
                const directResponse = await fetch(url, {
                    cache: 'reload'
                });

                if (directResponse.ok) {
                    const data = await directResponse.json();
                    const freshness = checkDataFreshness(data);
                    return { ...data, _dataStatus: freshness };
                }
            }
        } catch (error) {
            console.error(`❌ Ошибка загрузки ${farmId}:`, error);
        }

        return null;
    };

    const loadAccessibleFarms = async () => {
        if (!currentUser || !currentUser.farms || currentUser.farms.length === 0) {
            setFarms([]);
            return;
        }

        setLoading(true);
        console.log('📥 Загрузка ферм для пользователя:', currentUser);
        console.log('📋 Доступные фермы:', currentUser.farms);

        const farmsList = [];
        const newRetryCount = { ...retryCount };

        for (const farmId of currentUser.farms) {
            console.log(`🔍 Загрузка данных для фермы: ${farmId}`);

            const data = await loadFarmData(farmId);

            if (data) {
                console.log(`✅ Данные получены для ${farmId}`);

                const containers = data.containers || {};
                const containerList = Object.values(containers);

                const totalMiners = containerList.reduce((sum, c) => sum + (c.total_miners || 0), 0);
                const onlineMiners = containerList.reduce((sum, c) => sum + (c.online_miners || 0), 0);
                const hashrate = containerList.reduce((sum, c) => sum + (c.total_hashrate || 0), 0);
                const totalContainers = Object.keys(containers).length;

                let status = 'empty';
                let freshnessStatus = data._dataStatus || 'fresh';

                if (totalMiners > 0) {
                    if (freshnessStatus === 'offline') {
                        status = 'offline';
                    } else if (freshnessStatus === 'stale') {
                        status = 'stale';
                    } else {
                        status = onlineMiners === totalMiners ? 'online' :
                            onlineMiners > 0 ? 'warning' : 'offline';
                    }
                }

                farmsList.push({
                    id: farmId,
                    name: farmId,
                    displayName: data.farm_name || farmId,
                    status: status,
                    freshness: freshnessStatus,
                    miners: totalMiners,
                    onlineMiners: onlineMiners,
                    hashrate: hashrate,
                    containers: totalContainers,
                    lastUpdate: data.last_update,
                    exists: true,
                    dataStatus: freshnessStatus,
                    data: data // Сохраняем полные данные для отладки
                });

                // Сбрасываем счетчик попыток при успехе
                delete newRetryCount[farmId];
            } else {
                console.log(`❌ Нет данных для ${farmId}`);

                // Увеличиваем счетчик попыток
                newRetryCount[farmId] = (newRetryCount[farmId] || 0) + 1;

                farmsList.push({
                    id: farmId,
                    name: farmId,
                    displayName: farmId,
                    status: 'not-found',
                    freshness: 'offline',
                    miners: 0,
                    onlineMiners: 0,
                    hashrate: 0,
                    containers: 0,
                    lastUpdate: null,
                    exists: false,
                    dataStatus: 'offline',
                    retryCount: newRetryCount[farmId]
                });
            }
        }

        setRetryCount(newRetryCount);
        console.log('✅ Фермы загружены:', farmsList);
        setFarms(farmsList);
        setLoading(false);
    };

    // Повторная попытка загрузить конкретную ферму
    const retryFarm = async (farmId) => {
        console.log(`🔄 Повторная попытка для ${farmId}`);
        setLoading(true);

        const data = await loadFarmData(farmId);

        if (data) {
            // Обновляем список ферм
            await loadAccessibleFarms();
        } else {
            alert(`❌ Не удалось загрузить данные для фермы ${farmId}. Файл все еще не доступен.`);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccessibleFarms();

        // Обновляем каждые 30 секунд для повторных попыток
        const interval = setInterval(() => {
            // Проверяем есть ли фермы с ошибками
            const hasErrors = farms.some(f => !f.exists && f.retryCount < 5);
            if (hasErrors) {
                console.log('🔄 Повторная попытка загрузки ошибочных ферм...');
                loadAccessibleFarms();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [currentUser]);

    const handleFarmClick = (farmName) => {
        console.log('➡️ Переход к ферме:', farmName);
        navigate(`/farm/${farmName}/dashboard`);
    };

    const handleLogoutClick = () => {
        console.log('🚪 Выход из системы');
        onLogout();
        navigate('/login');
    };

    const handleManualRefresh = () => {
        console.log('🔄 Ручное обновление');
        loadAccessibleFarms();
    };

    const getStatusInfo = (status, freshness) => {
        if (freshness === 'offline') {
            return { text: 'OFFLINE', class: 'offline', subtext: 'Нет связи >30мин' };
        } else if (freshness === 'stale') {
            return { text: 'УСТАРЕЛО', class: 'stale', subtext: 'Данные старые' };
        }

        switch (status) {
            case 'online':
                return { text: 'ОНЛАЙН', class: 'online', subtext: 'Все системы в норме' };
            case 'warning':
                return { text: 'ПРОБЛЕМЫ', class: 'warning', subtext: 'Есть неисправности' };
            case 'offline':
                return { text: 'ОФФЛАЙН', class: 'offline', subtext: 'Нет работающих майнеров' };
            case 'empty':
                return { text: 'ПУСТО', class: 'empty', subtext: 'Нет майнеров' };
            case 'not-found':
                return { text: 'НЕ НАЙДЕНО', class: 'not-found', subtext: 'Файл данных отсутствует' };
            default:
                return { text: 'НЕИЗВЕСТНО', class: 'unknown', subtext: 'Статус не определен' };
        }
    };

    const getStatusIcon = (status, freshness) => {
        if (freshness === 'offline') return '🔴';
        if (freshness === 'stale') return '🟡';

        switch (status) {
            case 'online': return '🟢';
            case 'warning': return '🟡';
            case 'offline': return '🔴';
            case 'empty': return '⚪';
            case 'not-found': return '❌';
            default: return '❓';
        }
    };

    const formatHashrate = (hashrate) => {
        if (hashrate >= 1000) {
            return `${(hashrate / 1000).toFixed(1)} PH/s`;
        }
        return `${hashrate.toFixed(1)} TH/s`;
    };

    const formatLastUpdate = (lastUpdate, dataStatus) => {
        if (!lastUpdate) return 'Нет данных';

        if (dataStatus === 'offline') {
            return `🔄 ${lastUpdate} (OFFLINE)`;
        } else if (dataStatus === 'stale') {
            return `⏳ ${lastUpdate} (Устарело)`;
        }

        return `✅ ${lastUpdate}`;
    };

    // Функция для прямой проверки файла
    const handleCheckFile = async (farmId) => {
        const url = getFarmUrl(farmId);
        const exists = await checkFileExists(url);

        if (exists) {
            alert(`✅ Файл ${farmId} существует!\nURL: ${url}\nПопробуйте открыть его напрямую.`);
            // Открываем в новой вкладке
            window.open(url, '_blank');
        } else {
            alert(`❌ Файл ${farmId} не найден!\nURL: ${url}`);
        }
    };

    return (
        <div className="farm-selection">
            <div className="background-glow"></div>

            <div className="hero-section">
                <h1 className="hero-title">MINING MONITOR</h1>
                <p className="hero-subtitle">
                    Добро пожаловать, {currentUser?.name || 'пользователь'}!
                    {currentUser?.role && (
                        <span className="user-role">
                            {' '}
                            ({currentUser.role === 'admin' ? '👑 Администратор' :
                            currentUser.role === 'technician' ? '🔧 Техник' : '👀 Наблюдатель'})
                        </span>
                    )}
                </p>
                <div className="status-legend">
                    <div className="legend-item">
                        <span className="legend-icon">🟢</span>
                        <span>ОНЛАЙН</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-icon">🟡</span>
                        <span>УСТАРЕЛО/ПРОБЛЕМЫ</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-icon">🔴</span>
                        <span>OFFLINE</span>
                    </div>
                </div>
            </div>

            {currentUser?.farms?.length === 0 ? (
                <div className="no-farms-message">
                    <h2>🚫 Нет доступных ферм</h2>
                    <p>Обратитесь к администратору для получения доступа</p>
                </div>
            ) : (
                <div className="farms-grid">
                    {farms.map(farm => {
                        const status = getStatusInfo(farm.status, farm.freshness);
                        const statusIcon = getStatusIcon(farm.status, farm.freshness);

                        return (
                            <div
                                key={farm.id}
                                className={`farm-card ${status.class} ${farm.retryCount > 2 ? 'persistent-error' : ''}`}
                            >
                                <div className="farm-accent"></div>

                                <div className="farm-content">
                                    <div className="farm-header">
                                        <div className="farm-icon">
                                            <div className="icon-wrapper">
                                                {farm.exists ? '⚡' : '❌'}
                                            </div>
                                        </div>
                                        <div className="farm-titles">
                                            <h3 className="farm-name">{farm.id}</h3>
                                            <div className="farm-display-name">
                                                {farm.displayName}
                                            </div>
                                            {farm.retryCount > 0 && (
                                                <div className="retry-badge" title={`Попыток: ${farm.retryCount}`}>
                                                    🔄 {farm.retryCount}
                                                </div>
                                            )}
                                        </div>
                                        <div className="status-icon">
                                            {statusIcon}
                                        </div>
                                    </div>

                                    <div className={`status-indicator ${status.class}`}>
                                        <span className="status-text">{status.text}</span>
                                        <span className="status-subtext">{status.subtext}</span>
                                    </div>

                                    {farm.exists ? (
                                        <>
                                            <div className="stats-grid">
                                                <div className="stat-item">
                                                    <div className="stat-value">{farm.onlineMiners}/{farm.miners}</div>
                                                    <div className="stat-label">МАЙНЕРЫ</div>
                                                    <div className="stat-progress">
                                                        <div
                                                            className="progress-bar"
                                                            style={{
                                                                width: `${farm.miners > 0 ? (farm.onlineMiners / farm.miners) * 100 : 0}%`,
                                                                backgroundColor: farm.freshness === 'offline' ? '#ff4444' :
                                                                    farm.freshness === 'stale' ? '#ffc107' : '#00ff88'
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="stat-item">
                                                    <div className="stat-value">{formatHashrate(farm.hashrate)}</div>
                                                    <div className="stat-label">ХЕШРЕЙТ</div>
                                                    <div className={`hashrate-status ${farm.freshness}`}>
                                                        {farm.freshness === 'offline' ? 'OFFLINE' :
                                                            farm.freshness === 'stale' ? 'УСТАРЕЛО' : 'АКТИВЕН'}
                                                    </div>
                                                </div>
                                                <div className="stat-item">
                                                    <div className="stat-value">{farm.containers}</div>
                                                    <div className="stat-label">КОНТЕЙНЕРЫ</div>
                                                </div>
                                            </div>

                                            {farm.lastUpdate && (
                                                <div className="update-info">
                                                    <div className={`update-text ${farm.dataStatus}`}>
                                                        {formatLastUpdate(farm.lastUpdate, farm.dataStatus)}
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                className={`action-button ${farm.dataStatus}`}
                                                onClick={() => handleFarmClick(farm.id)}
                                            >
                                                {farm.dataStatus === 'offline' ? 'ПРОВЕРИТЬ СВЯЗЬ' :
                                                    farm.dataStatus === 'stale' ? 'ОБНОВИТЬ ДАННЫЕ' : 'ОТКРЫТЬ ДАШБОРД'}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="error-state">
                                            <div className="error-text">Файл данных не найден</div>
                                            <div className="error-subtext">
                                                {farm.retryCount > 3
                                                    ? 'Проблема с кэшем GitHub. Попробуйте:'
                                                    : 'Проверьте настройки фермы'}
                                            </div>
                                            {farm.retryCount > 3 && (
                                                <div className="error-help">
                                                    <p>1. Откройте файл напрямую:</p>
                                                    <code
                                                        className="file-link"
                                                        onClick={() => window.open(getFarmUrl(farm.id), '_blank')}
                                                    >
                                                        {getFarmUrl(farm.id)}
                                                    </code>
                                                    <p>2. Нажмите Ctrl+F5 для жесткой перезагрузки</p>
                                                    <p>3. Подождите 5-10 минут (кэш GitHub обновится)</p>
                                                </div>
                                            )}
                                            <div className="error-actions">
                                                <button
                                                    className="retry-small"
                                                    onClick={() => retryFarm(farm.id)}
                                                >
                                                    🔄 ПОВТОРИТЬ
                                                </button>
                                                <button
                                                    className="check-small"
                                                    onClick={() => handleCheckFile(farm.id)}
                                                >
                                                    🔍 ПРОВЕРИТЬ ФАЙЛ
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="control-panel">
                <div className="panel-content">
                    <div className="panel-info">
                        <div className="info-item">
                            <span className="info-label">ВАШИ ФЕРМЫ:</span>
                            <span className="info-value">{farms.length}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">ОНЛАЙН:</span>
                            <span className="info-value online">
                                {farms.filter(f => f.exists && f.dataStatus === 'fresh' && f.status === 'online').length}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">ПРОБЛЕМЫ:</span>
                            <span className="info-value warning">
                                {farms.filter(f => f.exists && (
                                    f.dataStatus === 'stale' ||
                                    (f.dataStatus === 'fresh' && f.status === 'warning')
                                )).length}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">OFFLINE:</span>
                            <span className="info-value offline">
                                {farms.filter(f => !f.exists || f.dataStatus === 'offline' || f.status === 'offline').length}
                            </span>
                        </div>
                    </div>

                    <div className="panel-actions">
                        <button
                            className={`refresh-button ${loading ? 'loading' : ''}`}
                            onClick={handleManualRefresh}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    ОБНОВЛЕНИЕ...
                                </>
                            ) : (
                                '🔄 ОБНОВИТЬ'
                            )}
                        </button>

                        <button
                            className="debug-button"
                            onClick={() => {
                                console.log('📊 Текущее состояние:', farms);
                                console.log('👤 Пользователь:', currentUser);
                                alert('Данные в консоли (F12)');
                            }}
                            title="Отладка"
                        >
                            🐛
                        </button>

                        <button
                            className="logout-button-nav"
                            onClick={handleLogoutClick}
                        >
                            🚪 ВЫЙТИ
                        </button>
                    </div>
                </div>
            </div>

            {/* Подсказка при проблемах с кэшем */}
            {farms.some(f => !f.exists && f.retryCount > 2) && (
                <div className="cache-warning">
                    <p>⚠️ Возможно проблема с кэшем GitHub. Файлы существуют, но не загружаются.</p>
                    <p>💡 Решение: Откройте файл напрямую, нажмите Ctrl+F5, подождите 5-10 минут.</p>
                </div>
            )}
        </div>
    );
};

export default FarmSelection;