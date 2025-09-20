const { test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const SAUAPIClient = require('../utils/api-client');
const TestHelpers = require('../utils/test-helpers');
const { testUsers, testFiles, errorMessages } = require('../fixtures/test-data');
const fs = require('fs');
const path = require('path');

describe('文件管理API集成测试', () => {
  let apiClient;
  let authToken;
  let createdFiles = [];

  beforeAll(async () => {
    apiClient = new SAUAPIClient();

    // 获取认证token
    try {
      const loginResponse = await apiClient.auth.login(
        testUsers.validUser.username,
        testUsers.validUser.password
      );
      authToken = loginResponse.data.token;
      apiClient.setAuthToken(authToken);
    } catch (error) {
      console.log('使用模拟认证token');
      authToken = 'mock_test_token';
      apiClient.setAuthToken(authToken);
    }

    // 确保fixtures目录存在
    const fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // 清理创建的文件
    for (const fileId of createdFiles) {
      try {
        await apiClient.files.deleteFile(fileId);
      } catch (error) {
        console.warn(`清理文件失败: ${fileId}`, error.message);
      }
    }
    createdFiles = [];
  });

  afterAll(() => {
    // 清理所有测试文件
    TestHelpers.cleanupFixtures();
  });

  describe('获取文件列表', () => {
    test('正常获取文件列表', async () => {
      const response = await apiClient.files.getFiles();

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toBeInstanceOf(Array);

      // 验证文件数据结构
      if (response.data.length > 0) {
        const file = response.data[0];
        expect(file).toHaveProperty('id');
        expect(file).toHaveProperty('name');
        expect(file).toHaveProperty('type');
        expect(file).toHaveProperty('size');
        expect(file).toHaveProperty('created_at');
      }

      console.log(`📁 获取到 ${response.data.length} 个文件`);
    });

    test('获取文件列表响应时间测试', async () => {
      const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
        apiClient.files.getFiles()
      );

      TestHelpers.validateSuccessResponse(result);
      TestHelpers.validateResponseTime(responseTime, 3000); // 3秒内完成
    });

    test('分页获取文件列表', async () => {
      const response = await apiClient.client.get('/api/getFiles', {
        params: { page: 1, limit: 10 }
      });

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeLessThanOrEqual(10);
    });

    test('按类型筛选文件', async () => {
      const response = await apiClient.client.get('/api/getFiles', {
        params: { type: 'image' }
      });

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toBeInstanceOf(Array);

      // 验证返回的都是图片类型
      response.data.forEach(file => {
        expect(file.type).toBe('image');
      });
    });
  });

  describe('上传文件功能', () => {
    test('上传文本文件', async () => {
      const testFile = TestHelpers.createTestFile(
        `test_text_${Date.now()}.txt`,
        testFiles.textFile.content,
        'text/plain'
      );

      try {
        const fileData = {
          file: {
            name: testFile.name,
            content: testFile.content,
            size: testFile.size,
            type: 'text/plain'
          },
          description: '测试文本文件上传',
          type: 'document'
        };

        const response = await apiClient.files.uploadFile(fileData);

        TestHelpers.validateSuccessResponse(response);
        expect(response.data).toHaveProperty('id');
        expect(response.data.name).toBe(testFile.name);
        expect(response.data.size).toBe(testFile.size);

        createdFiles.push(response.data.id);
        console.log(`✅ 文件上传成功: ${response.data.id}`);
      } finally {
        TestHelpers.cleanupTestFile(testFile.path);
      }
    });

    test('上传图片文件', async () => {
      const testImage = TestHelpers.createTestImageFile(
        `test_image_${Date.now()}.png`
      );

      try {
        const fileData = {
          file: {
            name: testImage.name,
            content: testImage.content,
            size: testImage.size,
            type: 'image/png'
          },
          description: '测试图片文件上传',
          type: 'image'
        };

        const response = await apiClient.files.uploadFile(fileData);

        TestHelpers.validateSuccessResponse(response);
        expect(response.data).toHaveProperty('id');
        expect(response.data.type).toBe('image');

        createdFiles.push(response.data.id);
        console.log(`✅ 图片上传成功: ${response.data.id}`);
      } finally {
        TestHelpers.cleanupTestFile(testImage.path);
      }
    });

    test('上传大文件', async () => {
      const largeFile = TestHelpers.createTestFile(
        `large_test_${Date.now()}.txt`,
        testFiles.largeFile.content,
        'application/octet-stream'
      );

      try {
        const fileData = {
          file: {
            name: largeFile.name,
            content: largeFile.content,
            size: largeFile.size,
            type: 'application/octet-stream'
          },
          description: '测试大文件上传',
          type: 'binary'
        };

        const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
          apiClient.files.uploadFile(fileData)
        );

        TestHelpers.validateSuccessResponse(result);
        expect(result.data.size).toBe(largeFile.size);

        createdFiles.push(result.data.id);

        console.log(`✅ 大文件上传成功: ${result.data.id}, 耗时: ${responseTime}ms`);
      } finally {
        TestHelpers.cleanupTestFile(largeFile.path);
      }
    });

    test('上传进度回调测试', async () => {
      const testFile = TestHelpers.createTestFile();
      const progressCallback = TestHelpers.createProgressCallback();

      try {
        const fileData = {
          file: {
            name: testFile.name,
            content: testFile.content,
            size: testFile.size,
            type: 'text/plain'
          },
          description: '测试上传进度',
          type: 'document'
        };

        const response = await apiClient.files.uploadFile(fileData, progressCallback.callback);

        TestHelpers.validateSuccessResponse(response);
        createdFiles.push(response.data.id);

        // 验证进度回调被调用
        const events = progressCallback.getEvents();
        expect(events.length).toBeGreaterThan(0);

        // 验证进度从0%到100%
        if (events.length > 0) {
          expect(events[0].percentage).toBe(0);
          expect(events[events.length - 1].percentage).toBe(100);
        }

        console.log(`📊 上传进度事件数量: ${events.length}`);
      } finally {
        TestHelpers.cleanupTestFile(testFile.path);
      }
    });

    test('无文件上传', async () => {
      const fileData = {
        file: null,
        description: '测试无文件上传'
      };

      const response = await apiClient.files.uploadFile(fileData);
      TestHelpers.validateErrorResponse(response, 400);
    });

    test('不支持的文件类型', async () => {
      const testFile = TestHelpers.createTestFile(
        `test.exe`,
        'executable content',
        'application/x-executable'
      );

      try {
        const fileData = {
          file: {
            name: testFile.name,
            content: testFile.content,
            size: testFile.size,
            type: 'application/x-executable'
          },
          description: '测试不支持的文件类型',
          type: 'executable'
        };

        const response = await apiClient.files.uploadFile(fileData);
        TestHelpers.validateErrorResponse(response, 415); // 415 Unsupported Media Type
      } finally {
        TestHelpers.cleanupTestFile(testFile.path);
      }
    });
  });

  describe('保存上传文件', () => {
    let uploadedFileId;

    beforeEach(async () => {
      // 创建测试文件
      const testFile = TestHelpers.createTestFile();

      try {
        const fileData = {
          file: {
            name: testFile.name,
            content: testFile.content,
            size: testFile.size,
            type: 'text/plain'
          },
          description: '测试文件',
          type: 'document'
        };

        const uploadResponse = await apiClient.files.uploadFile(fileData);
        uploadedFileId = uploadResponse.data.id;
        createdFiles.push(uploadedFileId);
      } finally {
        TestHelpers.cleanupTestFile(testFile.path);
      }
    });

    test('正常保存文件信息', async () => {
      const saveData = {
        id: uploadedFileId,
        description: '更新后的文件描述',
        tags: ['测试', '文档'],
        category: '测试分类'
      };

      const response = await apiClient.files.saveUpload(saveData);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data.id).toBe(uploadedFileId);
      expect(response.data.description).toBe(saveData.description);
    });

    test('保存不存在的文件', async () => {
      const saveData = {
        id: 'non_existent_file_id',
        description: '测试保存不存在文件'
      };

      const response = await apiClient.files.saveUpload(saveData);
      TestHelpers.validateErrorResponse(response, 404);
    });
  });

  describe('获取文件功能', () => {
    let testFileId;

    beforeEach(async () => {
      // 创建测试文件
      const testFile = TestHelpers.createTestFile();

      try {
        const fileData = {
          file: {
            name: testFile.name,
            content: testFile.content,
            size: testFile.size,
            type: 'text/plain'
          },
          description: '测试获取文件',
          type: 'document'
        };

        const uploadResponse = await apiClient.files.uploadFile(fileData);
        testFileId = uploadResponse.data.id;
        createdFiles.push(testFileId);
      } finally {
        TestHelpers.cleanupTestFile(testFile.path);
      }
    });

    test('正常获取文件', async () => {
      const response = await apiClient.files.getFile(testFileId);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toBeInstanceOf(ArrayBuffer); // 文件内容

      console.log(`✅ 文件获取成功: ${testFileId}`);
    });

    test('获取不存在的文件', async () => {
      const response = await apiClient.files.getFile('non_existent_file_id');
      TestHelpers.validateErrorResponse(response, 404);
    });
  });

  describe('删除文件功能', () => {
    let testFileId;

    beforeEach(async () => {
      // 创建测试文件
      const testFile = TestHelpers.createTestFile();

      try {
        const fileData = {
          file: {
            name: testFile.name,
            content: testFile.content,
            size: testFile.size,
            type: 'text/plain'
          },
          description: '测试删除文件',
          type: 'document'
        };

        const uploadResponse = await apiClient.files.uploadFile(fileData);
        testFileId = uploadResponse.data.id;
      } finally {
        TestHelpers.cleanupTestFile(testFile.path);
      }
    });

    test('正常删除文件', async () => {
      const response = await apiClient.files.deleteFile(testFileId);

      TestHelpers.validateSuccessResponse(response);

      // 验证文件已被删除
      try {
        await apiClient.files.getFile(testFileId);
        fail('应该抛出404错误');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }

      console.log(`✅ 文件删除成功: ${testFileId}`);
    });

    test('删除不存在的文件', async () => {
      const response = await apiClient.files.deleteFile('non_existent_file_id');
      TestHelpers.validateErrorResponse(response, 404);
    });

    test('重复删除文件', async () => {
      // 第一次删除
      await apiClient.files.deleteFile(testFileId);

      // 第二次删除
      const response = await apiClient.files.deleteFile(testFileId);
      TestHelpers.validateErrorResponse(response, 404);
    });
  });

  describe('性能测试', () => {
    test('批量文件上传性能', async () => {
      const fileCount = 3;
      const uploadPromises = [];

      for (let i = 0; i < fileCount; i++) {
        const testFile = TestHelpers.createTestFile(
          `batch_test_${i}.txt`,
          `批量测试文件 ${i} 内容`,
          'text/plain'
        );

        const fileData = {
          file: {
            name: testFile.name,
            content: testFile.content,
            size: testFile.size,
            type: 'text/plain'
          },
          description: `批量测试文件 ${i}`,
          type: 'document'
        };

        uploadPromises.push(
          (async () => {
            try {
              const response = await apiClient.files.uploadFile(fileData);
              createdFiles.push(response.data.id);
              return response;
            } finally {
              TestHelpers.cleanupTestFile(testFile.path);
            }
          })()
        );
      }

      const { result: results, responseTime: totalTime } = await TestHelpers.measureResponseTime(() =>
        Promise.all(uploadPromises)
      );

      // 验证所有上传都成功
      results.forEach(result => {
        TestHelpers.validateSuccessResponse(result);
      });

      TestHelpers.validateResponseTime(totalTime, 15000); // 15秒内完成

      console.log(`📊 批量上传 ${fileCount} 个文件耗时: ${totalTime}ms`);
    });

    test('大文件上传性能', async () => {
      const largeFile = TestHelpers.createTestFile(
        `perf_large_${Date.now()}.txt`,
        '0'.repeat(2 * 1024 * 1024), // 2MB文件
        'application/octet-stream'
      );

      try {
        const fileData = {
          file: {
            name: largeFile.name,
            content: largeFile.content,
            size: largeFile.size,
            type: 'application/octet-stream'
          },
          description: '性能测试大文件',
          type: 'binary'
        };

        const { result, responseTime } = await TestHelpers.measureResponseTime(() =>
          apiClient.files.uploadFile(fileData)
        );

        TestHelpers.validateSuccessResponse(result);
        createdFiles.push(result.data.id);

        console.log(`📊 大文件上传 (${(largeFile.size / 1024 / 1024).toFixed(2)}MB) 耗时: ${responseTime}ms`);
        console.log(`📊 上传速度: ${(largeFile.size / 1024 / responseTime).toFixed(2)} KB/s`);
      } finally {
        TestHelpers.cleanupTestFile(largeFile.path);
      }
    });
  });

  describe('安全性测试', () => {
    test('未授权文件操作', async () => {
      // 清除认证token
      apiClient.clearAuthToken();

      const response = await apiClient.files.getFiles();
      TestHelpers.validateErrorResponse(response, 401);
    });

    test('恶意文件名上传', async () => {
      const maliciousFile = TestHelpers.createTestFile(
        '../../../malicious.txt',
        'malicious content',
        'text/plain'
      );

      try {
        const fileData = {
          file: {
            name: maliciousFile.name,
            content: maliciousFile.content,
            size: maliciousFile.size,
            type: 'text/plain'
          },
          description: '恶意文件名测试',
          type: 'document'
        };

        const response = await apiClient.files.uploadFile(fileData);

        // 应该被拒绝或文件名被清理
        if (response.status >= 200 && response.status < 300) {
          expect(response.data.name).not.toContain('../');
          createdFiles.push(response.data.id);
        } else {
          TestHelpers.validateErrorResponse(response, 400);
        }
      } finally {
        TestHelpers.cleanupTestFile(maliciousFile.path);
      }
    });

    test('文件大小限制测试', async () => {
      const hugeFile = TestHelpers.createTestFile(
        `huge_${Date.now()}.txt`,
        '0'.repeat(100 * 1024 * 1024), // 100MB文件
        'application/octet-stream'
      );

      try {
        const fileData = {
          file: {
            name: hugeFile.name,
            content: hugeFile.content,
            size: hugeFile.size,
            type: 'application/octet-stream'
          },
          description: '超大文件测试',
          type: 'binary'
        };

        const response = await apiClient.files.uploadFile(fileData);
        TestHelpers.validateErrorResponse(response, 413); // 413 Payload Too Large
      } finally {
        TestHelpers.cleanupTestFile(hugeFile.path);
      }
    });
  });
});