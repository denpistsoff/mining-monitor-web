import React from 'react';
import '../styles/components/StatsGrid.css';

const StatsGrid = ({ stats }) => {
  const statCards = [
    {
      title: 'Общий хешрейт',
      value: `${(stats?.total_hashrate || 0).toFixed(2)} TH/s`,
      icon: '⚡',
      color: 'blue',
      trend: '+2.5%'
    },
    {
      title: 'Потребление',
      value: `${stats?.total_power || 0} Вт`,
      icon: '🔌',
      color: 'green',
      trend: '-1.2%'
    },
    {
      title: 'Эффективность',
      value: stats?.total_power ? `${((stats.total_hashrate / stats.total_power) * 1000).toFixed(2)} J/TH` : '0 J/TH',
      icon: '📊',
      color: 'purple',
      trend: '+0.8%'
    },
    {
      title: 'Аптайм',
      value: stats?.total_miners ? `${(((stats.online_miners || 0) / stats.total_miners) * 100).toFixed(1)}%` : '0%',
      icon: '🟢',
      color: 'green',
      trend: '+0.3%'
    }
  ];

  return (
    <div className="stats-grid">
      {statCards.map((stat, index) => (
        <div key={index} className={`stat-card stat-${stat.color}`}>
          <div className="stat-header">
            <div className="stat-icon">{stat.icon}</div>
            <span className="stat-trend">{stat.trend}</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">{stat.title}</h3>
            <div className="stat-value">{stat.value}</div>
          </div>
          <div className="stat-glow"></div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;