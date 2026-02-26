// src/components/AlertsPanel.js
import React, { useState, useEffect } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import alertManager from '../utils/alertManager';
import '../styles/components/AlertsPanel.css';

const AlertsPanel = ({ farmNameProp, isOpen, onClose, onCountChange }) => {
    const { farmData } = useFarmData(farmNameProp);
    const [allAlerts, setAllAlerts] = useState([]);
    const [filteredAlerts, setFilteredAlerts] = useState({
        unread: [],
        read: [],
        dismissed: []
    });
    const [showDismissed, setShowDismissed] = useState(false);
    const [showRead, setShowRead] = useState(false);

    // Генерируем уведомления на основе реальных данных с фермы
    useEffect(() => {
        if (!farmData || !farmData.containers) return;

        const newAlerts = [];

        Object.entries(farmData.containers).forEach(([containerId, container]) => {
            const miners = container.miners || [];

            miners.forEach(miner => {
                // Проверяем проблемные майнеры
                if (miner.status === 'problematic' || miner.status === 'offline') {
                    // Создаем уникальный ID на основе IP и времени первого появления
                    const alertBaseId = `${miner.ip}_${miner.status}`;
                    const alertId = `${alertBaseId}_${Date.now()}`;

                    let severity = 'warning';
                    let message = '';

                    if (miner.status === 'offline') {
                        severity = 'critical';
                        message = `Майнер ${miner.ip} отключен`;
                    } else if (miner.problem_reason) {
                        if (miner.problem_reason.includes('температура')) {
                            severity = 'critical';
                            message = `Высокая температура на майнере ${miner.ip}: ${miner.temperature}°C`;
                        } else if (miner.problem_reason.includes('хешрейт')) {
                            message = `Низкий хешрейт на майнере ${miner.ip}: ${miner.hashrate?.toFixed(2)} TH/s`;
                        } else {
                            message = `Проблема на майнере ${miner.ip}: ${miner.problem_reason}`;
                        }
                    }

                    newAlerts.push({
                        id: alertId,
                        baseId: alertBaseId,
                        ip: miner.ip,
                        containerId,
                        message,
                        severity,
                        timestamp: Date.now(),
                        problem_reason: miner.problem_reason,
                        temperature: miner.temperature,
                        hashrate: miner.hashrate,
                        status: miner.status
                    });
                }
            });
        });

        // Сортируем по времени (сначала новые)
        newAlerts.sort((a, b) => b.timestamp - a.timestamp);

        setAllAlerts(newAlerts);
    }, [farmData]);

    // Фильтруем уведомления через AlertManager
    useEffect(() => {
        const filtered = alertManager.getFilteredAlerts(farmNameProp, allAlerts);
        setFilteredAlerts(filtered);

        // Передаем счетчик в родительский компонент
        if (onCountChange) {
            onCountChange(filtered.unread.length);
        }
    }, [allAlerts, farmNameProp, onCountChange]);

    const handleDismiss = (alertId) => {
        alertManager.dismissAlert(farmNameProp, alertId);

        // Обновляем filtered
        const filtered = alertManager.getFilteredAlerts(farmNameProp, allAlerts);
        setFilteredAlerts(filtered);
    };

    const handleMarkAsRead = (alertId) => {
        alertManager.markAsRead(farmNameProp, alertId);

        const filtered = alertManager.getFilteredAlerts(farmNameProp, allAlerts);
        setFilteredAlerts(filtered);
    };

    const handleMarkAllAsRead = () => {
        alertManager.markAllAsRead(farmNameProp, allAlerts.map(a => a.id));

        const filtered = alertManager.getFilteredAlerts(farmNameProp, allAlerts);
        setFilteredAlerts(filtered);
    };

    const handleDismissAll = () => {
        allAlerts.forEach(alert => {
            alertManager.dismissAlert(farmNameProp, alert.id);
        });

        const filtered = alertManager.getFilteredAlerts(farmNameProp, allAlerts);
        setFilteredAlerts(filtered);
    };

    const handleClearHistory = () => {
        if (window.confirm('Очистить всю историю уведомлений?')) {
            alertManager.clearHistory(farmNameProp);

            const filtered = alertManager.getFilteredAlerts(farmNameProp, allAlerts);
            setFilteredAlerts(filtered);
        }
    };

    const getAlertIcon = (severity) => {
        switch (severity) {
            case 'critical': return '🔴';
            case 'warning': return '🟡';
            case 'info': return '🔵';
            default: return '⚪';
        }
    };

    const getSeverityText = (severity) => {
        switch (severity) {
            case 'critical': return 'КРИТИЧЕСКИЙ';
            case 'warning': return 'ПРЕДУПРЕЖДЕНИЕ';
            case 'info': return 'ИНФОРМАЦИЯ';
            default: return 'УВЕДОМЛЕНИЕ';
        }
    };

    if (!isOpen) return null;

    const displayAlerts = showDismissed ? filteredAlerts.dismissed :
        (showRead ? filteredAlerts.read : filteredAlerts.unread);

    return (
        <div className="alerts-overlay">
            <div className="alerts-panel">
                <div className="alerts-header">
                    <div className="alerts-title">
                        <span>ОПОВЕЩЕНИЯ - {farmNameProp}</span>
                        {filteredAlerts.unread.length > 0 && (
                            <span className="alerts-count">{filteredAlerts.unread.length}</span>
                        )}
                    </div>
                    <button className="alerts-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="alerts-filters">
                    <button
                        className={`filter-btn ${!showRead && !showDismissed ? 'active' : ''}`}
                        onClick={() => {
                            setShowRead(false);
                            setShowDismissed(false);
                        }}
                    >
                        🔔 Непрочитанные ({filteredAlerts.unread.length})
                    </button>
                    <button
                        className={`filter-btn ${showRead ? 'active' : ''}`}
                        onClick={() => {
                            setShowRead(true);
                            setShowDismissed(false);
                        }}
                    >
                        📖 Прочитанные ({filteredAlerts.read.length})
                    </button>
                    <button
                        className={`filter-btn ${showDismissed ? 'active' : ''}`}
                        onClick={() => {
                            setShowRead(false);
                            setShowDismissed(true);
                        }}
                    >
                        🗑️ Удаленные ({filteredAlerts.dismissed.length})
                    </button>
                </div>

                <div className="alerts-content">
                    {displayAlerts.length === 0 ? (
                        <div className="no-alerts">
                            <div className="no-alerts-icon">✅</div>
                            <span>НЕТ УВЕДОМЛЕНИЙ</span>
                            <p>В этой категории пока пусто</p>
                        </div>
                    ) : (
                        <div className="alerts-list">
                            {displayAlerts.map(alert => (
                                <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                                    <div className="alert-icon">
                                        {getAlertIcon(alert.severity)}
                                    </div>
                                    <div className="alert-content">
                                        <div className="alert-severity">
                                            {getSeverityText(alert.severity)}
                                        </div>
                                        <div className="alert-message">{alert.message}</div>
                                        <div className="alert-details">
                                            <span className="alert-ip">📡 {alert.ip}</span>
                                            <span className="alert-container">📦 {alert.containerId}</span>
                                        </div>
                                        {alert.temperature && alert.temperature !== 'N/A' && (
                                            <div className="alert-detail">
                                                🌡️ Температура: {alert.temperature}°C
                                            </div>
                                        )}
                                        {alert.hashrate > 0 && (
                                            <div className="alert-detail">
                                                📊 Хешрейт: {alert.hashrate.toFixed(2)} TH/s
                                            </div>
                                        )}
                                        <div className="alert-time">
                                            {new Date(alert.timestamp).toLocaleString('ru-RU')}
                                        </div>
                                    </div>
                                    <div className="alert-actions">
                                        {!showDismissed && (
                                            <>
                                                <button
                                                    className="alert-action read"
                                                    onClick={() => handleMarkAsRead(alert.id)}
                                                    title="Отметить как прочитанное"
                                                >
                                                    ✅
                                                </button>
                                                <button
                                                    className="alert-action dismiss"
                                                    onClick={() => handleDismiss(alert.id)}
                                                    title="Удалить навсегда"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="alerts-actions">
                    {!showDismissed && filteredAlerts.unread.length > 0 && (
                        <button
                            className="btn btn-primary"
                            onClick={handleMarkAllAsRead}
                        >
                            ✅ ОТМЕТИТЬ ВСЕ КАК ПРОЧИТАННЫЕ
                        </button>
                    )}
                    {!showDismissed && filteredAlerts.read.length > 0 && (
                        <button
                            className="btn btn-warning"
                            onClick={handleDismissAll}
                        >
                            🗑️ УДАЛИТЬ ВСЕ ПРОЧИТАННЫЕ
                        </button>
                    )}
                    {showDismissed && filteredAlerts.dismissed.length > 0 && (
                        <button
                            className="btn btn-danger"
                            onClick={handleClearHistory}
                        >
                            🧹 ОЧИСТИТЬ ИСТОРИЮ
                        </button>
                    )}
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                    >
                        ЗАКРЫТЬ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertsPanel;