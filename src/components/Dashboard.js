import React, { useState, useEffect, useRef } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import StatsGrid from './StatsGrid';
import ContainerCard from './ContainerCard';
import historyManager from '../utils/historyManager';
import '../styles/components/Dashboard.css';

const Dashboard = ({ farmNameProp }) => {
    const { farmData, loading, error } = useFarmData(farmNameProp);
    const [historyData, setHistoryData] = useState(null);
    const [chartTimeRange, setChartTimeRange] = useState('24h');

    useEffect(() => {
        // Инициализируем историю при первой загрузке
        historyManager.initHistory();
        setHistoryData(historyManager.loadHistory());
    }, []);

    useEffect(() => {
        if (farmData && !loading) {
            // Сохраняем данные в историю (если прошел час)
            const updatedHistory = historyManager.saveCurrentData(farmData);
            setHistoryData(updatedHistory);
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

            {/* График истории */}
            <HistoryChartSection
                historyData={historyData}
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

// Компонент секции графика
const HistoryChartSection = ({ historyData, timeRange, onTimeRangeChange, currentData }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        // Загружаем Chart.js динамически
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

            if (!historyData || !historyData.farm_history || historyData.farm_history.length === 0) {
                return;
            }

            const hours = timeRange === '24h' ? 24 : timeRange === '48h' ? 48 : 168;
            const filteredData = historyManager.getLastNHours(hours);

            if (filteredData.length === 0 || !chartRef.current) {
                return;
            }

            const ctx = chartRef.current.getContext('2d');

            // Создаем градиенты
            const gradientHashrate = ctx.createLinearGradient(0, 0, 0, 300);
            gradientHashrate.addColorStop(0, 'rgba(255, 140, 0, 0.4)');
            gradientHashrate.addColorStop(1, 'rgba(255, 140, 0, 0.05)');

            const gradientPower = ctx.createLinearGradient(0, 0, 0, 300);
            gradientPower.addColorStop(0, 'rgba(0, 170, 255, 0.4)');
            gradientPower.addColorStop(1, 'rgba(0, 170, 255, 0.05)');

            chartInstance.current = new window.Chart(ctx, {
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
                            pointHoverRadius: 6,
                        },
                        {
                            label: 'Потребление (кВт)',
                            data: filteredData.map(entry => (entry.total_power / 1000)).reverse(),
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
                            pointHoverRadius: 5,
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
                            padding: 12,
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
                                },
                                title: function(tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const originalIndex = filteredData.length - 1 - dataIndex;
                                    const entry = filteredData[originalIndex];
                                    return new Date(entry.timestamp).toLocaleString('ru-RU', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
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
                                maxTicksLimit: 8,
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
                                text: 'Хешрейт (TH/s)',
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
                                text: 'Потребление (кВт)',
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

    const handleExport = () => {
        historyManager.exportHistory();
    };

    const handleClear = () => {
        if (window.confirm('Очистить всю историю? Это действие нельзя отменить.')) {
            const clearedHistory = historyManager.clearHistory();
            setHistoryData(clearedHistory);
        }
    };

    const stats = historyManager.getHistoryStats();

    return (
        <div className="history-section">
            <div className="section-header">
                <div className="section-title-wrapper">
                    <h3 className="section-title">📊 ИСТОРИЯ РАБОТЫ</h3>
                    <div className="history-stats">
                        <span className="stat-badge">Записей: {stats.total_entries}</span>
                    </div>
                </div>

                <div className="chart-controls">
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

                    <div className="history-actions">
                        <button className="action-btn export-btn" onClick={handleExport} title="Экспорт данных">
                            📥
                        </button>
                        <button className="action-btn clear-btn" onClick={handleClear} title="Очистить историю">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>

            <div className="history-chart-container">
                <div className="chart-wrapper">
                    <canvas ref={chartRef} />
                </div>

                {(!historyData || !historyData.farm_history || historyData.farm_history.length === 0) ? (
                    <div className="history-chart-empty">
                        <div className="empty-chart-message">
                            <p>📊 Собираем исторические данные...</p>
                            <span>Первые данные появятся через час после начала работы</span>
                            <div className="debug-info">
                                <button onClick={() => {
                                    // Принудительно сохраняем текущие данные для теста
                                    const testData = {
                                        summary: currentData
                                    };
                                    const updatedHistory = historyManager.saveCurrentData(testData);
                                    setHistoryData(updatedHistory);
                                }} className="test-btn">
                                    Тест: добавить текущие данные
                                </button>
                            </div>
                        </div>
                    </div>
                ) : historyManager.getLastNHours(timeRange === '24h' ? 24 : timeRange === '48h' ? 48 : 168).length === 0 ? (
                    <div className="history-chart-empty">
                        <div className="empty-chart-message">
                            <p>⏰ Нет данных за выбранный период</p>
                            <span>Попробуйте выбрать другой временной диапазон</span>
                        </div>
                    </div>
                ) : null}

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
        </div>
    );
};

export default Dashboard;