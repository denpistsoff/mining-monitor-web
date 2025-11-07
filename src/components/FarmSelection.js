import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // АБСОЛЮТНЫЕ ПУТИ к файлам
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

    // Загружаем данные фермы по абсолютному пути
    const loadFarmData = async (farmFile) => {
        try {
            console.log(`🔄 Загружаем: ${farmFile.url}`);
            const response = await fetch(farmFile.url + '?t=' + Date.now());

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ УСПЕХ: ${farmFile.name} загружена`);
                return data;
            } else {
                console.log(`❌ ОШИБКА: ${farmFile.name} - ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ОШИБКА: ${farmFile.name} - ${error.message}`);
        }
        return null;
    };

    // Загружаем все фермы
    const loadFarms = async () => {
        setLoading(true);
        console.log('=== ЗАГРУЗКА ФЕРМ ПО АБСОЛЮТНЫМ ПУТЯМ ===');

        const farmsList = [];

        for (const farmFile of FARM_FILES) {
            const data = await loadFarmData(farmFile);

            if (data) {
                const containers = data.containers || {};
                const containerList = Object.values(containers);

                const totalMiners = containerList.reduce((sum, c) => sum + (c.total_miners || 0), 0);
                const onlineMiners = containerList.reduce((sum, c) => sum + (c.online_miners || 0), 0);
                const hashrate = containerList.reduce((sum, c) => sum + (c.total_hashrate || 0), 0);

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
                    lastUpdate: data.last_update,
                    exists: true,
                    url: farmFile.url
                });
            } else {
                farmsList.push({
                    name: farmFile.name,
                    displayName: farmFile.name,
                    status: 'not-found',
                    miners: 0,
                    onlineMiners: 0,
                    hashrate: 0,
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

        // Автообновление
        const interval = setInterval(loadFarms, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleFarmClick = (farmName) => {
        if (farms.find(f => f.name === farmName && f.exists)) {
            navigate(`/farm/${farmName}/dashboard`);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'online': return { icon: '🟢', text: 'Онлайн', class: 'online' };
            case 'warning': return { icon: '🟡', text: 'Проблемы', class: 'warning' };
            case 'offline': return { icon: '🔴', text: 'Офлайн', class: 'offline' };
            case 'empty': return { icon: '⚪', text: 'Нет майнеров', class: 'empty' };
            case 'not-found': return { icon: '❌', text: 'Файл не найден', class: 'not-found' };
            default: return { icon: '❓', text: 'Неизвестно', class: 'unknown' };
        }
    };

    return (
        <div className="farm-selection">
            <div className="header">
                <h1>🏭 Майнинг Фермы</h1>
                <div className="header-info">
                    <div>Абсолютные пути к GitHub</div>
                    <button onClick={loadFarms} disabled={loading}>
                        {loading ? '🔄' : '🔄'} Обновить
                    </button>
                </div>
            </div>

            <div className="farms-grid">
                {farms.map(farm => {
                    const status = getStatusInfo(farm.status);

                    return (
                        <div
                            key={farm.name}
                            className={`farm-card farm-${status.class}`}
                            onClick={() => handleFarmClick(farm.name)}
                        >
                            <div className="farm-header">
                                <div className="farm-icon">
                                    {farm.exists ? '⛏️' : '📁'}
                                </div>
                                <div className="farm-info">
                                    <div className="farm-name">{farm.name}</div>
                                    <div className="farm-url">
                                        <a href={farm.url} target="_blank" onClick={e => e.stopPropagation()}>
                                            🔗 Прямая ссылка
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className={`farm-status ${status.class}`}>
                                {status.icon} {status.text}
                            </div>

                            {farm.exists ? (
                                <>
                                    <div className="farm-stats">
                                        <div className="stat">
                                            <span>Майнеры:</span>
                                            <span>{farm.onlineMiners}/{farm.miners}</span>
                                        </div>
                                        <div className="stat">
                                            <span>Хешрейт:</span>
                                            <span>{farm.hashrate.toFixed(2)} TH/s</span>
                                        </div>
                                    </div>

                                    {farm.lastUpdate && (
                                        <div className="update-time">
                                            📅 {farm.lastUpdate}
                                        </div>
                                    )}

                                    <div className="farm-action">
                                        <button className="action-btn">
                                            📊 Открыть дашборд
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="file-info">
                                    ❌ Файл не найден по URL
                                    <div className="url-info">
                                        {farm.url}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="debug-panel">
                <h3>Информация:</h3>
                <div>Используются абсолютные пути к raw.githubusercontent.com</div>
                <div>Найдено: {farms.filter(f => f.exists).length} из {farms.length}</div>
                <div>Автообновление: каждую минуту</div>

                <div className="test-links">
                    <h4>Проверь файлы:</h4>
                    {FARM_FILES.map(farm => (
                        <a key={farm.name} href={farm.url} target="_blank">
                            {farm.name} - {farm.url}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FarmSelection;