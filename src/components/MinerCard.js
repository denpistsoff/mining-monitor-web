import React from 'react';
import '../styles/components/MinerCard.css';

const MinerCard = ({ miner }) => {
  const {
    ip,
    type,
    hashrate,
    temperature,
    power,
    pool,
    status,
    problem_reason
  } = miner;

  const getStatusIcon = () => {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'problematic': return '🟡';
      default: return '⚪';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'danger';
      case 'problematic': return 'warning';
      default: return 'muted';
    }
  };

  return (
    <div className={`miner-card miner-${getStatusColor()}`}>
      <div className="miner-header">
        <div className="miner-identity">
          <span className="miner-icon">
            {type === 'antminer' ? '⚡' : 
             type === 'whatsminer' ? '🔧' : '❓'}
          </span>
          <div className="miner-info">
            <div className="miner-ip">{ip}</div>
            <div className="miner-type">{type || 'unknown'}</div>
          </div>
        </div>
        
        <div className="miner-status">
          <span className={`status-indicator ${getStatusColor()}`}>
            {getStatusIcon()} {status === 'online' ? 'Онлайн' : 
                            status === 'offline' ? 'Офлайн' : 
                            'Проблемы'}
          </span>
        </div>
      </div>

      <div className="miner-stats">
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">Хешрейт</span>
            <span className="stat-value">
              {hashrate ? `${hashrate.toFixed(2)} TH/s` : 'N/A'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Температура</span>
            <span className="stat-value">
              {temperature && temperature !== 'N/A' ? `${temperature}°C` : 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">Питание</span>
            <span className="stat-value">
              {power && power !== 'N/A' ? `${power} Вт` : 'N/A'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Пул</span>
            <span className="stat-value pool" title={pool}>
              {pool && pool !== 'нет данных' ? 
                pool.length > 15 ? `${pool.substring(0, 15)}...` : pool 
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {problem_reason && (
        <div className="miner-problem">
          <div className="problem-icon">⚠️</div>
          <div className="problem-text">
            <strong>Проблема:</strong> {problem_reason}
          </div>
        </div>
      )}

      <div className="miner-actions">
        <button className="btn btn-sm btn-secondary">
          🔄 Перезапустить
        </button>
        <button className="btn btn-sm btn-secondary">
          📊 Детали
        </button>
      </div>
    </div>
  );
};

export default MinerCard;