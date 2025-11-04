import { useState, useEffect } from 'react';

export const useFarmData = () => {
    const [farmData, setFarmData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const response = await fetch('./data/farm_data.json?t=' + Date.now());
                
                if (!response.ok) {
                    throw new Error('Failed to load data');
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

        loadData();
        
        // Обновляем данные каждые 30 секунд
        const interval = setInterval(loadData, 30000);
        
        return () => clearInterval(interval);
    }, []);

    return { farmData, loading, error };
};