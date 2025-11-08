import React, { useState, useEffect } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import StatsGrid from './StatsGrid';
import ContainerCard from './ContainerCard';
import FarmHistory from '../utils/farmHistory';
import '../styles/components/Dashboard.css';

const Dashboard = ({ farmNameProp }) => {
    const { farmData, loading, error } = useFarmData(farmNameProp);
    const [historyData, setHistoryData] = useState(null);
    const [chartTimeRange, setChartTimeRange] = useState('24h');

    useEffect(() => {
        if (farmData && !loading) {
            // Сохраняем текущие данные в историю
            FarmHistory.saveCurrentData(farmData).then(updatedHistory => {
                setHistoryData(updatedHistory);
            });
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

            {/* Статистика сверху */}
            <StatsGrid summary={farmData.summary} />

            {/* График по середине */}
            <div className="history-section">
                <div className="section-header">
                    <h3 className="section-title">📊 ИСТОРИЯ РАБОТЫ</h3>
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

                <HistoryChartComponent
                    historyData={historyData}
                    timeRange={chartTimeRange}
                    currentData={farmData.summary}
                />
            </div>

            {/* Контейнеры снизу */}
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

// Компонент графика прямо внутри Dashboard.js
const HistoryChartComponent = ({ historyData, timeRange, currentData }) => {
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    React.useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        if (!historyData || !historyData.farm_history || historyData.farm_history.length === 0) {
            return;
        }

        const getTimeRangeHours = () => {
            switch (timeRange) {
                case '24h': return 24;
                case '48h': return 48;
                case '7d': return 168;
                default: return 24;
            }
        };

        const filteredData = FarmHistory.getLastNHours(historyData, getTimeRangeHours());

        if (filteredData.length === 0) {
            return;
        }

        const ctx = chartRef.current.getContext('2d');

        // Создаем градиенты
        const gradientHashrate = ctx.createLinearGradient(0, 0, 0, 300);
        gradientHashrate.addColorStop(0, 'rgba(255, 140, 0, 0.3)');
        gradientHashrate.addColorStop(1, 'rgba(255, 140, 0, 0.05)');

        const gradientPower = ctx.createLinearGradient(0, 0, 0, 300);
        gradientPower.addColorStop(0, 'rgba(0, 170, 255, 0.3)');
        gradientPower.addColorStop(1, 'rgba(0, 170, 255, 0.05)');

        // Регистрируем Chart.js если нужно
        if (window.Chart) {
            const Chart = window.Chart;

            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: filteredData.map(entry =>
                        new Date(entry.timestamp).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    ).reverse(),
                    datasets: [
                        {
                            label: 'Хешрейт (TH/s)',
                            data: filteredData.map(entry => entry.total_hashrate).reverse(),
                            borderColor: '#ff8c00',
                            backgroundColor: gradientHashrate,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y',
                            pointBackgroundColor: '#ff8c00',
                            pointBorderColor: '#000',
                            pointBorderWidth: 2,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                        },
                        {
                            label: 'Потребление (кВт)',
                            data: filteredData.map(entry => entry.total_power / 1000).reverse(),
                            borderColor: '#00aaff',
                            backgroundColor: gradientPower,
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y1',
                            pointBackgroundColor: '#00aaff',
                            pointBorderColor: '#000',
                            pointBorderWidth: 2,
                            pointRadius: 2,
                            pointHoverRadius: 4,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#ffffff',
                                font: {
                                    size: 12,
                                    family: "'Arial', sans-serif",
                                    weight: 'bold'
                                },
                                usePointStyle: true,
                                padding: 15,
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(26, 15, 10, 0.95)',
                            titleColor: '#ff8c00',
                            bodyColor: '#ffffff',
                            borderColor: '#ff8c00',
                            borderWidth: 1,
                            cornerRadius: 8,
                            padding: 10,
                            usePointStyle: true,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        if (context.dataset.label.includes('Хешрейт')) {
                                            label += context.parsed.y.toFixed(2) + ' TH/s';
                                        } else {
                                            label += context.parsed.y.toFixed(1) + ' кВт';
                                        }
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 140, 0, 0.1)',
                                drawBorder: false,
                            },
                            ticks: {
                                color: '#a0a0a0',
                                maxTicksLimit: 6,
                                font: {
                                    size: 10
                                }
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: {
                                color: 'rgba(255, 140, 0, 0.1)',
                                drawBorder: false,
                            },
                            ticks: {
                                color: '#ff8c00',
                                callback: function(value) {
                                    return value.toFixed(0) + ' TH/s';
                                },
                                font: {
                                    size: 10,
                                    weight: 'bold'
                                }
                            },
                            title: {
                                display: true,
                                text: 'Хешрейт',
                                color: '#ff8c00',
                                font: {
                                    size: 11,
                                    weight: 'bold'
                                }
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false,
                            },
                            ticks: {
                                color: '#00aaff',
                                callback: function(value) {
                                    return value.toFixed(0) + ' кВт';
                                },
                                font: {
                                    size: 10,
                                    weight: 'bold'
                                }
                            },
                            title: {
                                display: true,
                                text: 'Потребление',
                                color: '#00aaff',
                                font: {
                                    size: 11,
                                    weight: 'bold'
                                }
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
    }, [historyData, timeRange]);

    if (!historyData || !historyData.farm_history || historyData.farm_history.length === 0) {
        return (
            <div className="history-chart-empty">
                <div className="empty-chart-message">
                    <p>📊 Собираем исторические данные...</p>
                    <span>График появится после нескольких обновлений</span>
                </div>
            </div>
        );
    }

    const filteredData = FarmHistory.getLastNHours(historyData,
        timeRange === '24h' ? 24 : timeRange === '48h' ? 48 : 168
    );

    if (filteredData.length === 0) {
        return (
            <div className="history-chart-empty">
                <div className="empty-chart-message">
                    <p>⏰ Нет данных за выбранный период</p>
                    <span>Попробуйте выбрать другой временной диапазон</span>
                </div>
            </div>
        );
    }

    return (
        <div className="history-chart-container">
            <div className="chart-wrapper">
                <canvas ref={chartRef} />
            </div>

            <div className="current-stats-mini">
                <div className="mini-stat">
                    <span className="mini-label">Текущий хешрейт:</span>
                    <span className="mini-value hashrate">
                        {currentData?.total_hashrate?.toFixed(2)} TH/s
                    </span>
                </div>
                <div className="mini-stat">
                    <span className="mini-label">Потребление:</span>
                    <span className="mini-value power">
                        {(currentData?.total_power / 1000)?.toFixed(1)} кВт
                    </span>
                </div>
                <div className="mini-stat">
                    <span className="mini-label">Эффективность:</span>
                    <span className="mini-value efficiency">
                        {((currentData?.total_hashrate / (currentData?.total_power / 1000)) || 0).toFixed(2)} TH/кВт
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;