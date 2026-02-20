// src/utils/auth.js
class AuthManager {
    constructor() {
        this.configUrl = 'https://raw.githubusercontent.com/denpistsoff/mining-monitor-web/main/data/frontend_config.json';
        this.config = null;
        this.currentUser = null;
    }

    async loadConfig() {
        try {
            const response = await fetch(this.configUrl + '?t=' + Date.now());
            if (!response.ok) {
                throw new Error('Failed to load config');
            }
            this.config = await response.json();
            console.log('✅ Auth config loaded:', this.config);
            return this.config;
        } catch (error) {
            console.error('❌ Error loading auth config:', error);
            return null;
        }
    }

    async login(username, password) {
        // Загружаем конфиг если еще не загружен
        if (!this.config) {
            await this.loadConfig();
        }

        if (!this.config || !this.config.users) {
            console.error('❌ No config loaded');
            return { success: false, error: 'Ошибка загрузки конфигурации' };
        }

        // Ищем пользователя
        const user = this.config.users.find(u => u.username === username);

        if (!user) {
            return { success: false, error: 'Пользователь не найден' };
        }

        // Проверяем пароль (временный или постоянный)
        // В реальном приложении нужно использовать bcrypt или аналоги
        const isValidPassword = this.verifyPassword(password, user);

        if (!isValidPassword) {
            return { success: false, error: 'Неверный пароль' };
        }

        // Получаем доступные фермы
        const assignedFarms = this.config.user_farm_assignments[user.id] || [];

        // Сохраняем пользователя
        this.currentUser = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            farms: assignedFarms
        };

        // Сохраняем в localStorage для автоматического входа
        localStorage.setItem('miningAuth', JSON.stringify({
            user: this.currentUser,
            timestamp: Date.now()
        }));

        // Если это первый вход с временным паролем, возвращаем предупреждение
        const isTemporaryPassword = user.default_password && user.default_password === password;

        return {
            success: true,
            user: this.currentUser,
            isTemporary: isTemporaryPassword,
            message: isTemporaryPassword ? 'Используется временный пароль. Рекомендуется сменить его в настройках.' : null
        };
    }

    verifyPassword(password, user) {
        // Проверка временного пароля
        if (user.default_password && user.default_password === password) {
            return true;
        }

        // В реальном приложении здесь должна быть проверка хеша
        // Пока для простоты используем прямую проверку
        // ВНИМАНИЕ: в продакшене нужно использовать bcrypt!
        return password === `miner_${user.id}` || password === 'admin123';
    }

    async checkAuth() {
        const savedAuth = localStorage.getItem('miningAuth');
        if (!savedAuth) {
            return null;
        }

        try {
            const authData = JSON.parse(savedAuth);

            // Проверяем, не устарели ли данные (7 дней)
            if (Date.now() - authData.timestamp > 7 * 24 * 60 * 60 * 1000) {
                localStorage.removeItem('miningAuth');
                return null;
            }

            this.currentUser = authData.user;
            return this.currentUser;
        } catch (e) {
            localStorage.removeItem('miningAuth');
            return null;
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('miningAuth');
    }

    getUser() {
        return this.currentUser;
    }

    hasFarmAccess(farmId) {
        if (!this.currentUser) return false;
        return this.currentUser.farms.includes(farmId);
    }

    isAdmin() {
        return this.currentUser?.role === 'admin';
    }

    isTechnician() {
        return this.currentUser?.role === 'technician' || this.isAdmin();
    }
}

const authManager = new AuthManager();
export default authManager;