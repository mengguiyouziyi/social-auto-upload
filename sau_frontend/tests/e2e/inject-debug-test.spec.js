const { test, expect } = require('@playwright/test');

test('注入调试测试', async ({ page }) => {
  console.log('🔍 开始注入调试测试...');

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
  await page.waitForTimeout(3000);

  // 填写账号ID
  const accountIdInput = page.locator('input[placeholder*="账号"], input[placeholder*="ID"], #accountId').first();
  await accountIdInput.fill('test_debug_001');

  // 在页面中注入调试代码来检查按钮事件
  await page.evaluate(() => {
    console.log('🔍 开始注入调试代码...');

    // 查找添加按钮
    const addButton = document.querySelector('.add-btn, .modal-container button:has-text("添加账号")');
    if (addButton) {
      console.log('✅ 找到添加按钮');

      // 保存原始的点击事件
      const originalClick = addButton.onclick;

      // 添加新的点击事件
      addButton.addEventListener('click', function(e) {
        console.log('🔘 添加按钮被点击了！');

        // 检查 Vue 组件的方法
        const vueComponent = document.querySelector('.modal-container').__vueParentComponent;
        if (vueComponent && vueComponent.ctx) {
          console.log('✅ 找到 Vue 组件');
          if (vueComponent.ctx.addAccount) {
            console.log('✅ 找到 addAccount 方法');
            try {
              vueComponent.ctx.addAccount();
              console.log('✅ addAccount 方法执行成功');
            } catch (error) {
              console.error('❌ addAccount 方法执行失败:', error);
            }
          } else {
            console.log('❌ 未找到 addAccount 方法');
          }
        } else {
          console.log('❌ 未找到 Vue 组件');
        }
      }, true);

      console.log('✅ 调试事件监听器已添加');
    } else {
      console.log('❌ 未找到添加按钮');
    }
  });

  // 等待一下让注入代码生效
  await page.waitForTimeout(1000);

  // 点击添加按钮
  const modalAddBtn = page.locator('.add-btn, .modal-container button:has-text("添加账号")').first();
  await modalAddBtn.click();
  console.log('🔘 点击了添加按钮');

  // 等待一段时间观察结果
  await page.waitForTimeout(10000);

  // 检查结果
  const qrCode = page.locator('.qr-code, img[src*="data:image"]').first();
  const qrCodeVisible = await qrCode.isVisible();
  console.log(`📱 二维码可见: ${qrCodeVisible}`);

  const messageContainer = page.locator('.message-container').first();
  const messageVisible = await messageContainer.isVisible();
  console.log(`📝 消息容器可见: ${messageVisible}`);

  console.log('🔍 注入调试测试完成！');
});