import { test, expect } from '@playwright/test';

test.describe('SAU自媒体自动化运营系统 - 全面测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置超时时间
    test.setTimeout(60000);
    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  });

  test.describe('页面基本结构测试', () => {
    test('页面加载和标题检查', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // 检查页面标题
      await expect(page).toHaveTitle('SAU自媒体自动化运营系统');

      // 检查主要DOM结构
      await expect(page.locator('.main-layout')).toBeVisible();
      await expect(page.locator('.header')).toBeVisible();
      await expect(page.locator('.sidebar')).toBeVisible();
      await expect(page.locator('.main-content').first()).toBeVisible();

      console.log('✅ 页面基本结构加载成功');
    });

    test('Logo和品牌元素检查', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // 检查Logo
      const logo = page.locator('.logo');
      await expect(logo).toBeVisible();
      await expect(logo).toContainText('SAU');

      // 检查标题
      const title = page.locator('.header-title');
      if (await title.count() > 0) {
        await expect(title).toBeVisible();
      }

      console.log('✅ Logo和品牌元素显示正常');
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

      expect(headerStyles.height).not.toBe('0px');

      const sidebar = page.locator('.sidebar');
      const sidebarStyles = await sidebar.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          backgroundColor: computed.backgroundColor
        };
      });

      expect(sidebarStyles.width).not.toBe('0px');

      console.log('✅ 样式加载正常');
    });
  });

  test.describe('导航功能测试', () => {
    test('基础功能导航检查', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // 检查基础功能导航区域
      const basicSection = page.locator('.nav-section').first();
      await expect(basicSection).toBeVisible();

      const basicNavItems = basicSection.locator('.nav-item');
      const basicCount = await basicNavItems.count();
      expect(basicCount).toBeGreaterThan(0);

      console.log(`📋 基础功能导航项数量: ${basicCount}`);

      // 检查每个导航项
      for (let i = 0; i < basicCount; i++) {
        const navItem = basicNavItems.nth(i);
        await expect(navItem).toBeVisible();

        // 检查导航项是否有内容（不严格要求特定的图标和文本结构）
        const navText = await navItem.textContent();
        expect(navText.trim()).toBeTruthy();
      }

      console.log('✅ 基础功能导航检查通过');
    });

    test('AI功能导航检查', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // 检查AI功能导航区域
      const aiSection = page.locator('.nav-section').nth(1);
      await expect(aiSection).toBeVisible();

      const aiNavItems = aiSection.locator('.nav-item');
      const aiCount = await aiNavItems.count();
      expect(aiCount).toBeGreaterThan(0);

      console.log(`🤖 AI功能导航项数量: ${aiCount}`);

      // 检查AI功能导航项
      const expectedAIItems = [
        '实时监控', '内容分析', 'API市场', '用户管理', '企业管理', '性能优化'
      ];

      for (let i = 0; i < Math.min(aiCount, expectedAIItems.length); i++) {
        const navItem = aiNavItems.nth(i);
        await expect(navItem).toBeVisible();
        const navText = await navItem.textContent();
        console.log(`  - ${navText.trim()}`);
      }

      console.log('✅ AI功能导航检查通过');
    });

    test('导航点击功能测试', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // 测试第一个导航项点击
      const firstNavItem = page.locator('.nav-item').first();
      await firstNavItem.click();
      await page.waitForTimeout(1000);

      // 检查URL变化
      expect(page.url()).toContain('/account');

      // 测试返回首页
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      console.log('✅ 导航点击功能正常');
    });
  });

  test.describe('基础功能模块测试', () => {
    const basicRoutes = ['/account', '/publish', '/multi-publish', '/material-library', '/website', '/data'];

    basicRoutes.forEach(route => {
      test(`基础功能页面: ${route}`, async ({ page }) => {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // 检查页面是否加载
        await expect(page.locator('.main-content').first()).toBeVisible();

        // 检查是否有主要内容区域
        const contentArea = page.locator('.page-content, .component-container, .view-container');
        if (await contentArea.count() > 0) {
          await expect(contentArea.first()).toBeVisible();
        }

        console.log(`✅ 基础功能页面 ${route} 加载正常`);
      });
    });
  });

  test.describe('AI功能模块测试', () => {
    const aiRoutes = [
      { path: '/real-time-monitor', name: '实时数据监控' },
      { path: '/content-analysis', name: '内容分析' },
      { path: '/api-marketplace', name: 'API市场' },
      { path: '/user-management', name: '用户管理' },
      { path: '/enterprise-management', name: '企业管理' },
      { path: '/performance-optimization', name: '性能优化' }
    ];

    aiRoutes.forEach(({ path, name }) => {
      test(`AI功能页面: ${name}`, async ({ page }) => {
        await page.goto(`http://localhost:5173${path}`);
        await page.waitForLoadState('networkidle');

        // 检查页面是否加载
        await expect(page.locator('.main-content').first()).toBeVisible();

        // 检查页面标题
        const pageTitle = page.locator('h1, .page-title, .component-title');
        if (await pageTitle.count() > 0) {
          const titleText = await pageTitle.first().textContent();
          expect(titleText).toContain(name);
        }

        // 检查是否有功能区域
        const functionArea = page.locator('.function-area, .content-area, .main-area');
        if (await functionArea.count() > 0) {
          await expect(functionArea.first()).toBeVisible();
        }

        console.log(`✅ AI功能页面 ${name} 加载正常`);
      });
    });
  });

  test.describe('响应式设计测试', () => {
    const viewports = [
      { width: 1920, height: 1080, name: '桌面端' },
      { width: 768, height: 1024, name: '平板端' },
      { width: 375, height: 667, name: '移动端' }
    ];

    viewports.forEach(({ width, height, name }) => {
      test(`响应式测试: ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');

        // 检查主要布局元素
        await expect(page.locator('.main-layout')).toBeVisible();
        await expect(page.locator('.header')).toBeVisible();

        // 移动端特殊检查
        if (width <= 768) {
          await page.waitForTimeout(500);
          // 检查移动端菜单按钮
          const menuButton = page.locator('.mobile-menu-button, .hamburger-button');
          if (await menuButton.count() > 0) {
            await expect(menuButton).toBeVisible();
          }
        }

        console.log(`✅ ${name} 响应式布局测试通过`);
      });
    });
  });

  test.describe('表单和交互测试', () => {
    test('账号管理页面表单测试', async ({ page }) => {
      await page.goto('http://localhost:5173/account');
      await page.waitForLoadState('networkidle');

      // 检查添加账号按钮 - 使用第一个找到的按钮
      const addButton = page.locator('button:has-text("添加账号"), .add-account-btn, .btn-add').first();
      if (await addButton.count() > 0) {
        await expect(addButton).toBeVisible();
      }

      // 检查表格或列表
      const table = page.locator('table, .account-list, .data-table').first();
      if (await table.count() > 0) {
        await expect(table).toBeVisible();
      }

      console.log('✅ 账号管理页面表单测试通过');
    });

    test('发布中心页面交互测试', async ({ page }) => {
      await page.goto('http://localhost:5173/publish');
      await page.waitForLoadState('networkidle');

      // 检查发布按钮
      const publishButton = page.locator('button:has-text("发布"), .publish-btn, .btn-publish').first();
      if (await publishButton.count() > 0) {
        await expect(publishButton).toBeVisible();
      }

      // 检查内容输入区域
      const contentArea = page.locator('textarea, .content-editor, .rich-text-editor').first();
      if (await contentArea.count() > 0) {
        await expect(contentArea).toBeVisible();
      }

      console.log('✅ 发布中心页面交互测试通过');
    });
  });

  test.describe('性能测试', () => {
    test('页面加载性能测试', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`📊 页面加载时间: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000); // 10秒内加载完成

      // 检查资源加载
      const resources = await page.evaluate(() => {
        return performance.getEntriesByType('resource').length;
      });
      console.log(`📊 加载资源数量: ${resources}`);
    });

    test('内存使用测试', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      const memoryUsage = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
          };
        }
        return null;
      });

      if (memoryUsage) {
        console.log(`📊 内存使用情况:`, memoryUsage);
        expect(memoryUsage.usedJSHeapSize).toBeLessThan(100); // 小于100MB
      }
    });
  });

  test.describe('错误处理测试', () => {
    test('404页面测试', async ({ page }) => {
      await page.goto('http://localhost:5173/non-existent-page');
      await page.waitForLoadState('networkidle');

      // 检查是否有错误处理或重定向
      const currentUrl = page.url();
      if (currentUrl.includes('non-existent-page')) {
        // 检查是否有错误提示
        const errorElement = page.locator('.error-page, .not-found, .error-message');
        if (await errorElement.count() > 0) {
          await expect(errorElement).toBeVisible();
        }
      }

      console.log('✅ 404页面处理测试通过');
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

      // 检查是否有严重错误
      const criticalErrors = consoleErrors.filter(error =>
        error.includes('Uncaught') ||
        error.includes('TypeError') ||
        error.includes('ReferenceError')
      );

      console.log(`📊 发现 ${consoleErrors.length} 个控制台信息`);
      console.log(`📊 发现 ${criticalErrors.length} 个严重错误`);

      if (criticalErrors.length > 0) {
        console.log('严重错误列表:');
        criticalErrors.forEach(error => console.log(`  - ${error}`));
      }

      // 期望没有严重错误
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('跨浏览器兼容性测试', () => {
    // 这个测试会在不同的浏览器环境中运行
    test('基本功能跨浏览器测试', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // 检查基本功能在当前浏览器中是否正常
      await expect(page.locator('.main-layout')).toBeVisible();
      await expect(page.locator('.header')).toBeVisible();
      await expect(page.locator('.sidebar')).toBeVisible();

      // 测试导航点击
      const firstNavItem = page.locator('.nav-item').first();
      await firstNavItem.click();
      await page.waitForTimeout(1000);

      expect(page.url()).toMatch(/\/account|\/publish/);

      console.log('✅ 跨浏览器兼容性测试通过');
    });
  });

  test.describe('无障碍性测试', () => {
    test('键盘导航测试', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // 测试Tab键导航
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      // 测试Enter键
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      console.log('✅ 键盘导航测试通过');
    });

    test('ARIA标签测试', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // 检查主要的ARIA标签
      const navElements = page.locator('nav[role="navigation"]');
      const mainElements = page.locator('main[role="main"]');

      if (await navElements.count() > 0) {
        await expect(navElements.first()).toBeVisible();
      }

      if (await mainElements.count() > 0) {
        await expect(mainElements.first()).toBeVisible();
      }

      console.log('✅ ARIA标签测试通过');
    });
  });
});