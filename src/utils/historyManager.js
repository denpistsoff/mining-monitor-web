// src/utils/historyManager.js
class HistoryManager {
    constructor() {
        this.githubRepo = 'denpistsoff/mining-monitor-web';
        this.githubBranch = 'main';
        this.maxEntries = 336;
        this.githubToken = process.env.REACT_APP_GITHUB_TOKEN;
        this.apiBase = 'https://api.github.com/repos';
    }

    // Загрузить историю для конкретной фермы
    async loadFarmHistory(farmName) {
        try {
            const url = `https://raw.githubusercontent.com/${this.githubRepo}/${this.githubBranch}/data/history_${farmName}.json?t=${Date.now()}`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`📁 История для ${farmName} не найдена, создаем локально...`);
                    return this.getDefaultHistory(farmName);
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const history = await response.json();
            return history;
        } catch (error) {
            console.error(`❌ Ошибка загрузки истории для ${farmName}:`, error);
            return this.getDefaultHistory(farmName);
        }
    }

    // Получить данные за последние N часов для конкретной фермы
    async getLastNHours(farmName, hours = 24) {
        try {
            const history = await this.loadFarmHistory(farmName);
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

    // Получить статистику истории для конкретной фермы
    async getHistoryStats(farmName) {
        try {
            const history = await this.loadFarmHistory(farmName);
            const totalEntries = history.farm_history?.length || 0;
            const offlineEntries = history.farm_history?.filter(entry => entry.is_offline).length || 0;

            return {
                total_entries: totalEntries,
                offline_entries: offlineEntries,
                online_entries: totalEntries - offlineEntries,
                last_update: history.last_update,
                date_range: history.farm_history?.length > 0 ? {
                    start: history.farm_history[0]?.timestamp,
                    end: history.farm_history[history.farm_history.length - 1]?.timestamp
                } : null,
                source: 'github'
            };
        } catch (error) {
            console.error('❌ Ошибка получения статистики:', error);
            return {
                total_entries: 0,
                offline_entries: 0,
                online_entries: 0,
                last_update: null,
                date_range: null,
                source: 'error'
            };
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
}

const historyManager = new HistoryManager();
export default historyManager;