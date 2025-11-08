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
        // Инициализируем историю при первой загрузке
        const initialHistory = historyManager.initHistory();
        setHistoryData(initialHistory);
        console.log('📊 History initialized:', historyManager.getHistoryStats());
    }, []);

    useEffect(() => {
        if (farmData && !loading) {
            console.log('💾 Saving farm data to history...');
            const updatedHistory = historyManager.saveCurrentData(farmData);
            setHistoryData(updatedHistory);
        }
    }, [farmData, loading]);

    const handleClearHistory = () => {
        if (window.confirm('Очистить всю историю? Тестовые данные будут удалены, а реальные начнут собираться заново через час.')) {
            const clearedHistory = historyManager.clearHistory();
            setHistoryData(clearedHistory);
            console.log('🗑️ History cleared');
        }
    };

    const handleAddTestData = () => {
        const updatedHistory = historyManager.addTestData();
        setHistoryData(updatedHistory);
        console.log('🧪 Test data added');
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
                onAddTestData={handleAddTestData}
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
                              onAddTestData,
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
                        {stats.is_test_data && (
                            <span className="stat-badge test-badge">ТЕСТ</span>
                        )}
                        {stats.test_entries > 0 && (
                            <span className="stat-badge test-count">Тестовых: {stats.test_entries}</span>
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

                    <div className="history-actions">
                        <button className="action-btn export-btn" onClick={onExportHistory} title="Экспорт данных">
                            📥 Экспорт
                        </button>
                        <button className="action-btn test-btn" onClick={onAddTestData} title="Добавить тестовые данные">
                            🧪 Тест
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
                        isTestData={stats.is_test_data}
                    />
                )}
                {activeTab === 'power' && (
                    <PowerChart
                        data={hourlyData}
                        currentData={currentData}
                        isTestData={stats.is_test_data}
                    />
                )}

                {hourlyData.length === 0 && (
                    <div className="chart-empty">
                        <div className="empty-message">
                            <p>📊 Нет исторических данных</p>
                            <span>Данные начнут собираться автоматически через час</span>
                            <div className="debug-info">
                                <button onClick={onAddTestData} className="test-btn">
                                    🧪 Добавить тестовые данные за 2 часа
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Информация о данных */}
            <div className="data-info">
                {stats.is_test_data ? (
                    <div className="info-message test-message">
                        <strong>🧪 ТЕСТОВЫЕ ДАННЫЕ</strong> - Это демо-данные за 2 часа. Реальные данные начнут собираться через час после очистки.
                    </div>
                ) : stats.real_entries === 0 ? (
                    <div className="info-message waiting-message">
                        <strong>⏳ ОЖИДАНИЕ ДАННЫХ</strong> - Первые реальные данные появятся через час работы системы.
                    </div>
                ) : (
                    <div className="info-message real-message">
                        <strong>✅ РЕАЛЬНЫЕ ДАННЫЕ</strong> - Собирается каждый час. Всего записей: {stats.real_entries}
                    </div>
                )}
            </div>
        </div>
    );
};

// График хешрейта (остается без изменений)
const HashrateChart = ({ data, currentData, isTestData }) => {
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
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(255, 140, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 140, 0, 0.1)');

            chartInstance.current = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item =>
                        new Date(item.timestamp).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    ),
                    datasets: [{
                        label: 'Хешрейт (TH/s)',
                        data: data.map(item => item.total_hashrate),
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
                        legend: { display: false },
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
                            grid: { color: 'rgba(255, 140, 0, 0.1)' },
                            ticks: { color: '#a0a0a0', maxTicksLimit: 8 }
                        },
                        y: {
                            grid: { color: 'rgba(255, 140, 0, 0.1)' },
                            ticks: {
                                color: '#ff8c00',
                                callback: function(value) { return value.toFixed(0) + ' TH/s'; }
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

    return (
        <div className="chart-wrapper">
            <div className="chart-header">
                <h4>📊 ГРАФИК ХЕШРЕЙТА {isTestData && '🧪'}</h4>
                <div className="current-value hashrate-value">
                    Текущий: <strong>{currentData?.total_hashrate?.toFixed(2)} TH/s</strong>
                </div>
            </div>
            <canvas ref={chartRef} />
        </div>
    );
};

// График потребления (остается без изменений)
const PowerChart = ({ data, currentData, isTestData }) => {
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
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(0, 170, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(0, 170, 255, 0.1)');

            chartInstance.current = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item =>
                        new Date(item.timestamp).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    ),
                    datasets: [{
                        label: 'Потребление (кВт)',
                        data: data.map(item => item.total_power / 1000),
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
                        legend: { display: false },
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
                            grid: { color: 'rgba(0, 170, 255, 0.1)' },
                            ticks: { color: '#a0a0a0', maxTicksLimit: 8 }
                        },
                        y: {
                            grid: { color: 'rgba(0, 170, 255, 0.1)' },
                            ticks: {
                                color: '#00aaff',
                                callback: function(value) { return value.toFixed(0) + ' кВт'; }
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

    return (
        <div className="chart-wrapper">
            <div className="chart-header">
                <h4>⚡ ГРАФИК ПОТРЕБЛЕНИЯ {isTestData && '🧪'}</h4>
                <div className="current-value power-value">
                    Текущее: <strong>{(currentData?.total_power / 1000)?.toFixed(1)} кВт</strong>
                </div>
            </div>
            <canvas ref={chartRef} />
        </div>
    );
};

export default Dashboard;