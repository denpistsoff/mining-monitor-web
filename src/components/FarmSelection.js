// src/components/FarmSelection.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authManager from '../utils/auth';
import '../styles/components/FarmSelection.css';

const FarmSelection = ({ currentUser, onLogout }) => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Маппинг ID ферм к URL
    const FARM_FILES = {
        'box-111': 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_box-111.json',
        'VISOKOVKA': 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_VISOKOVKA.json',
        'HOME': 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_home.json',
        'SARATOV': 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_SARATOV.json'
    };

    // Функция определения статуса фермы на основе данных
    const determineFarmStatus = (data) => {
        if (!data || !data.containers) {
            return {
                status: 'offline',
                text: 'НЕТ ДАННЫХ',
                icon: '❌',
                class: 'offline'
            };
        }

        // Собираем статистику по всем контейнерам
        const containers = Object.values(data.containers);
        let totalMiners = 0;
        let onlineMiners = 0;
        let problematicMiners = 0;

        containers.forEach(container => {
            totalMiners += container.total_miners || 0;
            onlineMiners += container.online_miners || 0;
            problematicMiners += container.problematic_count || 0;
        });

        // Определяем статус
        if (totalMiners === 0) {
            return {
                status: 'empty',
                text: 'ПУСТО',
                icon: '⚪',
                class: 'empty',
                stats: { totalMiners, onlineMiners, problematicMiners }
            };
        }

        if (onlineMiners === 0) {
            return {
                status: 'offline',
                text: 'ОФФЛАЙН',
                icon: '🔴',
                class: 'offline',
                stats: { totalMiners, onlineMiners, problematicMiners }
            };
        }

        if (onlineMiners < totalMiners || problematicMiners > 0) {
            return {
                status: 'warning',
                text: 'ЕСТЬ ПРОБЛЕМЫ',
                icon: '🟡',
                class: 'warning',
                stats: { totalMiners, onlineMiners, problematicMiners }
            };
        }

        return {
            status: 'online',
            text: 'ОНЛАЙН',
            icon: '🟢',
            class: 'online',
            stats: { totalMiners, onlineMiners, problematicMiners }
        };
    };

    // Проверка свежести данных
    const getDataFreshness = (data) => {
        if (!data) return { status: 'offline', text: 'Нет данных' };

        // Получаем время данных
        let dataTime = null;

        if (data.timestamp) {
            // timestamp в секундах
            dataTime = new Date(data.timestamp * 1000);
        } else if (data.last_update) {
            // Парсим строку даты
            try {
                dataTime = new Date(data.last_update.replace(' ', 'T'));
            } catch {
                dataTime = new Date(data.last_update);
            }
        }

        if (!dataTime || isNaN(dataTime.getTime())) {
            return { status: 'unknown', text: 'Время неизвестно' };
        }

        const now = new Date();
        const diffMinutes = (now - dataTime) / (1000 * 60);

        if (diffMinutes > 60) {
            return { status: 'offline', text: '>60 мин', icon: '🔴' };
        } else if (diffMinutes > 30) {
            return { status: 'stale', text: '30-60 мин', icon: '🟡' };
        } else {
            return { status: 'fresh', text: '<30 мин', icon: '🟢' };
        }
    };

    const loadFarmData = async (farmId) => {
        const url = FARM_FILES[farmId];
        if (!url) return null;

        try {
            const response = await fetch(`${url}?t=${Date.now()}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                console.log(`❌ ${farmId}: статус ${response.status}`);
                return null;
            }

            const data = await response.json();

            // Определяем статус фермы
            const farmStatus = determineFarmStatus(data);
            const freshness = getDataFreshness(data);

            console.log(`📊 ${farmId}:`, {
                farmStatus: farmStatus.text,
                freshness: freshness.text,
                miners: farmStatus.stats
            });

            return {
                id: farmId,
                name: data.farm_name || farmId,
                displayName: farmId,
                status: farmStatus.status,
                statusText: farmStatus.text,
                statusIcon: farmStatus.icon,
                statusClass: farmStatus.class,
                freshness: freshness.status,
                freshnessText: freshness.text,
                freshnessIcon: freshness.icon,
                stats: farmStatus.stats,
                lastUpdate: data.last_update,
                containers: Object.keys(data.containers || {}).length,
                exists: true
            };
        } catch (error) {
            console.error(`❌ ${farmId}:`, error.message);
            return null;
        }
    };

    useEffect(() => {
        const loadAllFarms = async () => {
            if (!currentUser?.farms?.length) {
                setFarms([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            console.log('📥 Загрузка ферм для:', currentUser.name);

            const loadedFarms = [];

            for (const farmId of currentUser.farms) {
                const farm = await loadFarmData(farmId);
                if (farm) {
                    loadedFarms.push(farm);
                } else {
                    loadedFarms.push({
                        id: farmId,
                        name: farmId,
                        displayName: farmId,
                        status: 'offline',
                        statusText: 'НЕ ДОСТУПНА',
                        statusIcon: '❌',
                        statusClass: 'offline',
                        freshness: 'offline',
                        exists: false
                    });
                }
            }

            setFarms(loadedFarms);
            setLoading(false);
        };

        loadAllFarms();
        const interval = setInterval(loadAllFarms, 30000); // Обновление каждые 30 секунд

        return () => clearInterval(interval);
    }, [currentUser]);

    const handleFarmClick = (farm) => {
        if (farm.exists) {
            navigate(`/farm/${farm.id}/dashboard`);
        }
    };

    const formatHashrate = (stats) => {
        if (!stats) return '0 TH/s';
        // Хешрейт считается на основе данных из контейнеров
        // Пока вернем заглушку
        return '150 TH/s';
    };

    if (loading) {
        return (
            <div className="farm-selection loading-screen">
                <div className="loading-spinner"></div>
                <p>Загрузка ферм...</p>
            </div>
        );
    }

    return (
        <div className="farm-selection">
            <div className="header">
                <h1>MINING MONITOR</h1>
                <div className="user-info">
                    <span className="user-name">{currentUser?.name}</span>
                    <span className="user-role">
                        {currentUser?.role === 'admin' ? '👑' :
                            currentUser?.role === 'technician' ? '🔧' : '👀'}
                    </span>
                </div>
            </div>

            <div className="farms-grid">
                {farms.map(farm => (
                    <div
                        key={farm.id}
                        className={`farm-card ${farm.statusClass} ${!farm.exists ? 'disabled' : ''}`}
                        onClick={() => handleFarmClick(farm)}
                    >
                        <div className="farm-header">
                            <h3>{farm.displayName}</h3>
                            <span className="status-icon">{farm.statusIcon}</span>
                        </div>

                        <div className="status-badge">
                            {farm.statusText}
                            {farm.freshnessIcon && (
                                <span className="freshness" title={`Обновление: ${farm.freshnessText}`}>
                                    {farm.freshnessIcon}
                                </span>
                            )}
                        </div>

                        {farm.exists ? (
                            <div className="farm-details">
                                <div className="stat-row">
                                    <span>Майнеры:</span>
                                    <strong>{farm.stats?.onlineMiners || 0}/{farm.stats?.totalMiners || 0}</strong>
                                </div>
                                {farm.stats?.problematicMiners > 0 && (
                                    <div className="stat-row warning">
                                        <span>Проблемные:</span>
                                        <strong>{farm.stats.problematicMiners}</strong>
                                    </div>
                                )}
                                <div className="stat-row">
                                    <span>Контейнеры:</span>
                                    <strong>{farm.containers || 0}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Хешрейт:</span>
                                    <strong>{formatHashrate(farm.stats)}</strong>
                                </div>
                                {farm.lastUpdate && (
                                    <div className="update-time" title={farm.lastUpdate}>
                                        ⏱️ {new Date(farm.lastUpdate).toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="error-message">
                                Файл данных не найден
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="footer">
                <button className="refresh-btn" onClick={() => window.location.reload()}>
                    🔄 Обновить
                </button>
                <button className="logout-btn" onClick={onLogout}>
                    🚪 Выйти
                </button>
            </div>
        </div>
    );
};

export default FarmSelection;