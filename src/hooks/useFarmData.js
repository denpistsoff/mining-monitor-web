import { useState, useEffect, useRef } from 'react';

export const useFarmData = (farmNameProp) => {
    const [farmData, setFarmData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataStatus, setDataStatus] = useState('fresh'); // 'fresh', 'stale', 'offline'
    const lastUpdateRef = useRef(null);
    const lastKnownDataRef = useRef(null);

    // Функция проверки свежести данных
    const checkDataFreshness = (data) => {
        if (!data || (!data.timestamp && !data.last_update)) {
            return 'offline';
        }

        // Парсим timestamp из данных
        let dataTime;
        if (data.timestamp) {
            // Если timestamp в секундах (UNIX time)
            dataTime = new Date(data.timestamp * 1000);
        } else if (data.last_update) {
            // Если строка даты "2025-11-09 09:18:30"
            dataTime = new Date(data.last_update.replace(' ', 'T'));
        } else {
            return 'offline';
        }

        const now = new Date();
        const diffMinutes = (now - dataTime) / (1000 * 60);

        console.log(`🕒 Проверка свежести: ${dataTime}, разница: ${diffMinutes.toFixed(1)} мин`);

        if (diffMinutes > 30) {
            return 'offline'; // Данные старше 30 минут - считаем что ферма offline
        } else if (diffMinutes > 5) {
            return 'stale'; // Данные старше 5 минут - устаревшие
        } else {
            return 'fresh'; // Свежие данные
        }
    };

    // Функция создания offline данных
    const createOfflineData = (lastKnownData) => {
        const offlineTime = new Date().toLocaleString('ru-RU');

        const offlineData = {
            timestamp: Date.now() / 1000,
            farm_name: lastKnownData?.farm_name || farmNameProp,
            json_filename: lastKnownData?.json_filename || `farm_data_${farmNameProp}.json`,
            last_update: offlineTime,
            summary: {
                total_containers: lastKnownData?.summary?.total_containers || 0,
                total_miners: lastKnownData?.summary?.total_miners || 0,
                online_miners: 0, // Все майнеры offline
                problematic_miners: lastKnownData?.summary?.problematic_miners || 0,
                offline_miners: lastKnownData?.summary?.total_miners || 0,
                total_hashrate: 0, // Хешрейт нулевой
                total_power: 0 // Потребление нулевое
            },
            containers: lastKnownData ? createOfflineContainers(lastKnownData.containers) : {},
            _isOfflineData: true,
            _offlineSince: offlineTime,
            _dataStatus: 'offline'
        };

        return offlineData;
    };

    // Создание offline контейнеров
    const createOfflineContainers = (containers) => {
        const offlineContainers = {};

        Object.entries(containers || {}).forEach(([containerId, container]) => {
            offlineContainers[containerId] = {
                stats: {
                    total_hashrate: 0,
                    total_power: 0,
                    total_miners: container.stats?.total_miners || 0,
                    online_miners: 0,
                    problematic_miners: container.stats?.problematic_miners || 0,
                    offline_miners: container.stats?.total_miners || 0
                },
                miners: createOfflineMiners(container.miners)
            };
        });

        return offlineContainers;
    };

    // Создание offline майнеров
    const createOfflineMiners = (miners) => {
        if (!miners || !Array.isArray(miners)) return [];

        return miners.map(miner => ({
            ...miner,
            hashrate: 0,
            power: 0,
            status: 'offline',
            temperature: miner.temperature || 0,
            problem_reason: 'нет связи'
        }));
    };

    const loadData = async (force = false) => {
        if (!farmNameProp) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const url = `https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_${farmNameProp}.json?t=${Date.now()}`;

            console.log(`🔄 Загружаем данные для: ${farmNameProp}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Файл не найден: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Данные получены:`, data);

            // Проверяем свежесть данных
            const freshness = checkDataFreshness(data);
            setDataStatus(freshness);

            let processedData;

            if (freshness === 'offline') {
                // Данные устарели - показываем offline состояние
                console.log('⚠️ Данные устарели, показываем offline состояние');
                processedData = createOfflineData(lastKnownDataRef.current || data);
                processedData._dataStatus = 'offline';
            } else {
                // Данные свежие - обрабатываем как обычно
                processedData = processFarmData(data);
                processedData._dataStatus = freshness;
                // Сохраняем последние известные хорошие данные
                lastKnownDataRef.current = processedData;
            }

            // Проверяем, изменились ли данные
            const currentTimestamp = data.timestamp || data.last_update;
            if (force || !lastUpdateRef.current || lastUpdateRef.current !== currentTimestamp) {
                lastUpdateRef.current = currentTimestamp;
                setFarmData(processedData);
                setError(null);
            }

        } catch (err) {
            console.error('❌ Ошибка загрузки данных:', err);

            // При ошибке загрузки показываем offline данные
            setDataStatus('offline');
            const offlineData = createOfflineData(lastKnownDataRef.current);
            offlineData._dataStatus = 'offline_error';
            setFarmData(offlineData);
            setError('Нет связи с сервером, показаны последние известные данные');
        } finally {
            setLoading(false);
        }
    };

    // Функция для обработки структуры данных
    const processFarmData = (data) => {
        const containers = data.containers || {};
        const containerEntries = Object.entries(containers);

        const summary = {
            total_containers: containerEntries.length,
            total_miners: data.summary?.total_miners || containerEntries.reduce((sum, [_, container]) =>
                sum + (container.total_miners || 0), 0),
            online_miners: data.summary?.online_miners || containerEntries.reduce((sum, [_, container]) =>
                sum + (container.online_miners || 0), 0),
            problematic_miners: data.summary?.problematic_miners || containerEntries.reduce((sum, [_, container]) =>
                sum + (container.problematic_miners || 0), 0),
            offline_miners: data.summary?.offline_miners || containerEntries.reduce((sum, [_, container]) =>
                sum + (container.offline_miners || 0), 0),
            total_hashrate: data.summary?.total_hashrate || containerEntries.reduce((sum, [_, container]) =>
                sum + (container.total_hashrate || 0), 0),
            total_power: data.summary?.total_power || containerEntries.reduce((sum, [_, container]) =>
                sum + (container.total_power || 0), 0)
        };

        const processedContainers = {};
        containerEntries.forEach(([containerId, container]) => {
            processedContainers[containerId] = {
                stats: {
                    total_hashrate: container.total_hashrate,
                    total_power: container.total_power,
                    total_miners: container.total_miners,
                    online_miners: container.online_miners,
                    problematic_miners: container.problematic_miners,
                    offline_miners: container.offline_miners
                },
                miners: container.miners || container.miners_data || {}
            };
        });

        return {
            ...data,
            summary: summary,
            containers: processedContainers,
            _dataStatus: 'fresh'
        };
    };

    useEffect(() => {
        if (!farmNameProp) return;

        loadData(true);

        const interval = setInterval(loadData, 60000); // Проверяем каждую минуту
        return () => clearInterval(interval);
    }, [farmNameProp]);

    const refresh = () => {
        loadData(true);
    };

    return {
        farmData,
        loading,
        error,
        refresh,
        dataStatus // 'fresh', 'stale', 'offline'
    };
};