// src/components/FarmSelection.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authManager from '../utils/auth';
import '../styles/components/FarmSelection.css';

const FarmSelection = ({ currentUser, onLogout }) => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const getFarmUrl = (farmId) =>
        `https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_${farmId}.json`;

    useEffect(() => {
        const loadFarms = async () => {
            if (!currentUser?.farms?.length) {
                setFarms([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            const farmsData = await Promise.all(
                currentUser.farms.map(async (farmId) => {
                    try {
                        const res = await fetch(`${getFarmUrl(farmId)}?t=${Date.now()}`);
                        if (!res.ok) throw new Error('Not found');

                        const data = await res.json();
                        const containers = Object.values(data.containers || {});

                        return {
                            id: farmId,
                            name: data.farm_name || farmId,
                            online: containers.reduce((sum, c) => sum + (c.online_miners || 0), 0),
                            total: containers.reduce((sum, c) => sum + (c.total_miners || 0), 0),
                            hashrate: containers.reduce((sum, c) => sum + (c.total_hashrate || 0), 0),
                            containers: Object.keys(data.containers || {}).length,
                            lastUpdate: data.last_update,
                            error: false
                        };
                    } catch {
                        return {
                            id: farmId,
                            name: farmId,
                            error: true
                        };
                    }
                })
            );

            setFarms(farmsData);
            setLoading(false);
        };

        loadFarms();
        const interval = setInterval(loadFarms, 60000);
        return () => clearInterval(interval);
    }, [currentUser]);

    if (loading) {
        return <div className="farm-selection loading">Загрузка...</div>;
    }

    return (
        <div className="farm-selection">
            <div className="header">
                <h1>MINING MONITOR</h1>
                <p>{currentUser?.name}</p>
            </div>

            <div className="farms">
                {farms.map(farm => (
                    <div
                        key={farm.id}
                        className={`farm-card ${farm.error ? 'error' : ''}`}
                        onClick={() => !farm.error && navigate(`/farm/${farm.id}`)}
                    >
                        <h3>{farm.name}</h3>
                        {farm.error ? (
                            <p>Нет данных</p>
                        ) : (
                            <>
                                <p>Майнеры: {farm.online}/{farm.total}</p>
                                <p>Хешрейт: {farm.hashrate.toFixed(1)} TH/s</p>
                                <p>Контейнеры: {farm.containers}</p>
                                <small>{farm.lastUpdate}</small>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <button className="logout" onClick={onLogout}>Выйти</button>
        </div>
    );
};

export default FarmSelection;