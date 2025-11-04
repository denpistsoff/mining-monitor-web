import React, { useState } from 'react';
import '/home/runner/work/mining-monitor-web/mining-monitor-web/src/styles/components/MinerView.css';

const MinerCard = ({ miner, showContainer = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const {
        ip,
        type,
        hashrate,
        temperature,
        power,
        pool,
        status,
        problem_reason,
        containerId
    } = miner;

    const getStatusIcon = () => {
        switch (status) {
            case 'online': return '🟢';
            case 'offline': return '🔴';
            case 'problematic': return '🟡';
            default: return '⚪';
        }
    };

    const handleRestart = () => {
        console.log(`Перезапуск майнера ${ip}`);
        // Тут будет API вызов
        alert(`Перезапуск ${ip}...`);
    };

    const handleDetails = () => {
        console.log(`Детали майнера ${ip}`);
        setIsExpanded(!isExpanded);
    };

    const handleDiagnose = () => {
        console.log(`Диагностика майнера ${ip}`);
        alert(`Запуск диагностики ${ip}...`);
    };

    return (
        <div className={`miner-card miner-${status}`}>
            <div className="miner-header">
                <div className="miner-identity">
                    <span className="miner-icon">
                        {type === 'antminer' ? '⚡' : 
                         type === 'whatsminer' ? '🔧' : '❓'}
                    </span>
                    <div className="miner-info">
                        <div className="miner-ip">{ip}</div>
                        <div className="miner-meta">
                            <span className="miner-type">{type || 'unknown'}</span>
                            {showContainer && containerId && (
                                <span className="miner-container">🗂️ {containerId}</span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="miner-status">
                    <span className={`status-indicator ${status}`}>
                        {getStatusIcon()} 
                        {status === 'online' ? 'Онлайн' : 
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
                <button className="btn btn-sm btn-primary" onClick={handleRestart}>
                    🔄 Перезапустить
                </button>
                <button className="btn btn-sm btn-secondary" onClick={handleDetails}>
                    {isExpanded ? '📕 Скрыть' : '📊 Детали'}
                </button>
                {(status === 'problematic' || problem_reason) && (
                    <button className="btn btn-sm btn-warning" onClick={handleDiagnose}>
                        🔧 Диагностика
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="miner-details">
                    <div className="detail-section">
                        <h4>📋 Подробная информация</h4>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span>IP адрес:</span>
                                <strong>{ip}</strong>
                            </div>
                            <div className="detail-item">
                                <span>Тип:</span>
                                <strong>{type}</strong>
                            </div>
                            <div className="detail-item">
                                <span>Контейнер:</span>
                                <strong>{containerId}</strong>
                            </div>
                            <div className="detail-item">
                                <span>Статус:</span>
                                <strong>{status}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MinerCard;