const { test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const SAUAPIClient = require('../utils/api-client');
const TestHelpers = require('../utils/test-helpers');
const { testUsers, errorMessages } = require('../fixtures/test-data');

describe('认证API集成测试', () => {
  let apiClient;

  beforeAll(() => {
    apiClient = new SAUAPIClient();
  });

  beforeEach(() => {
    // 清理认证状态
    apiClient.clearAuthToken();
  });

  afterEach(() => {
    // 测试后清理
    apiClient.clearAuthToken();
  });

  describe('用户登录功能', () => {
    test('正常登录流程', async () => {
      const response = await apiClient.auth.login(
        testUsers.validUser.username,
        testUsers.validUser.password
      );

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user).toHaveProperty('username', testUsers.validUser.username);
    });

    test('错误密码登录', async () => {
      const response = await apiClient.auth.login(
        testUsers.validUser.username,
        'wrong_password'
      );

      TestHelpers.validateErrorResponse(response, 401);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toContain(errorMessages.auth.invalidCredentials);
    });

    test('不存在的用户登录', async () => {
      const response = await apiClient.auth.login(
        'nonexistent_user',
        'some_password'
      );

      TestHelpers.validateErrorResponse(response, 401);
    });

    test('空用户名登录', async () => {
      const response = await apiClient.auth.login('', 'some_password');

      TestHelpers.validateErrorResponse(response, 400);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toContain(errorMessages.validation.requiredField);
    });

    test('空密码登录', async () => {
      const response = await apiClient.auth.login(testUsers.validUser.username, '');

      TestHelpers.validateErrorResponse(response, 400);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toContain(errorMessages.validation.requiredField);
    });
  });

  describe('用户登出功能', () => {
    test('正常登出流程', async () => {
      // 先登录
      const loginResponse = await apiClient.auth.login(
        testUsers.validUser.username,
        testUsers.validUser.password
      );
      const token = loginResponse.data.token;

      // 设置token
      apiClient.setAuthToken(token);

      // 执行登出
      const logoutResponse = await apiClient.auth.logout();
      TestHelpers.validateSuccessResponse(logoutResponse);

      // 验证token已失效
      try {
        await apiClient.auth.getUserInfo();
        fail('应该抛出认证错误');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('未登录状态登出', async () => {
      const response = await apiClient.auth.logout();
      TestHelpers.validateErrorResponse(response, 401);
    });
  });

  describe('获取用户信息', () => {
    test('正常获取用户信息', async () => {
      // 先登录
      const loginResponse = await apiClient.auth.login(
        testUsers.validUser.username,
        testUsers.validUser.password
      );
      const token = loginResponse.data.token;

      // 设置token
      apiClient.setAuthToken(token);

      // 获取用户信息
      const response = await apiClient.auth.getUserInfo();
      TestHelpers.validateSuccessResponse(response);

      expect(response.data).toHaveProperty('username', testUsers.validUser.username);
      expect(response.data).toHaveProperty('email');
      expect(response.data).toHaveProperty('phone');
    });

    test('未登录获取用户信息', async () => {
      const response = await apiClient.auth.getUserInfo();
      TestHelpers.validateErrorResponse(response, 401);
    });

    test('过期token获取用户信息', async () => {
      // 设置过期token
      apiClient.setAuthToken('expired_token');

      const response = await apiClient.auth.getUserInfo();
      TestHelpers.validateErrorResponse(response, 401);
      expect(response.data.message).toContain(errorMessages.auth.tokenExpired);
    });
  });

  describe('Token刷新功能', () => {
    test('正常刷新token', async () => {
      // 先登录
      const loginResponse = await apiClient.auth.login(
        testUsers.validUser.username,
        testUsers.validUser.password
      );
      const originalToken = loginResponse.data.token;

      // 设置token
      apiClient.setAuthToken(originalToken);

      // 刷新token
      const refreshResponse = await apiClient.auth.refreshToken();
      TestHelpers.validateSuccessResponse(refreshResponse);

      expect(refreshResponse.data).toHaveProperty('token');
      expect(refreshResponse.data.token).not.toBe(originalToken);
    });

    test('未登录刷新token', async () => {
      const response = await apiClient.auth.refreshToken();
      TestHelpers.validateErrorResponse(response, 401);
    });
  });

  describe('性能测试', () => {
    test('登录响应时间测试', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.auth.login(testUsers.validUser.username, testUsers.validUser.password)
      );

      TestHelpers.validateSuccessResponse(result);
      TestHelpers.validateResponseTime(responseTime, 3000); // 3秒内完成
    });

    test('并发登录测试', async () => {
      const concurrentRequests = 5;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          apiClient.auth.login(
            testUsers.validUser.username,
            testUsers.validUser.password
          )
        );
      }

      const results = await Promise.all(promises);

      // 验证所有请求都成功
      results.forEach(result => {
        TestHelpers.validateSuccessResponse(result);
      });
    });
  });

  describe('安全性测试', () => {
    test('SQL注入防护测试', async () => {
      const maliciousInput = "admin' OR '1'='1";
      const response = await apiClient.auth.login(maliciousInput, 'password');

      // 应该被当作普通用户名处理，不会导致SQL注入
      expect(response.status).not.toBe(500);
    });

    test('XSS防护测试', async () => {
      const maliciousInput = "<script>alert('xss')</script>";
      const response = await apiClient.auth.login(maliciousInput, 'password');

      // 应该被转义或拒绝
      expect(response.status).not.toBe(500);
      if (response.status === 200) {
        const data = JSON.stringify(response.data);
        expect(data).not.toContain('<script>');
      }
    });

    test('暴力破解防护测试', async () => {
      const maxAttempts = 10;
      let successCount = 0;

      for (let i = 0; i < maxAttempts; i++) {
        try {
          await apiClient.auth.login(testUsers.validUser.username, 'wrong_password');
          successCount++;
        } catch (error) {
          // 预期会有失败
        }
      }

      // 如果有IP限制，后面几次应该被阻止
      expect(successCount).toBeLessThan(maxAttempts);
    });
  });

  describe('边界情况测试', () => {
    test('超长用户名登录', async () => {
      const longUsername = 'a'.repeat(1000);
      const response = await apiClient.auth.login(longUsername, 'password');

      TestHelpers.validateErrorResponse(response, 400);
    });

    test('超长密码登录', async () => {
      const longPassword = 'a'.repeat(1000);
      const response = await apiClient.auth.login(testUsers.validUser.username, longPassword);

      TestHelpers.validateErrorResponse(response, 400);
    });

    test('特殊字符用户名登录', async () => {
      const specialUsername = 'test_user!@#$%^&*()';
      const response = await apiClient.auth.login(specialUsername, 'password');

      // 可能成功也可能失败，但不应该返回500错误
      expect(response.status).not.toBe(500);
    });
  });
});