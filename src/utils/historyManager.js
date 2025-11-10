// src/utils/historyManager.js
class HistoryManager {
    constructor() {
        this.githubRepo = 'denpistsoff/mining-monitor-web';
        this.githubBranch = 'main';
        this.historyFile = 'farm_history.json';
        this.maxEntries = 336; // 7 дней

        // GitHub API настройки
        this.githubToken = process.env.REACT_APP_GITHUB_TOKEN;
        this.apiBase = 'https://api.github.com/repos';

        // Для принудительного сохранения каждые 30 минут
        this.lastSaveTimestamp = null;
        this.saveInterval = 30 * 60 * 1000; // 30 минут

        console.log('🔐 GitHub API:', this.githubToken ? 'Token configured' : 'Using public access');
    }

    // ДОБАВЛЕННЫЙ МЕТОД - инициализация истории
    async initHistory() {
        try {
            console.log('📥 Инициализация истории...');
            const history = await this.loadFromGitHub();
            console.log('✅ История загружена, записей:', history.farm_history?.length || 0);
            return history;
        } catch (error) {
            console.error('❌ Ошибка инициализации истории:', error);
            return this.getDefaultHistory();
        }
    }

    // ДОБАВЛЕННЫЙ МЕТОД - для совместимости со старым кодом
    async loadHistory() {
        return this.initHistory();
    }

    // Основной метод сохранения - теперь принудительно каждые 30 минут
    async saveCurrentData(farmData) {
        try {
            const now = Date.now();
            const currentTime = new Date();

            // Определяем получасовой интервал (00 или 30 минут)
            const minutes = currentTime.getMinutes();
            const roundedMinutes = minutes < 30 ? 0 : 30;
            const timestamp = new Date(currentTime);
            timestamp.setMinutes(roundedMinutes, 0, 0);

            // Проверяем, нужно ли сохранять (прошло 30 минут или это новый интервал)
            const shouldSave = this.shouldSaveData(timestamp);

            if (!shouldSave) {
                console.log('⏸️ Пропускаем сохранение - еще не прошло 30 минут');
                return await this.loadFromGitHub();
            }

            let history = await this.loadFromGitHub();

            const isOffline = farmData._isOfflineData || farmData._dataStatus === 'offline';

            const newEntry = {
                timestamp: timestamp.toISOString(),
                date: timestamp.toLocaleDateString('ru-RU'),
                hour: timestamp.getHours(),
                minute: roundedMinutes,
                time_label: `${timestamp.getHours().toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`,
                total_hashrate: isOffline ? 0 : (farmData.summary?.total_hashrate || 0),
                total_power: isOffline ? 0 : (farmData.summary?.total_power || 0),
                online_miners: isOffline ? 0 : (farmData.summary?.online_miners || 0),
                problematic_miners: isOffline ? (farmData.summary?.problematic_miners || 0) : (farmData.summary?.problematic_miners || 0),
                total_miners: farmData.summary?.total_miners || 0,
                total_containers: farmData.summary?.total_containers || 0,
                efficiency: isOffline ? 0 : (farmData.summary?.total_hashrate ?
                    parseFloat((farmData.summary.total_hashrate / (farmData.summary.total_power / 1000)).toFixed(3)) : 0),
                is_offline: isOffline,
                farm_name: farmData.farm_name
            };

            // Проверяем, нет ли уже записи для этого получасового интервала
            const existingIndex = history.farm_history.findIndex(entry =>
                entry.time_label === newEntry.time_label &&
                entry.date === newEntry.date
            );

            if (existingIndex !== -1) {
                // Обновляем существующую запись
                history.farm_history[existingIndex] = newEntry;
                console.log('🔄 Обновлена существующая запись:', newEntry.time_label);
            } else {
                // Добавляем новую запись
                history.farm_history.unshift(newEntry);
                console.log('✅ Добавлена новая запись:', newEntry.time_label);
            }

            // Сортируем по времени (от старых к новым)
            history.farm_history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Ограничиваем количество записей
            if (history.farm_history.length > this.maxEntries) {
                history.farm_history = history.farm_history.slice(-this.maxEntries);
            }

            history.last_update = new Date().toISOString();
            history.total_entries = history.farm_history.length;

            // Обновляем время последнего сохранения
            this.lastSaveTimestamp = now;

            // Пытаемся сохранить через GitHub API если есть токен
            let saveMethod = 'public_access';
            try {
                if (this.githubToken) {
                    await this.saveViaGitHubAPI(history);
                    saveMethod = 'github_api';
                } else {
                    // Без токена - просто возвращаем обновленные данные
                    saveMethod = 'waiting_commit';
                }
            } catch (error) {
                console.warn('⚠️ GitHub save failed:', error.message);
                saveMethod = 'save_failed';
            }

            console.log(`💾 ${isOffline ? 'OFFLINE ' : ''}Запись сохранена (${saveMethod}):`, {
                time: newEntry.time_label,
                hashrate: newEntry.total_hashrate,
                miners: newEntry.total_miners,
                entries: history.farm_history.length
            });

            return history;

        } catch (error) {
            console.error('❌ Ошибка сохранения истории:', error);
            return this.getDefaultHistory();
        }
    }

