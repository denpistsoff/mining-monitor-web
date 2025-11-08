import { useState, useMemo } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import '../styles/MinerView.css';

const MinersView = ({ farmName }) => {
    const { farmData, loading, error, refresh } = useFarmData(farmName);
    const [selectedContainer, setSelectedContainer] = useState('all');
    const [activeTab, setActiveTab] = useState('all');
    const [cardSize, setCardSize] = useState('medium');

    // Получаем список контейнеров
    const containers = useMemo(() => {
        if (!farmData?.containers) return [];
        return Object.keys(farmData.containers);
    }, [farmData]);

    // Фильтруем майнеры по выбранному контейнеру и статусу
    const filteredMiners = useMemo(() => {
        if (!farmData?.containers) return [];

        let miners = [];

        // Собираем всех майнеров из выбранных контейнеров
        if (selectedContainer === 'all') {
            Object.values(farmData.containers).forEach(container => {
                if (container.miners) {
                    Object.entries(container.miners).forEach(([minerId, minerData]) => {
                        miners.push({
                            id: minerId,
                            container: container.name || 'Unknown',
                            ...minerData
                        });
                    });
                }
            });
        } else {
            const container = farmData.containers[selectedContainer];
            if (container?.miners) {
                Object.entries(container.miners).forEach(([minerId, minerData]) => {
                    miners.push({
                        id: minerId,
                        container: selectedContainer,
                        ...minerData
                    });
                });
            }
        }

        // Фильтруем по статусу
        if (activeTab !== 'all') {
            miners = miners.filter(miner => {
                const status = miner.status?.toLowerCase();
                switch (activeTab) {
                    case 'online':
                        return status === 'online' || status === 'normal';
                    case 'problematic':
                        return status === 'warning' || status === 'problematic' || status === 'unstable';
                    case 'offline':
                        return status === 'offline' || status === 'error' || status === 'down';
                    default:
                        return true;
                }
            });
        }

        return miners;
    }, [farmData, selectedContainer, activeTab]);

    // Статистика для заголовка
    const stats = useMemo(() => {
        if (!farmData?.summary) {
            return {
                total: 0,
                online: 0,
                problematic: 0,
                offline: 0,
                hashrate: 0,
                power: 0
            };
        }

        return {
            total: farmData.summary.total_miners || 0,
            online: farmData.summary.online_miners || 0,
            problematic: farmData.summary.problematic_miners || 0,
            offline: farmData.summary.offline_miners || 0,
            hashrate: farmData.summary.total_hashrate || 0,
            power: farmData.summary.total_power || 0
        };
    }, [farmData]);

    if (loading) {
        return (
            <div className="miners-view">
                <div className="miners-header">
                    <h1>Загрузка данных...</h1>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="miners-view">
                <div className="miners-header">
                    <h1>Ошибка загрузки</h1>
                    <p>{error}</p>
                    <button className="action-btn primary" onClick={refresh}>
                        Повторить
                    </button>
                </div>
            </div>
        );
    }

    if (!farmData) {
        return (
            <div className="miners-view">
                <div className="miners-header">
                    <h1>Данные не найдены</h1>
                    <p>Пожалуйста, проверьте название фермы</p>
                </div>
            </div>
        );
    }

    return (
        <div className="miners-view">
            {/* Заголовок и статистика */}
            <div className="miners-header">
                <h1>Ферма: {farmName}</h1>
                <div className="miners-stats">
                    <div className="stat-item">
                        Всего: <strong>{stats.total}</strong>
                    </div>
                    <div className="stat-item online">
                        Онлайн: <strong>{stats.online}</strong>
                    </div>
                    <div className="stat-item problematic">
                        Проблемы: <strong>{stats.problematic}</strong>
                    </div>
                    <div className="stat-item offline">
                        Оффлайн: <strong>{stats.offline}</strong>
                    </div>
                    <div className="stat-item">
                        Хешрейт: <strong>{(stats.hashrate / 1e6).toFixed(2)} TH/s</strong>
                    </div>
                    <div className="stat-item">
                        Мощность: <strong>{stats.power} W</strong>
                    </div>
                </div>
            </div>

            {/* Панель фильтров */}
            <div className="filters-panel">
                <div className="container-filter">
                    <label htmlFor="container-select">Контейнер:</label>
                    <select
                        id="container-select"
                        value={selectedContainer}
                        onChange={(e) => setSelectedContainer(e.target.value)}
                    >
                        <option value="all">Все контейнеры</option>
                        {containers.map(container => (
                            <option key={container} value={container}>
                                {container}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="tab-buttons">
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        Все ({stats.total})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'online' ? 'active' : ''}`}
                        onClick={() => setActiveTab('online')}
                    >
                        Онлайн ({stats.online})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'problematic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('problematic')}
                    >
                        Проблемы ({stats.problematic})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'offline' ? 'active' : ''}`}
                        onClick={() => setActiveTab('offline')}
                    >
                        Оффлайн ({stats.offline})
                    </button>
                </div>

                <div className="size-controls">
                    <label>Размер карточек:</label>
                    <div className="size-buttons">
                        <button
                            className={`size-btn ${cardSize === 'small' ? 'active' : ''}`}
                            onClick={() => setCardSize('small')}
                        >
                            Маленький
                        </button>
                        <button
                            className={`size-btn ${cardSize === 'medium' ? 'active' : ''}`}
                            onClick={() => setCardSize('medium')}
                        >
                            Средний
                        </button>
                        <button
                            className={`size-btn ${cardSize === 'large' ? 'active' : ''}`}
                            onClick={() => setCardSize('large')}
                        >
                            Большой
                        </button>
                    </div>
                </div>
            </div>

            {/* Панель действий */}
            <div className="actions-panel">
                <button className="action-btn primary" onClick={refresh}>
                    Обновить данные
                </button>
                <button className="action-btn secondary">
                    Экспорт отчета
                </button>
                <button className="action-btn warning">
                    Перезагрузить проблемные
                </button>
                <button className="action-btn danger">
                    Остановить все
                </button>
            </div>

            {/* Сетка майнеров */}
            <div className="miners-grid">
                {filteredMiners.length === 0 ? (
                    <div className="no-miners-message">
                        <h3>Майнеры не найдены</h3>
                        <p>Нет майнеров, соответствующих выбранным фильтрам</p>
                    </div>
                ) : (
                    filteredMiners.map(miner => (
                        <div
                            key={miner.id}
                            className={`miner-card ${cardSize} ${miner.status?.toLowerCase()}`}
                        >
                            <div className="miner-card-header">
                                <h3>{miner.id}</h3>
                                <span className={`status-badge ${miner.status?.toLowerCase()}`}>
                                    {miner.status || 'Unknown'}
                                </span>
                            </div>
                            <div className="miner-card-body">
                                <div className="miner-info">
                                    <div className="info-row">
                                        <span>Контейнер:</span>
                                        <span>{miner.container}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Хешрейт:</span>
                                        <span>{(miner.hashrate / 1e6).toFixed(2)} TH/s</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Мощность:</span>
                                        <span>{miner.power} W</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Температура:</span>
                                        <span>{miner.temperature}°C</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Вентиляторы:</span>
                                        <span>{miner.fan_speed} RPM</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Время работы:</span>
                                        <span>{miner.uptime}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="miner-card-actions">
                                <button className="btn-small primary">Перезагрузить</button>
                                <button className="btn-small secondary">Детали</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MinersView;