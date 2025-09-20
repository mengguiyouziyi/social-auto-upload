// API测试环境设置
const { beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');

// 全局测试配置
global.TEST_CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5409',
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT) || 30000,
  TEST_USER: {
    username: process.env.TEST_USERNAME || 'test_user',
    password: process.env.TEST_PASSWORD || 'test_password'
  },
  RETRY_COUNT: parseInt(process.env.RETRY_COUNT) || 3,
  CLEANUP_AFTER_TESTS: process.env.CLEANUP_AFTER_TESTS !== 'false'
};

// 测试环境状态管理
global.testState = {
  authToken: null,
  testUserId: null,
  createdResources: [],
  isSetup: false
};

// 测试前设置
beforeAll(async () => {
  console.log('🚀 开始API测试环境设置...');

  // 验证API服务可用性
  try {
    const axios = require('axios');
    await axios.get(`${TEST_CONFIG.API_BASE_URL}/health`, {
      timeout: 5000
    });
    console.log('✅ API服务连接正常');
  } catch (error) {
    console.warn('⚠️ API服务连接失败，使用模拟模式');
    console.warn(`错误信息: ${error.message}`);
  }

  // 设置测试用户认证
  try {
    await setupTestAuth();
    console.log('✅ 测试认证设置完成');
  } catch (error) {
    console.warn('⚠️ 测试认证设置失败:', error.message);
  }

  global.testState.isSetup = true;
  console.log('🎉 API测试环境设置完成');
});

// 每个测试前的设置
beforeEach(() => {
  // 清理测试状态
  global.testState.currentTestResources = [];
});

// 每个测试后的清理
afterEach(async () => {
  if (TEST_CONFIG.CLEANUP_AFTER_TESTS) {
    await cleanupTestResources();
  }
});

// 所有测试后的清理
afterAll(async () => {
  console.log('🧹 开始清理API测试环境...');

  if (TEST_CONFIG.CLEANUP_AFTER_TESTS) {
    await cleanupAllTestResources();
  }

  console.log('🎉 API测试环境清理完成');
});

// 设置测试认证
async function setupTestAuth() {
  const axios = require('axios');

  try {
    // 尝试获取测试token
    const response = await axios.post(`${TEST_CONFIG.API_BASE_URL}/api/auth/login`, {
      username: TEST_CONFIG.TEST_USER.username,
      password: TEST_CONFIG.TEST_USER.password
    });

    if (response.data.token) {
      global.testState.authToken = response.data.token;
      global.testState.testUserId = response.data.user.id;
    }
  } catch (error) {
    console.log('📝 使用模拟认证token');
    global.testState.authToken = 'mock_test_token_' + Date.now();
  }
}

// 清理测试资源
async function cleanupTestResources() {
  const axios = require('axios');
  const resources = global.testState.currentTestResources || [];

  for (const resource of resources) {
    try {
      switch (resource.type) {
        case 'file':
          await axios.delete(`${TEST_CONFIG.API_BASE_URL}/api/deleteFile?id=${resource.id}`, {
            headers: { Authorization: `Bearer ${global.testState.authToken}` }
          });
          break;
        case 'account':
          await axios.delete(`${TEST_CONFIG.API_BASE_URL}/api/account/${resource.id}`, {
            headers: { Authorization: `Bearer ${global.testState.authToken}` }
          });
          break;
      }
    } catch (error) {
      console.warn(`清理资源失败: ${resource.type}:${resource.id}`, error.message);
    }
  }
}

// 清理所有测试资源
async function cleanupAllTestResources() {
  // 在这里添加全局资源清理逻辑
  console.log('📊 测试统计:', {
    totalTests: expect.getState().numPassingTests + expect.getState().numFailingTests,
    passedTests: expect.getState().numPassingTests,
    failedTests: expect.getState().numFailingTests
  });
}

// 辅助函数：添加测试资源
global.addTestResource = function(resource) {
  if (!global.testState.currentTestResources) {
    global.testState.currentTestResources = [];
  }
  global.testState.currentTestResources.push(resource);
};

// 辅助函数：获取认证头
global.getAuthHeaders = function() {
  return {
    'Authorization': `Bearer ${global.testState.authToken}`,
    'Content-Type': 'application/json'
  };
};

// 辅助函数：重试机制
global.retryOperation = async function(operation, maxRetries = TEST_CONFIG.RETRY_COUNT) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`重试 ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};