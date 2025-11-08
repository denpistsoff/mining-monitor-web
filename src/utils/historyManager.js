// utils/historyManager.js
class HistoryManager {
    constructor() {
        this.historyFile = '../../data/farm_history.json';
        this.maxEntries = 168; // 7 дней * 24 часа
        this.lastSaveTime = null;
        this.saveInterval = 60 * 60 * 1000; // 1 час
    }

    // Инициализация истории
    async initHistory() {
        try {
            const response = await fetch(this.historyFile);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('📁 History file not found, creating new...');
        }
        return this.createNewHistory();
    }

    // Создать новую историю
    createNewHistory() {
        const newHistory = {
            farm_history: [],
            last_update: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        this.saveToFile(newHistory);
        return newHistory;
    }

    // Сохранить текущие данные (если прошел час)
    async saveCurrentData(farmData) {
        const now = Date.now();

        // Проверяем, прошел ли час с последнего сохранения
        if (this.lastSaveTime && (now - this.lastSaveTime < this.saveInterval)) {
            return this.loadHistory();
        }

        try {
            const history = await this.loadHistory();
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
            await this.saveToFile(history);
            this.lastSaveTime = now;

            return history;
        } catch (error) {
            console.error('❌ Error saving history:', error);
            return await this.loadHistory();
        }
    }

    // Загрузить историю
    async loadHistory() {
        try {
            const response = await fetch(`${this.historyFile}?t=${Date.now()}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Could not load history file:', error);
        }
        return this.createNewHistory();
    }

    // Сохранить в файл
    async saveToFile(historyData) {
        try {
            await fetch('/api/save-farm-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(historyData)
            });
        } catch (error) {
            console.warn('Could not save to file, using localStorage as backup');
            // Резервное сохранение в localStorage
            localStorage.setItem('farm_history_backup', JSON.stringify(historyData));
        }
    }

    // Получить почасовые данные
    getHourlyData(hours = 24) {
        return this.loadHistory().then(history => {
            const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

            if (!history.farm_history || history.farm_history.length === 0) {
                return [];
            }

            const filtered = history.farm_history.filter(entry =>
                new Date(entry.timestamp) >= cutoffTime
            );

            // Группируем по часам для красивого графика
            const hourlyData = {};
            filtered.forEach(entry => {
                const hourKey = `${entry.date} ${entry.hour}:00`;
                if (!hourlyData[hourKey]) {
                    hourlyData[hourKey] = {
                        timestamp: entry.timestamp,
                        label: `${entry.hour}:00`,
                        hashrate: entry.total_hashrate,
                        power: entry.total_power,
                        efficiency: entry.efficiency,
                        count: 1
                    };
                } else {
                    // Усредняем если несколько записей в час
                    hourlyData[hourKey].hashrate =
                        (hourlyData[hourKey].hashrate * hourlyData[hourKey].count + entry.total_hashrate) /
                        (hourlyData[hourKey].count + 1);
                    hourlyData[hourKey].power =
                        (hourlyData[hourKey].power * hourlyData[hourKey].count + entry.total_power) /
                        (hourlyData[hourKey].count + 1);
                    hourlyData[hourKey].count++;
                }
            });

            return Object.values(hourlyData).sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            );
        });
    }

    // Для тестирования
    async addTestData(currentData) {
        const history = await this.loadHistory();
        const testEntry = {
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('ru-RU'),
            hour: new Date().getHours(),
            total_hashrate: currentData?.total_hashrate || 21704.47,
            total_power: currentData?.total_power || 708438,
            online_miners: currentData?.online_miners || 194,
            problematic_count: currentData?.problematic_count || 5,
            efficiency: 30.63
        };

        history.farm_history.unshift(testEntry);
        await this.saveToFile(history);
        return history;
    }
}

const historyManager = new HistoryManager();
export default historyManager;