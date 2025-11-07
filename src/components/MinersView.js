import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useFarmData } from '../hooks/useFarmData';
import MinerCard from './MinerCard';
import '../styles/components/MinerView.css';

const MinersView = ({ farmName }) => {
    // остальной код без изменений
    const { farmName } = useOutletContext();
    const { farmData, loading, error } = useFarmData(farmName);
    const [selectedContainer, setSelectedContainer] = useState('all');
    const [activeTab, setActiveTab] = useState('all');

    if (loading) return <div className="loading">ЗАГРУЗКА МАЙНЕРОВ</div>;
    if (error) return <div className="error">ОШИБКА: {error}</div>;
    if (!farmData) return <div className="no-data">НЕТ ДАННЫХ</div>;

    const containers = farmData.containers || {};

    // Собираем всех майнеров из всех контейнеров
    const getAllMiners = () => {
        let allMiners = [];
        Object.entries(containers).forEach(([containerId, container]) => {
            if (container.miners_data) {
                container.miners_data.forEach(miner => {
                    allMiners.push({
                        ...miner,
                        containerId: containerId
                    });
                });
            }
        });
        return allMiners;
    };

    const allMiners = getAllMiners();

    // Фильтруем майнеров по выбранным критериям
    const filteredMiners = allMiners.filter(miner => {
        // Фильтр по контейнеру
        if (selectedContainer !== 'all' && miner.containerId !== selectedContainer) {
            return false;
        }

        // Фильтр по статусу
        switch (activeTab) {
            case 'online':
                return miner.status === 'online';
            case 'problematic':
                return miner.status === 'problematic' || miner.problem_reason;
            case 'offline':
                return miner.status === 'offline';
            default:
                return true; // 'all' - показываем всех
        }
    });

    // Статистика
    const stats = {
        total: allMiners.length,
        online: allMiners.filter(m => m.status === 'online').length,
        problematic: allMiners.filter(m => m.status === 'problematic' || m.problem_reason).length,
        offline: allMiners.filter(m => m.status === 'offline').length
    };

    return (
        <div className="miners-view">
            <div className="miners-header">
                <h1>УПРАВЛЕНИЕ МАЙНЕРАМИ - {farmName}</h1>
                <div className="miners-stats">
                    <div className="stat-item">ВСЕГО: <strong>{stats.total}</strong></div>
                    <div className="stat-item online">ОНЛАЙН: <strong>{stats.online}</strong></div>
                    <div className="stat-item problematic">ПРОБЛЕМЫ: <strong>{stats.problematic}</strong></div>
                    <div className="stat-item offline">ОФФЛАЙН: <strong>{stats.offline}</strong></div>
                </div>
            </div>

            {/* Фильтры */}
            <div className="filters-panel">
                <div className="container-filter">
                    <label>КОНТЕЙНЕР:</label>
                    <select
                        value={selectedContainer}
                        onChange={(e) => setSelectedContainer(e.target.value)}
                    >
                        <option value="all">ВСЕ КОНТЕЙНЕРЫ</option>
                        {Object.keys(containers).map(containerId => (
                            <option key={containerId} value={containerId}>
                                КОНТЕЙНЕР {containerId}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="tab-buttons">
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        ВСЕ ({stats.total})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'online' ? 'active' : ''}`}
                        onClick={() => setActiveTab('online')}
                    >
                        ОНЛАЙН ({stats.online})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'problematic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('problematic')}
                    >
                        ПРОБЛЕМЫ ({stats.problematic})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'offline' ? 'active' : ''}`}
                        onClick={() => setActiveTab('offline')}
                    >
                        ОФФЛАЙН ({stats.offline})
                    </button>
                </div>
            </div>

            {/* Список майнеров */}
            <div className="miners-grid">
                {filteredMiners.length > 0 ? (
                    filteredMiners.map((miner, index) => (
                        <MinerCard
                            key={`${miner.ip}-${index}-${miner.containerId}`}
                            miner={miner}
                            showContainer={selectedContainer === 'all'}
                        />
                    ))
                ) : (
                    <div className="no-miners-message">
                        <h3>МАЙНЕРЫ НЕ НАЙДЕНЫ</h3>
                        <p>Измените фильтры для поиска</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MinersView;