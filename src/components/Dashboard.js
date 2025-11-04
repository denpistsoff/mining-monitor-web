import React from 'react';
import { useFarmData } from '../hooks/useFarmData';
import StatsGrid from './StatsGrid';
import ContainerCard from './ContainerCard';
import '../styles/components/Dashboard.css';

const Dashboard = () => {
    const { farmData, loading, error } = useFarmData();

    if (loading) {
        return <div className="loading">Загрузка данных майнинга...</div>;
    }

    if (error) {
        return <div className="error">Ошибка: {error}</div>;
    }

    if (!farmData) {
        return <div className="no-data">Нет данных</div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>{farmData.farm_name || 'Майнинг Ферма'}</h1>
                <p>Последнее обновление: {new Date(farmData.last_update).toLocaleString('ru-RU')}</p>
            </div>
            
            <StatsGrid summary={farmData.summary} />
            
            <div className="containers-grid">
                {Object.entries(farmData.containers).map(([containerId, container]) => (
                    <ContainerCard
                        key={containerId}
                        containerId={containerId}
                        container={container}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;