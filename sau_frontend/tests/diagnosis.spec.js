const { test, expect } = require('@playwright/test');

test('前端页面基本诊断', async ({ page }) => {
  console.log('🔍 开始前端页面诊断...');

  // 监听控制台消息
  page.on('console', msg => {
    console.log(`📝 Console ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`❌ 页面错误: ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`❌ 请求失败: ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    // 访问前端页面
    console.log('🌐 访问 http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 获取页面标题
    const title = await page.title();
    console.log(`📄 页面标题: ${title}`);

    // 检查页面内容
    const bodyContent = await page.textContent('body');
    console.log(`📄 Body内容长度: ${bodyContent.length}`);
    console.log(`📄 Body内容预览: ${bodyContent.substring(0, 200)}...`);

    // 检查是否有根元素
    const rootElement = await page.$('#app');
    if (rootElement) {
      console.log('✅ 找到Vue根元素 #app');

      // 检查根元素内容
      const rootContent = await rootElement.textContent();
      console.log(`📄 根元素内容: ${rootContent ? rootContent.substring(0, 100) : '空'}...`);
    } else {
      console.log('❌ 未找到Vue根元素 #app');
    }

    // 检查Vue是否已挂载
    const vueMounted = await page.evaluate(() => {
      return typeof window.Vue !== 'undefined' ||
             document.querySelector('[data-v-]') !== null;
    });

    console.log(`🔧 Vue检测: ${vueMounted ? '已检测到Vue' : '未检测到Vue'}`);

    // 截图保存
    await page.screenshot({ path: 'frontend-diagnosis.png', fullPage: true });
    console.log('📸 已保存诊断截图: frontend-diagnosis.png');

    // 检查网络请求
    console.log('🌐 检查主要资源加载...');
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(r => ({
        name: r.name,
        type: r.initiatorType,
        duration: r.duration,
        status: 'success'
      }));
    });

    console.log(`📊 加载了 ${resources.length} 个资源`);
    resources.forEach(r => {
      console.log(`   ${r.type}: ${r.name.split('/').pop()} (${r.duration.toFixed(0)}ms)`);
    });

  } catch (error) {
    console.error(`💥 诊断过程中出错: ${error.message}`);
    await page.screenshot({ path: 'frontend-error.png', fullPage: true });
  }
});

test('后端API连接测试', async ({ page }) => {
  console.log('🔗 测试后端API连接...');

  try {
    const response = await page.request.get('http://localhost:5409/health');
    console.log(`✅ 后端健康检查: ${response.status()}`);

    const data = await response.json();
    console.log(`📊 后端状态: ${JSON.stringify(data)}`);

  } catch (error) {
    console.error(`❌ 后端连接失败: ${error.message}`);
  }
});