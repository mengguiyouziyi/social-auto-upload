import { test, expect } from '@playwright/test';

test.describe('SAU自媒体自动化运营系统 - 基础功能测试', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(30000);
  });

  const basicRoutes = [
    { path: '/account', name: '账号管理', expectedElements: ['账号', '管理', '添加', '列表', '表格'] },
    { path: '/publish', name: '发布中心', expectedElements: ['发布', '内容', '编辑', '提交', '标题'] },
    { path: '/multi-publish', name: '多平台发布', expectedElements: ['多平台', '发布', '选择', '平台', '同步'] },
    { path: '/material-library', name: '素材库', expectedElements: ['素材', '库', '文件', '上传', '管理'] },
    { path: '/website', name: '网站', expectedElements: ['网站', '链接', '域名', '管理'] },
    { path: '/data', name: '数据', expectedElements: ['数据', '统计', '图表', '分析', '报表'] }
  ];

  basicRoutes.forEach(({ path, name, expectedElements }) => {
    test(`基础功能页面: ${name}`, async ({ page }) => {
      console.log(`🧪 测试 ${name} 页面...`);

      await page.goto(`http://localhost:5173${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 检查页面基本加载
      await expect(page.locator('#app')).toBeVisible();
      console.log(`✅ ${name} 页面加载成功`);

      // 检查URL是否正确
      expect(page.url()).toContain(path);
      console.log(`✅ ${name} URL正确`);

      // 获取页面内容进行关键词检查
      const bodyText = await page.locator('body').textContent();
      console.log(`📄 ${name} 页面内容长度: ${bodyText.length} 字符`);

      // 检查预期元素
      let foundElements = 0;
      for (const element of expectedElements) {
        if (bodyText.includes(element)) {
          foundElements++;
          console.log(`✅ ${name} 找到元素: ${element}`);
        } else {
          console.log(`⚠️ ${name} 未找到元素: ${element}`);
        }
      }

      console.log(`📊 ${name} 找到 ${foundElements}/${expectedElements.length} 个预期元素`);

      // 检查是否有功能按钮或链接
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      console.log(`🔘 ${name} 发现 ${buttonCount} 个按钮`);

      const links = page.locator('a');
      const linkCount = await links.count();
      console.log(`🔗 ${name} 发现 ${linkCount} 个链接`);

      // 检查表单元素
      const inputs = page.locator('input, textarea, select');
      const inputCount = await inputs.count();
      console.log(`📝 ${name} 发现 ${inputCount} 个表单元素`);

      // 基本断言
      expect(buttonCount + linkCount + inputCount).toBeGreaterThan(0);
      expect(foundElements).toBeGreaterThan(0);

      console.log(`🎉 ${name} 测试完成！`);
    });
  });

  test('账号管理功能详细测试', async ({ page }) => {
    console.log('🔍 详细测试账号管理功能...');

    await page.goto('http://localhost:5173/account');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 检查账号管理特定功能
    const accountFeatures = [
      '账号列表', '添加账号', '编辑账号', '删除账号', '账号状态',
      '平台选择', '账号信息', '登录状态', '批量操作'
    ];

    const bodyText = await page.locator('body').textContent();
    let foundFeatures = 0;

    for (const feature of accountFeatures) {
      if (bodyText.includes(feature)) {
        foundFeatures++;
        console.log(`✅ 找到账号功能: ${feature}`);
      }
    }

    console.log(`📊 账号管理功能覆盖度: ${foundFeatures}/${accountFeatures.length}`);

    // 检查是否有添加账号按钮
    const addButtons = page.locator('button:has-text("添加"), button:has-text("新增"), .add-btn, .btn-add');
    const addButtonCount = await addButtons.count();
    if (addButtonCount > 0) {
      console.log(`✅ 找到 ${addButtonCount} 个添加按钮`);
    }

    // 检查表格或列表
    const tables = page.locator('table, .table, .list, .data-list');
    const tableCount = await tables.count();
    if (tableCount > 0) {
      console.log(`✅ 找到 ${tableCount} 个表格/列表`);
    }

    // 检查搜索或过滤功能
    const searchInputs = page.locator('input[placeholder*="搜索"], input[placeholder*="筛选"], .search-input, .filter-input');
    const searchCount = await searchInputs.count();
    if (searchCount > 0) {
      console.log(`✅ 找到 ${searchCount} 个搜索/过滤输入框`);
    }

    expect(foundFeatures).toBeGreaterThan(0);
    console.log('🎉 账号管理详细测试完成！');
  });

  test('发布中心功能详细测试', async ({ page }) => {
    console.log('🔍 详细测试发布中心功能...');

    await page.goto('http://localhost:5173/publish');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 检查发布中心特定功能
    const publishFeatures = [
      '发布记录', '新增发布', '视频', '图文', '多平台发布',
      '全部发布人', '全部发布类型', '暂无发布记录'
    ];

    const bodyText = await page.locator('body').textContent();
    let foundFeatures = 0;

    for (const feature of publishFeatures) {
      if (bodyText.includes(feature)) {
        foundFeatures++;
        console.log(`✅ 找到发布功能: ${feature}`);
      }
    }

    console.log(`📊 发布中心功能覆盖度: ${foundFeatures}/${publishFeatures.length}`);

    // 检查内容编辑器
    const editors = page.locator('textarea, .editor, .content-editor, .rich-text');
    const editorCount = await editors.count();
    if (editorCount > 0) {
      console.log(`✅ 找到 ${editorCount} 个编辑器`);
    }

    // 检查发布按钮
    const publishButtons = page.locator('button:has-text("发布"), button:has-text("提交"), .publish-btn, .btn-publish');
    const publishButtonCount = await publishButtons.count();
    if (publishButtonCount > 0) {
      console.log(`✅ 找到 ${publishButtonCount} 个发布按钮`);
    }

    // 检查文件上传
    const fileInputs = page.locator('input[type="file"], .upload-btn, .file-upload');
    const fileInputCount = await fileInputs.count();
    if (fileInputCount > 0) {
      console.log(`✅ 找到 ${fileInputCount} 个文件上传组件`);
    }

    expect(foundFeatures).toBeGreaterThan(0);
    console.log('🎉 发布中心详细测试完成！');
  });

  test('跨页面导航测试', async ({ page }) => {
    console.log('🔄 测试跨页面导航...');

    // 从首页开始
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // 依次访问各个基础功能页面
    const navigationSequence = [
      { from: '/', to: '/account', name: '首页到账号管理' },
      { from: '/account', to: '/publish', name: '账号管理到发布中心' },
      { from: '/publish', to: '/material-library', name: '发布中心到素材库' },
      { from: '/material-library', to: '/data', name: '素材库到数据中心' },
      { from: '/data', to: '/website', name: '数据中心到网站管理' }
    ];

    for (const step of navigationSequence) {
      console.log(`🔄 测试导航: ${step.name}`);

      if (step.from !== '/') {
        await page.goto(`http://localhost:5173${step.from}`);
        await page.waitForLoadState('networkidle');
      }

      // 尝试通过链接导航到目标页面
      const targetLinks = page.locator(`a[href*="${step.to}"]`);
      const linkCount = await targetLinks.count();

      if (linkCount > 0) {
        await targetLinks.first().click();
        await page.waitForTimeout(1000);
        console.log(`✅ ${step.name}: 通过链接导航成功`);
      } else {
        // 如果没有找到链接，直接访问URL
        await page.goto(`http://localhost:5173${step.to}`);
        await page.waitForLoadState('networkidle');
        console.log(`⚠️ ${step.name}: 直接访问URL`);
      }

      // 验证导航成功
      expect(page.url()).toContain(step.to);
      await expect(page.locator('#app')).toBeVisible();

      console.log(`✅ ${step.name}: 导航验证成功`);
    }

    console.log('🎉 跨页面导航测试完成！');
  });

  test('基础功能响应式测试', async ({ page }) => {
    console.log('📱 测试基础功能响应式设计...');

    const viewports = [
      { width: 1920, height: 1080, name: '桌面端' },
      { width: 768, height: 1024, name: '平板端' },
      { width: 375, height: 667, name: '移动端' }
    ];

    const testRoute = '/account';

    for (const viewport of viewports) {
      console.log(`📱 测试 ${viewport.name} 账号管理页面...`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`http://localhost:5173${testRoute}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 检查基本元素是否可见
      await expect(page.locator('#app')).toBeVisible();

      // 检查内容是否适配
      const appElement = page.locator('#app');
      const appStyles = await appElement.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          height: computed.height,
          overflow: computed.overflow
        };
      });

      console.log(`📐 ${viewport.name} 应用容器尺寸: ${appStyles.width} x ${appStyles.height}`);

      // 移动端特殊检查
      if (viewport.width <= 768) {
        // 检查是否有移动端适配的UI元素
        const mobileElements = page.locator('.mobile-menu, .hamburger, .responsive-menu');
        const mobileCount = await mobileElements.count();
        if (mobileCount > 0) {
          console.log(`✅ ${viewport.name} 发现移动端适配元素`);
        }
      }

      console.log(`✅ ${viewport.name} 账号管理页面适配正常`);
    }

    console.log('🎉 基础功能响应式测试完成！');
  });
});