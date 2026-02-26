// src/components/FarmSelection.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authManager from '../utils/auth';
import '../styles/components/FarmSelection.css';

const FarmSelection = ({ currentUser, onLogout }) => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState(null);
    const navigate = useNavigate();

    const FARM_FILES = {
        VISOKOVKA: 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_VISOKOVKA.json',
        HOME: 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_home.json',
        SARATOV: 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_SARATOV.json'
    };

    // Функция проверки свежести данных
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

    const loadFarmData = async (farmId) => {
        const url = FARM_FILES[farmId];
        if (!url) return null;

        try {
            const response = await fetch(url + '?t=' + Date.now());
            if (response.ok) {
                const data = await response.json();
                const freshness = checkDataFreshness(data);
                return { ...data, _dataStatus: freshness };
            }
        } catch (error) {
            console.error(`Ошибка загрузки ${farmId}:`, error);
        }
        return null;
    };

    const loadAccessibleFarms = async () => {
        if (!currentUser || !currentUser.farms || currentUser.farms.length === 0) {
            setFarms([]);
            return;
        }

        setLoading(true);

        const farmsList = [];

        for (const farmId of currentUser.farms) {
            const data = await loadFarmData(farmId);

            if (data) {
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
                    dataStatus: freshnessStatus
                });
            } else {
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
                    dataStatus: 'offline'
                });
            }
        }

        setFarms(farmsList);
        setLoading(false);
    };

    useEffect(() => {
        loadAccessibleFarms();
        const interval = setInterval(loadAccessibleFarms, 60000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleFarmClick = (farmName) => {
        navigate(`/farm/${farmName}/dashboard`);
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
                                className={`farm-card ${status.class}`}
                                onClick={() => handleFarmClick(farm.id)}
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

                                            <button className={`action-button ${farm.dataStatus}`}>
                                                {farm.dataStatus === 'offline' ? 'ПРОВЕРИТЬ СВЯЗЬ' :
                                                    farm.dataStatus === 'stale' ? 'ОБНОВИТЬ ДАННЫЕ' : 'ОТКРЫТЬ ДАШБОРД'}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="error-state">
                                            <div className="error-text">Файл данных не найден</div>
                                            <div className="error-subtext">Проверьте настройки фермы</div>
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

                    <button
                        className={`refresh-button ${loading ? 'loading' : ''}`}
                        onClick={loadAccessibleFarms}
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
                        className="logout-button-nav"
                        onClick={onLogout}
                    >
                        🚪 ВЫЙТИ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FarmSelection;