const { test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const SAUAPIClient = require('../utils/api-client');
const TestHelpers = require('../utils/test-helpers');
const { testUsers, testAccounts, errorMessages } = require('../fixtures/test-data');

describe('账号管理API集成测试', () => {
  let apiClient;
  let authToken;

  beforeAll(async () => {
    apiClient = new SAUAPIClient();

    // 获取认证token
    try {
      const loginResponse = await apiClient.auth.login(
        testUsers.validUser.username,
        testUsers.validUser.password
      );
      authToken = loginResponse.data.token;
      apiClient.setAuthToken(authToken);
    } catch (error) {
      console.log('使用模拟认证token');
      authToken = 'mock_test_token';
      apiClient.setAuthToken(authToken);
    }
  });

  describe('获取有效账号列表', () => {
    test('正常获取账号列表', async () => {
      const response = await apiClient.accounts.getValidAccounts();

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toBeInstanceOf(Array);

      // 验证账号数据结构
      if (response.data.length > 0) {
        const account = response.data[0];
        expect(account).toHaveProperty('id');
        expect(account).toHaveProperty('platform');
        expect(account).toHaveProperty('username');
        expect(account).toHaveProperty('status');
      }

      console.log(`📊 获取到 ${response.data.length} 个有效账号`);
    });

    test('获取账号列表响应时间测试', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.accounts.getValidAccounts()
      );

      TestHelpers.validateSuccessResponse(result);
      TestHelpers.validateResponseTime(responseTime, 2000); // 2秒内完成
    });

    test('分页获取账号列表', async () => {
      // 这里假设API支持分页参数
      const response = await apiClient.client.get('/api/getValidAccounts', {
        params: { page: 1, limit: 5 }
      });

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('添加账号功能', () => {
    test('正常添加账号', async () => {
      const newAccount = testAccounts.generateAccount('test_platform');

      const response = await apiClient.accounts.addAccount(newAccount);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toHaveProperty('id');
      expect(response.data.platform).toBe(newAccount.platform);
      expect(response.data.username).toBe(newAccount.username);

      // 添加到清理列表
      global.addTestResource({
        type: 'account',
        id: response.data.id
      });

      console.log(`✅ 添加账号成功: ${response.data.id}`);
    });

    test('添加微信账号', async () => {
      const wechatAccount = testAccounts.wechatAccount;

      const response = await apiClient.accounts.addAccount(wechatAccount);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data.platform).toBe('wechat');
      expect(response.data.status).toBe('active');

      // 添加到清理列表
      global.addTestResource({
        type: 'account',
        id: response.data.id
      });
    });

    test('添加抖音账号', async () => {
      const douyinAccount = testAccounts.douyinAccount;

      const response = await apiClient.accounts.addAccount(douyinAccount);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data.platform).toBe('douyin');
      expect(response.data.status).toBe('active');

      // 添加到清理列表
      global.addTestResource({
        type: 'account',
        id: response.data.id
      });
    });

    test('重复账号名添加', async () => {
      const accountData = testAccounts.generateAccount('duplicate_test');

      // 第一次添加
      const firstResponse = await apiClient.accounts.addAccount(accountData);
      TestHelpers.validateSuccessResponse(firstResponse);

      // 第二次添加相同账号
      const secondResponse = await apiClient.accounts.addAccount(accountData);
      TestHelpers.validateErrorResponse(secondResponse, 409); // 409 Conflict

      // 清理
      global.addTestResource({
        type: 'account',
        id: firstResponse.data.id
      });
    });

    test('缺少必要字段添加账号', async () => {
      const incompleteAccount = {
        platform: 'test_platform',
        // 缺少username等必要字段
      };

      const response = await apiClient.accounts.addAccount(incompleteAccount);
      TestHelpers.validateErrorResponse(response, 400);
    });

    test('无效平台类型添加账号', async () => {
      const invalidAccount = testAccounts.generateAccount('invalid_platform_123');

      const response = await apiClient.accounts.addAccount(invalidAccount);
      // 可能成功也可能失败，取决于后端验证
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);

      if (response.status >= 200 && response.status < 300) {
        // 添加到清理列表
        global.addTestResource({
          type: 'account',
          id: response.data.id
        });
      }
    });
  });

  describe('更新账号功能', () => {
    let testAccountId;

    beforeEach(async () => {
      // 创建测试账号
      const newAccount = testAccounts.generateAccount('update_test');
      const response = await apiClient.accounts.addAccount(newAccount);
      testAccountId = response.data.id;

      global.addTestResource({
        type: 'account',
        id: testAccountId
      });
    });

    test('正常更新账号信息', async () => {
      const updateData = {
        nickname: '更新后的昵称',
        status: 'inactive'
      };

      const response = await apiClient.accounts.updateAccount(testAccountId, updateData);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data.nickname).toBe(updateData.nickname);
      expect(response.data.status).toBe(updateData.status);
    });

    test('更新不存在的账号', async () => {
      const updateData = { nickname: '测试更新' };
      const nonExistentId = 'non_existent_id';

      const response = await apiClient.accounts.updateAccount(nonExistentId, updateData);
      TestHelpers.validateErrorResponse(response, 404);
    });

    test('部分更新账号信息', async () => {
      const updateData = { nickname: '只更新昵称' };

      const response = await apiClient.accounts.updateAccount(testAccountId, updateData);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data.nickname).toBe(updateData.nickname);
    });

    test('更新账号状态', async () => {
      const updateData = { status: 'active' };

      const response = await apiClient.accounts.updateAccount(testAccountId, updateData);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data.status).toBe(updateData.status);
    });
  });

  describe('删除账号功能', () => {
    let testAccountId;

    beforeEach(async () => {
      // 创建测试账号
      const newAccount = testAccounts.generateAccount('delete_test');
      const response = await apiClient.accounts.addAccount(newAccount);
      testAccountId = response.data.id;
    });

    test('正常删除账号', async () => {
      const response = await apiClient.accounts.deleteAccount(testAccountId);

      TestHelpers.validateSuccessResponse(response);

      // 验证账号已被删除
      try {
        await apiClient.accounts.getAccountDetail(testAccountId);
        fail('应该抛出404错误');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    test('删除不存在的账号', async () => {
      const nonExistentId = 'non_existent_id';

      const response = await apiClient.accounts.deleteAccount(nonExistentId);
      TestHelpers.validateErrorResponse(response, 404);
    });

    test('重复删除账号', async () => {
      // 第一次删除
      await apiClient.accounts.deleteAccount(testAccountId);

      // 第二次删除
      const response = await apiClient.accounts.deleteAccount(testAccountId);
      TestHelpers.validateErrorResponse(response, 404);
    });
  });

  describe('获取账号详情', () => {
    let testAccountId;

    beforeEach(async () => {
      // 创建测试账号
      const newAccount = testAccounts.generateAccount('detail_test');
      const response = await apiClient.accounts.addAccount(newAccount);
      testAccountId = response.data.id;

      global.addTestResource({
        type: 'account',
        id: testAccountId
      });
    });

    test('正常获取账号详情', async () => {
      const response = await apiClient.accounts.getAccountDetail(testAccountId);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toHaveProperty('id', testAccountId);
      expect(response.data).toHaveProperty('platform');
      expect(response.data).toHaveProperty('username');
      expect(response.data).toHaveProperty('nickname');
      expect(response.data).toHaveProperty('status');
    });

    test('获取不存在账号详情', async () => {
      const nonExistentId = 'non_existent_id';

      const response = await apiClient.accounts.getAccountDetail(nonExistentId);
      TestHelpers.validateErrorResponse(response, 404);
    });
  });

  describe('性能测试', () => {
    test('批量账号操作性能', async () => {
      const accountCount = 5;
      const createdAccounts = [];

      // 创建多个账号
      const createPromises = [];
      for (let i = 0; i < accountCount; i++) {
        const account = testAccounts.generateAccount(`perf_test_${i}`);
        createPromises.push(apiClient.accounts.addAccount(account));
      }

      const { result: createResults, responseTime: createTime } = await TestHelpers.measureResponseTime(() =>
        Promise.all(createPromises)
      );

      // 验证创建结果
      createResults.forEach(result => {
        TestHelpers.validateSuccessResponse(result);
        createdAccounts.push(result.data.id);
        global.addTestResource({
          type: 'account',
          id: result.data.id
        });
      });

      TestHelpers.validateResponseTime(createTime, 10000); // 10秒内完成

      // 获取账号列表
      const { result: listResult, responseTime: listTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.accounts.getValidAccounts()
      );

      TestHelpers.validateSuccessResponse(listResult);
      TestHelpers.validateResponseTime(listTime, 2000); // 2秒内完成

      console.log(`📊 批量创建 ${accountCount} 个账号耗时: ${createTime}ms`);
      console.log(`📊 获取账号列表耗时: ${listTime}ms`);
    });

    test('并发账号操作测试', async () => {
      const concurrentRequests = 3;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const account = testAccounts.generateAccount(`concurrent_test_${i}`);
        promises.push(apiClient.accounts.addAccount(account));
      }

      const results = await Promise.all(promises);

      // 验证所有请求都成功
      results.forEach((result, index) => {
        TestHelpers.validateSuccessResponse(result);
        global.addTestResource({
          type: 'account',
          id: result.data.id
        });
      });
    });
  });

  describe('安全性测试', () => {
    test('未授权访问账号管理', async () => {
      // 清除认证token
      apiClient.clearAuthToken();

      const response = await apiClient.accounts.getValidAccounts();
      TestHelpers.validateErrorResponse(response, 401);
    });

    test('跨用户账号访问测试', async () => {
      // 这里假设有不同的用户权限
      // 测试当前用户只能访问自己的账号
      const response = await apiClient.accounts.getValidAccounts();
      TestHelpers.validateSuccessResponse(response);

      // 验证返回的账号都属于当前用户
      response.data.forEach(account => {
        expect(account).toHaveProperty('user_id');
        // 这里应该验证user_id匹配当前用户，但需要根据实际API设计调整
      });
    });
  });

  describe('边界情况测试', () => {
    test('超长账号信息', async () => {
      const longAccount = testAccounts.generateAccount('boundary_test');
      longAccount.nickname = 'a'.repeat(1000);
      longAccount.description = 'a'.repeat(5000);

      const response = await apiClient.accounts.addAccount(longAccount);

      if (response.status >= 200 && response.status < 300) {
        // 如果成功，添加到清理列表
        global.addTestResource({
          type: 'account',
          id: response.data.id
        });
      } else {
        // 如果失败，应该是验证错误
        TestHelpers.validateErrorResponse(response, 400);
      }
    });

    test('特殊字符账号信息', async () => {
      const specialAccount = testAccounts.generateAccount('special_test');
      specialAccount.nickname = '特殊昵称!@#$%^&*()';
      specialAccount.description = '特殊描述<script>alert("xss")</script>';

      const response = await apiClient.accounts.addAccount(specialAccount);

      if (response.status >= 200 && response.status < 300) {
        // 如果成功，验证特殊字符被正确处理
        expect(response.data.nickname).toBe(specialAccount.nickname);
        global.addTestResource({
          type: 'account',
          id: response.data.id
        });
      }
    });
  });
});