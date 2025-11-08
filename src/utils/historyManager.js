// src/utils/historyManager.js
class HistoryManager {
    constructor() {
        this.historyKey = 'farm_history_data';
        this.maxEntries = 336; // 7 дней * 48 получасовок
        this.lastSaveTime = null;
        this.saveInterval = 30 * 60 * 1000; // 30 минут
    }

    initHistory() {
        let history = this.loadHistory();
        return history;
    }

    saveCurrentData(farmData) {
        const now = Date.now();

        // Проверяем, прошло ли 30 минут с последнего сохранения
        if (this.lastSaveTime && (now - this.lastSaveTime < this.saveInterval)) {
            return this.loadHistory();
        }

        try {
            const history = this.loadHistory();
            const currentTime = new Date();

            // Определяем получасовой интервал (00 или 30 минут)
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
                problematic_count: farmData.summary?.problematic_count || 0,
                efficiency: farmData.summary?.total_hashrate ?
                    parseFloat((farmData.summary.total_hashrate / (farmData.summary.total_power / 1000)).toFixed(3)) : 0
            };

            // Проверяем, нет ли уже записи для этого получасового интервала
            const existingIndex = history.farm_history.findIndex(entry =>
                entry.time_label === newEntry.time_label &&
                entry.date === newEntry.date
            );

            if (existingIndex !== -1) {
                // Обновляем существующую запись
                history.farm_history[existingIndex] = newEntry;
            } else {
                // Добавляем новую запись
                history.farm_history.unshift(newEntry);
            }

            // Сортируем по времени (от старых к новым)
            history.farm_history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Ограничиваем количество записей
            if (history.farm_history.length > this.maxEntries) {
                history.farm_history = history.farm_history.slice(-this.maxEntries);
            }

            history.last_update = new Date().toISOString();
            this.saveToStorage(history);
            this.lastSaveTime = now;

            return history;
        } catch (error) {
            console.error('Error saving history:', error);
            return this.loadHistory();
        }
    }

    loadHistory() {
        try {
            const stored = localStorage.getItem(this.historyKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }

        return {
            farm_history: [],
            last_update: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
    }

    saveToStorage(historyData) {
        try {
            localStorage.setItem(this.historyKey, JSON.stringify(historyData));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    clearHistory() {
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

    getLastNHours(hours = 24) {
        const history = this.loadHistory();
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

        if (!history.farm_history || history.farm_history.length === 0) {
            return [];
        }

        const filtered = history.farm_history.filter(entry => {
            try {
                return new Date(entry.timestamp) >= cutoffTime;
            } catch {
                return false;
            }
        });

        // Убедимся что данные отсортированы от старых к новым
        return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    getHistoryStats() {
        const history = this.loadHistory();
        return {
            total_entries: history.farm_history?.length || 0,
            last_update: history.last_update,
            date_range: history.farm_history?.length > 0 ? {
                start: history.farm_history[0]?.timestamp,
                end: history.farm_history[history.farm_history.length - 1]?.timestamp
            } : null
        };
    }

    exportHistory() {
        const history = this.loadHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `farm_history_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

const historyManager = new HistoryManager();
export default historyManager;