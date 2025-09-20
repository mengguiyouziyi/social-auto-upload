/**
 * 测试数据配置文件
 * 包含各种测试场景所需的固定和动态测试数据
 */

const TestHelpers = require('../utils/test-helpers');

/**
 * 测试用户数据
 */
const testUsers = {
  validUser: {
    username: 'test_user',
    password: 'test_password_123',
    email: 'test@example.com',
    phone: '13800138000'
  },

  adminUser: {
    username: 'admin_user',
    password: 'admin_password_123',
    email: 'admin@example.com',
    phone: '13900139000',
    role: 'admin'
  },

  invalidUser: {
    username: 'invalid_user',
    password: 'wrong_password',
    email: 'invalid@example.com'
  },

  newUser: () => ({
    username: TestHelpers.generateRandomUsername(),
    password: 'TestPassword123!',
    email: TestHelpers.generateRandomEmail(),
    phone: TestHelpers.generateRandomPhone()
  })
};

/**
 * 测试账号数据
 */
const testAccounts = {
  wechatAccount: {
    platform: 'wechat',
    username: 'test_wechat',
    account_id: 'wx_' + TestHelpers.generateRandomString(8),
    nickname: '测试微信账号',
    avatar: 'https://placeholder.com/avatar.png',
    status: 'active'
  },

  douyinAccount: {
    platform: 'douyin',
    username: 'test_douyin',
    account_id: 'dy_' + TestHelpers.generateRandomString(8),
    nickname: '测试抖音账号',
    avatar: 'https://placeholder.com/avatar.png',
    status: 'active'
  },

  weiboAccount: {
    platform: 'weibo',
    username: 'test_weibo',
    account_id: 'wb_' + TestHelpers.generateRandomString(8),
    nickname: '测试微博账号',
    avatar: 'https://placeholder.com/avatar.png',
    status: 'active'
  },

  inactiveAccount: {
    platform: 'wechat',
    username: 'inactive_user',
    account_id: 'wx_inactive',
    nickname: '非活跃账号',
    status: 'inactive'
  },

  generateAccount: (platform = 'test') => ({
    platform: platform,
    username: TestHelpers.generateRandomUsername(),
    account_id: `${platform}_${TestHelpers.generateRandomString(8)}`,
    nickname: `测试${platform}账号`,
    avatar: 'https://placeholder.com/avatar.png',
    status: 'active'
  })
};

/**
 * 测试文件数据
 */
const testFiles = {
  textFile: {
    name: 'test_document.txt',
    content: '这是一个测试文档文件内容。\n包含多行文本。\n用于测试文件上传功能。',
    mimeType: 'text/plain',
    type: 'document'
  },

  imageFile: {
    name: 'test_image.png',
    mimeType: 'image/png',
    type: 'image'
  },

  videoFile: {
    name: 'test_video.mp4',
    mimeType: 'video/mp4',
    type: 'video',
    description: '测试视频文件'
  },

  largeFile: {
    name: 'large_file.bin',
    content: '0'.repeat(1024 * 1024), // 1MB文件
    mimeType: 'application/octet-stream',
    type: 'binary'
  },

  generateFile: (overrides = {}) => ({
    name: `test_${TestHelpers.generateRandomString()}.txt`,
    content: `自动生成的测试文件内容 - ${new Date().toISOString()}`,
    mimeType: 'text/plain',
    type: 'document',
    description: '自动生成的测试文件',
    ...overrides
  })
};

/**
 * 测试发布数据
 */
const testPublishData = {
  videoPost: {
    title: '测试视频发布',
    description: '这是一个测试视频的描述，用于测试视频发布功能。',
    tags: ['测试', '视频', '自动化'],
    visibility: 'public',
    scheduleTime: null
  },

  imagePost: {
    title: '测试图片发布',
    description: '这是一个测试图片的描述，用于测试图片发布功能。',
    tags: ['测试', '图片', '自动化'],
    visibility: 'public',
    scheduleTime: null
  },

  articlePost: {
    title: '测试文章发布',
    content: '# 测试文章\n\n这是一个测试文章的内容。\n\n## 章节1\n\n测试内容...',
    tags: ['测试', '文章', '自动化'],
    visibility: 'public',
    category: 'technology'
  },

  scheduledPost: {
    title: '定时发布测试',
    description: '这是一个定时发布的测试内容。',
    tags: ['定时', '测试'],
    visibility: 'public',
    scheduleTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后
  },

  generatePost: (type = 'video', overrides = {}) => ({
    title: `测试${type}发布_${TestHelpers.generateRandomString()}`,
    description: `这是一个测试${type}的描述，用于测试${type}发布功能。`,
    tags: ['测试', type, '自动化'],
    visibility: 'public',
    scheduleTime: null,
    ...overrides
  })
};

/**
 * 测试API数据
 */
