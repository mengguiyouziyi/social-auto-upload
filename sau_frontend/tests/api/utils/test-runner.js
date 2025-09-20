const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * API测试运行器
 * 提供统一的测试执行接口和报告生成功能
 */
class TestRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../..');
    this.testDir = path.join(this.projectRoot, 'tests/api');
    this.reportsDir = path.join(this.projectRoot, 'test-results/api');
    this.coverageDir = path.join(this.projectRoot, 'coverage/api');
  }

  /**
   * 运行所有API测试
   */
  async runAllTests(options = {}) {
    console.log('🚀 开始运行所有API测试...');

    const results = {
      unit: await this.runUnitTests(options),
      integration: await this.runIntegrationTests(options),
      e2e: await this.runE2ETests(options),
      performance: await this.runPerformanceTests(options)
    };

    await this.generateReport(results);
    return results;
  }

  /**
   * 运行单元测试
   */
  async runUnitTests(options = {}) {
    console.log('🔬 运行API单元测试...');

    try {
      const command = 'npm run test:api';
      const output = this.executeCommand(command, options);

      return {
        success: true,
        output,
        type: 'unit',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        type: 'unit',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 运行集成测试
   */
  async runIntegrationTests(options = {}) {
    console.log('🔗 运行API集成测试...');

    try {
      const command = 'npm run test:api:integration';
      const output = this.executeCommand(command, options);

      return {
        success: true,
        output,
        type: 'integration',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        type: 'integration',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 运行E2E测试
   */
  async runE2ETests(options = {}) {
    console.log('🎭 运行API E2E测试...');

    try {
      const command = 'npm run test:api:e2e';
      const output = this.executeCommand(command, options);

      return {
        success: true,
        output,
        type: 'e2e',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        type: 'e2e',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 运行性能测试
   */
  async runPerformanceTests(options = {}) {
    console.log('⚡ 运行API性能测试...');

    try {
      const command = 'npx playwright test tests/api/e2e/api-performance.spec.js';
      const output = this.executeCommand(command, options);

      return {
        success: true,
        output,
        type: 'performance',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        type: 'performance',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 运行覆盖率测试
   */
  async runCoverageTests(options = {}) {
    console.log('📊 运行API覆盖率测试...');

    try {
      const command = 'npm run test:api:coverage';
      const output = this.executeCommand(command, options);

      return {
        success: true,
        output,
        type: 'coverage',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        type: 'coverage',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 生成测试报告
   */
  async generateReport(results) {
    console.log('📋 生成测试报告...');

    // 确保报告目录存在
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }

    const report = {
      summary: this.generateSummary(results),
      details: results,
      generatedAt: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    // 保存JSON报告
    const reportPath = path.join(this.reportsDir, `api-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 生成HTML报告
    await this.generateHTMLReport(report);

    console.log(`✅ 测试报告已生成: ${reportPath}`);
    return report;
  }

  /**
   * 生成测试摘要
   */
  generateSummary(results) {
    const summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: 0,
      testTypes: {}
    };

    Object.keys(results).forEach(type => {
      const result = results[type];
      summary.testTypes[type] = {
        success: result.success,
        timestamp: result.timestamp
      };

      if (result.success) {
        summary.passedTests++;
      } else {
        summary.failedTests++;
      }
      summary.totalTests++;
    });

    summary.successRate = summary.totalTests > 0 ?
      (summary.passedTests / summary.totalTests * 100).toFixed(2) : 0;

    return summary;
  }

  /**
   * 生成HTML报告
   */
  async generateHTMLReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAU API测试报告</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e9ecef;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .test-results {
            margin-bottom: 30px;
        }
        .test-type {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .test-type.success {
            border-left-color: #28a745;
            background-color: #f8fff9;
        }
        .test-type.failure {
            border-left-color: #dc3545;
            background-color: #fff8f8;
        }
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .test-name {
            font-weight: bold;
            font-size: 1.1em;
        }
        .test-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .status-success {
            background-color: #28a745;
            color: white;
        }
        .status-failure {
            background-color: #dc3545;
            color: white;
        }
        .test-details {
            font-family: monospace;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
        }
        .environment {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .timestamp {
            color: #666;
            font-size: 0.9em;
            text-align: center;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 SAU API测试报告</h1>
            <p>自媒体自动化运营系统API测试结果</p>
        </div>

        <div class="summary">
            <div class="metric-card">
                <div class="metric-label">总测试数</div>
                <div class="metric-value">${report.summary.totalTests}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">通过测试</div>
                <div class="metric-value success">${report.summary.passedTests}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">失败测试</div>
                <div class="metric-value failure">${report.summary.failedTests}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">成功率</div>
                <div class="metric-value">${report.summary.successRate}%</div>
            </div>
        </div>

        <div class="test-results">
            <h2>📋 详细测试结果</h2>
            ${Object.entries(report.details).map(([type, result]) => `
                <div class="test-type ${result.success ? 'success' : 'failure'}">
                    <div class="test-header">
                        <div class="test-name">${this.getTestTypeName(type)}</div>
                        <div class="test-status ${result.success ? 'status-success' : 'status-failure'}">
                            ${result.success ? '✅ 通过' : '❌ 失败'}
                        </div>
                    </div>
                    <div class="test-details">${result.output || result.error}</div>
                    <div style="margin-top: 10px; color: #666; font-size: 0.9em;">
                        运行时间: ${new Date(result.timestamp).toLocaleString()}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="environment">
            <h3>🖥️ 测试环境</h3>
            <p><strong>Node.js版本:</strong> ${report.environment.nodeVersion}</p>
            <p><strong>平台:</strong> ${report.environment.platform} (${report.environment.arch})</p>
            <p><strong>报告生成时间:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
        </div>

        <div class="timestamp">
            报告生成时间: ${new Date(report.generatedAt).toLocaleString()}
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.reportsDir, `api-test-report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlContent);

    console.log(`📄 HTML报告已生成: ${htmlPath}`);
  }

  /**
   * 获取测试类型中文名称
   */
  getTestTypeName(type) {
    const typeNames = {
      unit: '单元测试',
      integration: '集成测试',
      e2e: '端到端测试',
      performance: '性能测试',
      coverage: '覆盖率测试'
    };
    return typeNames[type] || type;
  }

  /**
   * 执行命令
   */
  executeCommand(command, options = {}) {
    const cwd = options.cwd || this.projectRoot;
    const env = { ...process.env, ...options.env };

    try {
      return execSync(command, {
        cwd,
        env,
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } catch (error) {
      if (options.silent) {
        throw error;
      }
      console.error(`命令执行失败: ${command}`);
      console.error(error.message);
      throw error;
    }
  }

  /**
   * 清理测试结果
   */
  async cleanup() {
    console.log('🧹 清理测试结果...');

    const dirsToClean = [
      this.reportsDir,
      this.coverageDir,
      path.join(this.projectRoot, 'test-results')
    ];

    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`已清理: ${dir}`);
      }
    }
  }

  /**
   * 验证测试环境
   */
  async validateEnvironment() {
    console.log('🔍 验证测试环境...');

    const checks = [
      {
        name: 'Node.js版本',
        check: () => {
          const version = process.version;
          const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
          return majorVersion >= 16;
        },
        required: true
      },
      {
        name: 'npm可用性',
        check: () => {
          try {
            execSync('npm --version', { stdio: 'pipe' });
            return true;
          } catch {
            return false;
          }
        },
        required: true
      },
      {
        name: 'Playwright安装',
        check: () => {
          try {
            execSync('npx playwright --version', { stdio: 'pipe' });
            return true;
          } catch {
            return false;
          }
        },
        required: true
      },
      {
        name: 'Jest安装',
        check: () => {
          try {
            execSync('npx jest --version', { stdio: 'pipe' });
            return true;
          } catch {
            return false;
          }
        },
        required: true
      }
    ];

    const results = [];
    let allPassed = true;

    for (const check of checks) {
      try {
        const passed = check.check();
        results.push({
          name: check.name,
          passed,
          required: check.required
        });

        if (!passed && check.required) {
          allPassed = false;
        }
      } catch (error) {
        results.push({
          name: check.name,
          passed: false,
          required: check.required,
          error: error.message
        });

        if (check.required) {
          allPassed = false;
        }
      }
    }

    console.log('📋 环境验证结果:');
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const required = result.required ? '(必需)' : '(可选)';
      console.log(`  ${status} ${result.name} ${required}`);
      if (result.error) {
        console.log(`    错误: ${result.error}`);
      }
    });

    if (!allPassed) {
      throw new Error('测试环境验证失败，请检查依赖项');
    }

    console.log('✅ 测试环境验证通过');
  }
}

module.exports = TestRunner;