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

            console.log(`🔄 Loading data for farm: ${farmName}`);

            // Ищем файлы прямо в папке data/ в корне
            const pathsToTry = [
                `../data/farm_data_${farmName}.json?t=${Date.now()}`,
                `./../data/farm_data_${farmName}.json?t=${Date.now()}`,
                `../../data/farm_data_${farmName}.json?t=${Date.now()}`,
                `/data/farm_data_${farmName}.json?t=${Date.now()}`,
                `data/farm_data_${farmName}.json?t=${Date.now()}`
            ];

            let data = null;
            let lastError = null;

            for (const path of pathsToTry) {
                try {
                    console.log(`🔍 Trying path: ${path}`);
                    const response = await fetch(path);
                    console.log(`📡 Response status for ${path}:`, response.status);

                    if (response.ok) {
                        data = await response.json();
                        console.log(`✅ Successfully loaded from: ${path}`, data);

                        // Проверяем, изменились ли данные
                        const currentTimestamp = data.timestamp || data.last_update;
                        if (force || !lastUpdateRef.current || lastUpdateRef.current !== currentTimestamp) {
                            lastUpdateRef.current = currentTimestamp;
                            setFarmData(data);
                            setError(null);
                        }
                        break;
                    } else {
                        console.log(`❌ Failed to load from ${path}: ${response.status}`);
                    }
                } catch (err) {
                    lastError = err;
                    console.log(`❌ Error loading from ${path}:`, err);
                }
            }

            if (!data) {
                throw new Error(lastError || `Ферма "${farmName}" не найдена в папке data/`);
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
        }, 60000);

        return () => clearInterval(interval);
    }, [farmName]);

    const refresh = () => {
        loadData(true);
    };

    return { farmData, loading, error, refresh };
};