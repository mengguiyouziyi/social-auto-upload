const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 测试辅助工具类
 */
class TestHelpers {
  /**
   * 生成随机字符串
   */
  static generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成随机邮箱
   */
  static generateRandomEmail() {
    return `test_${this.generateRandomString()}@example.com`;
  }

  /**
   * 生成随机用户名
   */
  static generateRandomUsername() {
    return `user_${this.generateRandomString()}`;
  }

  /**
   * 生成随机手机号
   */
  static generateRandomPhone() {
    return '1' + Math.floor(Math.random() * 9 + 1) +
           Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  }

  /**
   * 创建测试文件
   */
  static createTestFile(filename = null, content = null, mimeType = 'text/plain') {
    const name = filename || `test_${Date.now()}_${this.generateRandomString(5)}.txt`;
    const fileContent = content || `Test file content - ${new Date().toISOString()}`;

    const filePath = path.join(__dirname, '../fixtures', name);

    // 确保fixtures目录存在
    const fixturesDir = path.dirname(filePath);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    fs.writeFileSync(filePath, fileContent);

    return {
      path: filePath,
      name: name,
      content: fileContent,
      mimeType: mimeType,
      size: Buffer.byteLength(fileContent, 'utf8')
    };
  }

  /**
   * 创建测试图片文件
   */
  static createTestImageFile(filename = null) {
    const name = filename || `test_image_${Date.now()}.png`;
    const filePath = path.join(__dirname, '../fixtures', name);

    // 确保fixtures目录存在
    const fixturesDir = path.dirname(filePath);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // 创建一个简单的1x1像素PNG文件
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);

    fs.writeFileSync(filePath, pngBuffer);

    return {
      path: filePath,
      name: name,
      content: pngBuffer,
      mimeType: 'image/png',
      size: pngBuffer.length
    };
  }

  /**
   * 清理测试文件
   */
  static cleanupTestFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`清理测试文件失败: ${filePath}`, error.message);
    }
  }

  /**
   * 清理fixtures目录
   */
  static cleanupFixtures() {
    const fixturesDir = path.join(__dirname, '../fixtures');
    try {
      if (fs.existsSync(fixturesDir)) {
        const files = fs.readdirSync(fixturesDir);
        for (const file of files) {
          fs.unlinkSync(path.join(fixturesDir, file));
        }
      }
    } catch (error) {
      console.warn('清理fixtures目录失败:', error.message);
    }
  }

  /**
   * 生成延迟
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重试函数
   */
  static async retry(fn, maxRetries = 3, delayMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.delay(delayMs * (i + 1));
      }
    }
  }

  /**
   * 验证响应格式
   */
  static validateResponse(response, expectedFields = []) {
    expect(response).toBeDefined();
    expect(response.status).toBeDefined();
    expect(response.data).toBeDefined();

    if (expectedFields.length > 0) {
      expectedFields.forEach(field => {
        expect(response.data).toHaveProperty(field);
      });
    }

    return response;
  }

  /**
   * 验证成功响应
   */
  static validateSuccessResponse(response) {
    this.validateResponse(response);
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  }

  /**
   * 验证错误响应
   */
  static validateErrorResponse(response, expectedStatus = null) {
    this.validateResponse(response);
    expect(response.status).toBeGreaterThanOrEqual(400);

    if (expectedStatus) {
      expect(response.status).toBe(expectedStatus);
    }
  }

  /**
   * 生成测试账号数据
   */
  static generateTestAccountData(overrides = {}) {
    return {
      username: this.generateRandomUsername(),
      email: this.generateRandomEmail(),
      phone: this.generateRandomPhone(),
      platform: 'test_platform',
      status: 'active',
      ...overrides
    };
  }

  /**
   * 生成测试发布数据
   */
  static generateTestPublishData(overrides = {}) {
    return {
      title: `测试标题_${this.generateRandomString()}`,
      description: `测试描述_${this.generateRandomString(20)}`,
      tags: ['测试', 'API', '自动化'],
      visibility: 'public',
      ...overrides
    };
  }

  /**
   * 生成测试API数据
   */
  static generateTestAPIData(overrides = {}) {
    return {
      name: `测试API_${this.generateRandomString()}`,
      provider: '测试提供商',
      endpoint: 'https://api.example.com',
      authType: 'apikey',
      description: '这是一个测试API',
      type: 'ai',
      ...overrides
    };
  }

  /**
   * 比较对象（忽略时间戳等动态字段）
   */
  static deepEqualIgnoreDynamicFields(obj1, obj2, ignoreFields = ['id', 'createdAt', 'updatedAt', 'timestamp']) {
    const normalize = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const result = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        if (!ignoreFields.includes(key)) {
          result[key] = normalize(obj[key]);
        }
      }
      return result;
    };

    expect(normalize(obj1)).toEqual(normalize(obj2));
  }

  /**
   * 计算响应时间
   */
  static async measureResponseTime(fn) {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    return {
      result,
      responseTime: end - start
    };
  }

  /**
   * 验证响应时间
   */
  static validateResponseTime(responseTime, maxTime = 5000) {
    expect(responseTime).toBeLessThan(maxTime);
    console.log(`⏱️ 响应时间: ${responseTime}ms`);
  }

  /**
   * 生成唯一ID
   */
  static generateUniqueId() {
    return crypto.randomUUID ? crypto.randomUUID() : this.generateRandomString(16);
  }

  /**
   * 格式化日期
   */
  static formatDate(date = new Date()) {
    return date.toISOString();
  }

  /**
   * 获取当前时间戳
   */
  static getTimestamp() {
    return Date.now();
  }

  /**
   * 日志记录
   */
  static log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * 创建测试进度回调
   */
  static createProgressCallback() {
    const progressEvents = [];

    return {
      callback: (progressEvent) => {
        progressEvents.push({
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
        });
      },
      getEvents: () => progressEvents,
      clearEvents: () => progressEvents.length = 0
    };
  }
}

module.exports = TestHelpers;