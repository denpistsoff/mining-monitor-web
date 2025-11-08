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
            const newEntry = {
                timestamp: new Date().toISOString(),
                total_hashrate: farmData.summary?.total_hashrate || 0,
                total_power: farmData.summary?.total_power || 0,
                online_miners: farmData.summary?.online_miners || 0,
                problematic_count: farmData.summary?.problematic_count || 0,
                efficiency: farmData.summary?.total_hashrate ?
                    (farmData.summary.total_hashrate / (farmData.summary.total_power / 1000)).toFixed(3) : 0
            };

            console.log('💾 Saving history entry:', {
                time: new Date().toLocaleTimeString(),
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

    // Экспорт истории в файл (для отладки)
    exportHistory() {
        const history = this.loadHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `farm_history_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Очистить историю
    clearHistory() {
        const emptyHistory = {
            farm_history: [],
            last_update: new Date().toISOString()
        };
        this.saveToStorage(emptyHistory);
        this.lastSaveTime = null;
        return emptyHistory;
    }

    // Получить данные за последние N часов
    getLastNHours(hours = 24) {
        const history = this.loadHistory();
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

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
            total_entries: history.farm_history.length,
            last_update: history.last_update,
            date_range: history.farm_history.length > 0 ? {
                start: history.farm_history[history.farm_history.length - 1]?.timestamp,
                end: history.farm_history[0]?.timestamp
            } : null
        };
    }
}

// Создаем глобальный экземпляр
const historyManager = new HistoryManager();

// Инициализируем при загрузке
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        historyManager.initHistory();
        console.log('📊 History Manager initialized');
    });
}

export default historyManager;