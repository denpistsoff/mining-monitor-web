import React, { useState, useEffect, useRef } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import StatsGrid from './StatsGrid';
import ContainerCard from './ContainerCard';
import historyManager from '../utils/historyManager';
import '../styles/components/Dashboard.css';

const Dashboard = ({ farmNameProp }) => {
    const { farmData, loading, error } = useFarmData(farmNameProp);
    const [historyData, setHistoryData] = useState(null);
    const [activeTab, setActiveTab] = useState('hashrate');
    const [chartTimeRange, setChartTimeRange] = useState('24h');

    useEffect(() => {
        const initialHistory = historyManager.initHistory();
        setHistoryData(initialHistory);
    }, []);

    useEffect(() => {
        if (farmData && !loading) {
            const updatedHistory = historyManager.saveCurrentData(farmData);
            setHistoryData(updatedHistory);
        }
    }, [farmData, loading]);

    const handleClearHistory = () => {
        if (window.confirm('Очистить всю историю? Данные начнут собираться заново через 30 минут.')) {
            const clearedHistory = historyManager.clearHistory();
            setHistoryData(clearedHistory);
        }
    };

    const handleExportHistory = () => {
        historyManager.exportHistory();
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

            <ChartTabsSection
                historyData={historyData}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                timeRange={chartTimeRange}
                onTimeRangeChange={setChartTimeRange}
                currentData={farmData.summary}
                onClearHistory={handleClearHistory}
                onExportHistory={handleExportHistory}
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
const ChartTabsSection = ({
                              historyData,
                              activeTab,
                              onTabChange,
                              timeRange,
                              onTimeRangeChange,
                              currentData,
                              onClearHistory,
                              onExportHistory
                          }) => {
    const [hourlyData, setHourlyData] = useState([]);

    useEffect(() => {
        if (historyData) {
            const hours = timeRange === '24h' ? 24 : timeRange === '48h' ? 48 : 168;
            const filteredData = historyManager.getLastNHours(hours);
            setHourlyData(filteredData);
        }
    }, [historyData, timeRange]);

    const stats = historyManager.getHistoryStats();

    return (
        <div className="chart-tabs-section">
            <div className="section-header">
                <div className="section-title-wrapper">
                    <h3 className="section-title">📈 ИСТОРИЯ РАБОТЫ</h3>
                    <div className="history-stats">
                        <span className="stat-badge">Записей: {stats.total_entries}</span>
                        <span className="stat-badge">Интервал: 30min</span>
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

                    <div className="history-actions">
                        <button className="action-btn export-btn" onClick={onExportHistory} title="Экспорт данных">
                            📥 Экспорт
                        </button>
                        <button className="action-btn clear-btn" onClick={onClearHistory} title="Очистить историю">
                            🗑️ Очистить
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

                {hourlyData.length === 0 && (
                    <div className="chart-empty">
                        <div className="empty-message">
                            <p>📊 Нет исторических данных</p>
                            <span>Данные начнут собираться автоматически через 30 минут</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Информация о данных */}
            <div className="data-info">
                {stats.total_entries === 0 ? (
                    <div className="info-message waiting-message">
                        <strong>⏳ ОЖИДАНИЕ ДАННЫХ</strong> - Первые данные появятся через 30 минут работы системы.
                    </div>
                ) : (
                    <div className="info-message real-message">
                        <strong>✅ ДАННЫЕ СОБИРАЮТСЯ</strong> - Каждые 30 минут. Всего записей: {stats.total_entries}
                    </div>
                )}
            </div>
        </div>
    );
};

// График хешрейта
const HashrateChart = ({ data, currentData }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
            const gradient = ctx.createLinearGradient(0, 0, 0, isMobile ? 200 : 300);
            gradient.addColorStop(0, 'rgba(255, 140, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 140, 0, 0.1)');

            // Настройки для мобильных
            const mobileOptions = {
                pointRadius: 2,
                pointHoverRadius: 4,
                borderWidth: 2,
            };

            const desktopOptions = {
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 3,
            };

            const chartOptions = isMobile ? mobileOptions : desktopOptions;

            chartInstance.current = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item => item.time_label),
                    datasets: [{
                        label: 'Хешрейт (TH/s)',
                        data: data.map(item => item.total_hashrate),
                        borderColor: '#ff8c00',
                        backgroundColor: gradient,
                        borderWidth: chartOptions.borderWidth,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ff8c00',
                        pointBorderColor: '#000',
                        pointBorderWidth: 1,
                        pointRadius: chartOptions.pointRadius,
                        pointHoverRadius: chartOptions.pointHoverRadius,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(26, 15, 10, 0.95)',
                            titleColor: '#ff8c00',
                            bodyColor: '#ffffff',
                            borderColor: '#ff8c00',
                            titleFont: {
                                size: isMobile ? 12 : 14
                            },
                            bodyFont: {
                                size: isMobile ? 12 : 14
                            },
                            callbacks: {
                                label: function(context) {
                                    return `Хешрейт: ${context.parsed.y.toFixed(2)} TH/s`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 140, 0, 0.1)' },
                            ticks: {
                                color: '#a0a0a0',
                                maxTicksLimit: isMobile ? 6 : 12,
                                font: {
                                    size: isMobile ? 10 : 12
                                }
                            }
                        },
                        y: {
                            grid: { color: 'rgba(255, 140, 0, 0.1)' },
                            ticks: {
                                color: '#ff8c00',
                                callback: function(value) { return value.toFixed(0) + ' TH/s'; },
                                font: {
                                    size: isMobile ? 10 : 12
                                }
                            },
                            title: {
                                display: !isMobile,
                                text: 'Хешрейт (TH/s)',
                                color: '#ff8c00',
                                font: {
                                    size: 12
                                }
                            }
                        },
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, isMobile]);

    return (
        <div className="chart-wrapper">
            <div className="chart-header">
                <h4>📊 ГРАФИК ХЕШРЕЙТА</h4>
                <div className="current-value hashrate-value">
                    Текущий: <strong>{currentData?.total_hashrate?.toFixed(2)} TH/s</strong>
                </div>
            </div>
            <canvas
                ref={chartRef}
                style={{
                    maxHeight: isMobile ? '250px' : '350px',
                    minHeight: isMobile ? '200px' : '300px'
                }}
            />
        </div>
    );
};

// График потребления
const PowerChart = ({ data, currentData }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
            const gradient = ctx.createLinearGradient(0, 0, 0, isMobile ? 200 : 300);
            gradient.addColorStop(0, 'rgba(0, 170, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(0, 170, 255, 0.1)');

            // Настройки для мобильных
            const mobileOptions = {
                pointRadius: 2,
                pointHoverRadius: 4,
                borderWidth: 2,
            };

            const desktopOptions = {
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 3,
            };

            const chartOptions = isMobile ? mobileOptions : desktopOptions;

            chartInstance.current = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item => item.time_label),
                    datasets: [{
                        label: 'Потребление (кВт)',
                        data: data.map(item => item.total_power / 1000),
                        borderColor: '#00aaff',
                        backgroundColor: gradient,
                        borderWidth: chartOptions.borderWidth,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#00aaff',
                        pointBorderColor: '#000',
                        pointBorderWidth: 1,
                        pointRadius: chartOptions.pointRadius,
                        pointHoverRadius: chartOptions.pointHoverRadius,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(26, 15, 10, 0.95)',
                            titleColor: '#00aaff',
                            bodyColor: '#ffffff',
                            borderColor: '#00aaff',
                            titleFont: {
                                size: isMobile ? 12 : 14
                            },
                            bodyFont: {
                                size: isMobile ? 12 : 14
                            },
                            callbacks: {
                                label: function(context) {
                                    return `Потребление: ${context.parsed.y.toFixed(1)} кВт`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(0, 170, 255, 0.1)' },
                            ticks: {
                                color: '#a0a0a0',
                                maxTicksLimit: isMobile ? 6 : 12,
                                font: {
                                    size: isMobile ? 10 : 12
                                }
                            }
                        },
                        y: {
                            grid: { color: 'rgba(0, 170, 255, 0.1)' },
                            ticks: {
                                color: '#00aaff',
                                callback: function(value) { return value.toFixed(0) + ' кВт'; },
                                font: {
                                    size: isMobile ? 10 : 12
                                }
                            },
                            title: {
                                display: !isMobile,
                                text: 'Потребление (кВт)',
                                color: '#00aaff',
                                font: {
                                    size: 12
                                }
                            }
                        },
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, isMobile]);

    return (
        <div className="chart-wrapper">
            <div className="chart-header">
                <h4>⚡ ГРАФИК ПОТРЕБЛЕНИЯ</h4>
                <div className="current-value power-value">
                    Текущее: <strong>{(currentData?.total_power / 1000)?.toFixed(1)} кВт</strong>
                </div>
            </div>
            <canvas
                ref={chartRef}
                style={{
                    maxHeight: isMobile ? '250px' : '350px',
                    minHeight: isMobile ? '200px' : '300px'
                }}
            />
        </div>
    );
};

export default Dashboard;