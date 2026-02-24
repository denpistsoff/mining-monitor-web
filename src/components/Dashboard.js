// src/components/Dashboard.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const autoRefreshTimer = useRef(null);

    // Загрузка истории при монтировании и при изменении фермы
    useEffect(() => {
        const loadHistory = async () => {
            if (!farmNameProp) return;

            setHistoryLoading(true);
            try {
                console.log(`📊 Loading history for ${farmNameProp}...`);
                const history = await historyManager.loadFarmHistory(farmNameProp);
                setHistoryData(history);
                setLastUpdate(new Date());

                // Добавляем текущие данные в историю если они свежие
                if (farmData && !loading && dataStatus === 'fresh') {
                    await historyManager.addHistoryEntry(farmNameProp, farmData);
                }
            } catch (error) {
                console.error('❌ Error loading history:', error);
            } finally {
                setHistoryLoading(false);
            }
        };

        loadHistory();
    }, [farmNameProp]);

    // Автоматическое обновление истории
    useEffect(() => {
        if (!autoRefresh || !farmNameProp) return;

        const updateHistory = async () => {
            if (farmData && !loading) {
                try {
                    const updatedHistory = await historyManager.addHistoryEntry(farmNameProp, farmData);
                    setHistoryData(updatedHistory);
                    setLastUpdate(new Date());
                } catch (error) {
                    console.error('❌ Error updating history:', error);
                }
            }
        };

        // Обновляем каждые 5 минут
        autoRefreshTimer.current = setInterval(updateHistory, 5 * 60 * 1000);

        return () => {
            if (autoRefreshTimer.current) {
                clearInterval(autoRefreshTimer.current);
            }
        };
    }, [farmNameProp, farmData, loading, autoRefresh]);

    // Подписка на реальные обновления
    useEffect(() => {
        let stopRealtime;

        const setupRealtime = async () => {
            stopRealtime = await historyManager.getRealtimeData(
                farmNameProp,
                (updatedHistory) => {
                    setHistoryData(updatedHistory);
                    setLastUpdate(new Date());
                },
                60000 // Каждую минуту
            );
        };

        if (farmNameProp) {
            setupRealtime();
        }

        return () => {
            if (stopRealtime) {
                stopRealtime();
            }
        };
    }, [farmNameProp]);

    const handleClearHistory = () => {
        if (window.confirm('Очистить всю историю? Данные будут удалены из GitHub.')) {
            // TODO: Implement clear history
            console.log('🗑️ Clear history');
        }
    };

    const handleExportHistory = () => {
        // TODO: Implement export
        console.log('📥 Export history');
    };

    const handleRefreshHistory = async () => {
        setHistoryLoading(true);
        try {
            const history = await historyManager.loadFarmHistory(farmNameProp, true);
            setHistoryData(history);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('❌ Error refreshing history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleTimeRangeChange = (range) => {
        setChartTimeRange(range);
        // Принудительно обновляем данные при смене диапазона
        handleRefreshHistory();
    };

    if (loading && !farmData) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner large"></div>
                <p>ЗАГРУЗКА ДАННЫХ</p>
            </div>
        );
    }

    if (error && !farmData) {
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
                        {lastUpdate && (
                            <span className="history-update">
                                📊 История: {lastUpdate.toLocaleTimeString()}
                            </span>
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
                onTimeRangeChange={handleTimeRangeChange}
                currentData={farmData.summary}
                dataStatus={farmData._dataStatus}
                historyLoading={historyLoading}
                onRefresh={handleRefreshHistory}
                autoRefresh={autoRefresh}
                onAutoRefreshChange={setAutoRefresh}
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

// Компонент с табами для графиков
const ChartTabsSection = ({
                              farmName,
                              historyData,
                              activeTab,
                              onTabChange,
                              timeRange,
                              onTimeRangeChange,
                              currentData,
                              dataStatus,
                              historyLoading,
                              onRefresh,
                              autoRefresh,
                              onAutoRefreshChange
                          }) => {
    const [hourlyData, setHourlyData] = useState([]);
    const [stats, setStats] = useState({
        total_entries: 0,
        offline_entries: 0,
        online_entries: 0,
        avg_hashrate_24h: 0,
        avg_power_24h: 0
    });

    useEffect(() => {
        const loadChartData = async () => {
            if (!farmName) return;

            try {
                const hours = timeRange === '24h' ? 24 : timeRange === '48h' ? 48 : 168;
                const filteredData = await historyManager.getLastNHours(farmName, hours);
                setHourlyData(filteredData);

                const historyStats = await historyManager.getHistoryStats(farmName);
                setStats(historyStats);
            } catch (error) {
                console.error('❌ Error loading chart data:', error);
            }
        };

        loadChartData();
    }, [farmName, historyData, timeRange]);

    return (
        <div className="chart-tabs-section">
            <div className="section-header">
                <div className="section-title-wrapper">
                    <h3 className="section-title">📈 ИСТОРИЯ РАБОТЫ</h3>
                    <div className="history-stats">
                        <span className="stat-badge">Записей: {stats.total_entries}</span>
                        <span className="stat-badge">Онлайн: {stats.online_entries}</span>
                        <span className="stat-badge">Оффлайн: {stats.offline_entries}</span>
                        <span className="stat-badge" title="Средний хешрейт за 24ч">
                            📊 {stats.avg_hashrate_24h.toFixed(1)} TH/s
                        </span>
                        <span className="stat-badge" title="Среднее потребление за 24ч">
                            ⚡ {stats.avg_power_24h.toFixed(1)} кВт
                        </span>
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
                        <button
                            className={`tab-btn ${activeTab === 'efficiency' ? 'active' : ''}`}
                            onClick={() => onTabChange('efficiency')}
                        >
                            📊 ЭФФЕКТИВНОСТЬ
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

                    <div className="chart-actions">
                        <button
                            className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
                            onClick={() => onAutoRefreshChange(!autoRefresh)}
                            title="Автоматическое обновление"
                        >
                            🔄
                        </button>
                        <button
                            className="refresh-btn"
                            onClick={onRefresh}
                            title="Обновить данные"
                        >
                            ↻
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
                        {activeTab === 'efficiency' && (
                            <EfficiencyChart
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
                        <strong>⏳ ОЖИДАНИЕ ДАННЫХ</strong> - История будет сохраняться автоматически.
                        <br />
                        <small>Следующее обновление через 5 минут</small>
                    </div>
                ) : dataStatus === 'offline' ? (
                    <div className="info-message offline-message">
                        <strong>🔴 ФЕРМА OFFLINE</strong> - Данные не обновляются более 30 минут.
                        <br />
                        <small>Последняя запись: {new Date(stats.last_update).toLocaleString()}</small>
                    </div>
                ) : (
                    <div className="info-message real-message">
                        <strong>✅ ДАННЫЕ СОБИРАЮТСЯ</strong> - История сохраняется автоматически.
                        <br />
                        <small>Записей: {stats.total_entries} | Средний хешрейт за 24ч: {stats.avg_hashrate_24h.toFixed(1)} TH/s</small>
                    </div>
                )}
            </div>
        </div>
    );
};

// График хешрейта
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
                    animation: {
                        duration: 0 // Отключаем анимацию для производительности
                    },
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

// График потребления
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
                    animation: {
                        duration: 0
                    },
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

// График эффективности
const EfficiencyChart = ({ data, currentData, dataStatus }) => {
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

            const efficiencyData = data.map(item => {
                if (item.total_hashrate && item.total_power) {
                    return item.total_hashrate / (item.total_power / 1000);
                }
                return 0;
            });

            const ctx = chartRef.current.getContext('2d');

            const borderColor = dataStatus === 'offline' ? '#ff4444' : '#10b981';
            const gradient = ctx.createLinearGradient(0, 0, 0, isMobile ? 200 : 300);

            if (dataStatus === 'offline') {
                gradient.addColorStop(0, 'rgba(255, 68, 68, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 68, 68, 0.1)');
            } else {
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
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
                        label: 'Эффективность (TH/кВт)',
                        data: efficiencyData,
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
                    animation: {
                        duration: 0
                    },
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
                                    return `Эффективность: ${context.parsed.y.toFixed(2)} TH/кВт`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: `rgba(${dataStatus === 'offline' ? '255,68,68' : '16,185,129'}, 0.1)` },
                            ticks: {
                                color: '#a0a0a0',
                                maxTicksLimit: isMobile ? 6 : 12,
                                font: {
                                    size: isMobile ? 10 : 12
                                }
                            }
                        },
                        y: {
                            grid: { color: `rgba(${dataStatus === 'offline' ? '255,68,68' : '16,185,129'}, 0.1)` },
                            ticks: {
                                color: borderColor,
                                callback: function(value) { return value.toFixed(1) + ' TH/кВт'; },
                                font: {
                                    size: isMobile ? 10 : 12
                                }
                            },
                            title: {
                                display: !isMobile,
                                text: 'Эффективность (TH/кВт)',
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

    const currentEfficiency = currentData?.total_hashrate && currentData?.total_power ?
        (currentData.total_hashrate / (currentData.total_power / 1000)).toFixed(2) : '0.00';

    return (
        <div className="chart-wrapper">
            <div className="chart-header">
                <h4>📊 ГРАФИК ЭФФЕКТИВНОСТИ</h4>
                <div className={`current-value efficiency-value ${dataStatus === 'offline' ? 'offline' : ''}`}>
                    Текущая: <strong>{currentEfficiency} TH/кВт</strong>
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