    // Проверка, нужно ли сохранять данные
    shouldSaveData(currentTimestamp) {
        if (!this.lastSaveTimestamp) {
            return true; // Первое сохранение
        }

        const now = Date.now();
        const timeSinceLastSave = now - this.lastSaveTimestamp;

        // Сохраняем если прошло более 25 минут (даем запас в 5 минут)
        if (timeSinceLastSave >= (25 * 60 * 1000)) {
            return true;
        }

        // Также проверяем по получасовым интервалам
        const lastSaveDate = new Date(this.lastSaveTimestamp);
        const currentDate = new Date(currentTimestamp);

        // Если сменился получасовой интервал (с 00 на 30 или наоборот)
        const lastInterval = lastSaveDate.getMinutes() < 30 ? 0 : 30;
        const currentInterval = currentDate.getMinutes() < 30 ? 0 : 30;

        if (lastInterval !== currentInterval) {
            return true;
        }

        return false;
    }

    // Сохранение через GitHub API
    async saveViaGitHubAPI(historyData) {
        if (!this.githubToken) {
            throw new Error('GitHub token not configured');
        }

        try {
            // Получаем текущий SHA файла
            const fileInfo = await this.getFileSHA();

            const content = JSON.stringify(historyData, null, 2);
            const contentEncoded = btoa(unescape(encodeURIComponent(content)));

            const response = await fetch(
                `${this.apiBase}/${this.githubRepo}/contents/data/${this.historyFile}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        message: `🤖 Auto-update farm history: ${new Date().toLocaleString('ru-RU')}`,
                        content: contentEncoded,
                        sha: fileInfo.sha,
                        branch: this.githubBranch,
                        committer: {
                            name: 'Mining Monitor Bot',
                            email: 'bot@mining-monitor.com'
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`GitHub API error ${response.status}: ${errorData.message || response.statusText}`);
            }

            console.log('✅ История сохранена в GitHub через API');
            return true;
        } catch (error) {
            console.error('❌ GitHub API error:', error.message);
            throw error;
        }
    }

    // Загрузка истории из GitHub
    async loadFromGitHub() {
        try {
            const url = `https://raw.githubusercontent.com/${this.githubRepo}/${this.githubBranch}/data/${this.historyFile}?t=${Date.now()}`;
            const response = await fetch(url);

            if (!response.ok) {
                // Если файла нет, создаем дефолтную историю
                if (response.status === 404) {
                    console.log('📁 Файл истории не найден, создаем локально...');
                    return this.getDefaultHistory();
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const history = await response.json();
            return history;
        } catch (error) {
            throw new Error(`Не удалось загрузить историю: ${error.message}`);
        }
    }

    // Получение данных за последние N часов
    async getLastNHours(hours = 24) {
        try {
            const history = await this.loadFromGitHub();
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

    // Получение статистики истории
    async getHistoryStats() {
        try {
            const history = await this.loadFromGitHub();
            const totalEntries = history.farm_history?.length || 0;
            const offlineEntries = history.farm_history?.filter(entry => entry.is_offline).length || 0;

            const githubStatus = await this.checkGitHubAccess();

            return {
                total_entries: totalEntries,
                offline_entries: offlineEntries,
                online_entries: totalEntries - offlineEntries,
                last_update: history.last_update,
                github_status: githubStatus,
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
                github_status: { available: false, authenticated: false },
                date_range: null,
                source: 'error'
            };
        }
    }

    // Проверка доступа к GitHub
    async checkGitHubAccess() {
        try {
            const response = await fetch(`${this.apiBase}/${this.githubRepo}`, {
                headers: this.githubToken ? {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                } : {}
            });

            const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
            const isAuthenticated = this.githubToken && response.ok;

            return {
                available: response.ok,
                authenticated: isAuthenticated,
                rateLimit: rateLimitRemaining,
                status: response.status
            };
        } catch (error) {
            return {
                available: false,
                authenticated: false,
                reason: error.message
            };
        }
    }

    // Получение SHA файла
    async getFileSHA() {
        try {
            const response = await fetch(
                `${this.apiBase}/${this.githubRepo}/contents/data/${this.historyFile}`,
                {
                    headers: this.githubToken ? {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    } : {}
                }
            );

            if (response.ok) {
                const data = await response.json();
                return { sha: data.sha, exists: true };
            } else if (response.status === 404) {
                return { sha: null, exists: false };
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ Cannot get file SHA:', error.message);
            return { sha: null, exists: false };
        }
    }

    // Очистка истории
    async clearHistory() {
        try {
            const emptyHistory = this.getDefaultHistory();

            if (this.githubToken) {
                await this.saveViaGitHubAPI(emptyHistory);
            }

            this.lastSaveTimestamp = null;
            console.log('🗑️ History cleared');
            return emptyHistory;
        } catch (error) {
            console.error('❌ Ошибка очистки истории:', error);
            return this.getDefaultHistory();
        }
    }

    // Экспорт истории
    async exportHistory() {
        try {
            const history = await this.loadFromGitHub();
            const dataStr = JSON.stringify(history, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `farm_history_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            console.log('📥 История экспортирована');
        } catch (error) {
            console.error('❌ Ошибка экспорта:', error);
        }
    }

    // ДОБАВЛЕННЫЙ МЕТОД - экспорт локальной очереди (для совместимости)
    async exportLocalQueue() {
        console.log('📤 Экспорт локальной очереди...');
        // В данной реализации нет локальной очереди, так как используется GitHub
        // Этот метод добавлен для совместимости с Dashboard.js
        await this.exportHistory();
    }

    // Получение дефолтной истории
    getDefaultHistory() {
        return {
            farm_history: [],
            last_update: new Date().toISOString(),
            total_entries: 0,
            version: '1.0'
        };
    }
}

const historyManager = new HistoryManager();
export default historyManager;