import React, { useState } from 'react';
import '../styles/components/MinerCard.css';

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

    const getStatusInfo = () => {
        switch (status) {
            case 'online': return { text: 'ОНЛАЙН', class: 'online' };
            case 'offline': return { text: 'ОФФЛАЙН', class: 'offline' };
            case 'problematic': return { text: 'ПРОБЛЕМЫ', class: 'problematic' };
            default: return { text: 'НЕИЗВЕСТНО', class: 'unknown' };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className={`miner-card miner-${statusInfo.class}`}>
            <div className="miner-header">
                <div className="miner-identity">
                    <div className="miner-icon">
                        {type === 'antminer' ? 'A' :
                            type === 'whatsminer' ? 'W' : 'M'}
                    </div>
                    <div className="miner-info">
                        <div className="miner-ip">{ip}</div>
                        <div className="miner-meta">
                            <span className="miner-type">{type || 'UNKNOWN'}</span>
                            {showContainer && containerId && (
                                <span className="miner-container">КОНТЕЙНЕР: {containerId}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="miner-status">
                    <span className={`status-indicator ${statusInfo.class}`}>
                        {statusInfo.text}
                    </span>
                </div>
            </div>

            <div className="miner-stats">
                <div className="stat-row">
                    <div className="stat-item">
                        <span className="stat-label">ХЕШРЕЙТ</span>
                        <span className="stat-value">
                            {hashrate ? `${hashrate.toFixed(2)} TH/S` : 'N/A'}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">ТЕМПЕРАТУРА</span>
                        <span className="stat-value">
                            {temperature ? `${temperature}°C` : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="stat-row">
                    <div className="stat-item">
                        <span className="stat-label">ПИТАНИЕ</span>
                        <span className="stat-value">
                            {power ? `${power} ВТ` : 'N/A'}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">ПУЛ</span>
                        <span className="stat-value pool" title={pool}>
                            {pool ? (pool.length > 20 ? `${pool.substring(0, 20)}...` : pool) : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {problem_reason && (
                <div className="miner-problem">
                    <div className="problem-text">
                        <strong>ПРОБЛЕМА:</strong> {problem_reason}
                    </div>
                </div>
            )}

            <div className="miner-actions">
                <button className="btn btn-sm btn-secondary" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'СКРЫТЬ' : 'ПОДРОБНО'}
                </button>
            </div>

            {isExpanded && (
                <div className="miner-details">
                    <div className="detail-section">
                        <h4>ДЕТАЛЬНАЯ ИНФОРМАЦИЯ</h4>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span>IP АДРЕС:</span>
                                <strong>{ip}</strong>
                            </div>
                            <div className="detail-item">
                                <span>ТИП:</span>
                                <strong>{type}</strong>
                            </div>
                            <div className="detail-item">
                                <span>СТАТУС:</span>
                                <strong>{status}</strong>
                            </div>
                            {containerId && (
                                <div className="detail-item">
                                    <span>КОНТЕЙНЕР:</span>
                                    <strong>{containerId}</strong>
                                </div>
                            )}
                            {pool && (
                                <div className="detail-item">
                                    <span>ПУЛ:</span>
                                    <strong>{pool}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MinerCard;