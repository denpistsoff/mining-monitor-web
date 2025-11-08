import React from 'react';
import { useFarmData } from '../hooks/useFarmData';
import { useOutletContext } from 'react-router-dom';
import StatsGrid from './StatsGrid';
import ContainerCard from './ContainerCard';
import '../styles/components/Dashboard.css';

const Dashboard = () => {
    const { farmNameProp } = useOutletContext();
    const { farmData, loading, error } = useFarmData(farmNameProp);

    // Функция для подсчета ТОЛЬКО онлайн майнеров (status === 'online')
    const countOnlineMiners = (containers) => {
        if (!containers) return 0;

        let onlineCount = 0;
        Object.values(containers).forEach(container => {
            Object.values(container.miners || {}).forEach(miner => {
                if (miner.status === 'online') {
                    onlineCount++;
                }
            });
        });
        return onlineCount;
    };

    // Функция для подсчета проблемных майнеров
    const countProblematicMiners = (containers) => {
        if (!containers) return 0;

        let problematicCount = 0;
        Object.values(containers).forEach(container => {
            Object.values(container.miners || {}).forEach(miner => {
                if (miner.status === 'problematic') {
                    problematicCount++;
                }
            });
        });
        return problematicCount;
    };

    // Функция для подсчета оффлайн майнеров
    const countOfflineMiners = (containers) => {
        if (!containers) return 0;

        let offlineCount = 0;
        Object.values(containers).forEach(container => {
            Object.values(container.miners || {}).forEach(miner => {
                if (miner.status === 'offline') {
                    offlineCount++;
                }
            });
        });
        return offlineCount;
    };

    // Функция для подсчета общего хешрейта только онлайн майнеров
    const calculateTotalHashrate = (containers) => {
        if (!containers) return 0;

        let totalHashrate = 0;
        Object.values(containers).forEach(container => {
            Object.values(container.miners || {}).forEach(miner => {
                if (miner.status === 'online' && miner.hashrate) {
                    totalHashrate += miner.hashrate;
                }
            });
        });
        return totalHashrate;
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

    // Обновляем summary с правильными счетчиками
    const updatedSummary = {
        ...farmData.summary,
        online_miners: countOnlineMiners(farmData.containers),
        problematic_miners: countProblematicMiners(farmData.containers),
        offline_miners: countOfflineMiners(farmData.containers),
        total_hashrate: calculateTotalHashrate(farmData.containers),
        total_miners: countOnlineMiners(farmData.containers) +
            countProblematicMiners(farmData.containers) +
            countOfflineMiners(farmData.containers)
    };

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

            <StatsGrid summary={updatedSummary} />

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