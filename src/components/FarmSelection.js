import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const navigate = useNavigate();

    // Правильные пути для JSON файлов (они лежат в public/data/)
    const loadFarmData = async (farmName) => {
        const paths = [
            `/data/farm_data_${farmName}.json?t=${Date.now()}`,  // Главный путь
            `./data/farm_data_${farmName}.json?t=${Date.now()}`, // Резервный путь
            `data/farm_data_${farmName}.json?t=${Date.now()}`    // Еще один вариант
        ];

        console.log(`🔍 Ищем ферму: ${farmName}`);

        for (const path of paths) {
            try {
                console.log(`   Пробуем: ${path}`);
                const response = await fetch(path);

                if (response.ok) {
                    const data = await response.json();
                    console.log(`   ✅ НАЙДЕНО: ${farmName} по пути ${path}`);
                    return data;
                } else {
                    console.log(`   ❌ Не найдено: ${path} (статус: ${response.status})`);
                }
            } catch (error) {
                console.log(`   ❌ Ошибка: ${path} - ${error.message}`);
            }
        }

        console.log(`   ❌ Ферма ${farmName} не найдена ни по одному пути`);
        return null;
    };

    // Сканируем все возможные фермы
    const scanForFarmFiles = async () => {
        console.log('🔍 Сканируем фермы...');

        // Список ферм для проверки (добавляй сюда новые имена)
        const farmNamesToCheck = [
            'VISOKOVKA',
            'DESKTOP-TO75OLC',
            'FARM1',
            'FARM2',
            'MAIN',
            'MINING',
            'WORKER'
        ];

        const foundFarms = [];

        // Проверяем каждую ферму
        for (const farmName of farmNamesToCheck) {
            const farmData = await loadFarmData(farmName);
            if (farmData) {
                foundFarms.push(farmName);
            }
        }

        console.log(`🎯 Найдено ферм: ${foundFarms.length}`, foundFarms);
        return foundFarms;
    };

    // Рассчитываем статистику фермы
    const calculateFarmStats = (farmData, farmName) => {
        if (!farmData) {
            return {
                miners: 0,
                onlineMiners: 0,
                hashrate: 0,
                status: 'unknown',
                isEmpty: true
            };
        }

        const containers = farmData.containers || {};
        const containerArray = Object.values(containers);

        const onlineMiners = containerArray.reduce((sum, container) =>
            sum + (container.online_miners || 0), 0);

        const totalMiners = containerArray.reduce((sum, container) =>
            sum + (container.total_miners || 0), 0);

        const hashrate = containerArray.reduce((sum, container) =>
            sum + (container.total_hashrate || 0), 0);

        let status = 'offline';
        let isEmpty = false;

        if (totalMiners === 0 && onlineMiners === 0) {
            status = 'empty';
            isEmpty = true;
        } else if (onlineMiners === totalMiners && totalMiners > 0) {
            status = 'online';
        } else if (onlineMiners > 0) {
            status = 'warning';
        }

        return {
            miners: totalMiners,
            onlineMiners: onlineMiners,
            hashrate: hashrate,
            status: status,
            isEmpty: isEmpty,
            lastUpdate: farmData.last_update,
            farmName: farmData.farm_name || farmName
        };
    };

    // Основная функция загрузки
    const loadAllFarms = async () => {
        setLoading(true);
        console.log('🔄 Начинаем загрузку ферм...');

        try {
            // 1. Находим все файлы ферм
            const farmNames = await scanForFarmFiles();

            // 2. Загружаем данные для каждой фермы
            const farmsData = [];

            for (const farmName of farmNames) {
                const farmData = await loadFarmData(farmName);
                const stats = calculateFarmStats(farmData, farmName);

                farmsData.push({
                    name: farmName,
                    ...stats
                });
            }

            // 3. Сортируем по имени
            farmsData.sort((a, b) => a.name.localeCompare(b.name));

            setFarms(farmsData);
            setLastUpdate(new Date().toLocaleTimeString('ru-RU'));

            console.log(`✅ Загружено ферм: ${farmsData.length}`);

        } catch (error) {
            console.error('❌ Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    // Первая загрузка
    useEffect(() => {
        loadAllFarms();

        // Автообновление
        const interval = setInterval(loadAllFarms, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleFarmSelect = (farmName) => {
        navigate(`/farm/${farmName}/dashboard`);
    };

    const handleRefresh = () => {
        loadAllFarms();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'online': return '🟢';
            case 'warning': return '🟡';
            case 'offline': return '🔴';
            case 'empty': return '⚪';
            case 'unknown': return '❓';
            default: return '❓';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'online': return 'Онлайн';
            case 'warning': return 'Проблемы';
            case 'offline': return 'Офлайн';
            case 'empty': return 'Нет майнеров';
            case 'unknown': return 'Неизвестно';
            default: return 'Неизвестно';
        }
    };

    return (
        <div className="farm-selection">
            <div className="selection-header">
                <div className="header-top">
                    <div>
                        <h1>🏭 Выбор площадки</h1>
                        <p>Ищет файлы в <code>/data/farm_data_*.json</code></p>
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
                    {lastUpdate && <span>Обновлено: <strong>{lastUpdate}</strong></span>}
                    <span>Путь: <strong>/data/</strong></span>
                </div>
            </div>

            {/* Сетка ферм */}
            <div className="farms-grid">
                {farms.map((farm) => (
                    <div
                        key={farm.name}
                        className={`farm-card farm-${farm.status}`}
                        onClick={() => handleFarmSelect(farm.name)}
                    >
                        <div className="farm-header">
                            <div className="farm-icon">
                                {farm.isEmpty ? '🏗️' : '⛏️'}
                            </div>
                            <div className="farm-info">
                                <h3>{farm.name}</h3>
                                <span className={`farm-status ${farm.status}`}>
                                    {getStatusIcon(farm.status)} {getStatusText(farm.status)}
                                </span>
                                {farm.lastUpdate && (
                                    <div className="farm-update-time">
                                        📅 {farm.lastUpdate}
                                    </div>
                                )}
                                {farm.isEmpty && (
                                    <div className="farm-empty-notice">
                                        ⚠️ Ферма настроена, майнеры появятся позже
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
                            <button className="btn btn-primary">
                                {farm.isEmpty ? '👀 Просмотр' : '📊 Мониторинг'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Сообщение если нет ферм */}
            {!loading && farms.length === 0 && (
                <div className="no-farms">
                    <div className="no-farms-icon">🏭</div>
                    <h3>Фермы не найдены</h3>
                    <p>Добавьте файлы в папку <code>public/data/</code></p>
                    <div className="help-text">
                        <p>Формат: <code>farm_data_НАЗВАНИЕ.json</code></p>
                        <p>Пример: <code>farm_data_VISOKOVKA.json</code></p>
                        <p style={{marginTop: '10px', fontSize: '0.9rem', color: '#666'}}>
                            Открой консоль браузера (F12) чтобы увидеть детали поиска
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={handleRefresh}>
                        🔄 Проверить снова
                    </button>
                </div>
            )}

            {/* Уведомление об автообновлении */}
            {farms.length > 0 && (
                <div className="auto-update-notice">
                    <p>🔄 Автообновление каждую минуту</p>
                    <p>Последнее обновление: {lastUpdate}</p>
                </div>
            )}
        </div>
    );
};

export default FarmSelection;