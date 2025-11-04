import React from 'react';
import '../styles/components/StatsGrid.css';

const StatsGrid = ({ summary }) => {
    const stats = [
        {
            title: 'Контейнеры',
            value: summary?.total_containers || 0,
            icon: '🏗️'
        },
        {
            title: 'Майнеры',
            value: `${summary?.online_miners || 0}/${summary?.total_miners || 0}`,
            icon: '⛏️'
        },
        {
            title: 'Хешрейт',
            value: `${(summary?.total_hashrate || 0).toLocaleString('ru-RU')} TH/s`,
            icon: '⚡'
        },
        {
            title: 'Мощность',
            value: `${(summary?.total_power || 0).toLocaleString('ru-RU')} Вт`,
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