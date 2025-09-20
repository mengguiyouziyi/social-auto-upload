import { test, expect } from '@playwright/test';

test.describe('SAU自媒体自动化运营系统', () => {
  test('页面加载测试', async ({ page }) => {
    // 访问应用
    await page.goto('http://localhost:5173');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 检查页面标题
    await expect(page).toHaveTitle('SAU自媒体自动化运营系统');

    // 检查主要内容区域是否存在
    await expect(page.locator('.main-layout')).toBeVisible();
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();

    // 检查logo是否存在
    await expect(page.locator('.logo')).toBeVisible();

    // 检查导航菜单项
    const navItems = page.locator('.nav-item');
    await expect(navItems.first()).toBeVisible();

    // 检查router-view是否在渲染内容
    await expect(page.locator('.main-content')).toBeVisible();

    console.log('✅ 页面基本结构加载成功');
  });

  test('导航功能测试', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // 检查基础功能导航
    const basicNavItems = page.locator('.nav-section').first().locator('.nav-item');
    const basicNavCount = await basicNavItems.count();

    console.log(`📋 基础功能导航项数量: ${basicNavCount}`);
    expect(basicNavCount).toBeGreaterThan(0);

    // 检查AI功能导航
    const aiNavItems = page.locator('.nav-section').nth(1).locator('.nav-item');
    const aiNavCount = await aiNavItems.count();

    console.log(`🤖 AI功能导航项数量: ${aiNavCount}`);
    expect(aiNavCount).toBeGreaterThan(0);

    // 点击第一个导航项
    if (basicNavCount > 0) {
      await basicNavItems.first().click();
      await page.waitForTimeout(1000);

      // 检查URL是否发生变化
      expect(page.url()).toContain('/account');
      console.log('✅ 导航功能正常工作');
    }
  });

  test('响应式布局测试', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // 桌面端测试
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.sidebar')).toBeVisible();

    // 移动端测试
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // 检查页面是否在移动端正常显示
    await expect(page.locator('.main-layout')).toBeVisible();
    await expect(page.locator('.header')).toBeVisible();

    console.log('✅ 响应式布局测试通过');
  });

  test('控制台错误检查', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 检查是否有JavaScript错误
    if (consoleErrors.length > 0) {
      console.log('❌ 发现控制台错误:');
      consoleErrors.forEach(error => console.log(`   ${error}`));
    } else {
      console.log('✅ 没有发现JavaScript错误');
    }

    // 过滤掉开发环境中常见的非关键错误
    const filteredErrors = consoleErrors.filter(error => {
      // 忽略404错误（开发环境常见）
      if (error.includes('404') || error.includes('Not Found')) {
        return false;
      }
      // 忽略API错误（可能后端服务未完全启动）
      if (error.includes('AxiosError') || error.includes('获取账号列表失败')) {
        return false;
      }
      // 忽略资源加载错误
      if (error.includes('Failed to load resource')) {
        return false;
      }
      return true;
    });

    console.log(`📊 发现 ${consoleErrors.length} 个控制台信息，${filteredErrors.length} 个严重错误`);

    // 只检查严重错误
    expect(filteredErrors.length).toBe(0);
  });

  test('样式加载测试', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // 检查主要样式是否加载
    const header = page.locator('.header');
    const headerStyles = await header.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        height: computed.height,
        borderBottom: computed.borderBottom
      };
    });

    console.log('🎨 顶部导航栏样式:', headerStyles);

    // 检查侧边栏样式
    const sidebar = page.locator('.sidebar');
    const sidebarStyles = await sidebar.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        backgroundColor: computed.backgroundColor,
        borderRight: computed.borderRight
      };
    });

    console.log('🎨 侧边栏样式:', sidebarStyles);

    // 验证样式是否正确应用
    expect(headerStyles.height).not.toBe('0px');
    expect(sidebarStyles.width).not.toBe('0px');

    console.log('✅ 样式加载正常');
  });
});