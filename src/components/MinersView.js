import React, { useState } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import MinerCard from './MinerCard';
import '../Styles/components/MinersView.css';

const MinersView = () => {
    const { farmData, loading, error } = useFarmData();
    const [selectedContainer, setSelectedContainer] = useState('all');
    const [activeTab, setActiveTab] = useState('online');

    if (loading) return <div className="loading">Загрузка майнеров...</div>;
    if (error) return <div className="error">Ошибка: {error}</div>;
    if (!farmData) return <div className="no-data">Нет данных</div>;

    // Получаем все контейнеры
    const containers = farmData.containers || {};
    
    // Фильтруем майнеров
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
        
        // Фильтр по контейнеру
        if (selectedContainer !== 'all') {
            filtered = filtered.filter(miner => miner.containerId === selectedContainer);
        }
        
        // Фильтр по статусу
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
                <h1>🖥️ Управление майнерами</h1>
                <div className="miners-stats">
                    <div className="stat-item">Всего: <strong>{stats.total}</strong></div>
                    <div className="stat-item online">Онлайн: <strong>{stats.online}</strong></div>
                    <div className="stat-item problematic">Проблемы: <strong>{stats.problematic}</strong></div>
                    <div className="stat-item offline">Офлайн: <strong>{stats.offline}</strong></div>
                </div>
            </div>

            {/* Фильтры */}
            <div className="filters-panel">
                <div className="container-filter">
                    <label>🗂️ Контейнер:</label>
                    <select 
                        value={selectedContainer} 
                        onChange={(e) => setSelectedContainer(e.target.value)}
                    >
                        <option value="all">Все контейнеры</option>
                        {Object.keys(containers).map(containerId => (
                            <option key={containerId} value={containerId}>
                                Контейнер {containerId}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="tab-buttons">
                    <button 
                        className={`tab-btn ${activeTab === 'online' ? 'active' : ''}`}
                        onClick={() => setActiveTab('online')}
                    >
                        🟢 Онлайн ({stats.online})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'problematic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('problematic')}
                    >
                        🟡 Проблемные ({stats.problematic})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'offline' ? 'active' : ''}`}
                        onClick={() => setActiveTab('offline')}
                    >
                        🔴 Офлайн ({stats.offline})
                    </button>
                </div>
            </div>

            {/* Действия */}
            <div className="actions-panel">
                <button className="action-btn primary">
                    🔄 Обновить все
                </button>
                <button className="action-btn secondary">
                    ⚡ Перезапустить онлайн
                </button>
                <button className="action-btn warning">
                    🔧 Диагностика проблемных
                </button>
                <button className="action-btn danger">
                    🚨 Включить офлайн
                </button>
            </div>

            {/* Список майнеров */}
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
                        <h3>🤷‍♂️ Майнеры не найдены</h3>
                        <p>Попробуйте изменить фильтры</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MinersView;