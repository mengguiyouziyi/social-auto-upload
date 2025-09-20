# SAU API测试体系

## 概述

本测试体系为SAU自媒体自动化运营系统提供完整的API测试解决方案，包括单元测试、集成测试、端到端测试和性能测试。

## 目录结构

```
tests/api/
├── package.json                 # API测试依赖配置
├── setup.js                    # 测试环境设置
├── README.md                   # 本文档
├── integration/               # 集成测试
│   ├── auth-api.test.js      # 认证API测试
│   ├── accounts-api.test.js  # 账号管理API测试
│   ├── files-api.test.js     # 文件管理API测试
│   └── publishing-api.test.js # 内容发布API测试
├── e2e/                      # 端到端测试
│   ├── api-playwright-integration.spec.js  # API与Playwright集成测试
│   └── api-performance.spec.js               # API性能测试
├── utils/                    # 测试工具
│   ├── api-client.js        # API客户端封装
│   ├── test-helpers.js      # 测试辅助工具
│   └── test-runner.js       # 测试运行器
└── fixtures/                 # 测试数据
    └── test-data.js         # 测试数据配置
```

## 技术栈

- **测试框架**: Jest + Playwright
- **HTTP客户端**: Axios
- **API测试**: Supertest
- **辅助工具**: 自定义测试工具类

## 快速开始

### 1. 安装依赖

```bash
cd tests/api
npm install
```

### 2. 环境配置

创建环境变量文件 `.env`：

```env
API_BASE_URL=http://localhost:5409
API_TIMEOUT=30000
TEST_USERNAME=test_user
TEST_PASSWORD=test_password
CLEANUP_AFTER_TESTS=true
```

### 3. 运行测试

```bash
# 运行所有API测试
npm run test:api

# 运行集成测试
npm run test:api:integration

# 运行E2E测试
npm run test:api:e2e

# 运行覆盖率测试
npm run test:api:coverage

# 运行监视模式
npm run test:api:watch
```

### 4. 使用测试运行器

```javascript
const TestRunner = require('./utils/test-runner');

const runner = new TestRunner();

// 验证环境
await runner.validateEnvironment();

// 运行所有测试
const results = await runner.runAllTests();

// 生成报告
await runner.generateReport(results);
```

## 测试类型

### 单元测试
- 验证API端点的基本功能
- 测试参数验证
- 错误处理测试

### 集成测试
- 认证流程测试
- 账号管理测试
- 文件操作测试
- 内容发布测试

### 端到端测试
- API与前端集成测试
- 跨页面数据一致性验证
- 响应式设计测试

### 性能测试
- 响应时间测试
- 并发性能测试
- 负载测试
- 资源使用监控

## 测试数据

测试数据位于 `fixtures/test-data.js`，包含：

- 测试用户数据
- 测试账号数据
- 测试文件数据
- 测试发布数据
- 性能测试配置

## 配置选项

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `API_BASE_URL` | API服务地址 | `http://localhost:5409` |
| `API_TIMEOUT` | API超时时间(毫秒) | `30000` |
| `TEST_USERNAME` | 测试用户名 | `test_user` |
| `TEST_PASSWORD` | 测试密码 | `test_password` |
| `CLEANUP_AFTER_TESTS` | 测试后清理资源 | `true` |
| `RETRY_COUNT` | 重试次数 | `3` |

### 性能配置

```javascript
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
```

## 报告生成

测试完成后会自动生成：

1. **JSON报告**: `test-results/api/api-test-report-{timestamp}.json`
2. **HTML报告**: `test-results/api/api-test-report-{timestamp}.html`
3. **覆盖率报告**: `coverage/api/`

## 自定义测试

### 添加新的API测试

```javascript
const { test, expect } = require('@jest/globals');
const SAUAPIClient = require('../utils/api-client');
const TestHelpers = require('../utils/test-helpers');

describe('新API测试', () => {
  let apiClient;

  beforeAll(() => {
    apiClient = new SAUAPIClient();
  });

  test('测试新功能', async () => {
    const response = await apiClient.newAPI.someMethod();

    TestHelpers.validateSuccessResponse(response);
    expect(response.data).toHaveProperty('expected_field');
  });
});
```

### 自定义断言

```javascript
// 使用辅助工具进行响应验证
TestHelpers.validateSuccessResponse(response);
TestHelpers.validateErrorResponse(response, 404);
TestHelpers.validateResponseTime(responseTime, 3000);
TestHelpers.deepEqualIgnoreDynamicFields(actual, expected);
```

### 性能测试

```javascript
// 测量响应时间
const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
  apiClient.someAPI.method()
);

TestHelpers.validateResponseTime(responseTime, 2000);
```

## 故障排除

### 常见问题

1. **API服务不可用**
   - 检查 `API_BASE_URL` 配置
   - 确认后端服务正在运行

2. **认证失败**
   - 检查 `TEST_USERNAME` 和 `TEST_PASSWORD`
   - 确认测试用户存在且权限正确

3. **测试超时**
   - 增加 `API_TIMEOUT` 值
   - 检查网络连接

4. **依赖问题**
   - 运行 `npm install` 重新安装依赖
   - 使用 `npm run test:api:validate` 验证环境

### 调试技巧

1. **启用详细日志**
   ```bash
   DEBUG=api-test npm run test:api
   ```

2. **单独运行测试**
   ```bash
   npm run test:api -- --testNamePattern="具体测试名称"
   ```

3. **查看测试报告**
   - 打开生成的HTML报告查看详细结果
   - 检查覆盖率报告找出未测试的代码

## 贡献指南

### 添加新测试

1. 在相应目录创建测试文件
2. 遵循现有的测试结构和命名规范
3. 使用提供的辅助工具和断言方法
4. 更新测试数据配置（如需要）

### 性能优化

1. 使用合理的超时时间
2. 避免过度测试
3. 使用测试数据复用
4. 优化测试数据生成

## 许可证

本项目遵循主项目的许可证。

## 支持

如有问题或建议，请：

1. 查看现有的测试用例
2. 检查测试报告
3. 联系开发团队
4. 创建Issue报告问题