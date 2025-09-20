# SAU API测试体系使用指南

## 概述

本文档详细介绍了如何使用为SAU自媒体自动化运营系统构建的完整API测试体系。

## 🏗️ 体系架构

### 技术栈选择

我们选择了以下开源工具组合：

1. **Jest** - 主要测试框架
   - 与Node.js生态完美兼容
   - 丰富的断言库和Mock功能
   - 优秀的性能和社区支持

2. **Axios** - HTTP客户端
   - 与项目现有技术栈一致
   - 支持Promise和拦截器
   - 完善的错误处理

3. **Playwright** - E2E测试
   - 已有的测试基础设施
   - 支持多浏览器测试
   - 强大的自动化能力

4. **Supertest** - HTTP测试
   - 专门用于API测试
   - 支持Express中间件测试
   - 链式调用语法

### 目录结构

```
tests/api/
├── package.json              # API测试专用依赖
├── setup.js                  # 全局测试环境配置
├── .env.example              # 环境变量模板
├── README.md                 # 详细文档
├── integration/              # 集成测试
│   ├── auth-api.test.js      # 认证模块测试
│   ├── accounts-api.test.js  # 账号管理测试
│   ├── files-api.test.js     # 文件操作测试
│   └── publishing-api.test.js # 内容发布测试
├── e2e/                     # 端到端测试
│   ├── api-playwright-integration.spec.js  # 前后端集成测试
│   └── api-performance.spec.js              # 性能测试
├── utils/                   # 工具类
│   ├── api-client.js        # 统一API客户端
│   ├── test-helpers.js      # 测试辅助函数
│   └── test-runner.js       # 测试运行器
└── fixtures/                # 测试数据
    └── test-data.js         # 预定义测试数据
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装API测试依赖
cd tests/api
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置API地址和测试用户信息
```

### 2. 验证环境

```bash
# 在项目根目录执行
npm run test:api:validate
```

### 3. 运行测试

```bash
# 运行所有API测试
npm run test:api

# 运行特定类型测试
npm run test:api:integration    # 集成测试
npm run test:api:e2e           # E2E测试
npm run test:api:performance   # 性能测试
npm run test:api:coverage      # 覆盖率测试

# 监视模式（代码变化时自动运行）
npm run test:api:watch
```

### 4. 生成报告

```bash
# 生成完整测试报告
npm run test:api:report

# 清理测试结果
npm run test:api:cleanup
```

## 📊 测试覆盖范围

### 认证API (`/api/auth/*`)
- ✅ 用户登录/登出
- ✅ Token刷新机制
- ✅ 用户信息获取
- ✅ 错误处理和安全性
- ✅ 性能和并发测试

### 账号管理API (`/api/accounts/*`)
- ✅ 账号列表获取
- ✅ 账号创建/更新/删除
- ✅ 账号详情查询
- ✅ 数据验证和权限控制
- ✅ 批量操作性能

### 文件管理API (`/api/files/*`)
- ✅ 文件列表查询
- ✅ 文件上传（支持进度监控）
- ✅ 文件获取和删除
- ✅ 大文件处理
- ✅ 安全性检查

### 内容发布API (`/api/publishing/*`)
- ✅ 视频/图片/文章发布
- ✅ 定时发布功能
- ✅ 多平台发布
- ✅ 发布状态查询
- ✅ 发布取消功能

### 系统监控API (`/api/system/*`)
- ✅ 系统状态监控
- ✅ API统计信息
- ✅ 性能指标收集
- ✅ 健康检查

### API市场功能 (`/api/marketplace/*`)
- ✅ API配置管理
- ✅ 连接测试
- ✅ 插件管理

## 🔧 核心功能

### 1. 统一API客户端

```javascript
const SAUAPIClient = require('./utils/api-client');

const client = new SAUAPIClient('http://localhost:5409');

// 认证
await client.auth.login('username', 'password');

// 账号管理
const accounts = await client.accounts.getValidAccounts();

// 文件操作
const result = await client.files.uploadFile(fileData);

// 内容发布
const publishResult = await client.publishing.postVideo(publishData);
```

### 2. 测试辅助工具

```javascript
const TestHelpers = require('./utils/test-helpers');

// 响应验证
TestHelpers.validateSuccessResponse(response);
TestHelpers.validateErrorResponse(response, 404);

// 性能测量
const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
  apiClient.someMethod()
);

// 测试数据生成
const testData = TestHelpers.generateTestAccountData();
const testFile = TestHelpers.createTestFile();

// 重试机制
await TestHelpers.retry(() => apiClient.someMethod(), 3);
```

### 3. 测试数据管理

```javascript
const { testUsers, testAccounts, testFiles } = require('./fixtures/test-data');

// 预定义测试数据
const user = testUsers.validUser;
const account = testAccounts.wechatAccount;
const file = testFiles.textFile;

// 动态生成数据
const newAccount = testAccounts.generateAccount('custom_platform');
const newPost = testPublishData.generatePost('video');
```

### 4. 自动化测试运行器

```javascript
const TestRunner = require('./utils/test-runner');

const runner = new TestRunner();

// 环境验证
await runner.validateEnvironment();

// 运行所有测试
const results = await runner.runAllTests();

// 生成详细报告
await runner.generateReport(results);
```

