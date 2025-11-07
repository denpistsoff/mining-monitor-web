import React, { useState } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import MinerCard from './MinerCard';
import '../styles/components/MinerView.css';

const MinersView = ({ farmName }) => {
    const { farmData, loading, error } = useFarmData(farmName);
    const [selectedContainer, setSelectedContainer] = useState('all');
    const [activeTab, setActiveTab] = useState('online');

    if (loading) return <div className="loading">ЗАГРУЗКА МАЙНЕРОВ</div>;
    if (error) return <div className="error">ОШИБКА: {error}</div>;
    if (!farmData) return <div className="no-data">НЕТ ДАННЫХ</div>;

    const containers = farmData.containers || {};

    const getAllMiners = () => {
        let allMiners = [];
        Object.entries(containers).forEach(([containerId, container]) => {
            container.miners?.forEach(miner => {
                allMiners.push({
                    ...miner,
                    containerId: containerId
                });
            });
        });
        return allMiners;
    };

    const filterMiners = (miners) => {
        let filtered = miners;

        if (selectedContainer !== 'all') {
            filtered = filtered.filter(miner => miner.containerId === selectedContainer);
        }

        switch (activeTab) {
            case 'online':
                filtered = filtered.filter(miner => miner.status === 'online');
                break;
            case 'problematic':
                filtered = filtered.filter(miner => miner.status === 'problematic' || miner.problem_reason);
                break;
            case 'offline':
                filtered = filtered.filter(miner => miner.status === 'offline');
                break;
            default:
                break;
        }

        return filtered;
    };

    const allMiners = getAllMiners();
    const filteredMiners = filterMiners(allMiners);

    const getStats = () => {
        const total = allMiners.length;
        const online = allMiners.filter(m => m.status === 'online').length;
        const problematic = allMiners.filter(m => m.status === 'problematic' || m.problem_reason).length;
        const offline = allMiners.filter(m => m.status === 'offline').length;

        return { total, online, problematic, offline };
    };

    const stats = getStats();

    return (
        <div className="miners-view">
            <div className="miners-header">
                <h1>УПРАВЛЕНИЕ МАЙНЕРАМИ</h1>
                <div className="miners-stats">
                    <div className="stat-item">ВСЕГО: <strong>{stats.total}</strong></div>
                    <div className="stat-item online">ОНЛАЙН: <strong>{stats.online}</strong></div>
                    <div className="stat-item problematic">ПРОБЛЕМЫ: <strong>{stats.problematic}</strong></div>
                    <div className="stat-item offline">ОФФЛАЙН: <strong>{stats.offline}</strong></div>
                </div>
            </div>

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
                        className={`tab-btn ${activeTab === 'online' ? 'active' : ''}`}
                        onClick={() => setActiveTab('online')}
                    >
                        ОНЛАЙН ({stats.online})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'problematic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('problematic')}
                    >
                        ПРОБЛЕМНЫЕ ({stats.problematic})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'offline' ? 'active' : ''}`}
                        onClick={() => setActiveTab('offline')}
                    >
                        ОФФЛАЙН ({stats.offline})
                    </button>
                </div>
            </div>

            <div className="actions-panel">
                <button className="action-btn primary" onClick={() => alert('Функция в разработке')}>
                    ОБНОВИТЬ ВСЕ
                </button>
                <button className="action-btn secondary" onClick={() => alert('Функция в разработке')}>
                    ПЕРЕЗАПУСТИТЬ ОНЛАЙН
                </button>
                <button className="action-btn warning" onClick={() => alert('Функция в разработке')}>
                    ДИАГНОСТИКА ПРОБЛЕМНЫХ
                </button>
                <button className="action-btn danger" onClick={() => alert('Функция в разработке')}>
                    ВКЛЮЧИТЬ ОФФЛАЙН
                </button>
            </div>

            <div className="miners-grid">
                {filteredMiners.length > 0 ? (
                    filteredMiners.map((miner, index) => (
                        <MinerCard
                            key={`${miner.ip}-${index}`}
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