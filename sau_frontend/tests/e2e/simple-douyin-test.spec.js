const { test, expect } = require('@playwright/test');

test('抖音登录功能简单测试', async ({ page }) => {
  console.log('🚀 开始抖音登录功能简单测试...');

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

  // 填写账号ID
  const accountIdInput = page.locator('input[placeholder*="账号"], input[placeholder*="ID"]').first();
  await accountIdInput.fill('test_douyin_001');
  console.log('✅ 填写账号ID: test_douyin_001');

  // 点击添加账号按钮（模态窗口中的）
  const modalAddBtn = page.locator('.modal-container button:has-text("添加账号")').first();

  // 使用force点击来避免被遮挡的问题
  await modalAddBtn.click({ force: true });
  console.log('🔘 点击添加账号按钮（force=true）');

  // 等待登录流程
  await page.waitForTimeout(10000);

  // 检查是否有二维码显示
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

  // 检查模态窗口是否还在
  const modal = page.locator('.modal-overlay').first();
  const modalVisible = await modal.isVisible();

  if (!modalVisible) {
    console.log('✅ 模态窗口已关闭，登录流程可能完成');
  } else {
    console.log('ℹ️ 模态窗口仍然可见');
  }

  // 最终断言
  expect(loginRequests.length).toBeGreaterThan(0);
  expect(errorVisible).toBe(false);

  console.log('🎉 抖音登录功能测试完成！');
});