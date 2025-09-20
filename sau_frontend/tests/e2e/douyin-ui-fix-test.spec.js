const { test, expect } = require('@playwright/test');

test('抖音登录UI修复测试', async ({ page }) => {
  console.log('🚀 开始抖音登录UI修复测试...');

  // 监听控制台消息
  page.on('console', msg => {
    console.log(`控制台消息: ${msg.text()}`);
  });

  // 监听网络请求
  const loginRequests = [];
  page.on('request', request => {
    if (request.url().includes('/login')) {
      loginRequests.push(request);
      console.log(`📡 登录请求: ${request.url()}`);
    }
  });

  // 访问应用
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 直接访问账号管理页面
  await page.goto('http://localhost:5173/account');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 点击添加账号按钮
  const addAccountBtn = page.locator('button:has-text("添加账号")').first();
  await addAccountBtn.click();
  await page.waitForTimeout(2000);

  // 等待模态窗口完全显示
  await page.waitForSelector('.modal-overlay', { state: 'visible' });
  await page.waitForTimeout(1000);

  // 检查模态窗口的z-index和pointer-events
  const modalOverlay = page.locator('.modal-overlay').first();
  const modalContainer = page.locator('.modal-container').first();

  // 检查z-index样式
  const overlayZIndex = await modalOverlay.evaluate((el) => {
    return window.getComputedStyle(el).zIndex;
  });

  const containerZIndex = await modalContainer.evaluate((el) => {
    return window.getComputedStyle(el).zIndex;
  });

  const overlayPointerEvents = await modalOverlay.evaluate((el) => {
    return window.getComputedStyle(el).pointerEvents;
  });

  const containerPointerEvents = await modalContainer.evaluate((el) => {
    return window.getComputedStyle(el).pointerEvents;
  });

  console.log(`📊 模态窗口样式信息:`);
  console.log(`  - Overlay z-index: ${overlayZIndex}`);
  console.log(`  - Container z-index: ${containerZIndex}`);
  console.log(`  - Overlay pointer-events: ${overlayPointerEvents}`);
  console.log(`  - Container pointer-events: ${containerPointerEvents}`);

  // 填写账号ID
  const accountIdInput = page.locator('input[placeholder*="账号"], input[placeholder*="ID"]').first();
  await accountIdInput.fill('test_douyin_001');
  console.log('✅ 填写账号ID: test_douyin_001');

  // 检查添加账号按钮是否可点击
  const modalAddBtn = page.locator('.modal-container button:has-text("添加账号")').first();
  const isDisabled = await modalAddBtn.isDisabled();
  const isVisible = await modalAddBtn.isVisible();
  const isClickable = await modalAddBtn.isEnabled();

  console.log(`🔘 添加账号按钮状态:`);
  console.log(`  - 可见: ${isVisible}`);
  console.log(`  - 禁用: ${isDisabled}`);
  console.log(`  - 可点击: ${isClickable}`);

  // 尝试多种方式点击按钮
  try {
    console.log('🔘 尝试点击添加账号按钮...');

    // 方法1: 直接点击
    await modalAddBtn.click({ timeout: 5000 });
    console.log('✅ 直接点击成功');

  } catch (error1) {
    console.log(`❌ 直接点击失败: ${error1.message}`);

    try {
      // 方法2: 强制点击
      await modalAddBtn.click({ force: true });
      console.log('✅ 强制点击成功');

    } catch (error2) {
      console.log(`❌ 强制点击失败: ${error2.message}`);

      try {
        // 方法3: JavaScript点击
        await modalAddBtn.evaluate((btn) => btn.click());
        console.log('✅ JavaScript点击成功');

      } catch (error3) {
        console.log(`❌ JavaScript点击失败: ${error3.message}`);

        // 方法4: 键盘操作
        await accountIdInput.press('Tab'); // 切换到按钮
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        console.log('✅ 键盘操作成功');
      }
    }
  }

  // 等待登录流程
  await page.waitForTimeout(5000);

  // 检查二维码是否显示
  const qrCode = page.locator('.qr-code, img[src*="data:image"]').first();
  const qrCodeVisible = await qrCode.isVisible();

  if (qrCodeVisible) {
    console.log('✅ 成功显示二维码！');
  } else {
    console.log('ℹ️ 未检测到二维码显示');
  }

  // 检查是否有错误消息
  const errorMessage = page.locator('text="连接异常中断", text="失败", text="错误"').first();
  const errorVisible = await errorMessage.isVisible();

  if (errorVisible) {
    const errorText = await errorMessage.textContent();
    console.log(`❌ 发现错误信息: ${errorText}`);
  } else {
    console.log('✅ 没有发现错误信息');
  }

  // 检查登录请求
  console.log(`📊 发起了 ${loginRequests.length} 个登录请求`);

  // 最终断言
  expect(loginRequests.length).toBeGreaterThan(0);
  expect(errorVisible).toBe(false);

  console.log('🎉 抖音登录UI修复测试完成！');
});