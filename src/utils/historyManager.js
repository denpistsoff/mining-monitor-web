// src/utils/historyManager.js
class HistoryManager {
    constructor() {
        this.baseUrl = 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/';
        this.cache = new Map();
        this.cacheTime = 5 * 60 * 1000; // 5 минут
        this.updateInterval = 5 * 60 * 1000; // 5 минут
        this.autoUpdateTimers = new Map();

        // Запускаем автообновление при создании
        this.initAutoUpdate();
    }

    initAutoUpdate() {
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
    }

    async refreshAllHistories() {
        console.log('🔄 Refreshing all histories...');
        try {
            // Получаем список всех ферм из конфига
            const config = await this.loadConfig();
            if (!config || !config.farms) return;

            for (const farm of config.farms) {
                const farmId = farm.id;
                await this.loadFarmHistory(farmId, true);
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
            // Пробуем загрузить с GitHub
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

        // Если не удалось загрузить, используем заглушку
        return {
            farms: [{ id: 'VISOKOVKA' }, { id: 'HOME' }]
        };
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

            // Сначала пробуем загрузить с GitHub
            const url = `${this.baseUrl}history_${farmName}.json?t=${Date.now()}`;
            const response = await fetch(url);

            if (response.ok) {
                const history = await response.json();
                console.log(`✅ History loaded from GitHub for ${farmName}: ${history.farm_history?.length || 0} entries`);

                // Сохраняем в кэш
                this.cache.set(cacheKey, {
                    data: history,
                    timestamp: Date.now()
                });

                // Сохраняем в localStorage
                this.saveToLocalStorage(cacheKey, history);

                return history;
            } else {
                // Если файла нет на GitHub, создаем эмулированную историю
                console.log(`📁 История для ${farmName} не найдена, создаем эмулированную...`);
                const emulatedHistory = this.createEmulatedHistory(farmName);

                this.cache.set(cacheKey, {
                    data: emulatedHistory,
                    timestamp: Date.now()
                });

                this.saveToLocalStorage(cacheKey, emulatedHistory);

                return emulatedHistory;
            }
        } catch (error) {
            console.error(`❌ Error loading history for ${farmName}:`, error);

            // Пробуем загрузить из localStorage
            const localData = this.loadFromLocalStorage(cacheKey);
            if (localData) {
                console.log(`📦 Using localStorage cache for ${farmName}`);
                return localData;
            }

            // Если ничего нет, создаем эмулированную
            return this.createEmulatedHistory(farmName);
        }
    }

    createEmulatedHistory(farmName) {
        console.log(`🎲 Creating emulated history for ${farmName}`);

        const now = new Date();
        const history = [];

        // Создаем данные за последние 24 часа с шагом 1 час
        for (let i = 24; i >= 0; i--) {
            const time = new Date(now - i * 60 * 60 * 1000);

            // Базовые значения с случайными колебаниями
            const baseHashrate = 150 + Math.sin(i / 5) * 20;
            const basePower = 3500 + Math.cos(i / 3) * 300;
            const baseMiners = 10;

            // Добавляем случайный шум
            const noise = (Math.random() - 0.5) * 10;

            history.push({
                timestamp: time.toISOString(),
                date: time.toLocaleDateString('ru-RU'),
                hour: time.getHours(),
                minute: time.getMinutes(),
                time_label: time.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                total_hashrate: Math.max(0, baseHashrate + noise),
                total_power: Math.max(2000, basePower + noise * 20),
                online_miners: Math.min(baseMiners, Math.max(8, baseMiners + Math.floor(noise / 10))),
                problematic_miners: Math.floor(Math.random() * 2),
                total_miners: baseMiners,
                efficiency: (baseHashrate + noise) / ((basePower + noise * 20) / 1000),
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
            is_emulated: true
        };
    }

    async addHistoryEntry(farmName, farmData) {
        try {
            // Загружаем текущую историю
            const history = await this.loadFarmHistory(farmName);

            // Создаем новую запись
            const now = new Date();
            const newEntry = {
                timestamp: now.toISOString(),
                date: now.toLocaleDateString('ru-RU'),
                hour: now.getHours(),
                minute: now.getMinutes(),
                time_label: now.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                total_hashrate: farmData?.summary?.total_hashrate || 150 + Math.random() * 30,
                total_power: farmData?.summary?.total_power || 3500 + Math.random() * 500,
                online_miners: farmData?.summary?.online_miners || 10,
                problematic_miners: farmData?.summary?.problematic_miners || 0,
                total_miners: farmData?.summary?.total_miners || 10,
                efficiency: farmData?.summary?.total_hashrate && farmData?.summary?.total_power ?
                    (farmData.summary.total_hashrate / (farmData.summary.total_power / 1000)) :
                    150 / 3.5,
                is_offline: farmData?._dataStatus === 'offline' || false,
                farm_name: farmName
            };

            // Добавляем в начало массива
            if (!history.farm_history) {
                history.farm_history = [];
            }

            // Проверяем, нет ли уже записи за эту минуту
            const lastEntry = history.farm_history[0];
            if (lastEntry && lastEntry.time_label === newEntry.time_label) {
                console.log(`⏸️ Запись за ${newEntry.time_label} уже существует`);
                return history;
            }

            history.farm_history.unshift(newEntry);

            // Ограничиваем количество записей (336 = 14 дней * 24)
            if (history.farm_history.length > 336) {
                history.farm_history = history.farm_history.slice(0, 336);
            }

            history.last_update = now.toISOString();
            history.total_entries = history.farm_history.length;

            // Сохраняем в кэш
            this.cache.set(`history_${farmName}`, {
                data: history,
                timestamp: Date.now()
            });

            // Сохраняем в localStorage
            this.saveToLocalStorage(`history_${farmName}`, history);

            console.log(`💾 New history entry added for ${farmName}: ${newEntry.time_label} (${history.total_entries} total)`);

            // Триггерим событие для обновления UI
            window.dispatchEvent(new CustomEvent('historyUpdated', {
                detail: { farmName, history }
            }));

            return history;
        } catch (error) {
            console.error(`❌ Error adding history entry for ${farmName}:`, error);
            return null;
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

            // Вычисляем средние значения за последние 24 часа
            const last24h = await this.getLastNHours(farmName, 24);
            let totalHashrate = 0;
            let totalPower = 0;

            last24h.forEach(entry => {
                totalHashrate += entry.total_hashrate || 0;
                totalPower += (entry.total_power || 0) / 1000;
            });

            const avgHashrate = last24h.length > 0 ? totalHashrate / last24h.length : 0;
            const avgPower = last24h.length > 0 ? totalPower / last24h.length : 0;

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
                is_emulated: history.is_emulated || false,
                source: history.is_emulated ? 'emulated' : 'github'
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
                is_emulated: false,
                source: 'error'
            };
        }
    }

    // Метод для принудительного добавления тестовой записи
    addTestEntry(farmName) {
        const testData = {
            summary: {
                total_hashrate: 150 + Math.random() * 30,
                total_power: 3500 + Math.random() * 500,
                online_miners: 10,
                problematic_miners: Math.floor(Math.random() * 2),
                total_miners: 10
            },
            _dataStatus: 'fresh'
        };
        return this.addHistoryEntry(farmName, testData);
    }

    // Метод для очистки и создания новой эмулированной истории
    resetToEmulated(farmName) {
        const emulatedHistory = this.createEmulatedHistory(farmName);
        this.cache.set(`history_${farmName}`, {
            data: emulatedHistory,
            timestamp: Date.now()
        });
        this.saveToLocalStorage(`history_${farmName}`, emulatedHistory);
        return emulatedHistory;
    }

    clearCache() {
        this.cache.clear();
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

    // Метод для получения данных в реальном времени
    async getRealtimeData(farmName, callback, interval = 60000) {
        if (this.autoUpdateTimers.has(farmName)) {
            clearInterval(this.autoUpdateTimers.get(farmName));
        }

        const timer = setInterval(async () => {
            try {
                // Добавляем новую запись
                await this.addHistoryEntry(farmName);

                // Загружаем обновленную историю
                const history = await this.loadFarmHistory(farmName, true);

                if (callback) {
                    callback(history);
                }
            } catch (error) {
                console.error(`❌ Error in realtime data for ${farmName}:`, error);
            }
        }, interval);

        this.autoUpdateTimers.set(farmName, timer);

        return () => {
            clearInterval(timer);
            this.autoUpdateTimers.delete(farmName);
        };
    }
}

const historyManager = new HistoryManager();
export default historyManager;