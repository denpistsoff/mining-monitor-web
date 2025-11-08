import { useState, useEffect, useRef } from 'react';

export const useFarmData = (farmNameProp) => {
    const [farmData, setFarmData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const lastUpdateRef = useRef(null);

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

            // Обрабатываем структуру данных
            const processedData = processFarmData(data);

            // Проверяем, изменились ли данные
            const currentTimestamp = data.timestamp || data.last_update;
            if (force || !lastUpdateRef.current || lastUpdateRef.current !== currentTimestamp) {
                lastUpdateRef.current = currentTimestamp;
                setFarmData(processedData);
                setError(null);
            }

        } catch (err) {
            setError(err.message);
            console.error('❌ Ошибка загрузки данных:', err);
        } finally {
            setLoading(false);
        }
    };

    // Функция для ПРАВИЛЬНОГО подсчета онлайн майнеров
    const countOnlineMiners = (containers) => {
        if (!containers) return 0;

        let onlineCount = 0;
        Object.values(containers).forEach(container => {
            Object.values(container.miners || {}).forEach(miner => {
                if (miner.status === 'online') {
                    onlineCount++;
                }
            });
        });
        return onlineCount;
    };

    // Функция для подсчета проблемных майнеров
    const countProblematicMiners = (containers) => {
        if (!containers) return 0;

        let problematicCount = 0;
        Object.values(containers).forEach(container => {
            Object.values(container.miners || {}).forEach(miner => {
                if (miner.status === 'problematic') {
                    problematicCount++;
                }
            });
        });
        return problematicCount;
    };

    // Функция для подсчета оффлайн майнеров
    const countOfflineMiners = (containers) => {
        if (!containers) return 0;

        let offlineCount = 0;
        Object.values(containers).forEach(container => {
            Object.values(container.miners || {}).forEach(miner => {
                if (miner.status === 'offline') {
                    offlineCount++;
                }
            });
        });
        return offlineCount;
    };

    // Функция для подсчета общего хешрейта только онлайн майнеров
    const calculateTotalHashrate = (containers) => {
        if (!containers) return 0;

        let totalHashrate = 0;
        Object.values(containers).forEach(container => {
            Object.values(container.miners || {}).forEach(miner => {
                if (miner.status === 'online' && miner.hashrate) {
                    totalHashrate += miner.hashrate;
                }
            });
        });
        return totalHashrate;
    };

    // Функция для обработки структуры данных
    const processFarmData = (data) => {
        const containers = data.containers || {};
        const containerEntries = Object.entries(containers);

        // ПРАВИЛЬНО рассчитываем общую статистику
        const totalMiners = containerEntries.reduce((sum, [_, container]) =>
            sum + Object.keys(container.miners || {}).length, 0);

        const onlineMiners = countOnlineMiners(containers);
        const problematicMiners = countProblematicMiners(containers);
        const offlineMiners = countOfflineMiners(containers);
        const totalHashrate = calculateTotalHashrate(containers);

        const summary = {
            total_containers: containerEntries.length,
            total_miners: totalMiners,
            online_miners: onlineMiners, // ТОЛЬКО онлайн (status === 'online')
            problematic_miners: problematicMiners, // отдельно проблемные
            offline_miners: offlineMiners, // отдельно оффлайн
            total_hashrate: totalHashrate,
            total_power: containerEntries.reduce((sum, [_, container]) =>
                sum + (container.total_power || 0), 0)
        };

        // Обрабатываем контейнеры для единообразной структуры
        const processedContainers = {};
        containerEntries.forEach(([containerId, container]) => {
            const containerMiners = container.miners || {};
            const containerOnline = Object.values(containerMiners).filter(m => m.status === 'online').length;
            const containerProblematic = Object.values(containerMiners).filter(m => m.status === 'problematic').length;
            const containerOffline = Object.values(containerMiners).filter(m => m.status === 'offline').length;
            const containerHashrate = Object.values(containerMiners)
                .filter(m => m.status === 'online' && m.hashrate)
                .reduce((sum, miner) => sum + (miner.hashrate || 0), 0);

            processedContainers[containerId] = {
                stats: {
                    total_hashrate: containerHashrate,
                    total_power: container.total_power || 0,
                    total_miners: Object.keys(containerMiners).length,
                    online_miners: containerOnline,
                    problematic_miners: containerProblematic,
                    offline_miners: containerOffline
                },
                miners: containerMiners
            };
        });

        return {
            ...data,
            summary: summary,
            containers: processedContainers
        };
    };

    useEffect(() => {
        if (!farmNameProp) return;

        loadData(true);

        const interval = setInterval(loadData, 60000);
        return () => clearInterval(interval);
    }, [farmNameProp]);

    const refresh = () => {
        loadData(true);
    };

    return { farmData, loading, error, refresh };
};