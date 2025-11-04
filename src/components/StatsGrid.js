import React from 'react';
import './StatsGrid.css';

const StatsGrid = ({ summary }) => {
    const stats = [
        {
            title: 'Containers',
            value: summary?.total_containers || 0,
            icon: '🏗️'
        },
        {
            title: 'Miners',
            value: `${summary?.online_miners || 0}/${summary?.total_miners || 0}`,
            icon: '⛏️'
        },
        {
            title: 'Hashrate',
            value: `${(summary?.total_hashrate || 0).toLocaleString()} TH/s`,
            icon: '⚡'
        },
        {
            title: 'Power',
            value: `${summary?.total_power || 0} W`,
            icon: '🔋'
        }
    ];

    return (
        <div className="stats-grid">
            {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-content">
                        <h3>{stat.title}</h3>
                        <div className="stat-value">{stat.value}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsGrid;