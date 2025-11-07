import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/FarmSelection.css';

const FarmSelection = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Старые рабочие пути
    const FARM_NAMES = ['VISOKOVKA', 'DESKTOP-TO75OLC'];

    // Загружаем данные фермы - СТАРЫЕ ПУТИ которые работали
    const loadFarmData = async (farmName) => {
        const paths = [
            `./data/farm_data_${farmName}.json?t=${Date.now()}`, // Этот путь работал!
            `/data/farm_data_${farmName}.json?t=${Date.now()}`,
            `../data/farm_data_${farmName}.json?t=${Date.now()}`,
            `data/farm_data_${farmName}.json?t=${Date.now()}`
        ];

        for (const path of paths) {
            try {
                console.log(`Пробуем путь: ${path}`);
                const response = await fetch(path);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ УСПЕХ: ${farmName} найден по пути: ${path}`);
                    return data;
                }
            } catch (error) {
                console.log(`❌ Ошибка: ${path} - ${error.message}`);
            }
        }
        return null;
    };

    // Загружаем все фермы
    const loadFarms = async () => {
        setLoading(true);
        console.log('=== НАЧИНАЕМ ЗАГРУЗКУ ФЕРМ ===');

        const farmsList = [];

        for (const farmName of FARM_NAMES) {
            console.log(`🔍 Проверяем ферму: ${farmName}`);
            const data = await loadFarmData(farmName);

            if (data) {
                console.log(`✅ Данные получены:`, data);

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
                    displayName: data.farm_name || farmName,
                    status: status,
                    miners: totalMiners,
                    onlineMiners: onlineMiners,
                    hashrate: hashrate,
                    lastUpdate: data.last_update,
                    exists: true
                });
            } else {
                console.log(`❌ Ферма ${farmName} не найдена`);
                farmsList.push({
                    name: farmName,
                    displayName: farmName,
                    status: 'not-found',
                    miners: 0,
                    onlineMiners: 0,
                    hashrate: 0,
                    lastUpdate: null,
                    exists: false
                });
            }
        }

        console.log('=== РЕЗУЛЬТАТЫ ===', farmsList);
        setFarms(farmsList);
        setLoading(false);
    };

    useEffect(() => {
        loadFarms();
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
                    <div>Проверяемые пути: ./data/ и /data/</div>
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
                                <div className="farm-name">{farm.name}</div>
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
                                    ❌ Файл farm_data_{farm.name}.json не найден
                                    <div className="path-info">
                                        Проверяемые пути: ./data/ /data/
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="debug-panel">
                <h3>Отладочная информация:</h3>
                <div>Открой консоль браузера (F12) чтобы увидеть детали загрузки</div>
                <div>Проверяемые фермы: {FARM_NAMES.join(', ')}</div>
                <div>Найдено: {farms.filter(f => f.exists).length} из {farms.length}</div>

                <div className="test-links">
                    <h4>Проверь прямые ссылки:</h4>
                    <a href="./data/farm_data_VISOKOVKA.json" target="_blank">
                        ./data/farm_data_VISOKOVKA.json
                    </a>
                    <a href="/data/farm_data_VISOKOVKA.json" target="_blank">
                        /data/farm_data_VISOKOVKA.json
                    </a>
                </div>
            </div>
        </div>
    );
};

export default FarmSelection;