import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadFarms();
    }, []);

    const loadFarms = async () => {
        try {
            // Симуляция загрузки ферм из JSON файлов
            const mockFarms = [
                { name: 'DESKTOP-TO75OLC', miners: 2, hashrate: 264.88, status: 'online' },
                { name: 'FARM-2', miners: 5, hashrate: 1250.50, status: 'online' },
                { name: 'FARM-3', miners: 3, hashrate: 890.25, status: 'warning' },
                { name: 'FARM-4', miners: 0, hashrate: 0, status: 'offline' }
            ];

            setFarms(mockFarms);
        } catch (error) {
            console.error('Error loading farms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFarmSelect = (farmName) => {
        navigate(`/farm/${farmName}/dashboard`);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'online': return '🟢';
            case 'warning': return '🟡';
            case 'offline': return '🔴';
            default: return '⚪';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'online': return 'Онлайн';
            case 'warning': return 'Проблемы';
            case 'offline': return 'Офлайн';
            default: return 'Неизвестно';
        }
    };

    if (loading) {
        return (
            <div className="farm-selection">
                <div className="loading">
                    <div className="loading-spinner large"></div>
                    <p>Загрузка списка ферм...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="farm-selection">
            <div className="selection-header">
                <h1>🏭 Выбор площадки</h1>
                <p>Выберите ферму для мониторинга</p>
            </div>

            <div className="farms-grid">
                {farms.map((farm, index) => (
                    <div
                        key={farm.name}
                        className={`farm-card farm-${farm.status}`}
                        onClick={() => handleFarmSelect(farm.name)}
                    >
                        <div className="farm-header">
                            <div className="farm-icon">⛏️</div>
                            <div className="farm-info">
                                <h3>{farm.name}</h3>
                                <span className={`farm-status ${farm.status}`}>
                                    {getStatusIcon(farm.status)} {getStatusText(farm.status)}
                                </span>
                            </div>
                        </div>

                        <div className="farm-stats">
                            <div className="farm-stat">
                                <span className="stat-label">Майнеры</span>
                                <span className="stat-value">{farm.miners}</span>
                            </div>
                            <div className="farm-stat">
                                <span className="stat-label">Хешрейт</span>
                                <span className="stat-value">{farm.hashrate} TH/s</span>
                            </div>
                        </div>

                        <div className="farm-actions">
                            <button className="btn btn-primary">
                                📊 Перейти к мониторингу
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {farms.length === 0 && (
                <div className="no-farms">
                    <div className="no-farms-icon">🏭</div>
                    <h3>Фермы не найдены</h3>
                    <p>Добавьте JSON файлы с данными ферм</p>
                </div>
            )}
        </div>
    );
};

export default FarmSelection;