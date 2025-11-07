import { useState, useEffect, useRef } from 'react';

export const useFarmData = (farmName) => {
    const [farmData, setFarmData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const lastUpdateRef = useRef(null);

    const loadData = async (force = false) => {
        if (!farmName) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const pathsToTry = [
                `/data/farm_data_${farmName}.json?t=${Date.now()}`,
                `./data/farm_data_${farmName}.json?t=${Date.now()}`,
                `/mining-monitor-web/data/farm_data_${farmName}.json?t=${Date.now()}`,
                `data/farm_data_${farmName}.json?t=${Date.now()}`
            ];

            let data = null;
            let lastError = null;

            for (const path of pathsToTry) {
                try {
                    const response = await fetch(path);

                    if (response.ok) {
                        data = await response.json();

                        // Проверяем, изменились ли данные
                        const currentTimestamp = data.timestamp || data.last_update;
                        if (force || !lastUpdateRef.current || lastUpdateRef.current !== currentTimestamp) {
                            lastUpdateRef.current = currentTimestamp;
                            setFarmData(data);
                            setError(null);
                        }
                        break;
                    }
                } catch (err) {
                    lastError = err;
                }
            }

            if (!data) {
                throw new Error(lastError || `Ферма "${farmName}" не найдена`);
            }

        } catch (err) {
            setError(err.message);
            console.error('Error loading farm data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!farmName) return;

        // Первая загрузка
        loadData(true);

        // Обновляем данные каждую минуту
        const interval = setInterval(() => {
            loadData();
        }, 60000); // 1 минута

        return () => clearInterval(interval);
    }, [farmName]);

    // Функция для принудительного обновления
    const refresh = () => {
        loadData(true);
    };

    return { farmData, loading, error, refresh };
};