const { test, expect } = require('@playwright/test');

test('抖音登录完整流程测试', async ({ page }) => {
  console.log('🚀 开始抖音登录完整流程测试...');

  // 监听控制台消息
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('登录') || text.includes('二维码') || text.includes('error') || text.includes('EventSource')) {
      console.log(`控制台消息: ${text}`);
    }
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

  // 点击添加账号按钮
  const modalAddBtn = page.locator('.modal-container button:has-text("添加账号")').first();
  await modalAddBtn.click();
  console.log('🔘 点击添加账号按钮');

  // 等待更长时间让登录流程完成
  await page.waitForTimeout(15000);

  // 检查二维码是否显示
  const qrCode = page.locator('.qr-code, img[src*="data:image"]').first();
  const qrCodeVisible = await qrCode.isVisible();
  console.log(`📱 二维码显示状态: ${qrCodeVisible}`);

  // 检查是否有消息显示
  const messageContainer = page.locator('.message-container').first();
  const messageVisible = await messageContainer.isVisible();
  console.log(`📝 消息容器显示状态: ${messageVisible}`);

  if (messageVisible) {
    const messageText = await messageContainer.textContent();
    console.log(`📝 消息内容: ${messageText}`);
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

  // 检查模态窗口是否还在
  const modal = page.locator('.modal-overlay').first();
  const modalVisible = await modal.isVisible();
  console.log(`🔲 模态窗口显示状态: ${modalVisible}`);

  // 如果模态窗口关闭了，说明登录流程完成
  if (!modalVisible) {
    console.log('✅ 模态窗口已关闭，登录流程可能完成');
  }

  // 最终断言 - 重点检查是否有错误信息
  expect(errorVisible).toBe(false);

  console.log('🎉 抖音登录完整流程测试完成！');
});