## 📈 性能测试

### 配置参数

```javascript
const performanceConfig = {
  responseTime: {
    fast: 1000,     // 快速响应 < 1秒
    normal: 3000,   // 正常响应 < 3秒
    slow: 5000,     // 慢响应 < 5秒
    critical: 10000 // 临界响应 < 10秒
  },
  concurrency: {
    low: 5,         // 低并发 5个
    medium: 10,     // 中并发 10个
    high: 50,       // 高并发 50个
    extreme: 100    // 极端并发 100个
  }
};
```

### 性能测试场景

1. **响应时间测试** - 验证各API端点的响应时间
2. **并发性能测试** - 模拟多用户同时访问
3. **负载测试** - 持续高负载下的系统表现
4. **资源监控** - 内存使用和连接池效率

## 🎯 集成到CI/CD

### GitHub Actions示例

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        npm install
        cd tests/api && npm install

    - name: Run API tests
      run: npm run test:api:report

    - name: Upload test results
      uses: actions/upload-artifact@v2
      with:
        name: test-results
        path: test-results/api/
```

### Jenkins Pipeline示例

```groovy
pipeline {
    agent any

    stages {
        stage('Setup') {
            steps {
                sh 'npm install'
                sh 'cd tests/api && npm install'
            }
        }

        stage('API Tests') {
            steps {
                sh 'npm run test:api:report'
            }
        }

        stage('Publish Results') {
            steps {
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'test-results/api',
                    reportFiles: '*.html',
                    reportName: 'API Test Report'
                ])
            }
        }
    }
}
```

## 🔍 调试和故障排除

### 常见问题

1. **API连接失败**
   ```bash
   # 检查API服务状态
   curl http://localhost:5409/health

   # 验证网络连接
   telnet localhost 5409
   ```

2. **认证失败**
   ```bash
   # 检查环境变量
   cat tests/api/.env

   # 测试用户认证
   curl -X POST http://localhost:5409/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test_user","password":"test_password_123"}'
   ```

3. **测试超时**
   ```bash
   # 增加超时时间
   export API_TIMEOUT=60000
   npm run test:api
   ```

### 调试技巧

1. **启用详细日志**
   ```bash
   DEBUG=api-test npm run test:api
   ```

2. **单独运行测试**
   ```bash
   # 运行特定测试文件
   npm run test:api -- auth-api.test.js

   # 运行特定测试用例
   npm run test:api -- --testNamePattern="用户登录"
   ```

3. **交互式调试**
   ```bash
   # 使用Node.js调试器
   node --inspect-brk tests/api/node_modules/.bin/jest --runInBand
   ```

## 📊 报告解读

### 测试报告包含

1. **执行摘要** - 总体测试结果统计
2. **详细结果** - 每个测试类型的执行情况
3. **性能指标** - 响应时间和吞吐量数据
4. **覆盖率报告** - 代码覆盖率分析
5. **环境信息** - 测试执行环境详情

### 关键指标

- **成功率** - 通过测试占总测试的百分比
- **平均响应时间** - API调用平均耗时
- **错误率** - 失败请求的比例
- **并发性能** - 高并发下的表现

## 🎓 最佳实践

### 1. 测试设计原则

- **独立性** - 每个测试应该独立运行
- **可重复性** - 测试结果应该稳定可重复
- **原子性** - 每个测试只验证一个功能点
- **清晰性** - 测试名称和断言应该明确

### 2. 测试数据管理

- 使用工厂方法生成测试数据
- 避免硬编码的测试数据
- 清理测试产生的数据
- 使用环境变量管理敏感信息

### 3. 性能测试建议

- 在隔离环境中运行性能测试
- 逐步增加负载，监控系统表现
- 关注响应时间趋势而非单次结果
- 设置合理的性能基准

### 4. 持续集成

- 将API测试集成到CI/CD流水线
- 设置测试失败时的构建阻断
- 定期审查测试覆盖率和结果
- 维护测试文档和运行指南

## 📞 支持和贡献

### 获取帮助

1. 查看本文档和 `tests/api/README.md`
2. 检查生成的测试报告
3. 查看测试日志和错误信息
4. 联系开发团队

### 贡献指南

1. 遵循现有的代码结构和命名规范
2. 为新功能添加相应的测试用例
3. 确保所有测试通过后再提交
4. 更新相关文档

### 问题反馈

如果发现问题或有改进建议：

1. 创建详细的bug报告
2. 包含复现步骤和环境信息
3. 提供相关的日志和截图
4. 建议解决方案或改进方向

---

## 📝 总结

这个API测试体系为SAU自媒体自动化运营系统提供了：

- ✅ **完整的测试覆盖** - 涵盖所有主要API端点
- ✅ **多种测试类型** - 单元、集成、E2E、性能测试
- ✅ **自动化工具** - 统一的测试运行器和报告生成
- ✅ **易于维护** - 清晰的代码结构和文档
- ✅ **CI/CD集成** - 支持自动化测试流程

通过这个测试体系，可以确保系统的API功能稳定、性能良好，并且能够及时发现和修复问题。