const testAPIs = {
  claudeAI: {
    name: 'Claude AI',
    provider: 'Anthropic',
    endpoint: 'https://api.anthropic.com',
    authType: 'apikey',
    description: '强大的AI助手，提供文本生成、问答等功能',
    features: '文本生成、代码编写、多轮对话',
    pricing: '按量计费',
    type: 'ai',
    status: 'connected'
  },

  baiduAI: {
    name: '百度AI开放平台',
    provider: '百度',
    endpoint: 'https://aip.baidubce.com',
    authType: 'apikey',
    description: '提供语音识别、图像识别等多种AI服务',
    features: '语音识别、图像识别、自然语言处理',
    pricing: '免费+付费',
    type: 'ai',
    status: 'connected'
  },

  wechatAPI: {
    name: '微信API',
    provider: '腾讯',
    endpoint: 'https://api.weixin.qq.com',
    authType: 'oauth',
    description: '微信公众平台API，支持消息管理、用户管理等',
    features: '消息发送、用户管理、素材管理',
    pricing: '免费',
    type: 'social',
    status: 'connected'
  },

  generateAPI: (overrides = {}) => ({
    name: `测试API_${TestHelpers.generateRandomString()}`,
    provider: '测试提供商',
    endpoint: 'https://api.example.com',
    authType: 'apikey',
    description: '这是一个用于测试的API',
    features: '测试功能',
    pricing: '免费',
    type: 'ai',
    status: 'disconnected',
    ...overrides
  })
};

/**
 * 测试场景数据
 */
const testScenarios = {
  happyPath: {
    name: '正常流程测试',
    description: '验证系统在正常情况下的功能表现'
  },

  errorHandling: {
    name: '错误处理测试',
    description: '验证系统对各种错误情况的处理能力'
  },

  performance: {
    name: '性能测试',
    description: '验证系统在高负载情况下的性能表现'
  },

  security: {
    name: '安全测试',
    description: '验证系统的安全机制和防护能力'
  },

  edgeCases: {
    name: '边界情况测试',
    description: '验证系统在边界条件下的行为'
  },

  integration: {
    name: '集成测试',
    description: '验证各模块之间的集成和协作'
  }
};

/**
 * 测试环境配置
 */
const environmentConfig = {
  development: {
    API_BASE_URL: 'http://localhost:5409',
    TIMEOUT: 30000,
    RETRY_COUNT: 3,
    CLEANUP_AFTER_TESTS: true
  },

  staging: {
    API_BASE_URL: 'https://staging-api.example.com',
    TIMEOUT: 30000,
    RETRY_COUNT: 3,
    CLEANUP_AFTER_TESTS: true
  },

  production: {
    API_BASE_URL: 'https://api.example.com',
    TIMEOUT: 60000,
    RETRY_COUNT: 2,
    CLEANUP_AFTER_TESTS: false
  },

  testing: {
    API_BASE_URL: 'http://localhost:5409',
    TIMEOUT: 10000,
    RETRY_COUNT: 1,
    CLEANUP_AFTER_TESTS: true
  }
};

/**
 * 性能测试配置
 */
const performanceConfig = {
  responseTime: {
    fast: 1000,    // 1秒内
    normal: 3000,  // 3秒内
    slow: 5000,    // 5秒内
    critical: 10000 // 10秒内
  },

  throughput: {
    low: 10,      // 每秒10个请求
    medium: 50,   // 每秒50个请求
    high: 100,    // 每秒100个请求
    extreme: 500  // 每秒500个请求
  },

  concurrency: {
    low: 5,       // 5个并发
    medium: 10,   // 10个并发
    high: 50,     // 50个并发
    extreme: 100  // 100个并发
  }
};

/**
 * 错误码和消息
 */
const errorMessages = {
  auth: {
    invalidCredentials: '用户名或密码错误',
    tokenExpired: 'Token已过期',
    tokenInvalid: '无效的Token',
    unauthorized: '未授权访问'
  },

  validation: {
    requiredField: '必填字段不能为空',
    invalidEmail: '邮箱格式不正确',
    invalidPhone: '手机号格式不正确',
    fileTooLarge: '文件大小超过限制',
    unsupportedFileType: '不支持的文件类型'
  },

  business: {
    accountNotFound: '账号不存在',
    accountInactive: '账号已停用',
    insufficientBalance: '余额不足',
    quotaExceeded: '配额已用完',
    operationFailed: '操作失败'
  },

  system: {
    serverError: '服务器内部错误',
    serviceUnavailable: '服务暂时不可用',
    timeout: '请求超时',
    networkError: '网络错误'
  }
};

module.exports = {
  testUsers,
  testAccounts,
  testFiles,
  testPublishData,
  testAPIs,
  testScenarios,
  environmentConfig,
  performanceConfig,
  errorMessages
};