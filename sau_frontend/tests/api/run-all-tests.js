#!/usr/bin/env node

/**
 * SAU API测试运行器
 * 运行所有API集成测试并生成综合报告
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class APITestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.testDir = path.join(__dirname, '..');
  }

  /**
   * 运行单个测试文件
   */
  async runTestFile(testFile, description) {
    console.log(`\n🚀 运行测试: ${description}`);
    console.log('='.repeat(50));

    const startTime = Date.now();

    try {
      // 运行测试
      const output = execSync(
        `npx jest ${testFile} --verbose --config jest.config.js`,
        {
          cwd: this.testDir,
          encoding: 'utf8',
          timeout: 30000
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 解析测试结果
      const result = this.parseTestOutput(output, duration, description);
      this.results.push(result);

      console.log(output);
      console.log(`✅ ${description} 完成 (${duration}ms)`);

      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        name: description,
        status: 'failed',
        duration: duration,
        error: error.message,
        output: error.stdout || error.stderr
      };

      this.results.push(result);

      console.log(`❌ ${description} 失败`);
      console.log(error.message);

      return result;
    }
  }

  /**
   * 解析测试输出
   */
  parseTestOutput(output, duration, description) {
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let total = 0;

    // 解析Jest输出
    for (const line of lines) {
      if (line.includes('✓') || line.includes('passed')) {
        passed++;
      } else if (line.includes('✕') || line.includes('failed')) {
        failed++;
      }
    }

    total = passed + failed;

    return {
      name: description,
      status: failed === 0 ? 'passed' : 'failed',
      duration: duration,
      passed: passed,
      failed: failed,
      total: total,
      successRate: total > 0 ? (passed / total * 100).toFixed(2) : 0,
      output: output
    };
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    const totalPassed = this.results.reduce((sum, r) => sum + (r.passed || 0), 0);
    const totalFailed = this.results.reduce((sum, r) => sum + (r.failed || 0), 0);
    const totalTests = totalPassed + totalFailed;

    const report = {
      summary: {
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        totalDuration: totalDuration,
        totalTests: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) : 0
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    // 保存报告
    const reportPath = path.join(this.testDir, 'reports', 'api-test-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 生成HTML报告
    this.generateHTMLReport(report);

    return report;
  }

  /**
   * 生成HTML报告
   */
  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAU API测试报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .card h3 {
            margin: 0 0 10px 0;
            color: #666;
        }
        .card .value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .warning { color: #ffc107; }
        .results {
            margin-top: 30px;
        }
        .result-item {
            background: #f8f9fa;
            margin-bottom: 10px;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #dee2e6;
        }
        .result-item.passed {
            border-left-color: #28a745;
        }
        .result-item.failed {
            border-left-color: #dc3545;
        }
        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .result-name {
            font-weight: bold;
            font-size: 16px;
        }
        .result-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .result-status.passed {
            background: #28a745;
            color: white;
        }
        .result-status.failed {
            background: #dc3545;
            color: white;
        }
        .result-details {
            font-size: 14px;
            color: #666;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            transition: width 0.3s ease;
        }
        .recommendations {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
        }
        .recommendations h3 {
            color: #856404;
            margin-top: 0;
        }
        .recommendations ul {
            color: #856404;
            margin: 10px 0;
            padding-left: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SAU API测试报告</h1>

        <div class="summary">
            <div class="card">
                <h3>总测试数</h3>
                <div class="value">${report.summary.totalTests}</div>
            </div>
            <div class="card">
                <h3>通过测试</h3>
                <div class="value success">${report.summary.passed}</div>
            </div>
            <div class="card">
                <h3>失败测试</h3>
                <div class="value failure">${report.summary.failed}</div>
            </div>
            <div class="card">
                <h3>成功率</h3>
                <div class="value ${report.summary.successRate >= 90 ? 'success' : report.summary.successRate >= 70 ? 'warning' : 'failure'}">
                    ${report.summary.successRate}%
                </div>
            </div>
            <div class="card">
                <h3>总耗时</h3>
                <div class="value">${(report.summary.totalDuration / 1000).toFixed(2)}s</div>
            </div>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width: ${report.summary.successRate}%"></div>
        </div>

        <div class="results">
            <h2>测试详情</h2>
            ${report.results.map(result => `
                <div class="result-item ${result.status}">
                    <div class="result-header">
                        <div class="result-name">${result.name}</div>
                        <div class="result-status ${result.status}">${result.status}</div>
                    </div>
                    <div class="result-details">
                        耗时: ${(result.duration / 1000).toFixed(2)}s |
                        通过: ${result.passed || 0} |
                        失败: ${result.failed || 0} |
                        成功率: ${result.successRate || 0}%
                    </div>
                </div>
            `).join('')}
        </div>

        ${report.recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>📋 建议和改进</h3>
                <ul>
                    ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.testDir, 'reports', 'api-test-report.html');
    fs.writeFileSync(htmlPath, html);

    console.log(`\n📊 HTML报告已生成: ${htmlPath}`);
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.results.length === 0) {
      recommendations.push('未运行任何测试，请检查测试配置');
      return recommendations;
    }

    const overallSuccessRate = this.results.reduce((sum, r) => sum + parseFloat(r.successRate || 0), 0) / this.results.length;

    if (overallSuccessRate < 70) {
      recommendations.push('测试成功率较低，建议检查API实现和测试用例');
    }

    const failedTests = this.results.filter(r => r.status === 'failed');
    if (failedTests.length > 0) {
      recommendations.push(`有 ${failedTests.length} 个测试失败，建议查看详细日志`);
    }

    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    if (avgDuration > 10000) {
      recommendations.push('测试执行时间较长，建议优化测试性能');
    }

    const api404Count = this.results.filter(r => r.output && r.output.includes('404')).length;
    if (api404Count > 0) {
      recommendations.push(`${api404Count} 个API端点返回404，建议完善API实现`);
    }

    if (overallSuccessRate >= 90) {
      recommendations.push('测试结果良好，建议继续扩展测试覆盖范围');
    }

    return recommendations;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始运行SAU API集成测试套件');
    console.log('='.repeat(60));

    const tests = [
      { file: 'integration/simple-api-test.js', description: '基础API测试' },
      { file: 'integration/auth-api.test.js', description: '认证API测试' },
      { file: 'integration/content-publishing-test.js', description: '内容发布API测试' },
      { file: 'integration/sau-ai-functions.test.js', description: 'AI功能API测试' }
    ];

    for (const test of tests) {
      await this.runTestFile(test.file, test.description);
    }

    console.log('\n🏁 所有测试完成，生成报告...');
    const report = this.generateReport();

    console.log('\n📊 测试总结:');
    console.log(`总测试数: ${report.summary.totalTests}`);
    console.log(`通过测试: ${report.summary.passed}`);
    console.log(`失败测试: ${report.summary.failed}`);
    console.log(`成功率: ${report.summary.successRate}%`);
    console.log(`总耗时: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);

    if (report.summary.successRate >= 90) {
      console.log('\n🎉 测试结果优秀！');
    } else if (report.summary.successRate >= 70) {
      console.log('\n✅ 测试结果良好');
    } else {
      console.log('\n⚠️ 测试结果需要改进');
    }

    return report;
  }
}

// 运行测试
if (require.main === module) {
  const runner = new APITestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = APITestRunner;