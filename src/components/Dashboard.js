import React from 'react';
import { useFarmData } from '../hooks/useFarmData';
import StatsGrid from './StatsGrid';
import ContainerCard from './ContainerCard';
import './Dashboard.css';

const Dashboard = () => {
    const { farmData, loading, error } = useFarmData();

    if (loading) {
        return <div className="loading">Loading mining data...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    if (!farmData) {
        return <div className="no-data">No data available</div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>{farmData.farm_name || 'Mining Farm'}</h1>
                <p>Last update: {new Date(farmData.last_update).toLocaleString()}</p>
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