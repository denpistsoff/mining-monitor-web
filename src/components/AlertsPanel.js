import React, { useState, useEffect } from 'react';
import '../styles/components/AlertsPanel.css';

const AlertsPanel = ({ farmNameProp }) => {
    const [alerts, setAlerts] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);

    // Заглушка для оповещений
    useEffect(() => {
        // Временные данные для демонстрации
        const mockAlerts = [
            {
                id: 1,
                message: 'Высокая температура на майнере 192.168.80.59',
                severity: 'warning',
                timestamp: Date.now() - 3600000
            },
            {
                id: 2,
                message: 'Майнер 192.168.80.60 отключен',
                severity: 'critical',
                timestamp: Date.now() - 7200000
            }
        ];
        setAlerts(mockAlerts);
    }, [farmNameProp]);

    const getAlertIcon = (severity) => {
        switch (severity) {
            case 'critical': return '●';
            case 'warning': return '●';
            case 'info': return '●';
            default: return '●';
        }
    };

    if (alerts.length === 0 && !isExpanded) {
        return null;
    }

    return (
        <div className={`alerts-panel ${isExpanded ? 'expanded' : ''}`}>
            <div className="alerts-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="alerts-title">
                    <span>ОПОВЕЩЕНИЯ - {farmNameProp}</span>
                    {alerts.length > 0 && (
                        <span className="alerts-count">{alerts.length}</span>
                    )}
                </div>
                <button className="alerts-toggle">
                    {isExpanded ? '▲' : '▼'}
                </button>
            </div>

            {isExpanded && (
                <div className="alerts-content">
                    {alerts.length === 0 ? (
                        <div className="no-alerts">
                            <span>НЕТ АКТИВНЫХ ОПОВЕЩЕНИЙ</span>
                        </div>
                    ) : (
                        <div className="alerts-list">
                            {alerts.map(alert => (
                                <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                                    <div className="alert-icon">
                                        {getAlertIcon(alert.severity)}
                                    </div>
                                    <div className="alert-content">
                                        <div className="alert-message">{alert.message}</div>
                                        <div className="alert-time">
                                            {new Date(alert.timestamp).toLocaleString('ru-RU')}
                                        </div>
                                    </div>
                                    <button
                                        className="alert-dismiss"
                                        onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                                        title="Отметить прочитанным"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="alerts-actions">
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setIsExpanded(false)}
                        >
                            СКРЫТЬ
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertsPanel;