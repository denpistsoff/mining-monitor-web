import React, { useState, useEffect, useRef } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import StatsGrid from './StatsGrid';
import ContainerCard from './ContainerCard';
import historyManager from '../utils/historyManager';
import '../styles/components/Dashboard.css';

const Dashboard = ({ farmNameProp }) => {
    const { farmData, loading, error } = useFarmData(farmNameProp);
    const [historyData, setHistoryData] = useState(null);
    const [activeTab, setActiveTab] = useState('hashrate'); // 'hashrate' или 'power'
    const [chartTimeRange, setChartTimeRange] = useState('24h');

    useEffect(() => {
        // Инициализируем историю
        historyManager.initHistory().then(setHistoryData);
    }, []);

    useEffect(() => {
        if (farmData && !loading) {
            historyManager.saveCurrentData(farmData).then(setHistoryData);
        }
    }, [farmData, loading]);

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

            {/* График с табами */}
            <ChartTabsSection
                historyData={historyData}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                timeRange={chartTimeRange}
                onTimeRangeChange={setChartTimeRange}
                currentData={farmData.summary}
            />

            <div className="containers-section">
                <h3 className="section-title">⚡ КОНТЕЙНЕРЫ</h3>
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

// Компонент с табами для графиков
const ChartTabsSection = ({ historyData, activeTab, onTabChange, timeRange, onTimeRangeChange, currentData }) => {
    const [hourlyData, setHourlyData] = useState([]);

    useEffect(() => {
        if (historyData) {
            const hours = timeRange === '24h' ? 24 : timeRange === '48h' ? 48 : 168;
            historyManager.getHourlyData(hours).then(setHourlyData);
        }
    }, [historyData, timeRange]);

    return (
        <div className="chart-tabs-section">
            <div className="section-header">
                <div className="section-title-wrapper">
                    <h3 className="section-title">📈 ИСТОРИЯ РАБОТЫ</h3>
                    <div className="history-stats">
                        <span className="stat-badge">Часов: {hourlyData.length}</span>
                    </div>
                </div>

                <div className="chart-controls">
                    <div className="tabs-container">
                        <button
                            className={`tab-btn ${activeTab === 'hashrate' ? 'active' : ''}`}
                            onClick={() => onTabChange('hashrate')}
                        >
                            🚀 ХЕШРЕЙТ
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'power' ? 'active' : ''}`}
                            onClick={() => onTabChange('power')}
                        >
                            ⚡ ПОТРЕБЛЕНИЕ
                        </button>
                    </div>

                    <div className="time-range-selector">
                        <button
                            className={`time-range-btn ${timeRange === '24h' ? 'active' : ''}`}
                            onClick={() => onTimeRangeChange('24h')}
                        >
                            24Ч
                        </button>
                        <button
                            className={`time-range-btn ${timeRange === '48h' ? 'active' : ''}`}
                            onClick={() => onTimeRangeChange('48h')}
                        >
                            48Ч
                        </button>
                        <button
                            className={`time-range-btn ${timeRange === '7d' ? 'active' : ''}`}
                            onClick={() => onTimeRangeChange('7d')}
                        >
                            7ДН
                        </button>
                    </div>
                </div>
            </div>

            <div className="chart-container">
                {activeTab === 'hashrate' && (
                    <HashrateChart
                        data={hourlyData}
                        currentData={currentData}
                    />
                )}
                {activeTab === 'power' && (
                    <PowerChart
                        data={hourlyData}
                        currentData={currentData}
                    />
                )}
            </div>
        </div>
    );
};

// График хешрейта
const HashrateChart = ({ data, currentData }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = renderChart;
            document.head.appendChild(script);
        } else {
            renderChart();
        }

        function renderChart() {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            if (!data || data.length === 0 || !chartRef.current) {
                return;
            }

            const ctx = chartRef.current.getContext('2d');

            // Градиент для хешрейта
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(255, 140, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 140, 0, 0.1)');

            chartInstance.current = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item => item.label),
                    datasets: [{
                        label: 'Хешрейт (TH/s)',
                        data: data.map(item => item.hashrate),
                        borderColor: '#ff8c00',
                        backgroundColor: gradient,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ff8c00',
                        pointBorderColor: '#000',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(26, 15, 10, 0.95)',
                            titleColor: '#ff8c00',
                            bodyColor: '#ffffff',
                            borderColor: '#ff8c00',
                            callbacks: {
                                label: function(context) {
                                    return `Хешрейт: ${context.parsed.y.toFixed(2)} TH/s`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 140, 0, 0.1)',
                            },
                            ticks: {
                                color: '#a0a0a0',
                                maxTicksLimit: 8,
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 140, 0, 0.1)',
                            },
                            ticks: {
                                color: '#ff8c00',
                                callback: function(value) {
                                    return value.toFixed(0) + ' TH/s';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Хешрейт (TH/s)',
                                color: '#ff8c00'
                            }
                        },
                    }
                }
            });
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="chart-empty">
                <div className="empty-message">
                    <p>📊 Нет данных по хешрейту</p>
                    <span>Данные появятся после сохранения почасовой статистики</span>
                </div>
            </div>
        );
    }

    return (
        <div className="chart-wrapper">
            <div className="chart-header">
                <h4>📊 ГРАФИК ХЕШРЕЙТА</h4>
                <div className="current-value hashrate-value">
                    Текущий: <strong>{currentData?.total_hashrate?.toFixed(2)} TH/s</strong>
                </div>
            </div>
            <canvas ref={chartRef} />
        </div>
    );
};

// График потребления
const PowerChart = ({ data, currentData }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = renderChart;
            document.head.appendChild(script);
        } else {
            renderChart();
        }

        function renderChart() {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            if (!data || data.length === 0 || !chartRef.current) {
                return;
            }

            const ctx = chartRef.current.getContext('2d');

            // Градиент для потребления
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(0, 170, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(0, 170, 255, 0.1)');

            chartInstance.current = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item => item.label),
                    datasets: [{
                        label: 'Потребление (кВт)',
                        data: data.map(item => item.power / 1000),
                        borderColor: '#00aaff',
                        backgroundColor: gradient,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#00aaff',
                        pointBorderColor: '#000',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(26, 15, 10, 0.95)',
                            titleColor: '#00aaff',
                            bodyColor: '#ffffff',
                            borderColor: '#00aaff',
                            callbacks: {
                                label: function(context) {
                                    return `Потребление: ${context.parsed.y.toFixed(1)} кВт`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(0, 170, 255, 0.1)',
                            },
                            ticks: {
                                color: '#a0a0a0',
                                maxTicksLimit: 8,
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(0, 170, 255, 0.1)',
                            },
                            ticks: {
                                color: '#00aaff',
                                callback: function(value) {
                                    return value.toFixed(0) + ' кВт';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Потребление (кВт)',
                                color: '#00aaff'
                            }
                        },
                    }
                }
            });
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="chart-empty">
                <div className="empty-message">
                    <p>⚡ Нет данных по потреблению</p>
                    <span>Данные появятся после сохранения почасовой статистики</span>
                </div>
            </div>
        );
    }

    return (
        <div className="chart-wrapper">
            <div className="chart-header">
                <h4>⚡ ГРАФИК ПОТРЕБЛЕНИЯ</h4>
                <div className="current-value power-value">
                    Текущее: <strong>{(currentData?.total_power / 1000)?.toFixed(1)} кВт</strong>
                </div>
            </div>
            <canvas ref={chartRef} />
        </div>
    );
};

export default Dashboard;