import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');
    const navigate = useNavigate();

    // Функция для добавления отладочной информации
    const addDebug = (message) => {
        console.log(message);
        setDebugInfo(prev => prev + '\n' + new Date().toLocaleTimeString() + ' - ' + message);
    };

    // Пробуем конкретные пути для farm_data_VISOKOVKA.json
    const testAllPaths = async (farmName) => {
        const baseUrl = window.location.origin;
        const paths = [
            // Относительные пути
            `../data/farm_data_${farmName}.json`,
            `./../data/farm_data_${farmName}.json`,
            `../../data/farm_data_${farmName}.json`,
            `data/farm_data_${farmName}.json`,
            `/data/farm_data_${farmName}.json`,
            // Абсолютные пути
            `${baseUrl}/data/farm_data_${farmName}.json`,
            `${baseUrl}/mining-monitor-web/data/farm_data_${farmName}.json`,
            // Прямые ссылки на GitHub
            `https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_${farmName}.json`
        ];

        addDebug(`🔍 Тестируем пути для ${farmName}:`);

        for (const path of paths) {
            try {
                addDebug(`   Пробуем: ${path}`);
                const response = await fetch(path + '?t=' + Date.now());
                addDebug(`   Статус: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    const data = await response.json();
                    addDebug(`   ✅ УСПЕХ: Файл найден по пути: ${path}`);
                    return { success: true, data: data, path: path };
                }
            } catch (error) {
                addDebug(`   ❌ ОШИБКА: ${error.message}`);
            }
        }

        addDebug(`   ❌ Все пути не сработали для ${farmName}`);
        return { success: false, data: null, path: null };
    };

    // Основная функция загрузки всех ферм
    const loadAllFarms = async () => {
        setLoading(true);
        setDebugInfo('🔄 Начинаем загрузку ферм...\n');

        addDebug('=== НАЧАЛО СКАНИРОВАНИЯ ===');

        try {
            // Тестируем конкретно VISOKOVKA
            addDebug('\n🎯 ТЕСТИРУЕМ FARM_DATA_VISOKOVKA.JSON:');
            const visokovkaTest = await testAllPaths('VISOKOVKA');

            // Тестируем DESKTOP-TO75OLC для сравнения
            addDebug('\n🎯 ТЕСТИРУЕМ FARM_DATA_DESKTOP-TO75OLC.JSON:');
            const desktopTest = await testAllPaths('DESKTOP-TO75OLC');

            const foundFarms = [];

            // Добавляем найденные фермы
            if (visokovkaTest.success) {
                const stats = calculateFarmStats(visokovkaTest.data, 'VISOKOVKA');
                foundFarms.push({
                    name: 'VISOKOVKA',
                    ...stats,
                    debugPath: visokovkaTest.path
                });
                addDebug(`✅ ДОБАВЛЕНА ФЕРМА: VISOKOVKA (путь: ${visokovkaTest.path})`);
            }

            if (desktopTest.success) {
                const stats = calculateFarmStats(desktopTest.data, 'DESKTOP-TO75OLC');
                foundFarms.push({
                    name: 'DESKTOP-TO75OLC',
                    ...stats,
                    debugPath: desktopTest.path
                });
                addDebug(`✅ ДОБАВЛЕНА ФЕРМА: DESKTOP-TO75OLC (путь: ${desktopTest.path})`);
            }

            // Также пробуем найти другие фермы сканированием папки
            addDebug('\n🔍 СКАНИРУЕМ ПАПКУ DATA/:');
            try {
                const dirResponse = await fetch('../data/');
                if (dirResponse.ok) {
                    const text = await dirResponse.text();
                    addDebug('✅ Папка data/ доступна');

                    // Парсим HTML для поиска файлов
                    const parser = new DOMParser();
                    const html = parser.parseFromString(text, 'text/html');
                    const links = html.querySelectorAll('a[href]');

                    addDebug(`📁 Найдено ссылок в папке: ${links.length}`);

                    links.forEach(link => {
                        const fileName = link.getAttribute('href');
                        addDebug(`   Файл: ${fileName}`);

                        if (fileName && fileName.startsWith('farm_data_') && fileName.endsWith('.json')) {
                            const farmName = fileName.replace('farm_data_', '').replace('.json', '');
                            addDebug(`   🎯 НАЙДЕН ФАЙЛ ФЕРМЫ: ${farmName}`);

                            // Если этой фермы еще нет в списке, добавляем
                            if (!foundFarms.find(f => f.name === farmName)) {
                                foundFarms.push({
                                    name: farmName,
                                    miners: 0,
                                    onlineMiners: 0,
                                    hashrate: 0,
                                    status: 'unknown',
                                    isEmpty: true,
                                    debugPath: 'из сканирования папки'
                                });
                            }
                        }
                    });
                } else {
                    addDebug(`❌ Папка data/ недоступна: ${dirResponse.status}`);
                }
            } catch (dirError) {
                addDebug(`❌ Ошибка сканирования папки: ${dirError.message}`);
            }

            // Сортируем и устанавливаем фермы
            foundFarms.sort((a, b) => a.name.localeCompare(b.name));
            setFarms(foundFarms);
            setLastUpdate(new Date().toLocaleTimeString('ru-RU'));

            addDebug(`\n=== РЕЗУЛЬТАТ: найдено ${foundFarms.length} ферм ===`);
            foundFarms.forEach(farm => {
                addDebug(`   📊 ${farm.name}: статус ${farm.status}, путь: ${farm.debugPath}`);
            });

        } catch (error) {
            addDebug(`❌ КРИТИЧЕСКАЯ ОШИБКА: ${error.message}`);
            console.error('Ошибка загрузки ферм:', error);
        } finally {
            setLoading(false);
            addDebug('=== СКАНИРОВАНИЕ ЗАВЕРШЕНО ===');
        }
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

    // Первая загрузка
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
                        <p>Отладочный режим - ищем farm_data_*.json</p>
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
                    <span>Режим: <strong>отладка</strong></span>
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
                                {farm.status === 'unknown' ? '🔍' :
                                    farm.isEmpty ? '🏗️' : '⛏️'}
                            </div>
                            <div className="farm-info">
                                <h3>{farm.name}</h3>
                                <span className={`farm-status ${farm.status}`}>
                                    {getStatusIcon(farm.status)} {getStatusText(farm.status)}
                                </span>
                                {farm.debugPath && (
                                    <div className="farm-debug-path">
                                        📍 {farm.debugPath}
                                    </div>
                                )}
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
                                {farm.status === 'unknown' ? '🔍 Исследовать' :
                                    farm.isEmpty ? '👀 Просмотр' : '📊 Мониторинг'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Отладочная информация */}
            <div className="debug-panel">
                <h3>📊 Отладочная информация:</h3>
                <div className="debug-content">
                    <pre>{debugInfo}</pre>
                </div>
                <div className="debug-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setDebugInfo('')}
                    >
                        🧹 Очистить лог
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            const testUrl = '../data/farm_data_VISOKOVKA.json';
                            addDebug(`\n🔗 Тестируем прямой переход: ${testUrl}`);
                            window.open(testUrl, '_blank');
                        }}
                    >
                        🔗 Проверить файл
                    </button>
                </div>
            </div>

            {farms.length === 0 && !loading && (
                <div className="no-farms">
                    <div className="no-farms-icon">🔍</div>
                    <h3>Фермы не найдены</h3>
                    <p>Проверьте отладочную информацию выше</p>
                </div>
            )}
        </div>
    );
};

export default FarmSelection;