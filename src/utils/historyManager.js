// src/utils/historyManager.js
import { getMockHistoryForFarm } from './mockHistoryData';

class HistoryManager {
    constructor() {
        this.baseUrl = 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/';
        this.cache = new Map();
        this.cacheTime = 5 * 60 * 1000; // 5 минут
        this.updateInterval = 5 * 60 * 1000; // 5 минут
        this.autoUpdateTimers = new Map();

        // Запускаем автообновление при создании
        this.initAutoUpdate();

        console.log('🔄 HistoryManager инициализирован');
    }

    initAutoUpdate() {
        if (window.historyAutoUpdate) return;
        window.historyAutoUpdate = true;

        setInterval(() => {
            this.refreshAllHistories();
        }, this.updateInterval);

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Страница видима, обновляем историю...');
                this.refreshAllHistories();
            }
        });
    }

    async refreshAllHistories() {
        console.log('🔄 Обновление всех историй...');
        try {
            const config = await this.loadConfig();
            if (!config || !config.farms) return;

            for (const farm of config.farms) {
                const farmId = farm.id;
                await this.loadFarmHistory(farmId, true);
            }
        } catch (error) {
            console.error('❌ Ошибка обновления историй:', error);
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
            console.error('❌ Ошибка загрузки конфига:', error);
        }

        // Если конфиг не загрузился, возвращаем стандартные фермы
        return {
            farms: [
                { id: 'VISOKOVKA' },
                { id: 'HOME' },
                { id: 'SARATOV' }
            ]
        };
    }

    async loadFarmHistory(farmName, force = false) {
        const cacheKey = `history_${farmName}`;
        const cached = this.cache.get(cacheKey);

        // Проверяем кэш
        if (!force && cached && (Date.now() - cached.timestamp < this.cacheTime)) {
            console.log(`📦 Используем кэш для ${farmName}`);
            return cached.data;
        }

        try {
            console.log(`📥 Загрузка истории для ${farmName}...`);

            // Сначала пробуем загрузить с GitHub
            const url = `${this.baseUrl}history_${farmName}.json?t=${Date.now()}`;
            const response = await fetch(url);

            if (response.ok) {
                const history = await response.json();
                console.log(`✅ История загружена с GitHub для ${farmName}: ${history.farm_history?.length || 0} записей`);

                this.cache.set(cacheKey, {
                    data: history,
                    timestamp: Date.now()
                });

                this.saveToLocalStorage(cacheKey, history);
                return history;
            } else {
                // Если файла нет на GitHub, создаем МОК-ДАННЫЕ
                console.log(`📁 Файл истории для ${farmName} не найден, создаем тестовые данные...`);
                const mockHistory = getMockHistoryForFarm(farmName);

                this.cache.set(cacheKey, {
                    data: mockHistory,
                    timestamp: Date.now()
                });

                this.saveToLocalStorage(cacheKey, mockHistory);

                return mockHistory;
            }
        } catch (error) {
            console.error(`❌ Ошибка загрузки истории для ${farmName}:`, error);

            // Пробуем загрузить из localStorage
            const localData = this.loadFromLocalStorage(cacheKey);
            if (localData) {
                console.log(`📦 Используем localStorage для ${farmName}`);
                return localData;
            }

            // Если ничего нет, создаем мок-данные
            console.log(`🎲 Создаем тестовые данные для ${farmName}`);
            const mockHistory = getMockHistoryForFarm(farmName);
            this.saveToLocalStorage(cacheKey, mockHistory);
            return mockHistory;
        }
    }

    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
            console.log(`💾 Данные сохранены в localStorage для ${key}`);
        } catch (e) {
            console.warn('❌ Ошибка сохранения в localStorage:', e);
        }
    }

    loadFromLocalStorage(key) {
        try {
            const cached = localStorage.getItem(key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;
                if (age < 24 * 60 * 60 * 1000) { // 24 часа
                    console.log(`📦 Данные загружены из localStorage для ${key}`);
                    return data;
                }
            }
        } catch (e) {
            console.error('❌ Ошибка загрузки из localStorage:', e);
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
            console.error('❌ Ошибка получения истории:', error);
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
                is_mock: history.is_mock || false,
                source: history.is_mock ? 'mock' : 'github'
            };
        } catch (error) {
            console.error('❌ Ошибка получения статистики:', error);
            return {
                total_entries: 0,
                offline_entries: 0,
                online_entries: 0,
                avg_hashrate_24h: 0,
                avg_power_24h: 0,
                last_update: null,
                date_range: null,
                is_mock: false,
                source: 'error'
            };
        }
    }

    // Метод для принудительного создания мок-данных
    forceMockData(farmName) {
        const mockHistory = getMockHistoryForFarm(farmName);
        this.cache.set(`history_${farmName}`, {
            data: mockHistory,
            timestamp: Date.now()
        });
        this.saveToLocalStorage(`history_${farmName}`, mockHistory);
        return mockHistory;
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
        console.log('🧹 Кэш истории очищен');
    }
}

const historyManager = new HistoryManager();
export default historyManager;