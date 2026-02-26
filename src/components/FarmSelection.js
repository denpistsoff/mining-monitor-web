// src/components/FarmSelection.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authManager from '../utils/auth';
import '../styles/components/FarmSelection.css';

const FarmSelection = ({ currentUser, onLogout }) => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/';

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

        if (diffMinutes > 60) return 'offline';
        if (diffMinutes > 30) return 'stale';
        return 'fresh';
    };

    const loadFarmData = async (farmId) => {
        const url = `${GITHUB_RAW_URL}farm_data_${farmId}.json?t=${Date.now()}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) return null;

            const data = await response.json();
            const freshness = checkDataFreshness(data);
            return { ...data, _dataStatus: freshness };
        } catch (error) {
            console.error(`Ошибка загрузки ${farmId}:`, error);
            return null;
        }
    };

    const loadFarms = async () => {
        if (!currentUser?.farms?.length) {
            setFarms([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        console.log('📥 Загрузка ферм для пользователя:', currentUser);

        const farmsList = [];

        for (const farmId of currentUser.farms) {
            console.log(`🔍 Загрузка: ${farmId}`);
            const data = await loadFarmData(farmId);

            if (data) {
                const containers = data.containers || {};
                const containerList = Object.values(containers);

                farmsList.push({
                    id: farmId,
                    name: farmId,
                    displayName: data.farm_name || farmId,
                    status: data._dataStatus === 'fresh' ? 'online' : data._dataStatus,
                    freshness: data._dataStatus,
                    miners: containerList.reduce((sum, c) => sum + (c.total_miners || 0), 0),
                    onlineMiners: containerList.reduce((sum, c) => sum + (c.online_miners || 0), 0),
                    hashrate: containerList.reduce((sum, c) => sum + (c.total_hashrate || 0), 0),
                    containers: Object.keys(containers).length,
                    lastUpdate: data.last_update,
                    exists: true
                });
            } else {
                farmsList.push({
                    id: farmId,
                    name: farmId,
                    displayName: farmId,
                    status: 'offline',
                    freshness: 'offline',
                    miners: 0,
                    onlineMiners: 0,
                    hashrate: 0,
                    containers: 0,
                    lastUpdate: null,
                    exists: false
                });
            }
        }

        console.log('✅ Фермы загружены:', farmsList);
        setFarms(farmsList);
        setLoading(false);
    };

    useEffect(() => {
        loadFarms();
        const interval = setInterval(loadFarms, 60000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleFarmClick = (farmName) => {
        navigate(`/farm/${farmName}/dashboard`);
    };

    const getStatusInfo = (status, freshness) => {
        if (freshness === 'offline' || status === 'offline') {
            return { text: 'OFFLINE', class: 'offline', subtext: 'Нет данных' };
        }
        if (freshness === 'stale') {
            return { text: 'УСТАРЕЛО', class: 'stale', subtext: 'Данные старше 30 мин' };
        }
        return { text: 'ОНЛАЙН', class: 'online', subtext: 'Работает' };
    };

    const getStatusIcon = (status, freshness) => {
        if (freshness === 'offline' || status === 'offline') return '🔴';
        if (freshness === 'stale') return '🟡';
        return '🟢';
    };

    const formatHashrate = (hashrate) => {
        if (hashrate >= 1000) return `${(hashrate / 1000).toFixed(1)} PH/s`;
        return `${hashrate.toFixed(1)} TH/s`;
    };

    if (loading) {
        return (
            <div className="farm-selection">
                <div className="loading">Загрузка ферм...</div>
            </div>
        );
    }

    return (
        <div className="farm-selection">
            <div className="hero-section">
                <h1 className="hero-title">MINING MONITOR</h1>
                <p className="hero-subtitle">
                    {currentUser?.name || 'Пользователь'}
                    {currentUser?.role && ` • ${currentUser.role === 'admin' ? 'Админ' :
                        currentUser.role === 'technician' ? 'Техник' : 'Наблюдатель'}`}
                </p>
            </div>

            {!currentUser?.farms?.length ? (
                <div className="no-farms">
                    <h2>Нет доступных ферм</h2>
                    <p>Обратитесь к администратору</p>
                </div>
            ) : (
                <div className="farms-grid">
                    {farms.map(farm => {
                        const status = getStatusInfo(farm.status, farm.freshness);
                        const icon = getStatusIcon(farm.status, farm.freshness);

                        return (
                            <div
                                key={farm.id}
                                className={`farm-card ${status.class}`}
                                onClick={() => farm.exists && handleFarmClick(farm.id)}
                            >
                                <div className="farm-header">
                                    <h3>{farm.displayName}</h3>
                                    <span className="status-icon">{icon}</span>
                                </div>

                                <div className="status-badge">{status.text}</div>

                                {farm.exists ? (
                                    <div className="farm-stats">
                                        <div>Майнеры: {farm.onlineMiners}/{farm.miners}</div>
                                        <div>Хешрейт: {formatHashrate(farm.hashrate)}</div>
                                        <div>Контейнеры: {farm.containers}</div>
                                        <div className="update-time">{farm.lastUpdate}</div>
                                    </div>
                                ) : (
                                    <div className="error-message">
                                        Нет данных
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="control-panel">
                <button className="refresh-button" onClick={loadFarms} disabled={loading}>
                    {loading ? '🔄' : '🔄 Обновить'}
                </button>
                <button className="logout-button" onClick={onLogout}>
                    🚪 Выйти
                </button>
            </div>
        </div>
    );
};

export default FarmSelection;