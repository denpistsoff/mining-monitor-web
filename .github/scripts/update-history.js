const fs = require('fs');
const path = require('path');

// Путь к файлу истории
const historyPath = path.join(__dirname, '../../data/farm_history.json');

// Загружаем текущую историю
function loadHistory() {
    try {
        if (fs.existsSync(historyPath)) {
            return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }

    return {
        farm_history: [],
        last_update: new Date().toISOString(),
        total_entries: 0,
        version: '1.0'
    };
}

// Сохраняем историю
function saveHistory(history) {
    try {
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
        console.log('✅ History saved successfully');
        return true;
    } catch (error) {
        console.error('❌ Error saving history:', error);
        return false;
    }
}

// Добавляем новую запись
function addNewEntry(history, farmData) {
    const currentTime = new Date();
    const minutes = currentTime.getMinutes();
    const roundedMinutes = minutes < 30 ? 0 : 30;
    const timestamp = new Date(currentTime);
    timestamp.setMinutes(roundedMinutes, 0, 0);

    const newEntry = {
        timestamp: timestamp.toISOString(),
        date: timestamp.toLocaleDateString('ru-RU'),
        hour: timestamp.getHours(),
        minute: roundedMinutes,
        time_label: `${timestamp.getHours().toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`,
        total_hashrate: farmData.summary?.total_hashrate || 0,
        total_power: farmData.summary?.total_power || 0,
        online_miners: farmData.summary?.online_miners || 0,
        problematic_miners: farmData.summary?.problematic_miners || 0,
        total_miners: farmData.summary?.total_miners || 0,
        total_containers: farmData.summary?.total_containers || 0,
        efficiency: farmData.summary?.total_hashrate ?
            parseFloat((farmData.summary.total_hashrate / (farmData.summary.total_power / 1000)).toFixed(3)) : 0,
        is_offline: false,
        farm_name: farmData.farm_name || 'unknown'
    };

    // Проверяем дубликаты
    const existingIndex = history.farm_history.findIndex(entry =>
        entry.time_label === newEntry.time_label &&
        entry.date === newEntry.date
    );

    if (existingIndex !== -1) {
        history.farm_history[existingIndex] = newEntry;
    } else {
        history.farm_history.unshift(newEntry);
    }

    // Сортируем и ограничиваем
    history.farm_history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (history.farm_history.length > 336) {
        history.farm_history = history.farm_history.slice(-336);
    }

    history.last_update = new Date().toISOString();
    history.total_entries = history.farm_history.length;

    return history;
}

// Основная функция
async function main() {
    console.log('🔄 Updating farm history...');

    const history = loadHistory();

    // Здесь можно добавить логику получения актуальных данных фермы
    // Например, загрузка из farm_data_*.json файлов

    // Пока просто обновляем timestamp для демонстрации
    history.last_update = new Date().toISOString();

    if (saveHistory(history)) {
        console.log(`✅ History updated: ${history.farm_history.length} entries`);
    } else {
        console.log('❌ Failed to update history');
        process.exit(1);
    }
}

main().catch(console.error);