/**
 * 贪吃蛇大作战 - 用户认证模块
 */

const Auth = {
    /**
     * 用户注册
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Object} 结果对象 { success: boolean, message: string }
     */
    register(username, password) {
        // 验证用户名
        if (!username || username.trim().length < 2) {
            return { success: false, message: '用户名至少需要2个字符' };
        }

        if (username.trim().length > 20) {
            return { success: false, message: '用户名不能超过20个字符' };
        }

        // 验证密码
        if (!password || password.length < 4) {
            return { success: false, message: '密码至少需要4个字符' };
        }

        // 检查用户名是否已存在
        if (Storage.findUser(username.trim())) {
            return { success: false, message: '用户名已被使用' };
        }

        // 创建用户
        const now = new Date().toISOString();
        const user = {
            username: username.trim(),
            password: simpleHash(password),
            createdAt: now,
            lastLoginAt: now
        };

        Storage.addUser(user);
        Storage.setCurrentUser({ username: user.username, lastLoginAt: now });

        return { success: true, message: '注册成功！' };
    },

    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Object} 结果对象 { success: boolean, message: string }
     */
    login(username, password) {
        if (!username || !password) {
            return { success: false, message: '请输入用户名和密码' };
        }

        const user = Storage.findUser(username.trim());

        if (!user) {
            return { success: false, message: '用户不存在' };
        }

        if (user.password !== simpleHash(password)) {
            return { success: false, message: '密码错误' };
        }

        // 更新登录时间
        const now = new Date().toISOString();
        Storage.updateUser(username, { lastLoginAt: now });
        Storage.setCurrentUser({ username: user.username, lastLoginAt: now });

        return { success: true, message: '登录成功！' };
    },

    /**
     * 用户登出
     */
    logout() {
        Storage.clearCurrentUser();
    },

    /**
     * 检查是否已登录
     * @returns {boolean}
     */
    isLoggedIn() {
        return Storage.getCurrentUser() !== null;
    },

    /**
     * 获取当前用户名
     * @returns {string|null}
     */
    getCurrentUsername() {
        const user = Storage.getCurrentUser();
        return user ? user.username : null;
    },

    /**
     * 需要登录才能访问的页面保护
     * 如果未登录，重定向到登录页
     */
    requireLogin() {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
};
