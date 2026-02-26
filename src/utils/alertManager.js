// src/utils/alertManager.js
class AlertManager {
    constructor() {
        this.readAlerts = new Map(); // farmName -> Set of read alert IDs
        this.dismissedAlerts = new Map(); // farmName -> Set of dismissed alert IDs
        this.loadFromStorage();
    }

    // Загружаем данные из localStorage
    loadFromStorage() {
        try {
            // Загружаем прочитанные
            const savedRead = localStorage.getItem('readAlerts');
            if (savedRead) {
                const parsed = JSON.parse(savedRead);
                Object.entries(parsed).forEach(([farmName, alertIds]) => {
                    this.readAlerts.set(farmName, new Set(alertIds));
                });
            }

            // Загружаем удаленные
            const savedDismissed = localStorage.getItem('dismissedAlerts');
            if (savedDismissed) {
                const parsed = JSON.parse(savedDismissed);
                Object.entries(parsed).forEach(([farmName, alertIds]) => {
                    this.dismissedAlerts.set(farmName, new Set(alertIds));
                });
            }

            console.log('📦 AlertManager загружен из localStorage');
        } catch (e) {
            console.error('❌ Ошибка загрузки AlertManager:', e);
        }
    }

    // Сохраняем в localStorage
    saveToStorage() {
        try {
            // Сохраняем прочитанные
            const readObj = {};
            this.readAlerts.forEach((alertSet, farmName) => {
                readObj[farmName] = Array.from(alertSet);
            });
            localStorage.setItem('readAlerts', JSON.stringify(readObj));

            // Сохраняем удаленные
            const dismissedObj = {};
            this.dismissedAlerts.forEach((alertSet, farmName) => {
                dismissedObj[farmName] = Array.from(alertSet);
            });
            localStorage.setItem('dismissedAlerts', JSON.stringify(dismissedObj));

            console.log('💾 AlertManager сохранен в localStorage');
        } catch (e) {
            console.error('❌ Ошибка сохранения AlertManager:', e);
        }
    }

    // Отметить уведомление как прочитанное
    markAsRead(farmName, alertId) {
        if (!this.readAlerts.has(farmName)) {
            this.readAlerts.set(farmName, new Set());
        }
        this.readAlerts.get(farmName).add(alertId);
        this.saveToStorage();
    }

    // Отметить несколько уведомлений как прочитанные
    markMultipleAsRead(farmName, alertIds) {
        if (!this.readAlerts.has(farmName)) {
            this.readAlerts.set(farmName, new Set());
        }
        const farmRead = this.readAlerts.get(farmName);
        alertIds.forEach(id => farmRead.add(id));
        this.saveToStorage();
    }

    // Отметить все как прочитанные
    markAllAsRead(farmName, allAlertIds) {
        this.readAlerts.set(farmName, new Set(allAlertIds));
        this.saveToStorage();
    }

    // Удалить уведомление (навсегда)
    dismissAlert(farmName, alertId) {
        if (!this.dismissedAlerts.has(farmName)) {
            this.dismissedAlerts.set(farmName, new Set());
        }
        this.dismissedAlerts.get(farmName).add(alertId);

        // Также убираем из прочитанных если было
        if (this.readAlerts.has(farmName)) {
            this.readAlerts.get(farmName).delete(alertId);
        }

        this.saveToStorage();
    }

    // Проверить, прочитано ли уведомление
    isRead(farmName, alertId) {
        return this.readAlerts.has(farmName) &&
            this.readAlerts.get(farmName).has(alertId);
    }

    // Проверить, удалено ли уведомление
    isDismissed(farmName, alertId) {
        return this.dismissedAlerts.has(farmName) &&
            this.dismissedAlerts.get(farmName).has(alertId);
    }

    // Получить количество непрочитанных уведомлений
    getUnreadCount(farmName, currentAlerts) {
        const readSet = this.readAlerts.get(farmName) || new Set();
        const dismissedSet = this.dismissedAlerts.get(farmName) || new Set();

        return currentAlerts.filter(alert =>
            !readSet.has(alert.id) && !dismissedSet.has(alert.id)
        ).length;
    }

    // Очистить историю для фермы
    clearHistory(farmName) {
        this.readAlerts.delete(farmName);
        this.dismissedAlerts.delete(farmName);
        this.saveToStorage();
    }

    // Получить все уведомления для фермы
    getFilteredAlerts(farmName, allAlerts) {
        const readSet = this.readAlerts.get(farmName) || new Set();
        const dismissedSet = this.dismissedAlerts.get(farmName) || new Set();

        return {
            unread: allAlerts.filter(alert =>
                !readSet.has(alert.id) && !dismissedSet.has(alert.id)
            ),
            read: allAlerts.filter(alert =>
                readSet.has(alert.id) && !dismissedSet.has(alert.id)
            ),
            dismissed: allAlerts.filter(alert =>
                dismissedSet.has(alert.id)
            )
        };
    }
}

const alertManager = new AlertManager();
export default alertManager;