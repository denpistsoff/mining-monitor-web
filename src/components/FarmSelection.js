import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const navigate = useNavigate();
    const farmsCacheRef = useRef(new Map());

    const loadFarms = async (force = false) => {
        try {
            setLoading(true);

            const indexPaths = [
                `/data/farms_index.json?t=${Date.now()}`,
                `./data/farms_index.json?t=${Date.now()}`,
                `/mining-monitor-web/data/farms_index.json?t=${Date.now()}`
            ];

            let farmsList = [];
            let indexData = null;

            // Загружаем индекс ферм
            for (const path of indexPaths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        indexData = await response.json();
                        farmsList = indexData.farms || [];
                        console.log('✅ Loaded farms index:', farmsList.length, 'farms');
                        break;
                    }
                } catch (e) {
                    console.log(`Failed to load index from ${path}:`, e);
                }
            }

            // Если индекс не найден, сканируем файлы
            if (farmsList.length === 0) {
                console.log('Scanning for farm files...');
                farmsList = await scanForFarmFiles();
            }

            // Загружаем данные для каждой фермы
            const farmsWithData = await Promise.all(
                farmsList.map(async (farm) => {
                    const cacheKey = farm.name;

                    // Проверяем кеш (обновляем каждые 30 секунд)
                    const cached = farmsCacheRef.current.get(cacheKey);
                    const now = Date.now();
                    if (!force && cached && (now - cached.timestamp < 30000)) {
                        return cached.data;
                    }

                    try {
                        const farmResponse = await fetch(`/data/farm_data_${farm.name}.json?t=${now}`);
                        if (farmResponse.ok) {
                            const farmData = await farmResponse.json();

                            const stats = calculateFarmStats(farmData);
                            const farmInfo = {
                                name: farm.name,
                                ...stats,
                                lastUpdate: farmData.last_update || farmData.timestamp
                            };

                            // Сохраняем в кеш
                            farmsCacheRef.current.set(cacheKey, {
                                data: farmInfo,
                                timestamp: now
                            });

                            return farmInfo;
                        }
                    } catch (e) {
                        console.error(`Error loading farm ${farm.name}:`, e);
                    }
                    return null;
                })
            );

            const validFarms = farmsWithData.filter(farm => farm !== null);
            setFarms(validFarms);
            setLastUpdate(new Date().toLocaleTimeString('ru-RU'));

            if (validFarms.length === 0 && !force) {
                // Fallback для первой загрузки
                setTimeout(() => loadFarms(true), 5000);
            }

        } catch (error) {
            console.error('Error loading farms:', error);
            setError('Ошибка загрузки списка ферм');
        } finally {
            setLoading(false);
        }
    };

    const scanForFarmFiles = async () => {
        // Пробуем загрузить известные фермы
        const knownFarms = ['DESKTOP-TO75OLC', 'FARM-1', 'FARM-2', 'MAIN-FARM'];
        const foundFarms = [];

        for (const farmName of knownFarms) {
            try {
                const response = await fetch(`/data/farm_data_${farmName}.json?t=${Date.now()}`);
                if (response.ok) {
                    foundFarms.push({ name: farmName });
                }
            } catch (e) {
                // Файл не найден - пропускаем
            }
        }

        return foundFarms;
    };

    const calculateFarmStats = (farmData) => {
        const containers = farmData.containers || {};
        const containerArray = Object.values(containers);

        const onlineMiners = containerArray.reduce((sum, container) =>
            sum + (container.online_miners || 0), 0);

        const totalMiners = containerArray.reduce((sum, container) =>
            sum + (container.total_miners || 0), 0);

        const hashrate = containerArray.reduce((sum, container) =>
            sum + (container.total_hashrate || 0), 0);

        let status = 'offline';
        if (onlineMiners === totalMiners && totalMiners > 0) status = 'online';
        else if (onlineMiners > 0) status = 'warning';

        return {
            miners: totalMiners,
            onlineMiners: onlineMiners,
            hashrate: hashrate,
            status: status
        };
    };

    useEffect(() => {
        // Первая загрузка
        loadFarms(true);

        // Обновляем каждую минуту
        const interval = setInterval(() => {
            loadFarms();
        }, 60000); // 1 минута

        return () => clearInterval(interval);
    }, []);

    const handleFarmSelect = (farmName) => {
        navigate(`/farm/${farmName}/dashboard`);
    };

    const handleRefresh = () => {
        loadFarms(true);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'online': return '🟢';
            case 'warning': return '🟡';
            case 'offline': return '🔴';
            default: return '⚪';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'online': return 'Онлайн';
            case 'warning': return 'Проблемы';
            case 'offline': return 'Офлайн';
            default: return 'Неизвестно';
        }
    };

    if (loading && farms.length === 0) {
        return (
            <div className="farm-selection">
                <div className="loading">
                    <div className="loading-spinner large"></div>
                    <p>Загрузка списка ферм...</p>
                    <p style={{fontSize: '0.9rem', color: '#666'}}>
                        Данные обновляются автоматически каждую минуту
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="farm-selection">
            <div className="selection-header">
                <div className="header-top">
                    <div>
                        <h1>🏭 Выбор площадки</h1>
                        <p>Выберите ферму для мониторинга</p>
                    </div>
                    <button
                        className="btn btn-primary refresh-btn"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        {loading ? '🔄' : '🔄'} Обновить
                    </button>
                </div>

                <div className="header-stats">
                    <span>Найдено ферм: <strong>{farms.length}</strong></span>
                    {lastUpdate && (
                        <span>Обновлено: <strong>{lastUpdate}</strong></span>
                    )}
                    <span>Следующее обновление: <strong>через 1 минуту</strong></span>
                </div>
            </div>

            <div className="farms-grid">
                {farms.map((farm, index) => (
                    <div
                        key={farm.name}
                        className={`farm-card farm-${farm.status}`}
                        onClick={() => handleFarmSelect(farm.name)}
                    >
                        <div className="farm-header">
                            <div className="farm-icon">⛏️</div>
                            <div className="farm-info">
                                <h3>{farm.name}</h3>
                                <span className={`farm-status ${farm.status}`}>
                                    {getStatusIcon(farm.status)} {getStatusText(farm.status)}
                                </span>
                                {farm.lastUpdate && (
                                    <div className="farm-update-time">
                                        📅 {new Date(farm.lastUpdate).toLocaleString('ru-RU')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="farm-stats">
                            <div className="farm-stat">
                                <span className="stat-label">Майнеры</span>
                                <span className="stat-value">
                                    {farm.onlineMiners}/{farm.miners}
                                </span>
                            </div>
                            <div className="farm-stat">
                                <span className="stat-label">Хешрейт</span>
                                <span className="stat-value">{farm.hashrate.toFixed(2)} TH/s</span>
                            </div>
                        </div>

                        <div className="farm-actions">
                            <button className="btn btn-primary">
                                📊 Перейти к мониторингу
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {farms.length === 0 && !loading && (
                <div className="no-farms">
                    <div className="no-farms-icon">🏭</div>
                    <h3>Фермы не найдены</h3>
                    <p>Добавьте JSON файлы в папку <code>data/</code> на GitHub</p>
                    <p style={{fontSize: '0.9rem', color: '#888', marginTop: '10px'}}>
                        Система автоматически обнаружит новые фермы в течение 1 минуты
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={handleRefresh}
                        style={{marginTop: '15px'}}
                    >
                        🔄 Проверить снова
                    </button>
                </div>
            )}

            {farms.length > 0 && (
                <div className="auto-update-notice">
                    <p>🔄 Данные автоматически обновляются каждую минуту</p>
                    <p>Последнее обновление: {lastUpdate}</p>
                </div>
            )}
        </div>
    );
};

export default FarmSelection;