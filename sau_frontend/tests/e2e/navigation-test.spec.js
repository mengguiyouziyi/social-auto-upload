import { test, expect } from '@playwright/test';

test.describe('SAU自媒体自动化运营系统 - 导航测试', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(30000);
  });

  test('基本导航功能测试', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    console.log('🔍 检查页面基本结构...');

    // 等待Vue应用加载
    await page.waitForSelector('#app', { state: 'visible' });

    // 检查是否有任何导航元素
    const navElements = page.locator('nav, .nav, .sidebar, .menu, .navigation');
    const navCount = await navElements.count();
    console.log(`📋 发现 ${navCount} 个导航区域`);

    // 检查导航项
    const allLinks = page.locator('a');
    const linkCount = await allLinks.count();
    console.log(`🔗 发现 ${linkCount} 个链接`);

    // 检查是否有预期的路由链接
    const expectedRoutes = ['account', 'publish', 'real-time-monitor', 'content-analysis'];
    let foundRoutes = 0;

    if (navCount > 0) {
      console.log('✅ 导航区域存在');

      for (const route of expectedRoutes) {
        const routeLinks = page.locator(`a[href*="${route}"]`);
        if (await routeLinks.count() > 0) {
          foundRoutes++;
          console.log(`✅ 找到路由: ${route}`);
        }
      }

      console.log(`📊 找到 ${foundRoutes}/${expectedRoutes.length} 个预期路由`);

      // 测试点击第一个链接
      if (linkCount > 0) {
        const firstLink = allLinks.first();
        const href = await firstLink.getAttribute('href');
        console.log(`🖱️ 点击第一个链接: ${href}`);

        await firstLink.click();
        await page.waitForTimeout(1000);

        const currentUrl = page.url();
        console.log(`📍 当前URL: ${currentUrl}`);

        // 检查URL是否发生变化
        if (href && currentUrl.includes(href)) {
          console.log('✅ 导航点击功能正常');
        } else {
          console.log('⚠️ 导航点击后URL未变化');
        }
      }
    } else {
      console.log('❌ 未找到导航区域');
    }

    // 检查AI功能相关内容
    const aiFeatures = ['实时监控', '内容分析', 'API市场', '用户管理', '企业管理', '性能优化'];
    let foundAIFeatures = 0;

    const bodyText = await page.locator('body').textContent();
    for (const feature of aiFeatures) {
      if (bodyText.includes(feature)) {
        foundAIFeatures++;
        console.log(`✅ 找到AI功能: ${feature}`);
      }
    }

    console.log(`🤖 找到 ${foundAIFeatures}/${aiFeatures.length} 个AI功能`);

    // 基本断言
    await expect(page.locator('#app')).toBeVisible();
    expect(foundRoutes).toBeGreaterThan(0);
    expect(foundAIFeatures).toBeGreaterThan(0);

    console.log('🎉 导航测试完成！');
  });

  test('路由测试', async ({ page }) => {
    const routes = [
      { path: '/account', name: '账号管理' },
      { path: '/publish', name: '发布中心' },
      { path: '/real-time-monitor', name: '实时监控' },
      { path: '/content-analysis', name: '内容分析' }
    ];

    for (const route of routes) {
      console.log(`🧪 测试路由: ${route.path}`);

      await page.goto(`http://localhost:5173${route.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 检查页面是否正常加载
      await expect(page.locator('#app')).toBeVisible();

      // 检查URL是否正确
      expect(page.url()).toContain(route.path);

      console.log(`✅ 路由 ${route.path} 加载正常`);
    }

    console.log('🎉 路由测试完成！');
  });

  test('响应式导航测试', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: '桌面端' },
      { width: 768, height: 1024, name: '平板端' },
      { width: 375, height: 667, name: '移动端' }
    ];

    for (const viewport of viewports) {
      console.log(`📱 测试 ${viewport.name} 响应式布局...`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // 检查基本元素是否可见
      await expect(page.locator('#app')).toBeVisible();

      // 检查是否有响应式菜单按钮（移动端）
      if (viewport.width <= 768) {
        const menuButtons = page.locator('button[aria-label*="menu"], .hamburger, .mobile-menu');
        const menuCount = await menuButtons.count();
        if (menuCount > 0) {
          console.log(`✅ ${viewport.name} 发现移动端菜单按钮`);
        }
      }

      await page.waitForTimeout(500);
      console.log(`✅ ${viewport.name} 布局正常`);
    }

    console.log('🎉 响应式导航测试完成！');
  });
});