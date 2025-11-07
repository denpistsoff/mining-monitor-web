import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const navigate = useNavigate();

    // Функция для поиска ВСЕХ farm_data_*.json файлов
    const scanForFarmFiles = async () => {
        console.log('🔍 Сканируем все farm_data_*.json файлы...');
        const foundFarms = [];

        // Пробуем разные методы поиска файлов
        const scanMethods = [
            // Метод 1: Пробуем загрузить индекс
            async () => {
                try {
                    const response = await fetch('../data/farms_index.json?t=' + Date.now());
                    if (response.ok) {
                        const data = await response.json();
                        return data.farms.map(farm => farm.name);
                    }
                } catch (e) {
                    console.log('❌ Индекс не найден');
                }
                return [];
            },

            // Метод 2: Пробуем получить список файлов из папки data/
            async () => {
                const farmsFromDir = [];
                try {
                    const response = await fetch('../data/');
                    if (response.ok) {
                        const text = await response.text();
                        const parser = new DOMParser();
                        const html = parser.parseFromString(text, 'text/html');
                        const links = html.querySelectorAll('a[href]');

                        links.forEach(link => {
                            const fileName = link.getAttribute('href');
                            if (fileName && fileName.startsWith('farm_data_') && fileName.endsWith('.json')) {
                                const farmName = fileName.replace('farm_data_', '').replace('.json', '');
                                farmsFromDir.push(farmName);
                            }
                        });
                    }
                } catch (e) {
                    console.log('❌ Не удалось прочитать папку data/');
                }
                return farmsFromDir;
            },

            // Метод 3: Пробуем известные имена ферм
            async () => {
                const knownFarms = [];
                const testNames = ['VISOKOVKA', 'DESKTOP-TO75OLC', 'FARM1', 'FARM2', 'MAIN'];

                for (const name of testNames) {
                    try {
                        const response = await fetch(`../data/farm_data_${name}.json?t=${Date.now()}`);
                        if (response.ok) {
                            knownFarms.push(name);
                        }
                    } catch (e) {
                        // Файл не существует - это нормально
                    }
                }
                return knownFarms;
            }
        ];

        // Запускаем все методы поиска
        for (const method of scanMethods) {
            const found = await method();
            found.forEach(farmName => {
                if (!foundFarms.includes(farmName)) {
                    foundFarms.push(farmName);
                }
            });

            if (foundFarms.length > 0) break; // Если нашли фермы, останавливаемся
        }

        console.log(`🎯 Найдено файлов ферм: ${foundFarms.length}`, foundFarms);
        return foundFarms;
    };

    // Загружаем данные конкретной фермы
    const loadFarmData = async (farmName) => {
        const paths = [
            `../data/farm_data_${farmName}.json?t=${Date.now()}`,
            `./../data/farm_data_${farmName}.json?t=${Date.now()}`,
            `data/farm_data_${farmName}.json?t=${Date.now()}`,
            `/data/farm_data_${farmName}.json?t=${Date.now()}`
        ];

        for (const path of paths) {
            try {
                console.log(`📡 Пробуем загрузить: ${path}`);
                const response = await fetch(path);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Успешно загружена ферма: ${farmName}`, data);
                    return data;
                }
            } catch (error) {
                console.log(`❌ Ошибка загрузки ${path}:`, error);
            }
        }
        console.log(`❌ Не удалось загрузить данные для фермы: ${farmName}`);
        return null;
    };

    // Рассчитываем статистику фермы (теперь работает с пустыми контейнерами)
    const calculateFarmStats = (farmData, farmName) => {
        if (!farmData) {
            return {
                miners: 0,
                onlineMiners: 0,
                hashrate: 0,
                status: 'offline',
                isEmpty: true
            };
        }

        // Проверяем есть ли контейнеры и майнеры
        const containers = farmData.containers || {};
        const containerArray = Object.values(containers);

        const onlineMiners = containerArray.reduce((sum, container) =>
            sum + (container.online_miners || 0), 0);

        const totalMiners = containerArray.reduce((sum, container) =>
            sum + (container.total_miners || 0), 0);

        const hashrate = containerArray.reduce((sum, container) =>
            sum + (container.total_hashrate || 0), 0);

        // Определяем статус
        let status = 'offline';
        let isEmpty = false;

        if (totalMiners === 0 && onlineMiners === 0) {
            status = 'empty'; // Нет майнеров
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
            farmName: farmData.farm_name || farmName,
            timestamp: farmData.timestamp
        };
    };

    // Основная функция загрузки всех ферм
    const loadAllFarms = async () => {
        setLoading(true);
        console.log('🔄 Загружаем данные всех ферм...');

        try {
            // 1. Находим все файлы ферм
            const farmNames = await scanForFarmFiles();

            // 2. Загружаем данные для каждой найденной фермы
            const farmsData = [];

            for (const farmName of farmNames) {
                const farmData = await loadFarmData(farmName);
                const stats = calculateFarmStats(farmData, farmName);

                farmsData.push({
                    name: farmName,
                    ...stats
                });
            }

            // 3. Сортируем фермы по имени
            farmsData.sort((a, b) => a.name.localeCompare(b.name));

            setFarms(farmsData);
            setLastUpdate(new Date().toLocaleTimeString('ru-RU'));

            console.log(`✅ Успешно загружено ${farmsData.length} ферм:`, farmsData);

        } catch (error) {
            console.error('❌ Ошибка загрузки ферм:', error);
        } finally {
            setLoading(false);
        }
    };

    // Первая загрузка при монтировании компонента
    useEffect(() => {
        loadAllFarms();

        // Автообновление каждую минуту
        const interval = setInterval(loadAllFarms, 60000);
        return () => clearInterval(interval);
    }, []);

    // Обработчики событий
    const handleFarmSelect = (farmName) => {
        navigate(`/farm/${farmName}/dashboard`);
    };

    const handleRefresh = () => {
        loadAllFarms();
    };

    // Вспомогательные функции для отображения
    const getStatusIcon = (status) => {
        switch (status) {
            case 'online': return '🟢';
            case 'warning': return '🟡';
            case 'offline': return '🔴';
            case 'empty': return '⚪';
            default: return '❓';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'online': return 'Онлайн';
            case 'warning': return 'Проблемы';
            case 'offline': return 'Офлайн';
            case 'empty': return 'Нет майнеров';
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
                        <p>Автоматически находит все farm_data_*.json файлы</p>
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
                    <span>Автообновление: <strong>каждую минуту</strong></span>
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
                                    {farm.isEmpty ? '0' : `${farm.onlineMiners}/${farm.miners}`}
                                </span>
                            </div>
                            <div className="farm-stat">
                                <span className="stat-label">Хешрейт</span>
                                <span className="stat-value">
                                    {farm.isEmpty ? '0' : `${farm.hashrate.toFixed(2)}`} TH/s
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

            {/* Сообщения */}
            {!loading && farms.length === 0 && (
                <div className="no-farms">
                    <div className="no-farms-icon">🏭</div>
                    <h3>Фермы не найдены</h3>
                    <p>Добавьте файлы в формате <code>farm_data_НАЗВАНИЕ.json</code> в папку <code>data/</code></p>
                    <div className="help-text">
                        <p>Пример: <code>farm_data_VISOKOVKA.json</code></p>
                        <p>Система автоматически найдет новые файлы</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleRefresh}>
                        🔄 Проверить снова
                    </button>
                </div>
            )}

            {/* Уведомление об автообновлении */}
            {farms.length > 0 && (
                <div className="auto-update-notice">
                    <p>🔄 Система автоматически сканирует папку data/ каждую минуту</p>
                    <p>Последнее сканирование: {lastUpdate}</p>
                    <p style={{fontSize: '0.8rem', marginTop: '5px'}}>
                        Найдено файлов: {farms.length} | Следующая проверка через 1 минуту
                    </p>
                </div>
            )}
        </div>
    );
};

export default FarmSelection;