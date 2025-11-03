import React, { useState, useEffect } from 'react';
import { MiningMonitorAPI } from '../utils/firebase';
import '../styles/components/AlertsPanel.css';

const AlertsPanel = ({ farmName }) => {
  const [alerts, setAlerts] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const api = new MiningMonitorAPI(farmName);
    
    const unsubscribe = api.subscribeToAlerts((alertsData) => {
      if (alertsData) {
        const alertsArray = Object.entries(alertsData)
          .map(([id, alert]) => ({ id, ...alert }))
          .filter(alert => !alert.read)
          .sort((a, b) => b.timestamp - a.timestamp);
        
        setAlerts(alertsArray);
      }
    });

    return unsubscribe;
  }, [farmName]);

  const markAsRead = (alertId) => {
    const api = new MiningMonitorAPI(farmName);
    api.markAlertRead(alertId);
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  if (alerts.length === 0 && !isExpanded) {
    return null;
  }

  return (
    <div className={`alerts-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="alerts-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="alerts-title">
          <span className="alerts-icon">🚨</span>
          <span>Оповещения</span>
          {alerts.length > 0 && (
            <span className="alerts-count">{alerts.length}</span>
          )}
        </div>
        <button className="alerts-toggle">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="alerts-content">
          {alerts.length === 0 ? (
            <div className="no-alerts">
              <span>✅ Нет активных оповещений</span>
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
                    onClick={() => markAsRead(alert.id)}
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
              Скрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;