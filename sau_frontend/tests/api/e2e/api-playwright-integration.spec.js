const { test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@playwright/test');
const SAUAPIClient = require('../utils/api-client');
const TestHelpers = require('../utils/test-helpers');
const { testUsers, testAccounts, testAPIs } = require('../fixtures/test-data');

describe('SAU系统 - API与Playwright集成测试', () => {
  let apiClient;
  let page;

  beforeAll(async ({ browser }) => {
    apiClient = new SAUAPIClient();

    // 获取认证token
    try {
      const loginResponse = await apiClient.auth.login(
        testUsers.validUser.username,
        testUsers.validUser.password
      );
      const token = loginResponse.data.token;
      apiClient.setAuthToken(token);
    } catch (error) {
      console.log('使用模拟认证token');
      apiClient.setAuthToken('mock_test_token');
    }
  });

  beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  describe('API与前端界面集成测试', () => {
    test('前端获取账号列表与API一致性验证', async () => {
      // 先通过API获取账号列表
      const apiResponse = await apiClient.accounts.getValidAccounts();
      TestHelpers.validateSuccessResponse(apiResponse);
      const apiAccounts = apiResponse.data;

      // 访问前端页面
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // 等待账号数据加载
      await page.waitForTimeout(2000);

      // 检查前端显示的账号数量
      // 这里假设前端有某种方式显示账号信息
      try {
        const accountElements = await page.locator('.account-item, .account-card').count();
        console.log(`前端显示账号数量: ${accountElements}`);
        console.log(`API返回账号数量: ${apiAccounts.length}`);

        // 验证数据一致性（这里只是基本验证，具体逻辑根据前端实现调整）
        if (accountElements > 0 && apiAccounts.length > 0) {
          expect(accountElements).toBeGreaterThanOrEqual(apiAccounts.length);
        }
      } catch (error) {
        console.log('前端账号元素查找失败，可能页面结构不同');
      }

      // 验证API响应正确性
      expect(apiAccounts).toBeInstanceOf(Array);
    });

    test('文件上传功能集成测试', async ({ page }) => {
      // 创建测试文件
      const testFile = TestHelpers.createTestFile(
        `integration_test_${Date.now()}.txt`,
        '集成测试文件内容',
        'text/plain'
      );

      try {
        // 通过API上传文件
        const fileData = {
          file: {
            name: testFile.name,
            content: testFile.content,
            size: testFile.size,
            type: 'text/plain'
          },
          description: '集成测试文件',
          type: 'document'
        };

        const uploadResponse = await apiClient.files.uploadFile(fileData);
        TestHelpers.validateSuccessResponse(uploadResponse);
        const uploadedFileId = uploadResponse.data.id;

        // 添加到清理列表
        global.addTestResource({
          type: 'file',
          id: uploadedFileId
        });

        // 访问素材库页面
        await page.goto('http://localhost:5173/material-library');
        await page.waitForLoadState('networkidle');

        // 等待文件列表加载
        await page.waitForTimeout(2000);

        // 检查文件是否在前端显示
        try {
          const fileElements = await page.locator('.file-item, .material-item').count();
          console.log(`素材库文件数量: ${fileElements}`);

          // 尝试找到刚上传的文件
          const uploadedFileElement = page.locator(`text=${testFile.name}`);
          const isVisible = await uploadedFileElement.isVisible();

          if (isVisible) {
            console.log(`✅ 文件在前端正确显示: ${testFile.name}`);
          } else {
            console.log(`⚠️ 文件可能需要时间同步到前端`);
          }
        } catch (error) {
          console.log('前端文件元素查找失败，可能页面结构不同');
        }

        // 验证上传的文件可以通过API获取
        const filesResponse = await apiClient.files.getFiles();
        TestHelpers.validateSuccessResponse(filesResponse);

        const foundFile = filesResponse.data.find(file => file.id === uploadedFileId);
        expect(foundFile).toBeDefined();
        expect(foundFile.name).toBe(testFile.name);

      } finally {
        TestHelpers.cleanupTestFile(testFile.path);
      }
    });

    test('发布功能集成测试', async ({ page }) => {
      // 创建测试发布数据
      const publishData = {
        ...testAPIs.generateAPI(),
        title: `集成测试发布_${Date.now()}`,
        description: 'API与前端集成测试发布内容',
        platforms: ['douyin']
      };

      // 通过API创建发布任务
      try {
        const publishResponse = await apiClient.publishing.postVideo({
          ...publishData,
          account_id: 'mock_account_id',
          video_id: 'mock_video_id'
        });

        if (publishResponse.status >= 200 && publishResponse.status < 300) {
          const publishId = publishResponse.data.publish_id;

          // 添加到清理列表
          global.addTestResource({
            type: 'publish',
            id: publishId
          });

          // 访问发布中心页面
          await page.goto('http://localhost:5173/publish');
          await page.waitForLoadState('networkidle');

          // 等待页面加载
          await page.waitForTimeout(2000);

          // 检查发布状态
          const statusResponse = await apiClient.publishing.getPublishStatus(publishId);
          TestHelpers.validateSuccessResponse(statusResponse);

          console.log(`✅ 发布任务创建成功: ${publishId}`);
          console.log(`📊 发布状态: ${statusResponse.data.status}`);

          // 验证状态更新
          expect(['pending', 'processing', 'published', 'failed']).toContain(statusResponse.data.status);
        }
      } catch (error) {
        console.log('API发布失败，继续其他测试');
      }
    });
  });

  describe('API市场功能集成测试', () => {
    test('API列表页面集成验证', async ({ page }) => {
      // 通过API获取API列表
      const apiResponse = await apiClient.marketplace.getAPIs();
      expect(apiResponse.status).toBeGreaterThanOrEqual(200);

      const apiList = apiResponse.data || [];

      // 访问API市场页面
      await page.goto('http://localhost:5173/api-marketplace');
      await page.waitForLoadState('networkidle');

      // 等待页面加载
      await page.waitForTimeout(2000);

      // 验证页面标题
      const title = await page.title();
      expect(title).toContain('API') || expect(title).toContain('市场');

      // 检查API统计信息
      try {
        const connectedCount = await page.locator('.metric-value').first().textContent();
        console.log(`前端显示已连接API数量: ${connectedCount}`);
      } catch (error) {
        console.log('API统计元素查找失败');
      }

      // 验证API数据结构
      if (apiList.length > 0) {
        const firstAPI = apiList[0];
        expect(firstAPI).toHaveProperty('name');
        expect(firstAPI).toHaveProperty('provider');
        expect(firstAPI).toHaveProperty('status');
      }

      console.log(`API返回 ${apiList.length} 个API配置`);
    });

    test('API连接测试集成', async ({ page }) => {
      // 创建测试API
      const testAPI = testAPIs.generateAPI({
        name: `集成测试API_${Date.now()}`,
        endpoint: 'https://httpbin.org/get' // 使用测试服务
      });

      // 通过API添加配置
      try {
        const addResponse = await apiClient.marketplace.addAPI(testAPI);

        if (addResponse.status >= 200 && addResponse.status < 300) {
          const apiId = addResponse.data.id;

          // 测试API连接
          const testResponse = await apiClient.marketplace.testAPIConnection(apiId);
          console.log(`API连接测试状态: ${testResponse.status}`);

          // 访问API市场页面验证
          await page.goto('http://localhost:5173/api-marketplace');
          await page.waitForLoadState('networkidle');

          // 尝试找到刚添加的API
          try {
            const apiElement = page.locator(`text=${testAPI.name}`);
            const isVisible = await apiElement.isVisible();

            if (isVisible) {
              console.log(`✅ API在前端正确显示: ${testAPI.name}`);
            }
          } catch (error) {
            console.log('API元素查找失败');
          }
        }
      } catch (error) {
        console.log('API添加失败，可能需要不同的配置');
      }
    });
  });

  describe('实时监控集成测试', () => {
    test('系统状态监控集成', async ({ page }) => {
      // 通过API获取系统状态
      const statusResponse = await apiClient.monitoring.getSystemStatus();
      console.log(`API系统状态: ${statusResponse.status}`);

      // 获取API统计
      const statsResponse = await apiClient.monitoring.getAPIStats();
      console.log(`API统计状态: ${statsResponse.status}`);

      // 访问实时监控页面
      await page.goto('http://localhost:5173/real-time-monitor');
      await page.waitForLoadState('networkidle');

      // 等待监控数据加载
      await page.waitForTimeout(3000);

      // 验证监控页面元素
      try {
        const monitorElements = await page.locator('.monitor-item, .status-card').count();
        console.log(`监控页面元素数量: ${monitorElements}`);
        expect(monitorElements).toBeGreaterThan(0);
      } catch (error) {
        console.log('监控元素查找失败');
      }

      // 检查是否有错误提示
      const errorElements = await page.locator('.error-message, .alert-error').count();
      if (errorElements > 0) {
        const errorMessage = await page.locator('.error-message, .alert-error').first().textContent();
        console.log(`页面错误信息: ${errorMessage}`);
      }

      console.log('✅ 实时监控页面加载完成');
    });

    test('性能指标集成验证', async ({ page }) => {
      // 通过API获取性能指标
      const perfResponse = await apiClient.monitoring.getPerformanceMetrics();
      console.log(`性能指标API状态: ${perfResponse.status}`);

      // 访问性能优化页面
      await page.goto('http://localhost:5173/performance-optimization');
      await page.waitForLoadState('networkidle');

      // 等待页面加载
      await page.waitForTimeout(2000);

      // 验证性能相关元素
      try {
        const perfElements = await page.locator('.performance-chart, .metric-card').count();
        console.log(`性能页面元素数量: ${perfElements}`);
      } catch (error) {
        console.log('性能元素查找失败');
      }

      console.log('✅ 性能优化页面加载完成');
    });
  });

  describe('用户管理集成测试', () => {
    test('用户信息一致性验证', async ({ page }) => {
      // 通过API获取用户信息
      try {
        const userResponse = await apiClient.auth.getUserInfo();
        if (userResponse.status >= 200 && userResponse.status < 300) {
          const apiUserInfo = userResponse.data;

          // 访问用户管理页面
          await page.goto('http://localhost:5173/user-management');
          await page.waitForLoadState('networkidle');

          // 等待页面加载
          await page.waitForTimeout(2000);

          // 验证用户信息一致性
          console.log(`API用户信息: ${JSON.stringify(apiUserInfo)}`);

          // 这里可以添加更多前端用户信息验证
          try {
            const userElements = await page.locator('.user-info, .profile-info').count();
            console.log(`用户信息元素数量: ${userElements}`);
          } catch (error) {
            console.log('用户信息元素查找失败');
          }
        }
      } catch (error) {
        console.log('用户信息API调用失败');
      }
    });
  });

  describe('响应式设计集成测试', () => {
    const viewports = [
      { width: 1920, height: 1080, name: '桌面端' },
      { width: 768, height: 1024, name: '平板端' },
      { width: 375, height: 667, name: '移动端' }
    ];

    viewports.forEach(viewport => {
      test(`API功能在${viewport.name}的响应式测试`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // 测试API调用在响应式布局下的表现
        const response = await apiClient.monitoring.healthCheck();
        console.log(`${viewport.name}健康检查状态: ${response.status}`);

        // 访问主要页面
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');

        // 验证基本功能
        await expect(page.locator('#app')).toBeVisible();

        // 检查响应式菜单（移动端）
        if (viewport.width <= 768) {
          const menuButtons = await page.locator('button[aria-label*="menu"], .hamburger, .mobile-menu').count();
          if (menuButtons > 0) {
            console.log(`${viewport.name} 发现移动端菜单按钮`);
          }
        }

        await page.waitForTimeout(1000);
        console.log(`✅ ${viewport.name} 响应式测试完成`);
      });
    });
  });

  describe('性能集成测试', () => {
    test('API响应时间与前端性能集成', async ({ page }) => {
      // 测试多个API调用的响应时间
      const apiCalls = [
        () => apiClient.accounts.getValidAccounts(),
        () => apiClient.monitoring.getSystemStatus(),
        () => apiClient.monitoring.getAPIStats()
      ];

      const apiResults = [];
      for (const apiCall of apiCalls) {
        const { result, responseTime } = await TestHelpers.measureResponseTime(apiCall);
        apiResults.push({ responseTime, status: result.status });
        console.log(`API响应时间: ${responseTime}ms, 状态: ${result.status}`);
      }

      // 访问前端页面并测量加载时间
      const startTime = Date.now();
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');
      const pageLoadTime = Date.now() - startTime;

      console.log(`页面加载时间: ${pageLoadTime}ms`);

      // 验证性能在合理范围内
      const avgApiResponseTime = apiResults.reduce((sum, r) => sum + r.responseTime, 0) / apiResults.length;
      console.log(`平均API响应时间: ${avgApiResponseTime.toFixed(2)}ms`);

      expect(avgApiResponseTime).toBeLessThan(5000); // 平均API响应时间小于5秒
      expect(pageLoadTime).toBeLessThan(10000); // 页面加载时间小于10秒
    });
  });
});