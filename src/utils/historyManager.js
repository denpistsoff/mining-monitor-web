// src/utils/historyManager.js
class HistoryManager {
    constructor() {
        this.baseUrl = 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/';
        this.githubApiUrl = 'https://api.github.com/repos/denpistsoff/mining-monitor-web/contents/data/';
        this.cache = new Map();
        this.cacheTime = 5 * 60 * 1000; // 5 минут
        this.updateInterval = 30 * 60 * 1000; // 30 минут
        this.autoUpdateTimers = new Map();

        // Запускаем автообновление при создании
        this.initAutoUpdate();
    }

    initAutoUpdate() {
        // Проверяем, не запущено ли уже автообновление
        if (window.historyAutoUpdate) return;
        window.historyAutoUpdate = true;

        console.log('🔄 History auto-update initialized');

        // Запускаем периодическое обновление
        setInterval(() => {
            this.refreshAllHistories();
        }, this.updateInterval);

        // Обновляем при возвращении на страницу
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Page visible, refreshing history...');
                this.refreshAllHistories();
            }
        });

        // Обновляем при подключении к интернету
        window.addEventListener('online', () => {
            console.log('🌐 Back online, refreshing history...');
            this.refreshAllHistories();
        });
    }

    async refreshAllHistories() {
        console.log('🔄 Refreshing all histories...');
        try {
            // Получаем список всех ферм из конфига
            const config = await this.loadConfig();
            if (!config || !config.farms) return;

            // Обновляем историю для каждой фермы
            for (const farm of config.farms) {
                const farmId = farm.id;
                this.loadFarmHistory(farmId, true).then(history => {
                    console.log(`✅ History updated for ${farmId}: ${history.farm_history?.length || 0} entries`);
                }).catch(err => {
                    console.error(`❌ Error updating ${farmId}:`, err);
                });
            }
        } catch (error) {
            console.error('❌ Error refreshing histories:', error);
        }
    }

    async loadConfig() {
        const cacheKey = 'frontend_config';
        const cached = this.cache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp < this.cacheTime)) {
            return cached.data;
        }

        try {
            const url = `${this.baseUrl}frontend_config.json?t=${Date.now()}`;
            const response = await fetch(url);
            if (response.ok) {
                const config = await response.json();
                this.cache.set(cacheKey, {
                    data: config,
                    timestamp: Date.now()
                });
                return config;
            }
        } catch (error) {
            console.error('❌ Error loading config:', error);
        }
        return null;
    }

    async loadFarmHistory(farmName, force = false) {
        const cacheKey = `history_${farmName}`;
        const cached = this.cache.get(cacheKey);

        // Проверяем кэш
        if (!force && cached && (Date.now() - cached.timestamp < this.cacheTime)) {
            console.log(`📦 Using cached history for ${farmName}`);
            return cached.data;
        }

        try {
            console.log(`📥 Loading history for ${farmName}...`);
            const url = `${this.baseUrl}history_${farmName}.json?t=${Date.now()}`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`📁 History for ${farmName} not found, creating default`);
                    const defaultHistory = this.getDefaultHistory(farmName);
                    this.cache.set(cacheKey, {
                        data: defaultHistory,
                        timestamp: Date.now()
                    });
                    return defaultHistory;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const history = await response.json();

            // Сохраняем в кэш
            this.cache.set(cacheKey, {
                data: history,
                timestamp: Date.now()
            });

            // Сохраняем в localStorage для оффлайн-доступа
            this.saveToLocalStorage(cacheKey, history);

            console.log(`✅ History loaded for ${farmName}: ${history.farm_history?.length || 0} entries`);
            return history;
        } catch (error) {
            console.error(`❌ Error loading history for ${farmName}:`, error);

            // Пробуем загрузить из localStorage
            const localData = this.loadFromLocalStorage(cacheKey);
            if (localData) {
                console.log(`📦 Using localStorage cache for ${farmName}`);
                return localData;
            }

            return this.getDefaultHistory(farmName);
        }
    }

    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    loadFromLocalStorage(key) {
        try {
            const cached = localStorage.getItem(key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;
                if (age < 24 * 60 * 60 * 1000) { // 24 часа
                    return data;
                }
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
        return null;
    }

    async getLastNHours(farmName, hours = 24, force = false) {
        try {
            const history = await this.loadFarmHistory(farmName, force);
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

            return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } catch (error) {
            console.error('❌ Error getting history:', error);
            return [];
        }
    }

    async getHistoryStats(farmName) {
        try {
            const history = await this.loadFarmHistory(farmName);
            const totalEntries = history.farm_history?.length || 0;
            const offlineEntries = history.farm_history?.filter(entry => entry.is_offline).length || 0;

            // Вычисляем средние значения
            let totalHashrate = 0;
            let totalPower = 0;
            let validEntries = 0;

            history.farm_history?.forEach(entry => {
                if (entry.total_hashrate > 0) {
                    totalHashrate += entry.total_hashrate;
                    totalPower += entry.total_power / 1000; // в кВт
                    validEntries++;
                }
            });

            const avgHashrate = validEntries > 0 ? totalHashrate / validEntries : 0;
            const avgPower = validEntries > 0 ? totalPower / validEntries : 0;

            return {
                total_entries: totalEntries,
                offline_entries: offlineEntries,
                online_entries: totalEntries - offlineEntries,
                last_update: history.last_update,
                avg_hashrate_24h: avgHashrate,
                avg_power_24h: avgPower,
                date_range: history.farm_history?.length > 0 ? {
                    start: history.farm_history[0]?.timestamp,
                    end: history.farm_history[history.farm_history.length - 1]?.timestamp
                } : null,
                source: 'github'
            };
        } catch (error) {
            console.error('❌ Error getting history stats:', error);
            return {
                total_entries: 0,
                offline_entries: 0,
                online_entries: 0,
                avg_hashrate_24h: 0,
                avg_power_24h: 0,
                last_update: null,
                date_range: null,
                source: 'error'
            };
        }
    }

    async addHistoryEntry(farmName, farmData) {
        try {
            // Загружаем текущую историю
            const history = await this.loadFarmHistory(farmName);

            // Создаем новую запись
            const newEntry = {
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('ru-RU'),
                time_label: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                total_hashrate: farmData.summary?.total_hashrate || 0,
                total_power: farmData.summary?.total_power || 0,
                online_miners: farmData.summary?.online_miners || 0,
                problematic_miners: farmData.summary?.problematic_miners || 0,
                total_miners: farmData.summary?.total_miners || 0,
                efficiency: farmData.summary?.total_hashrate && farmData.summary.total_power ?
                    (farmData.summary.total_hashrate / (farmData.summary.total_power / 1000)) : 0,
                is_offline: farmData._dataStatus === 'offline',
                farm_name: farmName
            };

            // Добавляем в начало массива
            if (!history.farm_history) {
                history.farm_history = [];
            }
            history.farm_history.unshift(newEntry);

            // Ограничиваем количество записей (336 = 14 дней * 24)
            if (history.farm_history.length > 336) {
                history.farm_history = history.farm_history.slice(0, 336);
            }

            history.last_update = new Date().toISOString();
            history.total_entries = history.farm_history.length;

            // Сохраняем в кэш
            this.cache.set(`history_${farmName}`, {
                data: history,
                timestamp: Date.now()
            });

            // Сохраняем в localStorage
            this.saveToLocalStorage(`history_${farmName}`, history);

            console.log(`💾 New history entry added for ${farmName}:`, newEntry.time_label);
            return history;
        } catch (error) {
            console.error(`❌ Error adding history entry for ${farmName}:`, error);
            return null;
        }
    }

    async syncWithServer(farmName) {
        try {
            // В реальном приложении здесь был бы POST запрос к серверу
            // Но пока просто логируем
            console.log(`📤 Syncing history for ${farmName} with server...`);

            // Имитация успешной синхронизации
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log(`✅ History synced for ${farmName}`);
            return true;
        } catch (error) {
            console.error(`❌ Error syncing history for ${farmName}:`, error);
            return false;
        }
    }

    getDefaultHistory(farmName) {
        return {
            farm_history: [],
            last_update: new Date().toISOString(),
            total_entries: 0,
            farm_name: farmName,
            version: '1.0'
        };
    }

    clearCache() {
        this.cache.clear();
        // Очищаем только наши ключи в localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('history_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🧹 History cache cleared');
    }

    // Метод для принудительного обновления всех историй
    forceRefreshAll() {
        console.log('🔄 Force refreshing all histories...');
        this.refreshAllHistories();
    }

    // Метод для получения данных для графика в реальном времени
    async getRealtimeData(farmName, callback, interval = 60000) {
        // Очищаем предыдущий таймер если есть
        if (this.autoUpdateTimers.has(farmName)) {
            clearInterval(this.autoUpdateTimers.get(farmName));
        }

        // Создаем новый таймер
        const timer = setInterval(async () => {
            try {
                const history = await this.loadFarmHistory(farmName, true);
                if (callback) {
                    callback(history);
                }
            } catch (error) {
                console.error(`❌ Error in realtime data for ${farmName}:`, error);
            }
        }, interval);

        this.autoUpdateTimers.set(farmName, timer);

        // Возвращаем функцию для остановки
        return () => {
            clearInterval(timer);
            this.autoUpdateTimers.delete(farmName);
        };
    }
}

const historyManager = new HistoryManager();
export default historyManager;