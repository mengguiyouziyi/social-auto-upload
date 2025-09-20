import { test, expect } from '@playwright/test';

test.describe('SAU AI功能模块测试', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(30000);
  });

  test.describe('智能内容推荐功能', () => {
    test('页面加载和基本元素检查', async ({ page }) => {
      console.log('🧪 测试智能推荐页面加载...');

      await page.goto('http://localhost:5173/content-recommendation');
      await page.waitForLoadState('networkidle');

      // 检查页面标题
      await expect(page).toHaveTitle('SAU自媒体自动化运营系统');

      // 检查主要内容区域
      const contentRecommendation = page.locator('.content-recommendation-container');
      await expect(contentRecommendation).toBeVisible();

      // 检查标题
      const title = page.locator('h1');
      await expect(title).toContainText('智能内容推荐');

      // 检查控制面板
      const controlPanel = page.locator('.control-panel');
      await expect(controlPanel).toBeVisible();

      // 检查推荐设置区域
      const recommendationSettings = page.locator('.recommendation-settings');
      await expect(recommendationSettings).toBeVisible();

      console.log('✅ 智能推荐页面基本结构加载成功');
    });

    test('推荐类型和筛选功能测试', async ({ page }) => {
      console.log('🧪 测试推荐类型和筛选功能...');

      await page.goto('http://localhost:5173/content-recommendation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 检查推荐类型选择器
      const recommendationTypeSelect = page.locator('select');
      const selectCount = await recommendationTypeSelect.count();
      expect(selectCount).toBeGreaterThan(0);

      // 检查推荐类型选项
      const firstSelect = recommendationTypeSelect.first();
      const options = await firstSelect.locator('option').allTextContents();
      console.log('📋 推荐类型选项:', options);
      expect(options.length).toBeGreaterThan(1);

      // 测试选择不同的推荐类型
      if (options.length > 1) {
        await firstSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        console.log('✅ 推荐类型切换功能正常');
      }

      // 检查平台筛选器
      const platformFilters = page.locator('.platform-filters');
      const platformFilterCount = await platformFilters.count();
      if (platformFilterCount > 0) {
        console.log('✅ 平台筛选器存在');
      }

      // 检查内容类型筛选器
      const contentTypeFilters = page.locator('.content-type-filters');
      const contentTypeFilterCount = await contentTypeFilters.count();
      if (contentTypeFilterCount > 0) {
        console.log('✅ 内容类型筛选器存在');
      }

      console.log('✅ 推荐类型和筛选功能测试完成');
    });

    test('推荐内容展示测试', async ({ page }) => {
      console.log('🧪 测试推荐内容展示...');

      await page.goto('http://localhost:5173/content-recommendation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // 检查推荐内容容器
      const recommendationsContainer = page.locator('.recommendations-container');
      await expect(recommendationsContainer).toBeVisible();

      // 等待推荐内容加载
      await page.waitForTimeout(2000);

      // 检查是否有推荐内容或空状态
      const recommendationsGrid = page.locator('.recommendations-grid');
      const emptyState = page.locator('.empty-state');

      const hasGrid = await recommendationsGrid.count() > 0;
      const hasEmpty = await emptyState.count() > 0;

      expect(hasGrid || hasEmpty).toBe(true);

      if (hasGrid) {
        console.log('📊 发现推荐内容网格');
        // 检查推荐卡片
        const recommendationCards = page.locator('.recommendation-card');
        const cardCount = await recommendationCards.count();
        console.log(`🔢 发现 ${cardCount} 个推荐卡片`);

        if (cardCount > 0) {
          // 检查第一个推荐卡片的结构
          const firstCard = recommendationCards.first();
          await expect(firstCard).toBeVisible();

          // 检查推荐分数
          const score = firstCard.locator('.recommendation-score');
          const scoreCount = await score.count();
          if (scoreCount > 0) {
            console.log('✅ 推荐分数显示正常');
          }

          // 检查内容标题
          const title = firstCard.locator('.content-title');
          const titleCount = await title.count();
          if (titleCount > 0) {
            const titleText = await title.textContent();
            console.log(`📝 内容标题: ${titleText}`);
            expect(titleText.length).toBeGreaterThan(0);
          }

          // 检查操作按钮
          const actionButtons = firstCard.locator('.action-btn');
          const actionButtonCount = await actionButtons.count();
          console.log(`🔘 发现 ${actionButtonCount} 个操作按钮`);
          expect(actionButtonCount).toBeGreaterThan(0);
        }
      } else if (hasEmpty) {
        console.log('📭 显示空状态');
        const emptyText = page.locator('.empty-text');
        await expect(emptyText).toBeVisible();
      }

      console.log('✅ 推荐内容展示测试完成');
    });

    test('AI分析面板测试', async ({ page }) => {
      console.log('🧪 测试AI分析面板...');

      await page.goto('http://localhost:5173/content-recommendation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 检查AI分析面板
      const aiAnalysisPanel = page.locator('.ai-analysis-panel');
      await expect(aiAnalysisPanel).toBeVisible();

      // 检查面板头部
      const panelHeader = page.locator('.panel-header');
      await expect(panelHeader).toBeVisible();

      // 检查标题
      const panelTitle = panelHeader.locator('h3');
      await expect(panelTitle).toContainText('AI智能分析');

      // 检查切换按钮
      const toggleBtn = page.locator('.toggle-btn');
      const toggleCount = await toggleBtn.count();
      if (toggleCount > 0) {
        console.log('✅ 切换按钮存在');

        // 测试切换功能
        await toggleBtn.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ 面板切换功能正常');
      }

      // 检查分析部分
      const analysisSections = page.locator('.analysis-section');
      const sectionCount = await analysisSections.count();
      console.log(`📊 发现 ${sectionCount} 个分析部分`);

      if (sectionCount > 0) {
        // 检查趋势分析
        const trendAnalysis = page.locator('.trend-analysis');
        const trendCount = await trendAnalysis.count();
        if (trendCount > 0) {
          console.log('✅ 趋势分析部分存在');
        }

        // 检查用户偏好
        const userPreferences = page.locator('.user-preferences');
        const prefCount = await userPreferences.count();
        if (prefCount > 0) {
          console.log('✅ 用户偏好部分存在');
        }

        // 检查最佳发布时间
        const bestTimes = page.locator('.best-times');
        const timesCount = await bestTimes.count();
        if (timesCount > 0) {
          console.log('✅ 最佳发布时间部分存在');
        }
      }

      console.log('✅ AI分析面板测试完成');
    });

    test('操作按钮功能测试', async ({ page }) => {
      console.log('🧪 测试操作按钮功能...');

      await page.goto('http://localhost:5173/content-recommendation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // 检查刷新按钮
      const refreshBtn = page.locator('.refresh-btn');
      const refreshCount = await refreshBtn.count();
      if (refreshCount > 0) {
        console.log('✅ 刷新按钮存在');
        await refreshBtn.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ 刷新按钮点击正常');
      }

      // 检查导出按钮
      const exportBtn = page.locator('.export-btn');
      const exportCount = await exportBtn.count();
      if (exportCount > 0) {
        console.log('✅ 导出按钮存在');
      }

      // 等待推荐内容加载并检查操作按钮
      await page.waitForTimeout(2000);
      const recommendationCards = page.locator('.recommendation-card');
      const cardCount = await recommendationCards.count();

      if (cardCount > 0) {
        const firstCard = recommendationCards.first();

        // 检查查看详情按钮
        const viewBtn = firstCard.locator('.view-btn');
        const viewCount = await viewBtn.count();
        if (viewCount > 0) {
          console.log('✅ 查看详情按钮存在');
        }

        // 检查创建相似内容按钮
        const createBtn = firstCard.locator('.create-btn');
        const createCount = await createBtn.count();
        if (createCount > 0) {
          console.log('✅ 创建相似内容按钮存在');
        }

        // 检查安排发布按钮
        const scheduleBtn = firstCard.locator('.schedule-btn');
        const scheduleCount = await scheduleBtn.count();
        if (scheduleCount > 0) {
          console.log('✅ 安排发布按钮存在');
        }

        // 检查忽略推荐按钮
        const ignoreBtn = firstCard.locator('.ignore-btn');
        const ignoreCount = await ignoreBtn.count();
        if (ignoreCount > 0) {
          console.log('✅ 忽略推荐按钮存在');
        }
      }

      console.log('✅ 操作按钮功能测试完成');
    });

    test('响应式设计测试', async ({ page }) => {
      console.log('📱 测试智能推荐页面响应式设计...');

      const viewports = [
        { width: 1920, height: 1080, name: '桌面端' },
        { width: 768, height: 1024, name: '平板端' },
        { width: 375, height: 667, name: '移动端' }
      ];

      for (const viewport of viewports) {
        console.log(`📱 测试 ${viewport.name} 智能推荐页面...`);

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('http://localhost:5173/content-recommendation');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 检查基本元素是否可见
        await expect(page.locator('.content-recommendation-container')).toBeVisible();

        // 检查主要内容区域
        const mainContent = page.locator('.recommendations-container');
        await expect(mainContent).toBeVisible();

        console.log(`✅ ${viewport.name} 智能推荐页面适配正常`);
      }

      console.log('✅ 智能推荐页面响应式测试完成');
    });

    test('API数据加载测试', async ({ page }) => {
      console.log('🌐 测试API数据加载...');

      // 监听网络请求
      const apiResponses = [];
      page.on('response', response => {
        if (response.url().includes('/ai/')) {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            method: response.request().method()
          });
        }
      });

      await page.goto('http://localhost:5173/content-recommendation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // 检查是否有AI相关的API请求
      const aiApiCalls = apiResponses.filter(resp => resp.url.includes('/ai/'));
      console.log(`📡 发起 ${aiApiCalls.length} 个AI API请求`);

      aiApiCalls.forEach(call => {
        console.log(`🔗 ${call.method} ${call.url} - ${call.status}`);
        expect(call.status).toBe(200);
      });

      if (aiApiCalls.length > 0) {
        console.log('✅ AI API数据加载正常');
      } else {
        console.log('⚠️ 未检测到AI API调用，可能使用模拟数据');
      }

      console.log('✅ API数据加载测试完成');
    });
  });

  test.describe('AI功能完整性测试', () => {
    test('所有AI功能页面可访问性测试', async ({ page }) => {
      console.log('🧪 测试所有AI功能页面可访问性...');

      const aiRoutes = [
        { path: '/real-time-monitor', name: '实时监控' },
        { path: '/content-analysis', name: '内容分析' },
        { path: '/api-marketplace', name: 'API市场' },
        { path: '/user-management', name: '用户管理' },
        { path: '/enterprise-management', name: '企业管理' },
        { path: '/performance-optimization', name: '性能优化' },
        { path: '/content-recommendation', name: '智能推荐' }
      ];

      for (const route of aiRoutes) {
        console.log(`🔄 测试 ${route.name} 页面...`);

        await page.goto(`http://localhost:5173${route.path}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 检查页面是否正常加载
        await expect(page.locator('#app')).toBeVisible();

        // 检查URL是否正确
        expect(page.url()).toContain(route.path);

        console.log(`✅ ${route.name} 页面访问成功`);
      }

      console.log('✅ 所有AI功能页面可访问性测试完成');
    });
  });
});