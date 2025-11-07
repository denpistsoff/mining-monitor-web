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

    // Функция для обработки структуры данных
    const processFarmData = (data) => {
        const containers = data.containers || {};
        const containerEntries = Object.entries(containers);

        // ПРОСТОЙ подсчет - берем данные как есть из JSON
        const summary = {
            total_containers: containerEntries.length,
            total_miners: containerEntries.reduce((sum, [_, container]) =>
                sum + (container.total_miners || 0), 0),
            online_miners: containerEntries.reduce((sum, [_, container]) =>
                sum + (container.online_miners || 0), 0),
            problematic_miners: containerEntries.reduce((sum, [_, container]) =>
                sum + (container.problematic_miners || 0), 0),
            offline_miners: containerEntries.reduce((sum, [_, container]) =>
                sum + (container.offline_miners || 0), 0),
            total_hashrate: containerEntries.reduce((sum, [_, container]) =>
                sum + (container.total_hashrate || 0), 0),
            total_power: containerEntries.reduce((sum, [_, container]) =>
                sum + (container.total_power || 0), 0)
        };

        // Обрабатываем контейнеры для единообразной структуры
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
                miners: container.miners_data || [] // Используем miners_data из JSON
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