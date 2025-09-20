const { test, expect } = require('@playwright/test');

test('模态窗口详细测试', async ({ page }) => {
  console.log('🔍 开始模态窗口详细测试...');

  // 监听所有控制台消息
  page.on('console', msg => {
    console.log(`💻 控制台: ${msg.text()}`);
  });

  // 监听所有网络请求
  page.on('request', request => {
    if (request.url().includes('/login')) {
      console.log(`📡 登录请求: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/login')) {
      console.log(`📥 登录响应: ${response.status()}`);
    }
  });

  // 访问应用
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 访问账号管理页面
  await page.goto('http://localhost:5173/account');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 截图查看当前状态
  await page.screenshot({ path: 'before-click.png', fullPage: true });

  // 点击添加账号按钮
  console.log('🔘 点击添加账号按钮...');
  const addAccountBtn = page.locator('button:has-text("添加账号")').first();

  // 检查按钮是否存在和可见
  const btnExists = await addAccountBtn.isVisible();
  console.log(`🔘 按钮存在且可见: ${btnExists}`);

  if (!btnExists) {
    console.log('❌ 添加账号按钮不可见');
    return;
  }

  await addAccountBtn.click();
  await page.waitForTimeout(3000);

  // 截图查看点击后状态
  await page.screenshot({ path: 'after-click.png', fullPage: true });

  // 详细检查模态窗口
  console.log('🔍 检查模态窗口...');

  // 检查 modal-overlay
  const modalOverlay = page.locator('.modal-overlay').first();
  const overlayVisible = await modalOverlay.isVisible();
  console.log(`🔲 modal-overlay 可见: ${overlayVisible}`);

  // 检查 modal-container
  const modalContainer = page.locator('.modal-container').first();
  const containerVisible = await modalContainer.isVisible();
  console.log(`🔲 modal-container 可见: ${containerVisible}`);

  // 检查 modal-header
  const modalHeader = page.locator('.modal-header').first();
  const headerVisible = await modalHeader.isVisible();
  console.log(`🔲 modal-header 可见: ${headerVisible}`);

  if (headerVisible) {
    const headerText = await modalHeader.textContent();
    console.log(`📋 modal-header 内容: ${headerText}`);
  }

  // 检查输入框
  const accountIdInput = page.locator('input[placeholder*="账号"], input[placeholder*="ID"], #accountId').first();
  const inputVisible = await accountIdInput.isVisible();
  console.log(`📝 账号输入框可见: ${inputVisible}`);

  // 检查添加按钮
  const modalAddBtn = page.locator('.modal-container button:has-text("添加账号"), .add-btn').first();
  const modalAddBtnVisible = await modalAddBtn.isVisible();
  console.log(`🔘 模态窗口添加按钮可见: ${modalAddBtnVisible}`);

  // 如果输入框可见，填写内容
  if (inputVisible) {
    console.log('✅ 填写账号ID...');
    await accountIdInput.fill('test_douyin_001');

    // 等待一下确保填写完成
    await page.waitForTimeout(1000);

    // 验证输入框的值
    const inputValue = await accountIdInput.inputValue();
    console.log(`📝 输入框的值: ${inputValue}`);

    // 点击添加按钮
    if (modalAddBtnVisible) {
      console.log('🔘 点击模态窗口的添加按钮...');
      await modalAddBtn.click();

      // 等待登录流程
      await page.waitForTimeout(10000);

      // 最终截图
      await page.screenshot({ path: 'final-state.png', fullPage: true });

      // 检查二维码
      const qrCode = page.locator('.qr-code, img[src*="data:image"]').first();
      const qrCodeVisible = await qrCode.isVisible();
      console.log(`📱 二维码可见: ${qrCodeVisible}`);

      // 检查消息容器
      const messageContainer = page.locator('.message-container').first();
      const messageVisible = await messageContainer.isVisible();
      console.log(`📝 消息容器可见: ${messageVisible}`);

      if (messageVisible) {
        const messageText = await messageContainer.textContent();
        console.log(`📝 消息内容: ${messageText}`);
      }
    } else {
      console.log('❌ 模态窗口添加按钮不可见');
    }
  } else {
    console.log('❌ 账号输入框不可见');
  }

  console.log('🔍 模态窗口详细测试完成！');
});