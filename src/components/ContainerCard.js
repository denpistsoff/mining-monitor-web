import React, { useState } from 'react';
import MinerCard from './MinerCard';
import '../styles/components/ContainerCard.css';

const ContainerCard = ({ containerId, container }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { stats, miners } = container;

  const onlineCount = miners?.filter(m => m.status === 'online').length || 0;
  const offlineCount = miners?.filter(m => m.status === 'offline').length || 0;
  const problematicCount = miners?.filter(m => m.status === 'problematic').length || 0;

  return (
    <div className="container-card">
      <div 
        className="container-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="container-info">
          <h3 className="container-title">
            🗂️ Контейнер {containerId}
          </h3>
          <div className="container-stats">
            <span className="stat-badge online">
              🟢 {onlineCount} онлайн
            </span>
            <span className="stat-badge offline">
              🔴 {offlineCount} офлайн
            </span>
            <span className="stat-badge problematic">
              ⚠️ {problematicCount} проблемы
            </span>
          </div>
        </div>
        
        <div className="container-summary">
          <div className="hashrate">
            <strong>{stats?.total_hashrate?.toFixed(2) || 0} TH/s</strong>
          </div>
          <div className="power">
            {stats?.total_power || 0} Вт
          </div>
          <button className="expand-btn">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="container-content">
          <div className="miners-list">
            {miners?.map((miner, index) => (
              <MinerCard 
                key={`${miner.ip}-${index}`}
                miner={miner}
              />
            ))}
          </div>
          
          {(!miners || miners.length === 0) && (
            <div className="no-miners">
              <span>⛔ Нет майнеров в этом контейнере</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContainerCard;