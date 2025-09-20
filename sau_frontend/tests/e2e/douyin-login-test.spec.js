const { test, expect } = require('@playwright/test');

test.describe('抖音账号登录功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置超时时间
    test.setTimeout(60000);

    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`控制台错误: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`页面错误: ${error.message}`);
    });
  });

  test('抖音账号添加和登录流程测试', async ({ page }) => {
    console.log('🚀 开始抖音登录功能测试...');

    // 访问应用
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 查找账号管理导航
    const accountNav = page.locator('text="账号", text="账户", text="Account", .nav-item:has-text("账号")');

    if (await accountNav.count() > 0) {
      console.log('🔍 找到账号管理导航，点击进入...');
      await accountNav.first().click();
      await page.waitForTimeout(2000);
    }

    // 查找添加账号按钮
    const addAccountButton = page.locator('button:has-text("添加账号"), button:has-text("新增"), button:has-text("+"), .add-btn, .el-button:has-text("添加")');

    if (await addAccountButton.count() > 0) {
      console.log('➕ 找到添加账号按钮，点击...');
      await addAccountButton.first().click();
      await page.waitForTimeout(1000);
    } else {
      // 尝试查找抖音相关的添加按钮
      const douyinAddButton = page.locator('text="抖音", .platform-card, .add-douyin-btn');
      if (await douyinAddButton.count() > 0) {
        console.log('🔍 找到抖音相关按钮，点击...');
        await douyinAddButton.first().click();
        await page.waitForTimeout(1000);
      }
    }

    // 查找添加抖音账号的特定按钮
    const douyinButton = page.locator('text="抖音", .douyin-btn, [data-platform="douyin"]');
    if (await douyinButton.count() > 0) {
      console.log('🎵 找到抖音按钮，点击...');
      await douyinButton.first().click();
      await page.waitForTimeout(1000);
    }

    // 等待模态窗口出现
    await page.waitForTimeout(2000);

    // 查找账号ID输入框
    const accountIdInput = page.locator('input[placeholder*="账号"], input[placeholder*="ID"], input[placeholder*="手机"], input[placeholder*="用户"], input[type="text"]').first();

    if (await accountIdInput.count() > 0) {
      console.log('📝 找到账号ID输入框，填写测试账号...');
      await accountIdInput.fill('test_douyin_001');
      console.log('✅ 填写账号ID: test_douyin_001');
    } else {
      console.log('❌ 未找到账号ID输入框');
      // 尝试其他可能的输入框
      const allInputs = page.locator('input:not([type="hidden"])');
      const inputCount = await allInputs.count();
      console.log(`📋 发现 ${inputCount} 个输入框`);

      if (inputCount > 0) {
        await allInputs.first().fill('test_douyin_001');
        console.log('✅ 在第一个输入框填写账号ID');
      }
    }

    // 查找添加/登录按钮
    const loginButton = page.locator('button:has-text("添加账号"), button:has-text("登录"), button:has-text("确定"), button:has-text("提交"), .el-button:has-text("添加"), .add-btn').first();

    if (await loginButton.count() > 0) {
      console.log('🔘 找到登录按钮，点击开始登录流程...');
      await loginButton.click();

      // 等待登录流程开始
      await page.waitForTimeout(3000);

      // 检查是否出现二维码
      const qrCode = page.locator('.qr-code, img[alt*="二维码"], img[src*="data:image"]');

      if (await qrCode.count() > 0) {
        console.log('🖼️ 成功显示二维码！');

        // 等待登录过程完成
        await page.waitForTimeout(8000); // 等待8秒让登录流程完成

        // 检查是否有成功消息
        const successMessage = page.locator('text="成功", text="登录成功", .success-message, .el-message--success');
        if (await successMessage.count() > 0) {
          console.log('✅ 登录成功！');
        } else {
          console.log('ℹ️ 登录流程进行中或已完成');
        }

        // 检查模态窗口是否自动关闭
        const modal = page.locator('.modal-overlay, .el-dialog, .add-account-modal');
        if (await modal.count() === 0 || !(await modal.first().isVisible())) {
          console.log('✅ 模态窗口已自动关闭，登录流程完成');
        }

      } else {
        console.log('❌ 未显示二维码，检查是否有错误信息');

        // 检查错误信息
        const errorMessage = page.locator('text="连接异常中断", text="失败", text="错误", .error-message, .el-message--error');
        if (await errorMessage.count() > 0) {
          const errorText = await errorMessage.first().textContent();
          console.log(`❌ 发现错误信息: ${errorText}`);
        }
      }
    } else {
      console.log('❌ 未找到登录按钮');

      // 尝试查找任何可点击的按钮
      const allButtons = page.locator('button:not([disabled])');
      const buttonCount = await allButtons.count();
      console.log(`📋 发现 ${buttonCount} 个可点击按钮`);

      if (buttonCount > 0) {
        console.log('🔘 尝试点击第一个可用按钮...');
        await allButtons.first().click();
        await page.waitForTimeout(2000);
      }
    }

    // 最终检查页面状态
    await page.waitForTimeout(2000);
    console.log('📊 抖音登录功能测试完成');
  });

  test('检查抖音登录相关的网络请求', async ({ page }) => {
    console.log('🔍 监控抖音登录相关的网络请求...');

    // 监听网络请求
    const loginRequests = [];
    page.on('request', request => {
      if (request.url().includes('/login') && request.url().includes('type=3')) {
        loginRequests.push(request);
        console.log(`📡 发现登录请求: ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/login') && response.url().includes('type=3')) {
        console.log(`📨 收到登录响应: ${response.status()} - ${response.url()}`);
      }
    });

    // 访问应用
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 导航到账号管理
    const accountNav = page.locator('text="账号", text="账户", .nav-item:has-text("账号")');
    if (await accountNav.count() > 0) {
      await accountNav.first().click();
      await page.waitForTimeout(2000);
    }

    console.log(`📊 总共发起 ${loginRequests.length} 个登录请求`);

    if (loginRequests.length > 0) {
      console.log('✅ 成功检测到登录请求');
    } else {
      console.log('❌ 未检测到登录请求');
    }
  });
});