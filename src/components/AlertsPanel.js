// src/components/AlertsPanel.js
import React, { useState, useEffect } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import '../styles/components/AlertsPanel.css';

const AlertsPanel = ({ farmNameProp, isOpen, onClose, onMarkAsRead }) => {
    const { farmData } = useFarmData(farmNameProp);
    const [alerts, setAlerts] = useState([]);
    const [readAlerts, setReadAlerts] = useState([]);

    // Загружаем прочитанные уведомления из localStorage
    useEffect(() => {
        const savedReadAlerts = localStorage.getItem(`readAlerts_${farmNameProp}`);
        if (savedReadAlerts) {
            setReadAlerts(JSON.parse(savedReadAlerts));
        }
    }, [farmNameProp]);

    // Генерируем уведомления на основе реальных данных с фермы
    useEffect(() => {
        if (!farmData || !farmData.containers) return;

        const newAlerts = [];

        // Проходим по всем контейнерам и майнерам
        Object.entries(farmData.containers).forEach(([containerId, container]) => {
            const miners = container.miners || [];

            miners.forEach(miner => {
                // Проверяем проблемные майнеры
                if (miner.status === 'problematic' || miner.status === 'offline') {
                    // Создаем уникальный ID для уведомления
                    const alertId = `${miner.ip}_${miner.status}_${Date.now()}`;

                    // Определяем тип проблемы
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
                            message = `Низкий хешрейт на майнере ${miner.ip}: ${miner.hashrate} TH/s`;
                        } else {
                            message = `Проблема на майнере ${miner.ip}: ${miner.problem_reason}`;
                        }
                    }

                    newAlerts.push({
                        id: alertId,
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

        setAlerts(newAlerts);
    }, [farmData]);

    const handleDismiss = (alertId) => {
        // Добавляем в прочитанные
        const updatedReadAlerts = [...readAlerts, alertId];
        setReadAlerts(updatedReadAlerts);

        // Сохраняем в localStorage
        localStorage.setItem(`readAlerts_${farmNameProp}`, JSON.stringify(updatedReadAlerts));

        // Убираем из списка
        setAlerts(prev => prev.filter(a => a.id !== alertId));

        // Обновляем счетчик в родительском компоненте
        if (onMarkAsRead) {
            onMarkAsRead(alertId);
        }
    };

    const handleDismissAll = () => {
        // Добавляем все текущие в прочитанные
        const allAlertIds = alerts.map(a => a.id);
        const updatedReadAlerts = [...readAlerts, ...allAlertIds];
        setReadAlerts(updatedReadAlerts);

        // Сохраняем в localStorage
        localStorage.setItem(`readAlerts_${farmNameProp}`, JSON.stringify(updatedReadAlerts));

        // Очищаем список
        setAlerts([]);

        // Обновляем счетчик
        if (onMarkAsRead) {
            onMarkAsRead('all');
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

    // Фильтруем только непрочитанные
    const unreadAlerts = alerts.filter(alert => !readAlerts.includes(alert.id));

    if (!isOpen) return null;

    return (
        <div className="alerts-overlay">
            <div className="alerts-panel">
                <div className="alerts-header">
                    <div className="alerts-title">
                        <span>ОПОВЕЩЕНИЯ - {farmNameProp}</span>
                        {unreadAlerts.length > 0 && (
                            <span className="alerts-count">{unreadAlerts.length}</span>
                        )}
                    </div>
                    <button className="alerts-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="alerts-content">
                    {unreadAlerts.length === 0 ? (
                        <div className="no-alerts">
                            <div className="no-alerts-icon">✅</div>
                            <span>НЕТ АКТИВНЫХ ОПОВЕЩЕНИЙ</span>
                            <p>Все системы работают в штатном режиме</p>
                        </div>
                    ) : (
                        <div className="alerts-list">
                            {unreadAlerts.map(alert => (
                                <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                                    <div className="alert-icon">
                                        {getAlertIcon(alert.severity)}
                                    </div>
                                    <div className="alert-content">
                                        <div className="alert-severity">
                                            {getSeverityText(alert.severity)}
                                        </div>
                                        <div className="alert-message">{alert.message}</div>
                                        {alert.temperature && (
                                            <div className="alert-detail">
                                                🌡️ Температура: {alert.temperature}°C
                                            </div>
                                        )}
                                        {alert.hashrate !== undefined && (
                                            <div className="alert-detail">
                                                📊 Хешрейт: {alert.hashrate.toFixed(2)} TH/s
                                            </div>
                                        )}
                                        <div className="alert-time">
                                            {new Date(alert.timestamp).toLocaleString('ru-RU')}
                                        </div>
                                    </div>
                                    <button
                                        className="alert-dismiss"
                                        onClick={() => handleDismiss(alert.id)}
                                        title="Отметить прочитанным"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="alerts-actions">
                    <button
                        className="btn btn-primary"
                        onClick={handleDismissAll}
                        disabled={unreadAlerts.length === 0}
                    >
                        ОТМЕТИТЬ ВСЕ КАК ПРОЧИТАННЫЕ
                    </button>
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