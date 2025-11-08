import React, { useState, useEffect } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import StatsGrid from './StatsGrid';
import ContainerCard from './ContainerCard';
import FarmHistoryChart from './FarmHistoryChart';
import FarmHistory from '../utils/farmHistory';
import '../styles/components/Dashboard.css';

const Dashboard = ({ farmNameProp }) => {
    const { farmData, loading, error } = useFarmData(farmNameProp);
    const [historyData, setHistoryData] = useState(null);
    const [chartTimeRange, setChartTimeRange] = useState('24h');

    useEffect(() => {
        if (farmData && !loading) {
            // Сохраняем текущие данные в историю
            FarmHistory.saveCurrentData(farmData);

            // Загружаем историю для графика
            loadHistoryData();
        }
    }, [farmData, loading]);

    const loadHistoryData = async () => {
        const history = await FarmHistory.loadHistory();
        setHistoryData(history);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner large"></div>
                <p>ЗАГРУЗКА ДАННЫХ</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <div className="error-title">ОШИБКА</div>
                <div className="error-message">{error}</div>
                <button className="retry-button" onClick={() => window.location.reload()}>
                    ПОВТОРИТЬ
                </button>
            </div>
        );
    }

    if (!farmData) {
        return (
            <div className="no-data">
                <div className="no-data-title">ДАННЫЕ НЕДОСТУПНЫ</div>
                <div className="no-data-message">Нет данных для отображения</div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <h2>ДАШБОРД ФЕРМЫ {farmNameProp}</h2>
                    <div className="last-update">
                        Последнее обновление: {farmData.last_update}
                    </div>
                </div>
            </div>

            <StatsGrid summary={farmData.summary} />

            {/* Секция исторического графика */}
            <div className="history-section">
                <div className="section-header">
                    <h3 className="section-title">ИСТОРИЯ РАБОТЫ</h3>
                    <div className="time-range-selector">
                        <button
                            className={`time-range-btn ${chartTimeRange === '24h' ? 'active' : ''}`}
                            onClick={() => setChartTimeRange('24h')}
                        >
                            24Ч
                        </button>
                        <button
                            className={`time-range-btn ${chartTimeRange === '48h' ? 'active' : ''}`}
                            onClick={() => setChartTimeRange('48h')}
                        >
                            48Ч
                        </button>
                        <button
                            className={`time-range-btn ${chartTimeRange === '7d' ? 'active' : ''}`}
                            onClick={() => setChartTimeRange('7d')}
                        >
                            7ДН
                        </button>
                    </div>
                </div>

                <FarmHistoryChart
                    historyData={historyData}
                    timeRange={chartTimeRange}
                    currentData={farmData.summary}
                />
            </div>

            <div className="containers-section">
                <h3 className="section-title">КОНТЕЙНЕРЫ</h3>
                <div className="containers-grid">
                    {Object.entries(farmData.containers || {}).map(([containerId, container]) => (
                        <ContainerCard
                            key={containerId}
                            containerId={containerId}
                            container={container}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;