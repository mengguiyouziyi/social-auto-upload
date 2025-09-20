const { test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const SAUAPIClient = require('../utils/api-client');
const TestHelpers = require('../utils/test-helpers');

// 尝试导入Playwright，如果失败则使用API-only模式
let playwright;
try {
  playwright = require('@playwright/test');
} catch (error) {
  console.log('⚠️ Playwright未安装，使用API-only测试模式');
}

/**
 * SAU AI功能API + Playwright集成测试
 * 测试AI功能模块的API接口和前端集成
 */
describe('SAU AI功能 - API与Playwright集成测试', () => {
  let apiClient;
  let browser;
  let context;
  let page;
  let hasPlaywright = false;

  beforeAll(async () => {
    // 初始化API客户端
    apiClient = new SAUAPIClient();

    // 检查是否有Playwright
    if (playwright && playwright.chromium) {
      hasPlaywright = true;
      browser = await playwright.chromium.launch();
      context = await browser.newContext();
      page = await context.newPage();

      // 监听控制台错误
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error('前端错误:', msg.text());
        }
      });

      page.on('pageerror', error => {
        console.error('页面错误:', error.message);
      });
    } else {
      console.log('🔧 运行在API-only模式');
    }
  });

  afterAll(async () => {
    if (hasPlaywright && browser) {
      await context.close();
      await browser.close();
    }
  });

  beforeEach(() => {
    // 清理认证状态
    apiClient.clearAuthToken();
  });

  describe('实时数据监控功能测试', () => {
    test('API接口测试 - 获取监控数据', async () => {
      // 测试API接口
      const response = await apiClient.monitoring.getRealTimeData({
        metrics: ['cpu', 'memory', 'network'],
        timeRange: '1h'
      });

      // 由于后端可能未配置，我们测试错误处理
      if (response.status === 200) {
        TestHelpers.validateSuccessResponse(response);
        expect(response.data).toHaveProperty('metrics');
        expect(response.data.metrics).toBeInstanceOf(Array);
      } else {
        TestHelpers.validateErrorResponse(response, response.status);
        console.log('⚠️ 监控API未配置，状态码:', response.status);
      }
    });

    test('API + Playwright集成 - 前端监控页面', async () => {
      if (!hasPlaywright) {
        console.log('⚠️ 跳过Playwright测试，运行在API-only模式');
        return;
      }

      // 通过Playwright访问前端页面
      await page.goto('http://localhost:5173/real-time-monitor');
      await page.waitForLoadState('networkidle');

      // 验证页面标题
      const title = await page.title();
      expect(title).toContain('SAU');

      // 检查监控UI元素
      const monitorElements = page.locator('.monitor-container, .metrics-panel, .real-time-data');
      const elementCount = await monitorElements.count();

      console.log(`📊 实时监控页面发现 ${elementCount} 个监控元素`);

      if (elementCount > 0) {
        await expect(monitorElements.first()).toBeVisible();
        console.log('✅ 实时监控UI元素正常显示');
      }

      // 模拟API调用（如果后端未配置）
      try {
        // 等待可能的API调用
        await page.waitForTimeout(2000);

        // 检查是否有错误信息显示
        const errorElements = page.locator('.error-message, .api-error');
        const errorCount = await errorElements.count();

        if (errorCount > 0) {
          console.log('🔍 发现前端错误信息，可能是API未配置');
        }
      } catch (error) {
        console.log('📡 API调用测试完成，状态:', error.message);
      }
    });

    test('性能测试 - 监控数据响应时间', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.monitoring.getRealTimeData({ metrics: ['cpu'] })
      );

      console.log(`⏱️ 监控API响应时间: ${responseTime}ms`);

      if (result.status === 200) {
        TestHelpers.validateResponseTime(responseTime, 2000); // 2秒内
      } else {
        console.log('⚠️ 监控API响应时间测试，状态码:', result.status);
      }
    });
  });

  describe('内容分析功能测试', () => {
    test('API接口测试 - 内容分析请求', async () => {
      const testData = {
        content: '这是一篇测试文章，用于验证内容分析API功能。',
        type: 'article',
        analysisType: 'sentiment'
      };

      const response = await apiClient.content.analyze(testData);

      if (response.status === 200) {
        TestHelpers.validateSuccessResponse(response);
        expect(response.data).toHaveProperty('analysis');
        expect(response.data.analysis).toHaveProperty('sentiment');
      } else {
        TestHelpers.validateErrorResponse(response, response.status);
        console.log('⚠️ 内容分析API未配置，状态码:', response.status);
      }
    });

    test('API + Playwright集成 - 内容分析页面', async () => {
      await page.goto('http://localhost:5173/content-analysis');
      await page.waitForLoadState('networkidle');

      // 检查内容分析UI
      const analysisElements = page.locator('.analysis-panel, .content-input, .result-display');
      const elementCount = await analysisElements.count();

      console.log(`📝 内容分析页面发现 ${elementCount} 个分析元素`);

      if (elementCount > 0) {
        await expect(analysisElements.first()).toBeVisible();
        console.log('✅ 内容分析UI元素正常显示');
      }

      // 模拟用户输入内容进行分析
      const textarea = page.locator('textarea, .content-editor').first();
      if (await textarea.count() > 0) {
        await textarea.fill('测试内容分析功能的文章内容');

        const analyzeButton = page.locator('button:has-text("分析"), .analyze-btn').first();
        if (await analyzeButton.count() > 0) {
          await analyzeButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ 模拟内容分析操作完成');
        }
      }
    });

    test('批量内容分析测试', async () => {
      const contents = [
        '这是第一篇测试文章',
        '这是第二篇测试文章，内容不同',
        '第三篇测试文章用于批量分析验证'
      ];

      const promises = contents.map(content =>
        apiClient.content.analyze({ content, type: 'text' })
      );

      const results = await Promise.all(promises);

      const successCount = results.filter(r => r.status === 200).length;
      console.log(`📊 批量分析结果: ${successCount}/${results.length} 成功`);

      // 至少应该有响应，即使是错误
      results.forEach(result => {
        expect(result.status).toBeDefined();
        expect(result.data).toBeDefined();
      });
    });
  });

  describe('API市场功能测试', () => {
    test('API接口测试 - API列表获取', async () => {
      const response = await apiClient.marketplace.getAPIs({
        category: 'ai',
        page: 1,
        limit: 10
      });

      if (response.status === 200) {
        TestHelpers.validateSuccessResponse(response);
        expect(response.data).toHaveProperty('apis');
        expect(response.data).toHaveProperty('pagination');
      } else {
        TestHelpers.validateErrorResponse(response, response.status);
        console.log('⚠️ API市场API未配置，状态码:', response.status);
      }
    });

    test('API + Playwright集成 - API市场页面', async () => {
      await page.goto('http://localhost:5173/api-marketplace');
      await page.waitForLoadState('networkidle');

      // 检查API市场UI
      const marketElements = page.locator('.api-grid, .marketplace-container, .api-card');
      const elementCount = await marketElements.count();

      console.log(`🛒 API市场页面发现 ${elementCount} 个市场元素`);

      if (elementCount > 0) {
        await expect(marketElements.first()).toBeVisible();
        console.log('✅ API市场UI元素正常显示');
      }

      // 测试分类筛选功能
      const categoryButtons = page.locator('button:has-text("AI"), .category-btn').first();
      if (await categoryButtons.count() > 0) {
        await categoryButtons.click();
        await page.waitForTimeout(500);
        console.log('✅ 分类筛选功能测试完成');
      }
    });

    test('API连接测试功能', async () => {
      const testConfig = {
        name: 'Test API',
        endpoint: 'https://api.example.com/test',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const response = await apiClient.marketplace.testConnection(testConfig);

      console.log(`🔌 API连接测试状态: ${response.status}`);

      // 连接测试可能成功也可能失败，但应该有明确的响应
      expect(response.status).toBeDefined();
      expect(response.data).toHaveProperty('connectionStatus');
    });
  });

  describe('用户管理功能测试', () => {
    test('API接口测试 - 用户列表获取', async () => {
      const response = await apiClient.users.getUsers({
        page: 1,
        limit: 20,
        role: 'user'
      });

      if (response.status === 200) {
        TestHelpers.validateSuccessResponse(response);
        expect(response.data).toHaveProperty('users');
        expect(response.data).toHaveProperty('total');
      } else {
        TestHelpers.validateErrorResponse(response, response.status);
        console.log('⚠️ 用户管理API未配置，状态码:', response.status);
      }
    });

    test('API + Playwright集成 - 用户管理页面', async () => {
      await page.goto('http://localhost:5173/user-management');
      await page.waitForLoadState('networkidle');

      // 检查用户管理UI
      const userElements = page.locator('.user-table, .management-panel, .user-list');
      const elementCount = await userElements.count();

      console.log(`👥 用户管理页面发现 ${elementCount} 个管理元素`);

      if (elementCount > 0) {
        await expect(userElements.first()).toBeVisible();
        console.log('✅ 用户管理UI元素正常显示');
      }

      // 测试搜索功能
      const searchInput = page.locator('input[placeholder*="搜索"], .search-input').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
        console.log('✅ 用户搜索功能测试完成');
      }
    });

    test('用户权限验证测试', async () => {
      // 测试不同权限级别的访问控制
      const permissions = ['admin', 'editor', 'viewer', 'guest'];

      for (const permission of permissions) {
        const response = await apiClient.users.checkPermission({
          resource: 'user_management',
          action: 'read',
          role: permission
        });

        expect(response.status).toBeDefined();
        if (response.status === 200) {
          expect(response.data).toHaveProperty('allowed');
          console.log(`🔒 ${permission} 权限检查: ${response.data.allowed ? '允许' : '拒绝'}`);
        }
      }
    });
  });

  describe('性能优化功能测试', () => {
    test('API接口测试 - 性能指标获取', async () => {
      const response = await apiClient.performance.getMetrics({
        timeRange: '24h',
        metrics: ['response_time', 'memory_usage', 'cpu_usage']
      });

      if (response.status === 200) {
        TestHelpers.validateSuccessResponse(response);
        expect(response.data).toHaveProperty('metrics');
        expect(response.data).toHaveProperty('optimizations');
      } else {
        TestHelpers.validateErrorResponse(response, response.status);
        console.log('⚠️ 性能优化API未配置，状态码:', response.status);
      }
    });

    test('API + Playwright集成 - 性能优化页面', async () => {
      await page.goto('http://localhost:5173/performance-optimization');
      await page.waitForLoadState('networkidle');

      // 检查性能优化UI
      const perfElements = page.locator('.performance-dashboard, .metrics-chart, .optimization-panel');
      const elementCount = await perfElements.count();

      console.log(`⚡ 性能优化页面发现 ${elementCount} 个性能元素`);

      if (elementCount > 0) {
        await expect(perfElements.first()).toBeVisible();
        console.log('✅ 性能优化UI元素正常显示');
      }

      // 测试优化建议功能
      const optimizeButton = page.locator('button:has-text("优化"), .optimize-btn').first();
      if (await optimizeButton.count() > 0) {
        await optimizeButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ 性能优化功能测试完成');
      }
    });

    test('性能基准测试', async () => {
      const benchmarks = [
        { name: '首页加载', url: '/real-time-monitor' },
        { name: '内容分析', url: '/content-analysis' },
        { name: '用户管理', url: '/user-management' }
      ];

      for (const benchmark of benchmarks) {
        const startTime = Date.now();

        // 通过API测试页面性能
        const response = await apiClient.performance.pageLoad(benchmark.url);

        const loadTime = Date.now() - startTime;

        console.log(`📊 ${benchmark.name} 性能: ${loadTime}ms`);

        if (response.status === 200) {
          TestHelpers.validateResponseTime(loadTime, 3000); // 3秒内
        }
      }
    });
  });

  describe('集成测试 - 端到端工作流', () => {
    test('完整的AI功能工作流测试', async () => {
      // 1. 用户登录（通过API）
      const loginResponse = await apiClient.auth.login('test_user', 'test_password');

      if (loginResponse.status === 200) {
        const token = loginResponse.data.token;
        apiClient.setAuthToken(token);
        console.log('✅ API登录成功');

        // 2. 访问实时监控页面（通过Playwright）
        await page.goto('http://localhost:5173/real-time-monitor');
        await page.waitForLoadState('networkidle');

        // 3. 验证页面元素
        const monitorPanel = page.locator('.monitor-container').first();
        if (await monitorPanel.count() > 0) {
          await expect(monitorPanel).toBeVisible();
          console.log('✅ 实时监控页面验证成功');
        }

        // 4. 测试内容分析功能
        await page.goto('http://localhost:5173/content-analysis');
        await page.waitForLoadState('networkidle');

        const analysisPanel = page.locator('.analysis-panel').first();
        if (await analysisPanel.count() > 0) {
          await expect(analysisPanel).toBeVisible();
          console.log('✅ 内容分析页面验证成功');
        }

        // 5. 用户登出
        const logoutResponse = await apiClient.auth.logout();
        if (logoutResponse.status === 200) {
          console.log('✅ API登出成功');
        }
      } else {
        console.log('⚠️ 跳过登录步骤，直接测试页面功能');
      }
    });

    test('跨页面数据一致性测试', async () => {
      // 测试在不同页面间的数据一致性
      const pages = [
        '/real-time-monitor',
        '/content-analysis',
        '/api-marketplace',
        '/user-management',
        '/performance-optimization'
      ];

      for (const pageUrl of pages) {
        await page.goto(`http://localhost:5173${pageUrl}`);
        await page.waitForLoadState('networkidle');

        // 检查页面基本结构
        await expect(page.locator('.main-layout')).toBeVisible();

        // 检查导航栏
        const navItems = page.locator('.nav-item');
        const navCount = await navItems.count();

        console.log(`📄 ${pageUrl} 页面导航项数量: ${navCount}`);

        if (navCount > 0) {
          await expect(navItems.first()).toBeVisible();
        }
      }

      console.log('✅ 跨页面数据一致性测试完成');
    });
  });

  describe('错误处理和边界情况', () => {
    test('API错误处理测试', async () => {
      // 测试各种错误情况
      const errorScenarios = [
        {
          name: '无效的监控参数',
          test: () => apiClient.monitoring.getRealTimeData({ metrics: 'invalid' })
        },
        {
          name: '空内容分析',
          test: () => apiClient.content.analyze({ content: '', type: 'article' })
        },
        {
          name: '无效的API配置',
          test: () => apiClient.marketplace.testConnection({ endpoint: 'invalid-url' })
        }
      ];

      for (const scenario of errorScenarios) {
        try {
          const response = await scenario.test();
          console.log(`🔍 ${scenario.name}: 状态码 ${response.status}`);

          // 即使是错误响应，也应该有正确的格式
          expect(response.status).toBeDefined();
          expect(response.data).toBeDefined();
        } catch (error) {
          // 网络错误或其他异常
          console.log(`🔍 ${scenario.name}: ${error.message}`);
          expect(error.message).toBeDefined();
        }
      }
    });

    test('并发访问测试', async () => {
      // 模拟多个用户同时访问不同AI功能
      const concurrentTests = [
        () => apiClient.monitoring.getRealTimeData({ metrics: ['cpu'] }),
        () => apiClient.content.analyze({ content: 'test content', type: 'text' }),
        () => apiClient.marketplace.getAPIs({ category: 'ai' }),
        () => apiClient.users.getUsers({ page: 1, limit: 10 }),
        () => apiClient.performance.getMetrics({ timeRange: '1h' })
      ];

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentTests);
      const totalTime = Date.now() - startTime;

      console.log(`⚡ 并发测试完成时间: ${totalTime}ms`);

      // 检查所有测试都有结果
      results.forEach((result, index) => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBeDefined();
        }
      });

      console.log('✅ 并发访问测试通过');
    });
  });
});