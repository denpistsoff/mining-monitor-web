import { useState, useEffect } from 'react';

export const useFarmData = (farmName) => {
    const [farmData, setFarmData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Загрузка данных для конкретной фермы
                const response = await fetch(`./data/farm_data_${farmName}.json?t=${Date.now()}`);

                if (!response.ok) {
                    throw new Error(`Failed to load data for farm: ${farmName}`);
                }

                const data = await response.json();
                setFarmData(data);
                setError(null);
            } catch (err) {
                setError(err.message);
                console.error('Error loading farm data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (farmName) {
            loadData();

            // Обновляем данные каждые 30 секунд
            const interval = setInterval(loadData, 30000);

            return () => clearInterval(interval);
        }
    }, [farmName]);

    return { farmData, loading, error };
};