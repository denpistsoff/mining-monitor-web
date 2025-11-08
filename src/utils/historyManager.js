// utils/historyManager.js
class HistoryManager {
    constructor() {
        this.historyKey = 'farm_history_data';
        this.maxEntries = 168; // 7 дней * 24 часа
        this.lastSaveTime = null;
        this.saveInterval = 60 * 60 * 1000; // 1 час
    }

    // Инициализация истории с тестовыми данными
    initHistory() {
        let history = this.loadHistory();

        // Если история пустая, создаем тестовые данные за 2 часа
        if (history.farm_history.length === 0) {
            console.log('🧪 Creating test data for 2 hours...');
            history = this.createTestData();
            this.saveToStorage(history);
        }

        return history;
    }

    // Создать тестовые данные за 2 часа
    createTestData() {
        const testData = {
            farm_history: [],
            last_update: new Date().toISOString(),
            created_at: new Date().toISOString(),
            is_test_data: true
        };

        const now = new Date();

        // Создаем данные за последние 2 часа
        for (let i = 2; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hashrate = 21700 + Math.random() * 200 - 100; // 21700 ± 100
            const power = 708000 + Math.random() * 2000 - 1000; // 708000 ± 1000

            testData.farm_history.push({
                timestamp: timestamp.toISOString(),
                date: timestamp.toLocaleDateString('ru-RU'),
                hour: timestamp.getHours(),
                total_hashrate: parseFloat(hashrate.toFixed(2)),
                total_power: parseFloat(power.toFixed(0)),
                online_miners: 194,
                problematic_count: 5,
                efficiency: parseFloat((hashrate / (power / 1000)).toFixed(3)),
                is_test_entry: true
            });
        }

        console.log('✅ Test data created for 2 hours:', testData.farm_history.length, 'entries');
        return testData;
    }

    // Сохранить текущие данные (если прошел час)
    saveCurrentData(farmData) {
        const now = Date.now();

        // Проверяем, прошел ли час с последнего сохранения
        if (this.lastSaveTime && (now - this.lastSaveTime < this.saveInterval)) {
            return this.loadHistory();
        }

        try {
            const history = this.loadHistory();

            // Удаляем тестовые данные при первом реальном сохранении
            if (history.is_test_data) {
                console.log('🔄 Replacing test data with real data...');
                history.farm_history = [];
                history.is_test_data = false;
            }

            const newEntry = {
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('ru-RU'),
                hour: new Date().getHours(),
                total_hashrate: farmData.summary?.total_hashrate || 0,
                total_power: farmData.summary?.total_power || 0,
                online_miners: farmData.summary?.online_miners || 0,
                problematic_count: farmData.summary?.problematic_count || 0,
                efficiency: farmData.summary?.total_hashrate ?
                    parseFloat((farmData.summary.total_hashrate / (farmData.summary.total_power / 1000)).toFixed(3)) : 0
            };

            console.log('💾 Saving hourly data:', {
                time: `${newEntry.hour}:00`,
                hashrate: newEntry.total_hashrate,
                power: newEntry.total_power
            });

            // Добавляем новую запись
            history.farm_history.unshift(newEntry);

            // Ограничиваем количество записей
            if (history.farm_history.length > this.maxEntries) {
                history.farm_history = history.farm_history.slice(0, this.maxEntries);
            }

            history.last_update = new Date().toISOString();
            this.saveToStorage(history);
            this.lastSaveTime = now;

            return history;
        } catch (error) {
            console.error('❌ Error saving history:', error);
            return this.loadHistory();
        }
    }

    // Загрузить историю из localStorage
    loadHistory() {
        try {
            const stored = localStorage.getItem(this.historyKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading history from storage:', error);
        }

        // Возвращаем пустую историю если нет данных
        return {
            farm_history: [],
            last_update: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
    }

    // Сохранить в localStorage
    saveToStorage(historyData) {
        try {
            localStorage.setItem(this.historyKey, JSON.stringify(historyData));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    // Очистить всю историю
    clearHistory() {
        console.log('🗑️ Clearing all history data...');
        const emptyHistory = {
            farm_history: [],
            last_update: new Date().toISOString(),
            created_at: new Date().toISOString(),
            cleared_at: new Date().toISOString()
        };
        this.saveToStorage(emptyHistory);
        this.lastSaveTime = null;
        return emptyHistory;
    }

    // Получить данные за последние N часов
    getLastNHours(hours = 24) {
        const history = this.loadHistory();
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

        if (!history.farm_history || history.farm_history.length === 0) {
            return [];
        }

        return history.farm_history.filter(entry => {
            try {
                return new Date(entry.timestamp) >= cutoffTime;
            } catch {
                return false;
            }
        });
    }

    // Получить статистику истории
    getHistoryStats() {
        const history = this.loadHistory();
        const totalEntries = history.farm_history?.length || 0;
        const testEntries = history.farm_history?.filter(entry => entry.is_test_entry).length || 0;
        const realEntries = totalEntries - testEntries;

        return {
            total_entries: totalEntries,
            test_entries: testEntries,
            real_entries: realEntries,
            is_test_data: history.is_test_data || false,
            last_update: history.last_update,
            date_range: history.farm_history?.length > 0 ? {
                start: history.farm_history[history.farm_history.length - 1]?.timestamp,
                end: history.farm_history[0]?.timestamp
            } : null
        };
    }

    // Добавить тестовые данные (для ручного тестирования)
    addTestData() {
        console.log('🧪 Adding manual test data...');
        const history = this.loadHistory();
        const testHistory = this.createTestData();

        // Объединяем существующие данные с тестовыми
        history.farm_history = [...testHistory.farm_history, ...history.farm_history];
        history.last_update = new Date().toISOString();

        this.saveToStorage(history);
        return history;
    }

    // Экспорт истории в файл
    exportHistory() {
        const history = this.loadHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `farm_history_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        console.log('📥 History exported');
    }
}

// Создаем глобальный экземпляр
const historyManager = new HistoryManager();

export default historyManager;