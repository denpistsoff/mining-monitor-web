import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const FARM_FILES = [
        {
            name: 'VISOKOVKA',
            url: 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_VISOKOVKA.json'
        },
        {
            name: 'DESKTOP-TO75OLC',
            url: 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/farm_data_DESKTOP-TO75OLC.json'
        }
    ];

    const loadFarmData = async (farmFile) => {
        try {
            const response = await fetch(farmFile.url + '?t=' + Date.now());
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Данные загружены: ${farmFile.name}`, data);
                return data;
            } else {
                console.log(`❌ Файл не найден: ${farmFile.name} - ${response.status}`);
            }
        } catch (error) {
            console.error(`Ошибка загрузки ${farmFile.name}:`, error);
        }
        return null;
    };

    const loadFarms = async () => {
        setLoading(true);
        console.log('=== ЗАГРУЗКА ФЕРМ ===');

        const farmsList = [];

        for (const farmFile of FARM_FILES) {
            console.log(`🔍 Загружаем ферму: ${farmFile.name}`);
            const data = await loadFarmData(farmFile);

            if (data) {
                const containers = data.containers || {};
                const containerList = Object.values(containers);

                const totalMiners = containerList.reduce((sum, c) => sum + (c.total_miners || 0), 0);
                const onlineMiners = containerList.reduce((sum, c) => sum + (c.online_miners || 0), 0);
                const hashrate = containerList.reduce((sum, c) => sum + (c.total_hashrate || 0), 0);
                const totalContainers = Object.keys(containers).length;

                let status = 'empty';
                if (totalMiners > 0) {
                    status = onlineMiners === totalMiners ? 'online' :
                        onlineMiners > 0 ? 'warning' : 'offline';
                }

                farmsList.push({
                    name: farmFile.name,
                    displayName: data.farm_name || farmFile.name,
                    status: status,
                    miners: totalMiners,
                    onlineMiners: onlineMiners,
                    hashrate: hashrate,
                    containers: totalContainers,
                    lastUpdate: data.last_update,
                    exists: true,
                    url: farmFile.url,
                    rawData: data // Сохраняем сырые данные для отладки
                });
                console.log(`✅ Ферма добавлена: ${farmFile.name}`, {
                    containers: totalContainers,
                    miners: totalMiners,
                    hashrate: hashrate
                });
            } else {
                console.log(`❌ Ферма не найдена: ${farmFile.name}`);
                farmsList.push({
                    name: farmFile.name,
                    displayName: farmFile.name,
                    status: 'not-found',
                    miners: 0,
                    onlineMiners: 0,
                    hashrate: 0,
                    containers: 0,
                    lastUpdate: null,
                    exists: false,
                    url: farmFile.url
                });
            }
        }

        console.log('=== РЕЗУЛЬТАТЫ ===', farmsList);
        setFarms(farmsList);
        setLoading(false);
    };

    useEffect(() => {
        loadFarms();
        const interval = setInterval(loadFarms, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleFarmClick = (farmName) => {
        const farm = farms.find(f => f.name === farmName);
        if (farm && farm.exists) {
            console.log(`🎯 Переход к ферме: ${farmName}`, farm);
            navigate(`/farm/${farmName}/dashboard`);
        } else {
            console.log(`❌ Ферма не найдена: ${farmName}`);
            alert(`Ферма ${farmName} не найдена или данные недоступны`);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'online': return { text: 'ОНЛАЙН', class: 'online' };
            case 'warning': return { text: 'ПРОБЛЕМЫ', class: 'warning' };
            case 'offline': return { text: 'ОФФЛАЙН', class: 'offline' };
            case 'empty': return { text: 'ПУСТО', class: 'empty' };
            case 'not-found': return { text: 'НЕ НАЙДЕНО', class: 'not-found' };
            default: return { text: 'НЕИЗВЕСТНО', class: 'unknown' };
        }
    };

    return (
        <div className="farm-selection">
            <div className="background-glow"></div>

            <div className="hero-section">
                <h1 className="hero-title">MINING MONITOR</h1>
                <p className="hero-subtitle">СИСТЕМА МОНИТОРИНГА МАЙНИНГ ФЕРМ</p>
            </div>

            <div className="farms-grid">
                {farms.map(farm => {
                    const status = getStatusInfo(farm.status);

                    return (
                        <div
                            key={farm.name}
                            className={`farm-card ${status.class}`}
                            onClick={() => handleFarmClick(farm.name)}
                        >
                            <div className="farm-accent"></div>

                            <div className="farm-content">
                                <div className="farm-header">
                                    <div className="farm-icon">
                                        <div className="icon-wrapper">
                                            {farm.exists ? 'M' : 'F'}
                                        </div>
                                    </div>
                                    <div className="farm-titles">
                                        <h3 className="farm-name">{farm.name}</h3>
                                        <div className="farm-display-name">
                                            {farm.displayName}
                                        </div>
                                    </div>
                                </div>

                                <div className={`status-indicator ${status.class}`}>
                                    <span className="status-text">{status.text}</span>
                                </div>

                                {farm.exists ? (
                                    <>
                                        <div className="stats-grid">
                                            <div className="stat-item">
                                                <div className="stat-value">{farm.onlineMiners}/{farm.miners}</div>
                                                <div className="stat-label">МАЙНЕРЫ</div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-value">{farm.hashrate.toFixed(1)}</div>
                                                <div className="stat-label">TH/S</div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-value">{farm.containers}</div>
                                                <div className="stat-label">КОНТЕЙНЕРЫ</div>
                                            </div>
                                        </div>

                                        {farm.lastUpdate && (
                                            <div className="update-info">
                                                <div className="update-text">Обновлено: {farm.lastUpdate}</div>
                                            </div>
                                        )}

                                        <button className="action-button">
                                            ОТКРЫТЬ ДАШБОРД
                                        </button>
                                    </>
                                ) : (
                                    <div className="error-state">
                                        <div className="error-text">Файл данных не найден</div>
                                        <a
                                            href={farm.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="file-link"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            ПРОВЕРИТЬ URL
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="control-panel">
                <div className="panel-content">
                    <div className="panel-info">
                        <div className="info-item">
                            <span className="info-label">ВСЕГО ФЕРМ:</span>
                            <span className="info-value">{farms.length}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">АКТИВНЫХ:</span>
                            <span className="info-value">{farms.filter(f => f.exists && f.status === 'online').length}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">КОНТЕЙНЕРОВ:</span>
                            <span className="info-value">{farms.reduce((sum, f) => sum + f.containers, 0)}</span>
                        </div>
                    </div>

                    <button
                        className={`refresh-button ${loading ? 'loading' : ''}`}
                        onClick={loadFarms}
                    >
                        {loading ? 'ОБНОВЛЕНИЕ...' : 'ОБНОВИТЬ'}
                    </button>
                </div>
            </div>

            {/* Отладочная информация */}
            <div className="debug-panel">
                <h4>ОТЛАДОЧНАЯ ИНФОРМАЦИЯ</h4>
                <div>Проверяемые фермы: {FARM_FILES.map(f => f.name).join(', ')}</div>
                <div>Найдено: {farms.filter(f => f.exists).length} из {farms.length}</div>
                <div>Откройте консоль браузера для подробной информации</div>
            </div>
        </div>
    );
};

export default FarmSelection;