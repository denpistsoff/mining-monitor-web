import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import FarmHistory from '../utils/farmHistory';
import '../styles/components/FarmHistoryChart.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

const FarmHistoryChart = ({ historyData, timeRange, currentData }) => {
    if (!historyData || !historyData.farm_history || historyData.farm_history.length === 0) {
        return (
            <div className="history-chart-empty">
                <div className="empty-chart-message">
                    <p>Исторические данные пока недоступны</p>
                    <span>Данные появятся после нескольких обновлений</span>
                </div>
            </div>
        );
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
        return (
            <div className="history-chart-empty">
                <div className="empty-chart-message">
                    <p>Нет данных за выбранный период</p>
                </div>
            </div>
        );
    }

    const chartData = {
        labels: filteredData.map(entry =>
            new Date(entry.timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
            })
        ).reverse(),
        datasets: [
            {
                label: 'Хешрейт (TH/s)',
                data: filteredData.map(entry => entry.total_hashrate).reverse(),
                borderColor: '#ff8c00',
                backgroundColor: 'rgba(255, 140, 0, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Потребление (кВт)',
                data: filteredData.map(entry => entry.total_power / 1000).reverse(),
                borderColor: '#00aaff',
                backgroundColor: 'rgba(0, 170, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                yAxisID: 'y1',
            }
        ]
    };

    const options = {
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
                        family: "'Arial', sans-serif"
                    },
                    usePointStyle: true,
                }
            },
            tooltip: {
                backgroundColor: 'rgba(26, 15, 10, 0.95)',
                titleColor: '#ff8c00',
                bodyColor: '#ffffff',
                borderColor: '#ff8c00',
                borderWidth: 1,
                cornerRadius: 8,
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
                },
                ticks: {
                    color: '#a0a0a0',
                    maxTicksLimit: 8,
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
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
                    }
                },
                title: {
                    display: true,
                    text: 'Потребление (кВт)',
                    color: '#00aaff'
                }
            },
        },
    };

    return (
        <div className="history-chart-container">
            <div className="chart-wrapper">
                <Line data={chartData} options={options} />
            </div>

            {/* Мини-статистика текущих значений */}
            <div className="current-stats-mini">
                <div className="mini-stat">
                    <span className="mini-label">Текущий хешрейт:</span>
                    <span className="mini-value hashrate">
                        {currentData?.total_hashrate?.toFixed(2)} TH/s
                    </span>
                </div>
                <div className="mini-stat">
                    <span className="mini-label">Текущее потребление:</span>
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

export default FarmHistoryChart;