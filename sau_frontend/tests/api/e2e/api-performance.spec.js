const { test, expect, beforeAll, afterAll, describe } = require('@playwright/test');
const SAUAPIClient = require('../utils/api-client');
const TestHelpers = require('../utils/test-helpers');
const { testUsers, testAccounts, performanceConfig } = require('../fixtures/test-data');

describe('API性能测试', () => {
  let apiClient;

  beforeAll(async () => {
    apiClient = new SAUAPIClient();

    // 获取认证token
    try {
      const loginResponse = await apiClient.auth.login(
        testUsers.validUser.username,
        testUsers.validUser.password
      );
      apiClient.setAuthToken(loginResponse.data.token);
    } catch (error) {
      console.log('使用模拟认证token');
      apiClient.setAuthToken('mock_test_token');
    }
  });

  describe('响应时间测试', () => {
    test('账号API响应时间', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.accounts.getValidAccounts()
      );

      TestHelpers.validateSuccessResponse(result);
      TestHelpers.validateResponseTime(responseTime, performanceConfig.responseTime.normal);

      console.log(`账号API响应时间: ${responseTime}ms`);
    });

    test('文件API响应时间', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.files.getFiles()
      );

      TestHelpers.validateSuccessResponse(result);
      TestHelpers.validateResponseTime(responseTime, performanceConfig.responseTime.normal);

      console.log(`文件API响应时间: ${responseTime}ms`);
    });

    test('系统监控API响应时间', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.monitoring.getSystemStatus()
      );

      TestHelpers.validateSuccessResponse(result);
      TestHelpers.validateResponseTime(responseTime, performanceConfig.responseTime.fast);

      console.log(`系统监控API响应时间: ${responseTime}ms`);
    });

    test('API统计响应时间', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.monitoring.getAPIStats()
      );

      TestHelpers.validateSuccessResponse(result);
      TestHelpers.validateResponseTime(responseTime, performanceConfig.responseTime.fast);

      console.log(`API统计响应时间: ${responseTime}ms`);
    });

    test('性能指标API响应时间', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.monitoring.getPerformanceMetrics()
      );

      TestHelpers.validateSuccessResponse(result);
      TestHelpers.validateResponseTime(responseTime, performanceConfig.responseTime.fast);

      console.log(`性能指标API响应时间: ${responseTime}ms`);
    });
  });

  describe('并发性能测试', () => {
    test('并发账号查询', async () => {
      const concurrentRequests = performanceConfig.concurrency.medium;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(apiClient.accounts.getValidAccounts());
      }

      const { result: results, responseTime } = await TestHelpers.measureResponseTime(() =>
        Promise.all(promises)
      );

      // 验证所有请求都成功
      results.forEach(result => {
        TestHelpers.validateSuccessResponse(result);
      });

      const avgResponseTime = responseTime / concurrentRequests;
      console.log(`并发 ${concurrentRequests} 个账号查询总耗时: ${responseTime}ms`);
      console.log(`平均每个请求耗时: ${avgResponseTime.toFixed(2)}ms`);

      // 验证并发性能
      expect(avgResponseTime).toBeLessThan(performanceConfig.responseTime.normal);
    });

    test('并发文件操作', async () => {
      const concurrentRequests = performanceConfig.concurrency.low;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(apiClient.files.getFiles());
      }

      const { result: results, responseTime } = await TestHelpers.measureResponseTime(() =>
        Promise.all(promises)
      );

      // 验证所有请求都成功
      results.forEach(result => {
        TestHelpers.validateSuccessResponse(result);
      });

      const avgResponseTime = responseTime / concurrentRequests;
      console.log(`并发 ${concurrentRequests} 个文件查询总耗时: ${responseTime}ms`);
      console.log(`平均每个请求耗时: ${avgResponseTime.toFixed(2)}ms`);

      expect(avgResponseTime).toBeLessThan(performanceConfig.responseTime.normal);
    });

    test('混合API并发调用', async () => {
      const concurrentRequests = performanceConfig.concurrency.low;
      const promises = [];

      const apiCalls = [
        () => apiClient.accounts.getValidAccounts(),
        () => apiClient.files.getFiles(),
        () => apiClient.monitoring.getSystemStatus(),
        () => apiClient.monitoring.getAPIStats(),
        () => apiClient.monitoring.getPerformanceMetrics()
      ];

      for (let i = 0; i < concurrentRequests; i++) {
        const randomApiCall = apiCalls[Math.floor(Math.random() * apiCalls.length)];
        promises.push(randomApiCall());
      }

      const { result: results, responseTime } = await TestHelpers.measureResponseTime(() =>
        Promise.all(promises)
      );

      // 验证所有请求都成功
      results.forEach(result => {
        TestHelpers.validateSuccessResponse(result);
      });

      const avgResponseTime = responseTime / concurrentRequests;
      console.log(`混合API并发 ${concurrentRequests} 个请求总耗时: ${responseTime}ms`);
      console.log(`平均每个请求耗时: ${avgResponseTime.toFixed(2)}ms`);

      expect(avgResponseTime).toBeLessThan(performanceConfig.responseTime.normal);
    });
  });

  describe('负载测试', () => {
    test('持续负载测试', async () => {
      const duration = 30000; // 30秒
      const requestInterval = 1000; // 每秒1个请求
      const startTime = Date.now();
      const results = [];

      const makeRequest = async () => {
        try {
          const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
            apiClient.accounts.getValidAccounts()
          );
          results.push({ success: true, responseTime, timestamp: Date.now() });
          return result;
        } catch (error) {
          results.push({ success: false, error: error.message, timestamp: Date.now() });
          throw error;
        }
      };

      // 持续发送请求
      while (Date.now() - startTime < duration) {
        await makeRequest();
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      // 分析结果
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const successRate = (successCount / results.length) * 100;

      const responseTimes = results.filter(r => r.success).map(r => r.responseTime);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`📊 持续负载测试结果 (${duration/1000}秒):`);
      console.log(`总请求数: ${results.length}`);
      console.log(`成功请求数: ${successCount}`);
      console.log(`失败请求数: ${failureCount}`);
      console.log(`成功率: ${successRate.toFixed(2)}%`);
      console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`最大响应时间: ${maxResponseTime}ms`);
      console.log(`最小响应时间: ${minResponseTime}ms`);

      // 验证性能指标
      expect(successRate).toBeGreaterThan(95); // 成功率大于95%
      expect(avgResponseTime).toBeLessThan(performanceConfig.responseTime.normal);
    });

    test('突发负载测试', async () => {
      const burstSize = performanceConfig.concurrency.high;
      const burstCount = 3;
      const results = [];

      for (let burst = 0; burst < burstCount; burst++) {
        console.log(`🔥 执行突发负载测试 ${burst + 1}/${burstCount}`);

        const promises = [];
        for (let i = 0; i < burstSize; i++) {
          promises.push(
            (async () => {
              try {
                const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
                  apiClient.monitoring.healthCheck()
                );
                results.push({ success: true, responseTime, burst: burst + 1 });
                return result;
              } catch (error) {
                results.push({ success: false, error: error.message, burst: burst + 1 });
                throw error;
              }
            })()
          );
        }

        await Promise.all(promises);

        // 突发间隔
        if (burst < burstCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // 分析结果
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const successRate = (successCount / results.length) * 100;

      const responseTimes = results.filter(r => r.success).map(r => r.responseTime);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

      console.log(`📊 突发负载测试结果:`);
      console.log(`突发次数: ${burstCount}`);
      console.log(`每次突发请求数: ${burstSize}`);
      console.log(`总请求数: ${results.length}`);
      console.log(`成功率: ${successRate.toFixed(2)}%`);
      console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);

      // 按突发分组统计
      for (let i = 1; i <= burstCount; i++) {
        const burstResults = results.filter(r => r.burst === i);
        const burstSuccessCount = burstResults.filter(r => r.success).length;
        const burstSuccessRate = (burstSuccessCount / burstResults.length) * 100;
        console.log(`突发 ${i} 成功率: ${burstSuccessRate.toFixed(2)}%`);
      }

      expect(successRate).toBeGreaterThan(90); // 突发负载成功率大于90%
      expect(avgResponseTime).toBeLessThan(performanceConfig.responseTime.slow);
    });
  });

  describe('资源使用测试', () => {
    test('内存使用监控', async () => {
      const initialMemory = process.memoryUsage();
      console.log(`初始内存使用: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);

      // 执行大量API调用
      const apiCalls = 50;
      for (let i = 0; i < apiCalls; i++) {
        await apiClient.accounts.getValidAccounts();
        await apiClient.monitoring.getSystemStatus();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`最终内存使用: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
      console.log(`内存增长: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      console.log(`平均每次调用内存增长: ${Math.round(memoryIncrease / apiCalls / 1024)}KB`);

      // 验证内存增长在合理范围内
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 内存增长小于50MB
    });

    test('连接池测试', async () => {
      const connectionCount = 20;
      const promises = [];

      for (let i = 0; i < connectionCount; i++) {
        promises.push(
          (async () => {
            const client = new SAUAPIClient();
            try {
              const loginResponse = await client.auth.login(
                testUsers.validUser.username,
                testUsers.validUser.password
              );
              client.setAuthToken(loginResponse.data.token);

              const response = await client.accounts.getValidAccounts();
              return { success: true, response };
            } catch (error) {
              return { success: false, error: error.message };
            }
          })()
        );
      }

      const { result: results, responseTime } = await TestHelpers.measureResponseTime(() =>
        Promise.all(promises)
      );

      const successCount = results.filter(r => r.success).length;
      const successRate = (successCount / results.length) * 100;

      console.log(`连接池测试结果:`);
      console.log(`并发连接数: ${connectionCount}`);
      console.log(`成功率: ${successRate.toFixed(2)}%`);
      console.log(`总耗时: ${responseTime}ms`);

      expect(successRate).toBeGreaterThan(80); // 连接池测试成功率大于80%
    });
  });

  describe('错误处理性能测试', () => {
    test('错误响应时间测试', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.accounts.getAccountDetail('non_existent_id')
      );

      TestHelpers.validateErrorResponse(result, 404);
      console.log(`错误响应时间: ${responseTime}ms`);

      // 错误响应也应该快速返回
      expect(responseTime).toBeLessThan(performanceConfig.responseTime.fast);
    });

    test('超时处理测试', async () => {
      // 创建一个超时的客户端
      const timeoutClient = new SAUAPIClient(null, 1); // 1ms超时

      const startTime = Date.now();
      try {
        await timeoutClient.accounts.getValidAccounts();
        fail('应该抛出超时错误');
      } catch (error) {
        const timeoutTime = Date.now() - startTime;
        console.log(`超时处理时间: ${timeoutTime}ms`);

        // 超时应该在合理时间内处理
        expect(timeoutTime).toBeLessThan(5000); // 5秒内应该处理超时
      }
    });
  });
});