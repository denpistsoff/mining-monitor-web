// utils/historyManager.js
class HistoryManager {
    constructor() {
        this.historyKey = 'farm_history_data';
        this.maxEntries = 168; // 7 дней * 24 часа
        this.lastSaveTime = null;
        this.saveInterval = 60 * 60 * 1000; // 1 час
    }

    // Инициализация истории
    initHistory() {
        if (!localStorage.getItem(this.historyKey)) {
            const initialHistory = {
                farm_history: [],
                last_update: new Date().toISOString()
            };
            this.saveToStorage(initialHistory);
        }
        return this.loadHistory();
    }

    // Сохранить текущие данные (если прошел час)
    saveCurrentData(farmData) {
        const now = Date.now();
        const currentHistory = this.loadHistory();

        // Проверяем, прошел ли час с последнего сохранения
        if (this.lastSaveTime && (now - this.lastSaveTime < this.saveInterval)) {
            return currentHistory;
        }

        try {
            const newEntry = {
                timestamp: new Date().toISOString(),
                total_hashrate: farmData.summary?.total_hashrate || 0,
                total_power: farmData.summary?.total_power || 0,
                online_miners: farmData.summary?.online_miners || 0,
                problematic_count: farmData.summary?.problematic_count || 0,
                efficiency: farmData.summary?.total_hashrate ?
                    parseFloat((farmData.summary.total_hashrate / (farmData.summary.total_power / 1000)).toFixed(3)) : 0
            };

            console.log('💾 Saving history entry:', {
                time: new Date().toLocaleTimeString(),
                hashrate: newEntry.total_hashrate,
                power: newEntry.total_power
            });

            // Добавляем новую запись
            currentHistory.farm_history.unshift(newEntry);

            // Ограничиваем количество записей
            if (currentHistory.farm_history.length > this.maxEntries) {
                currentHistory.farm_history = currentHistory.farm_history.slice(0, this.maxEntries);
            }

            currentHistory.last_update = new Date().toISOString();
            this.saveToStorage(currentHistory);
            this.lastSaveTime = now;

            return currentHistory;
        } catch (error) {
            console.error('❌ Error saving history:', error);
            return currentHistory;
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
            last_update: new Date().toISOString()
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
        return {
            total_entries: history.farm_history?.length || 0,
            last_update: history.last_update,
            date_range: history.farm_history?.length > 0 ? {
                start: history.farm_history[history.farm_history.length - 1]?.timestamp,
                end: history.farm_history[0]?.timestamp
            } : null
        };
    }

    // Для тестирования: принудительно добавить данные
    forceAddTestData(currentData) {
        const history = this.loadHistory();
        const newEntry = {
            timestamp: new Date().toISOString(),
            total_hashrate: currentData?.total_hashrate || 21704.47,
            total_power: currentData?.total_power || 708438,
            online_miners: currentData?.online_miners || 194,
            problematic_count: currentData?.problematic_count || 5,
            efficiency: currentData?.total_hashrate ?
                parseFloat((currentData.total_hashrate / (currentData.total_power / 1000)).toFixed(3)) : 30.63
        };

        history.farm_history.unshift(newEntry);
        this.saveToStorage(history);
        return history;
    }
}

// Создаем глобальный экземпляр
const historyManager = new HistoryManager();

export default historyManager;