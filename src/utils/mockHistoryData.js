// src/utils/mockHistoryData.js

// Генерируем тестовые данные за последние 24 часа
export const generateMockHistory = (farmName) => {
    const now = new Date();
    const history = [];

    // Базовые значения
    const baseHashrate = 150; // TH/s
    const basePower = 3500; // Вт
    const baseMiners = 10;

    // Создаем данные за последние 24 часа с шагом 1 час
    for (let i = 24; i >= 0; i--) {
        const time = new Date(now - i * 60 * 60 * 1000);

        // Добавляем синусоидальные колебания + случайный шум
        const hourFactor = Math.sin(i / 4) * 20; // Колебания в течение дня
        const randomNoise = (Math.random() - 0.5) * 15; // Случайный шум

        const hashrate = Math.max(100, baseHashrate + hourFactor + randomNoise);
        const power = basePower + hourFactor * 20 + randomNoise * 10;
        const onlineMiners = Math.floor(baseMiners + Math.sin(i / 3) * 2);
        const problematicMiners = Math.floor(Math.random() * 2);

        history.push({
            timestamp: time.toISOString(),
            date: time.toLocaleDateString('ru-RU'),
            hour: time.getHours(),
            minute: time.getMinutes(),
            time_label: time.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            total_hashrate: Number(hashrate.toFixed(2)),
            total_power: Math.floor(power),
            online_miners: onlineMiners,
            problematic_miners: problematicMiners,
            total_miners: baseMiners,
            efficiency: Number((hashrate / (power / 1000)).toFixed(2)),
            is_offline: false,
            farm_name: farmName
        });
    }

    return {
        farm_history: history,
        last_update: now.toISOString(),
        total_entries: history.length,
        farm_name: farmName,
        version: "2.0",
        is_mock: true
    };
};

// Константы для разных типов ферм
export const MOCK_FARMS = {
    'VISOKOVKA': {
        baseHashrate: 150,
        basePower: 3500,
        baseMiners: 10
    },
    'HOME': {
        baseHashrate: 50,
        basePower: 1200,
        baseMiners: 3
    },
    'SARATOV': {
        baseHashrate: 200,
        basePower: 5000,
        baseMiners: 15
    }
};

// Функция для получения мок-данных под конкретную ферму
export const getMockHistoryForFarm = (farmName) => {
    const farmConfig = MOCK_FARMS[farmName] || MOCK_FARMS['VISOKOVKA'];
    return generateMockHistory(farmName, farmConfig);
};