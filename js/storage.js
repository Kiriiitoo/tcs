/**
 * 贪吃蛇大作战 - 数据存储工具
 * 使用 LocalStorage 进行数据持久化
 */

const StorageKeys = {
  USERS: 'snake_game_users',
  CURRENT_USER: 'snake_game_current_user',
  GAME_RECORDS: 'snake_game_records'
};

/**
 * 存储工具类
 */
const Storage = {
  /**
   * 获取所有用户
   * @returns {Array} 用户列表
   */
  getUsers() {
    const data = localStorage.getItem(StorageKeys.USERS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * 保存用户列表
   * @param {Array} users - 用户列表
   */
  saveUsers(users) {
    localStorage.setItem(StorageKeys.USERS, JSON.stringify(users));
  },

  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @returns {Object|null} 用户对象或 null
   */
  findUser(username) {
    const users = this.getUsers();
    return users.find(u => u.username === username) || null;
  },

  /**
   * 添加新用户
   * @param {Object} user - 用户对象
   * @returns {boolean} 是否成功
   */
  addUser(user) {
    if (this.findUser(user.username)) {
      return false; // 用户名已存在
    }
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
    return true;
  },

  /**
   * 更新用户信息
   * @param {string} username - 用户名
   * @param {Object} updates - 更新的字段
   */
  updateUser(username, updates) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.username === username);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      this.saveUsers(users);
    }
  },

  /**
   * 获取当前登录用户
   * @returns {Object|null} 当前用户或 null
   */
  getCurrentUser() {
    const data = sessionStorage.getItem(StorageKeys.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  /**
   * 设置当前登录用户
   * @param {Object} user - 用户对象
   */
  setCurrentUser(user) {
    sessionStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(user));
  },

  /**
   * 清除当前用户（登出）
   */
  clearCurrentUser() {
    sessionStorage.removeItem(StorageKeys.CURRENT_USER);
  },

  /**
   * 获取所有游戏记录
   * @returns {Array} 游戏记录列表
   */
  getGameRecords() {
    const data = localStorage.getItem(StorageKeys.GAME_RECORDS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * 保存游戏记录
   * @param {Object} record - 游戏记录
   */
  addGameRecord(record) {
    const records = this.getGameRecords();
    records.push(record);
    localStorage.setItem(StorageKeys.GAME_RECORDS, JSON.stringify(records));
  },

  /**
   * 获取用户的游戏记录
   * @param {string} username - 用户名
   * @returns {Array} 该用户的游戏记录
   */
  getUserRecords(username) {
    const records = this.getGameRecords();
    return records
      .filter(r => r.username === username)
      .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
  },

  /**
   * 获取排行榜（按最高分排序）
   * @param {number} limit - 返回数量限制
   * @returns {Array} 排行榜数据
   */
  getLeaderboard(limit = 10) {
    const records = this.getGameRecords();
    
    // 按用户分组，取每个用户的最高分
    const userBest = {};
    records.forEach(record => {
      if (!userBest[record.username] || record.score > userBest[record.username].score) {
        userBest[record.username] = record;
      }
    });

    // 转为数组并排序
    return Object.values(userBest)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  /**
   * 获取用户最高分
   * @param {string} username - 用户名
   * @returns {number} 最高分
   */
  getUserHighScore(username) {
    const records = this.getUserRecords(username);
    if (records.length === 0) return 0;
    return Math.max(...records.map(r => r.score));
  }
};

// 简单的密码哈希函数（仅用于演示，生产环境请使用更安全的方案）
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
