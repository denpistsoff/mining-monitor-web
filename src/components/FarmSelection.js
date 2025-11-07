import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const navigate = useNavigate();

    // Список ферм для проверки
    const FARM_NAMES = ['DESKTOP-TO75OLC', 'FARM-1', 'FARM-2', 'MAIN-FARM'];

    // Загружаем данные фермы
    const loadFarmData = async (farmName) => {
        const paths = [
            `../data/farm_data_${farmName}.json?t=${Date.now()}`,
            `./../data/farm_data_${farmName}.json?t=${Date.now()}`,
            `data/farm_data_${farmName}.json?t=${Date.now()}`,
            `/data/farm_data_${farmName}.json?t=${Date.now()}`
        ];

        for (const path of paths) {
            try {
                console.log(`Пробуем путь: ${path}`);
                const response = await fetch(path);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Найдена ферма: ${farmName}`);
                    return data;
                }
            } catch (error) {
                console.log(`❌ Ошибка загрузки ${path}:`, error);
            }
        }
        return null;
    };

    // Рассчитываем статистику фермы
    const calculateFarmStats = (farmData) => {
        if (!farmData || !farmData.containers) {
            return { miners: 0, onlineMiners: 0, hashrate: 0, status: 'offline' };
        }

        const containers = Object.values(farmData.containers);

        const onlineMiners = containers.reduce((sum, container) =>
            sum + (container.online_miners || 0), 0);

        const totalMiners = containers.reduce((sum, container) =>
            sum + (container.total_miners || 0), 0);

        const hashrate = containers.reduce((sum, container) =>
            sum + (container.total_hashrate || 0), 0);

        let status = 'offline';
        if (onlineMiners === totalMiners && totalMiners > 0) {
            status = 'online';
        } else if (onlineMiners > 0) {
            status = 'warning';
        }

        return {
            miners: totalMiners,
            onlineMiners: onlineMiners,
            hashrate: hashrate,
            status: status,
            lastUpdate: farmData.last_update
        };
    };

    // Загружаем все фермы
    const loadAllFarms = async () => {
        setLoading(true);
        console.log('🔄 Начинаем загрузку ферм...');

        const farmsData = [];

        // Проверяем каждую ферму
        for (const farmName of FARM_NAMES) {
            const farmData = await loadFarmData(farmName);
            if (farmData) {
                const stats = calculateFarmStats(farmData);
                farmsData.push({
                    name: farmName,
                    ...stats
                });
            }
        }

        setFarms(farmsData);
        setLastUpdate(new Date().toLocaleTimeString('ru-RU'));
        setLoading(false);

        console.log(`✅ Загружено ферм: ${farmsData.length}`);
        if (farmsData.length === 0) {
            console.log('❌ Не найдено ни одной фермы. Проверьте:');
            console.log('1. Файлы в папке data/');
            console.log('2. Формат имен: farm_data_НАЗВАНИЕ.json');
            console.log('3. Доступность файлов по сети');
        }
    };

    // Первая загрузка
    useEffect(() => {
        loadAllFarms();

        // Автообновление каждую минуту
        const interval = setInterval(loadAllFarms, 60000);
        return () => clearInterval(interval);
    }, []);

    // Обработчик выбора фермы
    const handleFarmSelect = (farmName) => {
        navigate(`/farm/${farmName}/dashboard`);
    };

    // Обработчик обновления
    const handleRefresh = () => {
        loadAllFarms();
    };

    // Иконки статусов
    const getStatusIcon = (status) => {
        switch (status) {
            case 'online': return '🟢';
            case 'warning': return '🟡';
            case 'offline': return '🔴';
            default: return '⚪';
        }
    };

    // Текст статусов
    const getStatusText = (status) => {
        switch (status) {
            case 'online': return 'Онлайн';
            case 'warning': return 'Проблемы';
            case 'offline': return 'Офлайн';
            default: return 'Неизвестно';
        }
    };

    return (
        <div className="farm-selection">
            {/* Шапка */}
            <div className="selection-header">
                <div className="header-top">
                    <div>
                        <h1>🏭 Выбор площадки</h1>
                        <p>Фермы загружаются из папки data/</p>
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
                    <span>Следующее обновление: <strong>через 1 минуту</strong></span>
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
                            <div className="farm-icon">⛏️</div>
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

            {/* Сообщение если нет ферм */}
            {!loading && farms.length === 0 && (
                <div className="no-farms">
                    <div className="no-farms-icon">🏭</div>
                    <h3>Фермы не найдены</h3>
                    <p>Добавьте JSON файлы в папку <code>data/</code></p>
                    <div className="help-text">
                        <p>Формат имен: <code>farm_data_НАЗВАНИЕ.json</code></p>
                        <p>Пример: <code>farm_data_DESKTOP-TO75OLC.json</code></p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleRefresh}
                    >
                        🔄 Проверить снова
                    </button>
                </div>
            )}

            {/* Уведомление об автообновлении */}
            {farms.length > 0 && (
                <div className="auto-update-notice">
                    <p>🔄 Данные обновляются автоматически каждую минуту</p>
                    <p>Последнее обновление: {lastUpdate}</p>
                </div>
            )}

            {/* Отладочная информация */}
            <div className="debug-info">
                <details>
                    <summary>Отладочная информация</summary>
                    <div>
                        <p>Проверяемые фермы: {FARM_NAMES.join(', ')}</p>
                        <p>Текущий URL: {window.location.href}</p>
                        <p>Проверьте консоль браузера для подробной отладки</p>
                    </div>
                </details>
            </div>
        </div>
    );
};

export default FarmSelection;