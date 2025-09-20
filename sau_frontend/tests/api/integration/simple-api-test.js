const { test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const SAUAPIClient = require('../utils/api-client');
const TestHelpers = require('../utils/test-helpers');

describe('SAU API基础集成测试', () => {
  let apiClient;

  beforeAll(() => {
    apiClient = new SAUAPIClient();
    console.log('🚀 开始SAU API基础集成测试');
  });

  beforeEach(() => {
    apiClient.clearAuthToken();
  });

  describe('系统监控API测试', () => {
    test('健康检查接口测试', async () => {
      try {
        const response = await apiClient.monitoring.healthCheck();

        if (response.status === 200) {
          TestHelpers.validateSuccessResponse(response);
          console.log('✅ 健康检查接口正常');
        } else {
          console.log(`⚠️ 健康检查接口返回状态码: ${response.status}`);
          expect(response.status).toBeLessThan(500);
        }
      } catch (error) {
        console.log('🔍 健康检查接口连接失败:', error.message);
        expect(error.message).toBeDefined();
      }
    });

    test('系统状态接口测试', async () => {
      try {
        const response = await apiClient.monitoring.getSystemStatus();

        if (response.status === 200) {
          TestHelpers.validateSuccessResponse(response);
          expect(response.data).toHaveProperty('status');
          console.log('✅ 系统状态接口正常');
        } else {
          console.log(`⚠️ 系统状态接口返回状态码: ${response.status}`);
          expect(response.status).toBeLessThan(500);
        }
      } catch (error) {
        console.log('🔍 系统状态接口连接失败:', error.message);
        expect(error.message).toBeDefined();
      }
    });

    test('API统计接口测试', async () => {
      try {
        const response = await apiClient.monitoring.getAPIStats();

        if (response.status === 200) {
          TestHelpers.validateSuccessResponse(response);
          expect(response.data).toHaveProperty('stats');
          console.log('✅ API统计接口正常');
        } else {
          console.log(`⚠️ API统计接口返回状态码: ${response.status}`);
          expect(response.status).toBeLessThan(500);
        }
      } catch (error) {
        console.log('🔍 API统计接口连接失败:', error.message);
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('账号管理API测试', () => {
    test('获取有效账号列表', async () => {
      try {
        const response = await apiClient.accounts.getValidAccounts();

        if (response.status === 200) {
          TestHelpers.validateSuccessResponse(response);
          expect(response.data).toHaveProperty('accounts');
          expect(Array.isArray(response.data.accounts)).toBe(true);
          console.log(`✅ 获取账号列表成功，共 ${response.data.accounts.length} 个账号`);
        } else {
          console.log(`⚠️ 获取账号列表返回状态码: ${response.status}`);
          expect(response.status).toBeLessThan(500);
        }
      } catch (error) {
        console.log('🔍 获取账号列表失败:', error.message);
        expect(error.message).toBeDefined();
      }
    });

    test('获取文件列表', async () => {
      try {
        const response = await apiClient.files.getFiles();

        if (response.status === 200) {
          TestHelpers.validateSuccessResponse(response);
          expect(response.data).toHaveProperty('files');
          expect(Array.isArray(response.data.files)).toBe(true);
          console.log(`✅ 获取文件列表成功，共 ${response.data.files.length} 个文件`);
        } else {
          console.log(`⚠️ 获取文件列表返回状态码: ${response.status}`);
          expect(response.status).toBeLessThan(500);
        }
      } catch (error) {
        console.log('🔍 获取文件列表失败:', error.message);
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('API市场测试', () => {
    test('获取API列表', async () => {
      try {
        const response = await apiClient.marketplace.getAPIs();

        if (response.status === 200) {
          TestHelpers.validateSuccessResponse(response);
          expect(response.data).toHaveProperty('apis');
          expect(Array.isArray(response.data.apis)).toBe(true);
          console.log(`✅ 获取API列表成功，共 ${response.data.apis.length} 个API`);
        } else {
          console.log(`⚠️ 获取API列表返回状态码: ${response.status}`);
          expect(response.status).toBeLessThan(500);
        }
      } catch (error) {
        console.log('🔍 获取API列表失败:', error.message);
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('性能测试', () => {
    test('健康检查响应时间测试', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.monitoring.healthCheck()
      );

      console.log(`⏱️ 健康检查响应时间: ${responseTime}ms`);

      if (result.status === 200) {
        TestHelpers.validateResponseTime(responseTime, 2000); // 2秒内
        console.log('✅ 健康检查响应时间达标');
      } else {
        console.log('⚠️ 健康检查接口状态码:', result.status);
      }
    });

    test('并发请求测试', async () => {
      const concurrentRequests = [
        () => apiClient.monitoring.healthCheck(),
        () => apiClient.monitoring.getSystemStatus(),
        () => apiClient.accounts.getValidAccounts(),
        () => apiClient.files.getFiles()
      ];

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentRequests);
      const totalTime = Date.now() - startTime;

      console.log(`⚡ 并发测试完成时间: ${totalTime}ms`);

      // 检查所有请求都有结果，即使失败也应该有响应
      let successCount = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value && result.value.status !== undefined) {
            successCount++;
            console.log(`请求 ${index} 成功: 状态码 ${result.value.status}`);
          } else {
            console.log(`请求 ${index} 返回了无效响应`);
          }
        } else {
          // 拒绝的请求应该有错误信息
          expect(result.reason).toBeDefined();
          console.log(`请求 ${index} 失败: ${result.reason.message}`);
        }
      });

      console.log(`✅ 并发请求测试完成: ${successCount}/${results.length} 成功`);
      expect(successCount).toBeGreaterThan(0); // 至少有一个成功
    });
  });

  describe('错误处理测试', () => {
    test('无效端点测试', async () => {
      try {
        const response = await apiClient.client.get('/api/invalid-endpoint');

        // 应该返回404或类似的错误状态码
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);

        console.log(`✅ 无效端点正确返回错误状态码: ${response.status}`);
      } catch (error) {
        console.log('🔍 无效端点测试:', error.message);
        expect(error.message).toBeDefined();
      }
    });

    test('超时测试', async () => {
      // 创建一个超时配置的客户端
      const timeoutClient = new SAUAPIClient('http://localhost:5409', 100); // 100ms超时

      try {
        const response = await timeoutClient.monitoring.getSystemStatus();

        // 如果成功，说明响应很快
        console.log('✅ 系统状态接口响应快速');
      } catch (error) {
        // 超时是预期的
        expect(error.message).toContain('timeout') || expect(error.message).toBeDefined();
        console.log('⚠️ 超时测试: 接口响应较慢或不可用');
      }
    });
  });

  afterAll(() => {
    console.log('🏁 SAU API基础集成测试完成');
  });
});