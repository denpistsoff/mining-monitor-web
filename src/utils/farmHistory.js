// utils/farmHistory.js
class FarmHistory {
    constructor() {
        this.historyFile = 'farm_history.json';
        this.maxEntries = 168; // 7 дней * 24 часа
    }

    // Загрузить исторические данные
    async loadHistory() {
        try {
            const response = await fetch(`/api/farm-history?t=${Date.now()}`);
            if (response.ok) {
                const data = await response.json();
                return data;
            }
            return this.getDefaultHistory();
        } catch (error) {
            console.warn('History data not available yet, using default');
            return this.getDefaultHistory();
        }
    }

    // Сохранить текущие данные
    async saveCurrentData(farmData) {
        try {
            const history = await this.loadHistory();
            const newEntry = {
                timestamp: new Date().toISOString(),
                total_hashrate: farmData.summary?.total_hashrate || 0,
                total_power: farmData.summary?.total_power || 0,
                online_miners: farmData.summary?.online_miners || 0,
                problematic_count: farmData.summary?.problematic_count || 0,
                efficiency: farmData.summary?.total_hashrate ?
                    farmData.summary.total_hashrate / (farmData.summary.total_power / 1000) : 0
            };

            // Добавляем новую запись в начало
            history.farm_history.unshift(newEntry);

            // Ограничиваем количество записей
            if (history.farm_history.length > this.maxEntries) {
                history.farm_history = history.farm_history.slice(0, this.maxEntries);
            }

            // Сохраняем на сервер (неблокирующий вызов)
            this.saveToServer(history).catch(console.error);
            return history;
        } catch (error) {
            console.error('Error saving history:', error);
            return this.getDefaultHistory();
        }
    }

    // Сохранить на сервер
    async saveToServer(historyData) {
        try {
            await fetch('/api/save-farm-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(historyData)
            });
        } catch (error) {
            console.warn('Could not save history to server:', error);
        }
    }

    getDefaultHistory() {
        return {
            farm_history: []
        };
    }

    // Получить данные за последние N часов
    getLastNHours(history, hours = 24) {
        if (!history || !history.farm_history) return [];

        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        return history.farm_history.filter(entry => {
            try {
                return new Date(entry.timestamp) >= cutoffTime;
            } catch {
                return false;
            }
        });
    }
}

export default new FarmHistory();