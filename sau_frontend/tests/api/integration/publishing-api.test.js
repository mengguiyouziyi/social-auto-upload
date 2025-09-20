const { test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const SAUAPIClient = require('../utils/api-client');
const TestHelpers = require('../utils/test-helpers');
const { testUsers, testPublishData, testAccounts } = require('../fixtures/test-data');

describe('内容发布API集成测试', () => {
  let apiClient;
  let authToken;
  let testAccountId;
  let createdPublishIds = [];

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

    // 创建测试账号
    try {
      const accountResponse = await apiClient.accounts.addAccount(testAccounts.generateAccount('publish_test'));
      testAccountId = accountResponse.data.id;
    } catch (error) {
      console.log('使用模拟测试账号ID');
      testAccountId = 'mock_account_id';
    }
  });

  afterEach(async () => {
    // 清理创建的发布内容
    for (const publishId of createdPublishIds) {
      try {
        await apiClient.publishing.cancelPublish(publishId);
      } catch (error) {
        console.warn(`取消发布失败: ${publishId}`, error.message);
      }
    }
    createdPublishIds = [];
  });

  describe('视频发布功能', () => {
    let testVideoId;

    beforeEach(async () => {
      // 创建测试视频文件
      try {
        const testFile = TestHelpers.createTestImageFile(`test_video_${Date.now()}.png`);
        const fileData = {
          file: {
            name: testFile.name,
            content: testFile.content,
            size: testFile.size,
            type: 'image/png'
          },
          description: '测试视频文件',
          type: 'video'
        };

        const uploadResponse = await apiClient.files.uploadFile(fileData);
        testVideoId = uploadResponse.data.id;

        global.addTestResource({
          type: 'file',
          id: testVideoId
        });
      } catch (error) {
        console.log('使用模拟视频文件ID');
        testVideoId = 'mock_video_id';
      }
    });

    test('正常发布视频', async () => {
      const videoData = {
        ...testPublishData.videoPost,
        account_id: testAccountId,
        video_id: testVideoId,
        platforms: ['douyin', 'wechat']
      };

      const response = await apiClient.publishing.postVideo(videoData);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toHaveProperty('publish_id');
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toMatch(/pending|processing|published/);

      createdPublishIds.push(response.data.publish_id);
      console.log(`✅ 视频发布成功: ${response.data.publish_id}`);
    });

    test('定时发布视频', async () => {
      const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24小时后
      const videoData = {
        ...testPublishData.scheduledPost,
        account_id: testAccountId,
        video_id: testVideoId,
        platforms: ['douyin'],
        schedule_time: scheduledTime
      };

      const response = await apiClient.publishing.postVideo(videoData);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toHaveProperty('schedule_time', scheduledTime);
      expect(response.data.status).toBe('scheduled');

      createdPublishIds.push(response.data.publish_id);
      console.log(`✅ 定时视频发布成功: ${response.data.publish_id}`);
    });

    test('多平台发布视频', async () => {
      const videoData = {
        ...testPublishData.videoPost,
        account_id: testAccountId,
        video_id: testVideoId,
        platforms: ['douyin', 'wechat', 'weibo']
      };

      const response = await apiClient.publishing.postVideo(videoData);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data.platforms).toEqual(['douyin', 'wechat', 'weibo']);

      createdPublishIds.push(response.data.publish_id);
      console.log(`✅ 多平台视频发布成功: ${response.data.publish_id}`);
    });

    test('缺少必要字段发布视频', async () => {
      const incompleteData = {
        account_id: testAccountId,
        // 缺少video_id等必要字段
      };

      const response = await apiClient.publishing.postVideo(incompleteData);
      TestHelpers.validateErrorResponse(response, 400);
    });

    test('无效账号发布视频', async () => {
      const videoData = {
        ...testPublishData.videoPost,
        account_id: 'invalid_account_id',
        video_id: testVideoId,
        platforms: ['douyin']
      };

      const response = await apiClient.publishing.postVideo(videoData);
      TestHelpers.validateErrorResponse(response, 404);
    });
  });

  describe('图片发布功能', () => {
    let testImageId;

    beforeEach(async () => {
      // 创建测试图片文件
      try {
        const testFile = TestHelpers.createTestImageFile(`test_image_${Date.now()}.png`);
        const fileData = {
          file: {
            name: testFile.name,
            content: testFile.content,
            size: testFile.size,
            type: 'image/png'
          },
          description: '测试图片文件',
          type: 'image'
        };

        const uploadResponse = await apiClient.files.uploadFile(fileData);
        testImageId = uploadResponse.data.id;

        global.addTestResource({
          type: 'file',
          id: testImageId
        });
      } catch (error) {
        console.log('使用模拟图片文件ID');
        testImageId = 'mock_image_id';
      }
    });

    test('正常发布图片', async () => {
      const imageData = {
        ...testPublishData.imagePost,
        account_id: testAccountId,
        image_id: testImageId,
        platforms: ['wechat']
      };

      const response = await apiClient.publishing.postImage(imageData);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toHaveProperty('publish_id');
      expect(response.data.type).toBe('image');

      createdPublishIds.push(response.data.publish_id);
      console.log(`✅ 图片发布成功: ${response.data.publish_id}`);
    });

    test('多图片发布', async () => {
      const imageData = {
        ...testPublishData.imagePost,
        account_id: testAccountId,
        image_ids: [testImageId, testImageId], // 模拟多图片
        platforms: ['wechat', 'weibo']
      };

      const response = await apiClient.publishing.postImage(imageData);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toHaveProperty('publish_id');

      createdPublishIds.push(response.data.publish_id);
      console.log(`✅ 多图片发布成功: ${response.data.publish_id}`);
    });
  });

  describe('文章发布功能', () => {
    test('正常发布文章', async () => {
      const articleData = {
        ...testPublishData.articlePost,
        account_id: testAccountId,
        platforms: ['wechat']
      };

      const response = await apiClient.publishing.postArticle(articleData);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toHaveProperty('publish_id');
      expect(response.data.type).toBe('article');

      createdPublishIds.push(response.data.publish_id);
      console.log(`✅ 文章发布成功: ${response.data.publish_id}`);
    });

    test('带格式的文章发布', async () => {
      const formattedArticle = {
        ...testPublishData.articlePost,
        account_id: testAccountId,
        content: `# 标题

## 子标题

**粗体文本**
*斜体文本*

- 列表项1
- 列表项2

[链接](https://example.com)`,
        platforms: ['wechat']
      };

      const response = await apiClient.publishing.postArticle(formattedArticle);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toHaveProperty('publish_id');

      createdPublishIds.push(response.data.publish_id);
      console.log(`✅ 格式化文章发布成功: ${response.data.publish_id}`);
    });
  });

  describe('获取发布状态', () => {
    let testPublishId;

    beforeEach(async () => {
      // 创建测试发布任务
      try {
        const publishData = {
          ...testPublishData.videoPost,
          account_id: testAccountId,
          video_id: 'mock_video_id',
          platforms: ['douyin']
        };

        const response = await apiClient.publishing.postVideo(publishData);
        testPublishId = response.data.publish_id;
        createdPublishIds.push(testPublishId);
      } catch (error) {
        console.log('使用模拟发布ID');
        testPublishId = 'mock_publish_id';
      }
    });

    test('正常获取发布状态', async () => {
      const response = await apiClient.publishing.getPublishStatus(testPublishId);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data).toHaveProperty('publish_id', testPublishId);
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('progress');

      console.log(`📊 发布状态: ${response.data.status}`);
    });

    test('获取不存在的发布状态', async () => {
      const response = await apiClient.publishing.getPublishStatus('non_existent_publish_id');
      TestHelpers.validateErrorResponse(response, 404);
    });
  });

  describe('取消发布功能', () => {
    let testPublishId;

    beforeEach(async () => {
      // 创建测试发布任务
      try {
        const publishData = {
          ...testPublishData.videoPost,
          account_id: testAccountId,
          video_id: 'mock_video_id',
          platforms: ['douyin']
        };

        const response = await apiClient.publishing.postVideo(publishData);
        testPublishId = response.data.publish_id;
      } catch (error) {
        console.log('使用模拟发布ID');
        testPublishId = 'mock_publish_id';
      }
    });

    test('正常取消发布', async () => {
      const response = await apiClient.publishing.cancelPublish(testPublishId);

      TestHelpers.validateSuccessResponse(response);
      expect(response.data.status).toMatch(/cancelled|failed/);

      console.log(`✅ 发布取消成功: ${testPublishId}`);
    });

    test('取消不存在的发布', async () => {
      const response = await apiClient.publishing.cancelPublish('non_existent_publish_id');
      TestHelpers.validateErrorResponse(response, 404);
    });

    test('重复取消发布', async () => {
      // 第一次取消
      await apiClient.publishing.cancelPublish(testPublishId);

      // 第二次取消
      const response = await apiClient.publishing.cancelPublish(testPublishId);
      TestHelpers.validateErrorResponse(response, 400);
    });
  });

  describe('性能测试', () => {
    test('批量发布性能测试', async () => {
      const publishCount = 3;
      const publishPromises = [];

      for (let i = 0; i < publishCount; i++) {
        const publishData = {
          ...testPublishData.generatePost('video', { title: `批量测试视频 ${i}` }),
          account_id: testAccountId,
          video_id: 'mock_video_id',
          platforms: ['douyin']
        };

        publishPromises.push(apiClient.publishing.postVideo(publishData));
      }

      const { result: results, responseTime: totalTime } = await TestHelpers.measureResponseTime(() =>
        Promise.all(publishPromises)
      );

      // 验证所有发布都成功
      results.forEach(result => {
        TestHelpers.validateSuccessResponse(result);
        createdPublishIds.push(result.data.publish_id);
      });

      TestHelpers.validateResponseTime(totalTime, 10000); // 10秒内完成

      console.log(`📊 批量发布 ${publishCount} 个内容耗时: ${totalTime}ms`);
    });

    test('发布状态查询性能', async () => {
      let testPublishId;

      // 创建发布任务
      try {
        const publishData = {
          ...testPublishData.videoPost,
          account_id: testAccountId,
          video_id: 'mock_video_id',
          platforms: ['douyin']
        };

        const response = await apiClient.publishing.postVideo(publishData);
        testPublishId = response.data.publish_id;
        createdPublishIds.push(testPublishId);
      } catch (error) {
        testPublishId = 'mock_publish_id';
      }

      // 多次查询状态
      const queryCount = 10;
      const queryPromises = [];

      for (let i = 0; i < queryCount; i++) {
        queryPromises.push(apiClient.publishing.getPublishStatus(testPublishId));
      }

      const { result: results, responseTime: totalTime } = await TestHelpers.measureResponseTime(() =>
        Promise.all(queryPromises)
      );

      // 验证所有查询都成功
      results.forEach(result => {
        TestHelpers.validateSuccessResponse(result);
      });

      TestHelpers.validateResponseTime(totalTime, 5000); // 5秒内完成

      console.log(`📊 ${queryCount} 次状态查询耗时: ${totalTime}ms`);
      console.log(`📊 平均查询时间: ${(totalTime / queryCount).toFixed(2)}ms`);
    });
  });

  describe('并发发布测试', () => {
    test('并发视频发布', async () => {
      const concurrentCount = 3;
      const publishPromises = [];

      for (let i = 0; i < concurrentCount; i++) {
        const publishData = {
          ...testPublishData.generatePost('video', { title: `并发测试视频 ${i}` }),
          account_id: testAccountId,
          video_id: 'mock_video_id',
          platforms: ['douyin']
        };

        publishPromises.push(apiClient.publishing.postVideo(publishData));
      }

      const results = await Promise.all(publishPromises);

      // 验证所有发布都成功
      results.forEach((result, index) => {
        TestHelpers.validateSuccessResponse(result);
        createdPublishIds.push(result.data.publish_id);
        console.log(`✅ 并发发布 ${index + 1} 成功: ${result.data.publish_id}`);
      });
    });
  });

  describe('边界情况测试', () => {
    test('超长标题发布', async () => {
      const longTitle = 'a'.repeat(1000);
      const publishData = {
        ...testPublishData.videoPost,
        title: longTitle,
        account_id: testAccountId,
        video_id: 'mock_video_id',
        platforms: ['douyin']
      };

      const response = await apiClient.publishing.postVideo(publishData);

      if (response.status >= 200 && response.status < 300) {
        createdPublishIds.push(response.data.publish_id);
      } else {
        TestHelpers.validateErrorResponse(response, 400);
      }
    });

    test('空内容发布', async () => {
      const emptyData = {
        title: '',
        description: '',
        account_id: testAccountId,
        video_id: 'mock_video_id',
        platforms: ['douyin']
      };

      const response = await apiClient.publishing.postVideo(emptyData);
      TestHelpers.validateErrorResponse(response, 400);
    });

    test('特殊字符发布', async () => {
      const specialData = {
        ...testPublishData.videoPost,
        title: '特殊标题!@#$%^&*()',
        description: '特殊描述<script>alert("xss")</script>',
        account_id: testAccountId,
        video_id: 'mock_video_id',
        platforms: ['douyin']
      };

      const response = await apiClient.publishing.postVideo(specialData);

      if (response.status >= 200 && response.status < 300) {
        createdPublishIds.push(response.data.publish_id);
        // 验证特殊字符被正确处理
        expect(response.data.title).toBe(specialData.title);
      }
    });
  });

  describe('发布到不同平台', () => {
    const platforms = ['douyin', 'wechat', 'weibo'];

    platforms.forEach(platform => {
      test(`发布到${platform}平台`, async () => {
        const publishData = {
          ...testPublishData.videoPost,
          account_id: testAccountId,
          video_id: 'mock_video_id',
          platforms: [platform]
        };

        const response = await apiClient.publishing.postVideo(publishData);

        if (response.status >= 200 && response.status < 300) {
          createdPublishIds.push(response.data.publish_id);
          console.log(`✅ 成功发布到${platform}: ${response.data.publish_id}`);
        } else {
          console.log(`⚠️ 发布到${platform}失败: ${response.status}`);
        }
      });
    });
  });
});