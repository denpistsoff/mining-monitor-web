// src/components/Dashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { useFarmData } from '../hooks/useFarmData';
import StatsGrid from './StatsGrid';
import ContainerCard from './ContainerCard';
import historyManager from '../utils/historyManager';
import '../styles/components/Dashboard.css';

const Dashboard = ({ farmNameProp }) => {
    const { farmData, loading, error, dataStatus } = useFarmData(farmNameProp);
    const [historyData, setHistoryData] = useState(null);
    const [activeTab, setActiveTab] = useState('hashrate');
    const [chartTimeRange, setChartTimeRange] = useState('24h');
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            if (!farmNameProp) return;

            setHistoryLoading(true);
            try {
                const history = await historyManager.loadFarmHistory(farmNameProp);
                setHistoryData(history);
            } catch (error) {
                console.error('❌ Ошибка загрузки истории:', error);
            } finally {
                setHistoryLoading(false);
            }
        };

        loadHistory();
    }, [farmNameProp]);

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
                        {farmData._dataStatus === 'offline' && (
                            <span className="status-badge offline"> 🔴 OFFLINE</span>
                        )}
                        {farmData._dataStatus === 'stale' && (
                            <span className="status-badge stale"> 🟡 УСТАРЕЛО</span>
                        )}
                        {farmData._dataStatus === 'fresh' && (
                            <span className="status-badge fresh"> 🟢 ONLINE</span>
                        )}
                    </div>
                </div>
            </div>

            <StatsGrid summary={farmData.summary} dataStatus={farmData._dataStatus} />

            <ChartTabsSection
                farmName={farmNameProp}
                historyData={historyData}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                timeRange={chartTimeRange}
                onTimeRangeChange={setChartTimeRange}
                currentData={farmData.summary}
                dataStatus={farmData._dataStatus}
                historyLoading={historyLoading}
            />

            <div className="containers-section">
                <h3 className="section-title">⚡ КОНТЕЙНЕРЫ</h3>
                {farmData._dataStatus === 'offline' && (
                    <div className="offline-warning">
                        ⚠️ Ферма в режиме OFFLINE - данные не обновляются более 30 минут
                    </div>
                )}
                <div className="containers-grid">
                    {Object.entries(farmData.containers || {}).map(([containerId, container]) => (
                        <ContainerCard
                            key={containerId}
                            containerId={containerId}
                            container={container}
                            dataStatus={farmData._dataStatus}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Компонент с табами для графиков (обновлен)
const ChartTabsSection = ({
                              farmName,
                              historyData,
                              activeTab,
                              onTabChange,
                              timeRange,
                              onTimeRangeChange,
                              currentData,
                              dataStatus,
                              historyLoading
                          }) => {
    const [hourlyData, setHourlyData] = useState([]);
    const [stats, setStats] = useState({
        total_entries: 0,
        offline_entries: 0,
        online_entries: 0
    });

    useEffect(() => {
        const loadChartData = async () => {
            if (historyLoading || !farmName) return;

            try {
                const hours = timeRange === '24h' ? 24 : timeRange === '48h' ? 48 : 168;
                const filteredData = await historyManager.getLastNHours(farmName, hours);
                setHourlyData(filteredData);

                const historyStats = await historyManager.getHistoryStats(farmName);
                setStats(historyStats);
            } catch (error) {
                console.error('❌ Ошибка загрузки данных графиков:', error);
            }
        };

        loadChartData();
    }, [farmName, historyData, timeRange, historyLoading]);

    return (
        <div className="chart-tabs-section">
            <div className="section-header">
                <div className="section-title-wrapper">
                    <h3 className="section-title">📈 ИСТОРИЯ РАБОТЫ</h3>
                    <div className="history-stats">
                        <span className="stat-badge">Записей: {stats.total_entries}</span>
                        <span className="stat-badge">Онлайн: {stats.online_entries}</span>
                        <span className="stat-badge">Оффлайн: {stats.offline_entries}</span>
                        <span className="stat-badge github-sync" title="Данные из GitHub">🔗 GitHub</span>
                        {dataStatus === 'offline' && (
                            <span className="stat-badge offline">OFFLINE</span>
                        )}
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
                {historyLoading ? (
                    <div className="chart-loading">
                        <div className="loading-spinner"></div>
                        <p>Загрузка истории из GitHub...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'hashrate' && (
                            <HashrateChart
                                data={hourlyData}
                                currentData={currentData}
                                dataStatus={dataStatus}
                            />
                        )}
                        {activeTab === 'power' && (
                            <PowerChart
                                data={hourlyData}
                                currentData={currentData}
                                dataStatus={dataStatus}
                            />
                        )}

                        {hourlyData.length === 0 && (
                            <div className="chart-empty">
                                <div className="empty-message">
                                    <p>📊 Нет исторических данных</p>
                                    <span>Данные начнут собираться автоматически</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Информация о данных */}
            <div className="data-info">
                {historyLoading ? (
                    <div className="info-message loading-message">
                        <strong>🔄 ЗАГРУЗКА ИСТОРИИ</strong> - Загружаем данные из GitHub...
                    </div>
                ) : stats.total_entries === 0 ? (
                    <div className="info-message waiting-message">
                        <strong>⏳ ОЖИДАНИЕ ДАННЫХ</strong> - История будет сохраняться автоматически в GitHub.
                    </div>
                ) : dataStatus === 'offline' ? (
                    <div className="info-message offline-message">
                        <strong>🔴 ФЕРМА OFFLINE</strong> - Данные не обновляются более 30 минут.
                    </div>
                ) : (
                    <div className="info-message real-message">
                        <strong>✅ ДАННЫЕ СОБИРАЮТСЯ</strong> - История сохраняется в GitHub. Записей: {stats.total_entries}
                    </div>
                )}
            </div>
        </div>
    );
};

// График хешрейта (без изменений)
const HashrateChart = ({ data, currentData, dataStatus }) => {
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

            const borderColor = dataStatus === 'offline' ? '#ff4444' : '#ff8c00';
            const gradient = ctx.createLinearGradient(0, 0, 0, isMobile ? 200 : 300);

            if (dataStatus === 'offline') {
                gradient.addColorStop(0, 'rgba(255, 68, 68, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 68, 68, 0.1)');
            } else {
                gradient.addColorStop(0, 'rgba(255, 140, 0, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 140, 0, 0.1)');
            }

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
                        borderColor: borderColor,
                        backgroundColor: gradient,
                        borderWidth: chartOptions.borderWidth,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: borderColor,
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
                            titleColor: borderColor,
                            bodyColor: '#ffffff',
                            borderColor: borderColor,
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
                            grid: { color: `rgba(${dataStatus === 'offline' ? '255,68,68' : '255,140,0'}, 0.1)` },
                            ticks: {
                                color: '#a0a0a0',
                                maxTicksLimit: isMobile ? 6 : 12,
                                font: {
                                    size: isMobile ? 10 : 12
                                }
                            }
                        },
                        y: {
                            grid: { color: `rgba(${dataStatus === 'offline' ? '255,68,68' : '255,140,0'}, 0.1)` },
                            ticks: {
                                color: borderColor,
                                callback: function(value) { return value.toFixed(0) + ' TH/s'; },
                                font: {
                                    size: isMobile ? 10 : 12
                                }
                            },
                            title: {
                                display: !isMobile,
                                text: 'Хешрейт (TH/s)',
                                color: borderColor,
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
    }, [data, isMobile, dataStatus]);

    return (
        <div className="chart-wrapper">
            <div className="chart-header">
                <h4>📊 ГРАФИК ХЕШРЕЙТА</h4>
                <div className={`current-value hashrate-value ${dataStatus === 'offline' ? 'offline' : ''}`}>
                    Текущий: <strong>{currentData?.total_hashrate?.toFixed(2)} TH/s</strong>
                    {dataStatus === 'offline' && ' 🔴'}
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

// График потребления (без изменений)
const PowerChart = ({ data, currentData, dataStatus }) => {
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

            const borderColor = dataStatus === 'offline' ? '#ff4444' : '#00aaff';
            const gradient = ctx.createLinearGradient(0, 0, 0, isMobile ? 200 : 300);

            if (dataStatus === 'offline') {
                gradient.addColorStop(0, 'rgba(255, 68, 68, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 68, 68, 0.1)');
            } else {
                gradient.addColorStop(0, 'rgba(0, 170, 255, 0.6)');
                gradient.addColorStop(1, 'rgba(0, 170, 255, 0.1)');
            }

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
                        borderColor: borderColor,
                        backgroundColor: gradient,
                        borderWidth: chartOptions.borderWidth,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: borderColor,
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
                            titleColor: borderColor,
                            bodyColor: '#ffffff',
                            borderColor: borderColor,
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
                            grid: { color: `rgba(${dataStatus === 'offline' ? '255,68,68' : '0,170,255'}, 0.1)` },
                            ticks: {
                                color: '#a0a0a0',
                                maxTicksLimit: isMobile ? 6 : 12,
                                font: {
                                    size: isMobile ? 10 : 12
                                }
                            }
                        },
                        y: {
                            grid: { color: `rgba(${dataStatus === 'offline' ? '255,68,68' : '0,170,255'}, 0.1)` },
                            ticks: {
                                color: borderColor,
                                callback: function(value) { return value.toFixed(0) + ' кВт'; },
                                font: {
                                    size: isMobile ? 10 : 12
                                }
                            },
                            title: {
                                display: !isMobile,
                                text: 'Потребление (кВт)',
                                color: borderColor,
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
    }, [data, isMobile, dataStatus]);

    return (
        <div className="chart-wrapper">
            <div className="chart-header">
                <h4>⚡ ГРАФИК ПОТРЕБЛЕНИЯ</h4>
                <div className={`current-value power-value ${dataStatus === 'offline' ? 'offline' : ''}`}>
                    Текущее: <strong>{(currentData?.total_power / 1000)?.toFixed(1)} кВт</strong>
                    {dataStatus === 'offline' && ' 🔴'}
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