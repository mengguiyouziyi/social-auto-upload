const { test, expect } = require('@playwright/test');

test('抖音登录调试测试', async ({ page }) => {
  console.log('🔍 开始抖音登录调试测试...');

  // 监听所有网络请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/login')) {
      console.log(`📡 登录请求: ${request.method()} ${url}`);
      console.log(`📋 请求头: ${JSON.stringify(request.headers(), null, 2)}`);
      if (request.postData()) {
        console.log(`📦 请求数据: ${request.postData()}`);
      }
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/login')) {
      console.log(`📥 登录响应: ${response.status()} ${url}`);
      try {
        const headers = response.headers();
        console.log(`📋 响应头: ${JSON.stringify(headers, null, 2)}`);

        // 检查是否是SSE响应
        if (headers['content-type'] && headers['content-type'].includes('text/event-stream')) {
          console.log(`🌊 检测到SSE响应，开始监听数据流...`);

          // 尝试读取一些数据
          const body = await response.text();
          console.log(`📄 响应体 (前500字符): ${body.substring(0, 500)}`);
        }
      } catch (e) {
        console.log(`❌ 读取响应失败: ${e.message}`);
      }
    }
  });

  // 监听控制台消息
  page.on('console', msg => {
    const text = msg.text();
    console.log(`💻 控制台: ${text}`);
  });

  // 监听错误
  page.on('pageerror', error => {
    console.log(`❌ 页面错误: ${error.message}`);
  });

  // 访问应用
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 访问账号管理页面
  await page.goto('http://localhost:5173/account');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 点击添加账号按钮
  const addAccountBtn = page.locator('button:has-text("添加账号")').first();
  await addAccountBtn.click();
  await page.waitForTimeout(2000);

  // 检查模态窗口是否出现
  const modal = page.locator('.modal-overlay').first();
  const modalVisible = await modal.isVisible();
  console.log(`🔲 模态窗口显示状态: ${modalVisible}`);

  if (!modalVisible) {
    console.log('❌ 模态窗口没有显示，测试终止');
    return;
  }

  // 填写账号ID
  const accountIdInput = page.locator('input[placeholder*="账号"], input[placeholder*="ID"]').first();
  await accountIdInput.fill('test_douyin_001');
  console.log('✅ 填写账号ID: test_douyin_001');

  // 点击添加账号按钮
  const modalAddBtn = page.locator('.modal-container button:has-text("添加账号")').first();
  await modalAddBtn.click();
  console.log('🔘 点击添加账号按钮');

  // 等待更长时间观察登录流程
  await page.waitForTimeout(20000);

  // 检查最终状态
  const qrCode = page.locator('.qr-code, img[src*="data:image"]').first();
  const qrCodeVisible = await qrCode.isVisible();
  console.log(`📱 二维码显示状态: ${qrCodeVisible}`);

  const messageContainer = page.locator('.message-container').first();
  const messageVisible = await messageContainer.isVisible();
  console.log(`📝 消息容器显示状态: ${messageVisible}`);

  if (messageVisible) {
    const messageText = await messageContainer.textContent();
    console.log(`📝 消息内容: ${messageText}`);
  }

  console.log('🔍 调试测试完成！');
});