import React, { useState, useEffect } from 'react';
import StatsGrid from './StatsGrid';
import ContainerCard from './ContainerCard';
import { MiningMonitorAPI } from '../utils/firebase';
import '../styles/components/Dashboard.css';

const Dashboard = ({ farmName }) => {
  const [farmData, setFarmData] = useState(null);
  const [minersData, setMinersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const api = new MiningMonitorAPI(farmName);
    
    // Подписка на данные майнеров
    const unsubscribeMiners = api.subscribeToMiners((data) => {
      if (data) {
        setMinersData(data);
        setLastUpdate(new Date());
        setLoading(false);
      }
    });

    // Подписка на данные фермы
    const unsubscribeFarm = api.subscribeToFarmData((data) => {
      if (data) {
        setFarmData(data);
      }
    });

    // Периодическое обновление
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => {
      unsubscribeMiners();
      unsubscribeFarm();
      clearInterval(interval);
    };
  }, [farmName]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner large"></div>
        <p>Загружаем данные майнеров...</p>
      </div>
    );
  }

  if (!minersData) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h3>Нет данных</h3>
        <p>Не удалось загрузить данные майнеров</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Обзор фермы</h2>
          {lastUpdate && (
            <span className="last-update">
              Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}
            </span>
          )}
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          🔄 Обновить
        </button>
      </div>

      {/* Общая статистика */}
      <StatsGrid stats={minersData.total_stats} />

      {/* Контейнеры с майнерами */}
      <section className="containers-section">
        <h3 className="section-title">Контейнеры</h3>
        <div className="containers-grid">
          {Object.entries(minersData.containers || {}).map(([containerId, container]) => (
            <ContainerCard
              key={containerId}
              containerId={containerId}
              container={container}
            />
          ))}
        </div>
      </section>

      {/* Быстрый статус */}
      <section className="quick-stats">
        <h3 className="section-title">Быстрый статус</h3>
        <div className="quick-stats-grid">
          <div className="quick-stat">
            <span className="stat-label">Всего майнеров</span>
            <span className="stat-value">{minersData.total_stats?.total_miners || 0}</span>
          </div>
          <div className="quick-stat">
            <span className="stat-label">Онлайн</span>
            <span className="stat-value success">{minersData.total_stats?.online_miners || 0}</span>
          </div>
          <div className="quick-stat">
            <span className="stat-label">Офлайн</span>
            <span className="stat-value danger">{minersData.total_stats?.offline_miners || 0}</span>
          </div>
          <div className="quick-stat">
            <span className="stat-label">Проблемы</span>
            <span className="stat-value warning">{minersData.total_stats?.problematic_miners || 0}</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;