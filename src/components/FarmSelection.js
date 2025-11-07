import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const navigate = useNavigate();

    // Функция для проверки существования файла фермы
    const checkFarmFile = async (farmName) => {
        try {
            const response = await fetch(`/data/farm_data_${farmName}.json?t=${Date.now()}`);
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    // Загружаем данные фермы
    const loadFarmData = async (farmName) => {
        try {
            const response = await fetch(`/data/farm_data_${farmName}.json?t=${Date.now()}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error(`Ошибка загрузки ${farmName}:`, error);
        }
        return null;
    };

    // Основная функция загрузки всех ферм
    const loadAllFarms = async () => {
        setLoading(true);
        console.log('🔄 Загружаем фермы...');

        try {
            // Список ферм для проверки (добавляй сюда новые)
            const farmNamesToCheck = [
                'VISOKOVKA',
                'DESKTOP-TO75OLC',
                'FARM1',
                'FARM2',
                'MAIN'
            ];

            const farmsData = [];

            // Проверяем каждую ферму
            for (const farmName of farmNamesToCheck) {
                console.log(`🔍 Проверяем ферму: ${farmName}`);

                const exists = await checkFarmFile(farmName);
                console.log(`   Файл существует: ${exists}`);

                if (exists) {
                    const farmData = await loadFarmData(farmName);
                    console.log(`   Данные загружены:`, farmData);

                    if (farmData) {
                        // Ферма с данными
                        const containers = farmData.containers || {};
                        const containerArray = Object.values(containers);

                        const onlineMiners = containerArray.reduce((sum, container) =>
                            sum + (container.online_miners || 0), 0);

                        const totalMiners = containerArray.reduce((sum, container) =>
                            sum + (container.total_miners || 0), 0);

                        const hashrate = containerArray.reduce((sum, container) =>
                            sum + (container.total_hashrate || 0), 0);

                        let status = 'empty';
                        if (totalMiners > 0) {
                            if (onlineMiners === totalMiners) {
                                status = 'online';
                            } else if (onlineMiners > 0) {
                                status = 'warning';
                            } else {
                                status = 'offline';
                            }
                        }

                        farmsData.push({
                            name: farmName,
                            miners: totalMiners,
                            onlineMiners: onlineMiners,
                            hashrate: hashrate,
                            status: status,
                            lastUpdate: farmData.last_update,
                            hasData: true
                        });
                    } else {
                        // Файл есть, но данные не загрузились
                        farmsData.push({
                            name: farmName,
                            miners: 0,
                            onlineMiners: 0,
                            hashrate: 0,
                            status: 'error',
                            lastUpdate: null,
                            hasData: false
                        });
                    }
                } else {
                    // Файла нет - все равно показываем
                    farmsData.push({
                        name: farmName,
                        miners: 0,
                        onlineMiners: 0,
                        hashrate: 0,
                        status: 'not-found',
                        lastUpdate: null,
                        hasData: false
                    });
                }
            }

            console.log('📊 Результат:', farmsData);
            setFarms(farmsData);
            setLastUpdate(new Date().toLocaleTimeString('ru-RU'));

        } catch (error) {
            console.error('❌ Ошибка загрузки ферм:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllFarms();
        const interval = setInterval(loadAllFarms, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleFarmSelect = (farmName) => {
        navigate(`/farm/${farmName}/dashboard`);
    };

    const handleRefresh = () => {
        loadAllFarms();
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'online':
                return { icon: '🟢', text: 'Онлайн', color: 'online' };
            case 'warning':
                return { icon: '🟡', text: 'Проблемы', color: 'warning' };
            case 'offline':
                return { icon: '🔴', text: 'Офлайн', color: 'offline' };
            case 'empty':
                return { icon: '⚪', text: 'Нет майнеров', color: 'empty' };
            case 'error':
                return { icon: '❌', text: 'Ошибка данных', color: 'error' };
            case 'not-found':
                return { icon: '🔍', text: 'Файл не найден', color: 'not-found' };
            default:
                return { icon: '❓', text: 'Неизвестно', color: 'unknown' };
        }
    };

    return (
        <div className="farm-selection">
            <div className="selection-header">
                <div className="header-top">
                    <div>
                        <h1>🏭 Выбор площадки</h1>
                        <p>Все проверяемые фермы</p>
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
                    <span>Проверено: <strong>{farms.length}</strong></span>
                    {lastUpdate && <span>Обновлено: <strong>{lastUpdate}</strong></span>}
                    <span>Путь: <strong>/data/</strong></span>
                </div>
            </div>

            {/* Сетка ферм - показываем ВСЕ */}
            <div className="farms-grid">
                {farms.map((farm) => {
                    const statusInfo = getStatusInfo(farm.status);

                    return (
                        <div
                            key={farm.name}
                            className={`farm-card farm-${statusInfo.color}`}
                            onClick={() => handleFarmSelect(farm.name)}
                        >
                            <div className="farm-header">
                                <div className="farm-icon">
                                    {farm.hasData ? '⛏️' : '📁'}
                                </div>
                                <div className="farm-info">
                                    <h3>{farm.name}</h3>
                                    <span className={`farm-status farm-${statusInfo.color}`}>
                                        {statusInfo.icon} {statusInfo.text}
                                    </span>
                                    {farm.lastUpdate && (
                                        <div className="farm-update-time">
                                            📅 {farm.lastUpdate}
                                        </div>
                                    )}
                                    {!farm.hasData && (
                                        <div className="farm-help">
                                            Файл: farm_data_{farm.name}.json
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="farm-stats">
                                <div className="farm-stat">
                                    <span className="stat-label">Майнеры</span>
                                    <span className="stat-value">
                                        {farm.miners > 0 ? `${farm.onlineMiners}/${farm.miners}` : '0'}
                                    </span>
                                </div>
                                <div className="farm-stat">
                                    <span className="stat-label">Хешрейт</span>
                                    <span className="stat-value">
                                        {farm.hashrate > 0 ? `${farm.hashrate.toFixed(2)}` : '0'} TH/s
                                    </span>
                                </div>
                            </div>

                            <div className="farm-actions">
                                <button className={`btn ${farm.hasData ? 'btn-primary' : 'btn-secondary'}`}>
                                    {farm.hasData ? '📊 Мониторинг' : '👀 Просмотр'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Информация о проверяемых фермах */}
            <div className="farm-list-info">
                <h4>🔍 Проверяемые фермы:</h4>
                <div className="farm-names-list">
                    {farms.map(farm => (
                        <span key={farm.name} className="farm-name-tag">
                            {farm.name}
                        </span>
                    ))}
                </div>
                <p style={{marginTop: '10px', fontSize: '0.9rem', color: '#666'}}>
                    Файлы ищутся в: <code>public/data/farm_data_НАЗВАНИЕ.json</code>
                </p>
            </div>

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Загрузка списка ферм...</p>
                </div>
            )}
        </div>
    );
};

export default FarmSelection;