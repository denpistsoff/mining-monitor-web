import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Список ферм для проверки
    const FARM_NAMES = ['VISOKOVKA', 'DESKTOP-TO75OLC'];

    // Загружаем данные фермы
    const loadFarmData = async (farmName) => {
        try {
            const response = await fetch(`/data/farm_data_${farmName}.json?t=${Date.now()}`);
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.log(`Ошибка загрузки ${farmName}:`, error);
        }
        return null;
    };

    // Загружаем все фермы
    const loadFarms = async () => {
        setLoading(true);

        const farmsList = [];

        for (const farmName of FARM_NAMES) {
            const data = await loadFarmData(farmName);

            if (data) {
                // Файл найден и загружен
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
                    name: farmName,
                    displayName: data.farm_name || farmName, // Берем имя из JSON или используем имя файла
                    status: status,
                    miners: totalMiners,
                    onlineMiners: onlineMiners,
                    hashrate: hashrate,
                    lastUpdate: data.last_update,
                    exists: true,
                    containers: containers
                });
            } else {
                // Файл не найден
                farmsList.push({
                    name: farmName,
                    displayName: farmName,
                    status: 'not-found',
                    miners: 0,
                    onlineMiners: 0,
                    hashrate: 0,
                    lastUpdate: null,
                    exists: false,
                    containers: {}
                });
            }
        }

        console.log('Загруженные фермы:', farmsList);
        setFarms(farmsList);
        setLoading(false);
    };

    useEffect(() => {
        loadFarms();

        // Автообновление каждую минуту
        const interval = setInterval(loadFarms, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleFarmClick = (farmName) => {
        navigate(`/farm/${farmName}/dashboard`);
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
                    <div>Файлы: /data/farm_data_*.json</div>
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
                                    <div className="farm-display-name">
                                        {farm.displayName !== farm.name && `(${farm.displayName})`}
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
                                            <span className="label">Майнеры:</span>
                                            <span className="value">{farm.onlineMiners}/{farm.miners}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Хешрейт:</span>
                                            <span className="value">{farm.hashrate.toFixed(2)} TH/s</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Контейнеры:</span>
                                            <span className="value">{Object.keys(farm.containers).length}</span>
                                        </div>
                                    </div>

                                    {farm.lastUpdate && (
                                        <div className="update-time">
                                            📅 {farm.lastUpdate}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="file-info">
                                    ❌ Файл farm_data_{farm.name}.json не найден в папке /data/
                                </div>
                            )}

                            <div className="farm-action">
                                <button className="action-btn">
                                    {farm.exists ? '📊 Открыть' : '👀 Проверить'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="debug-info">
                <h3>Отладочная информация:</h3>
                <div>Проверяемые фермы: {FARM_NAMES.join(', ')}</div>
                <div>Найдено файлов: {farms.filter(f => f.exists).length}</div>
                <div>Путь к файлам: /data/farm_data_НАЗВАНИЕ.json</div>
            </div>
        </div>
    );
};

export default FarmSelection;