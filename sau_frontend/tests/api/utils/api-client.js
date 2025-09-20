const axios = require('axios');
const FormData = require('form-data');

/**
 * SAU API客户端
 * 封装所有API调用，提供统一的接口和错误处理
 */
class SAUAPIClient {
  constructor(baseURL = null, timeout = null) {
    this.baseURL = baseURL || global.TEST_CONFIG?.API_BASE_URL || 'http://localhost:5409';
    this.timeout = timeout || global.TEST_CONFIG?.API_TIMEOUT || 30000;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      validateStatus: function (status) {
        return status < 500; // 接受所有小于500的状态码
      }
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求拦截器
   */
  setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加认证token
        if (global.testState?.authToken) {
          config.headers.Authorization = `Bearer ${global.testState.authToken}`;
        }

        // 添加测试标识
        config.headers['X-Test-Request'] = 'true';

        console.log(`📡 API请求: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ 请求拦截器错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API响应: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ API错误: ${error.config?.url || 'Unknown'}`, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 认证相关API
   */
  auth = {
    /**
     * 用户登录
     */
    login: async (username, password) => {
      return this.client.post('/api/auth/login', { username, password });
    },

    /**
     * 用户登出
     */
    logout: async () => {
      return this.client.post('/api/auth/logout');
    },

    /**
     * 获取用户信息
     */
    getUserInfo: async () => {
      return this.client.get('/api/auth/user');
    },

    /**
     * 刷新token
     */
    refreshToken: async () => {
      return this.client.post('/api/auth/refresh');
    }
  };

  /**
   * 账号管理API
   */
  accounts = {
    /**
     * 获取有效账号列表
     */
    getValidAccounts: async () => {
      return this.client.get('/getValidAccounts');
    },

    /**
     * 添加新账号
     */
    addAccount: async (accountData) => {
      return this.client.post('/api/accounts', accountData);
    },

    /**
     * 更新账号信息
     */
    updateAccount: async (accountId, accountData) => {
      return this.client.put(`/api/accounts/${accountId}`, accountData);
    },

    /**
     * 删除账号
     */
    deleteAccount: async (accountId) => {
      return this.client.delete(`/api/accounts/${accountId}`);
    },

    /**
     * 获取账号详情
     */
    getAccountDetail: async (accountId) => {
      return this.client.get(`/api/accounts/${accountId}`);
    }
  };

  /**
   * 文件管理API
   */
  files = {
    /**
     * 获取文件列表
     */
    getFiles: async () => {
      return this.client.get('/getFiles');
    },

    /**
     * 上传文件
     */
    uploadFile: async (fileData, onProgress = null) => {
      const formData = new FormData();
      formData.append('file', fileData.file);
      if (fileData.description) {
        formData.append('description', fileData.description);
      }
      if (fileData.type) {
        formData.append('type', fileData.type);
      }

      const config = {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${global.testState?.authToken}`
        }
      };

      if (onProgress) {
        config.onUploadProgress = onProgress;
      }

      return this.client.post('/api/upload', formData, config);
    },

    /**
     * 保存上传的文件
     */
    saveUpload: async (fileData) => {
      return this.client.post('/api/uploadSave', fileData);
    },

    /**
     * 获取文件
     */
    getFile: async (fileId) => {
      return this.client.get('/api/getFile', {
        params: { id: fileId },
        responseType: 'arraybuffer'
      });
    },

    /**
     * 删除文件
     */
    deleteFile: async (fileId) => {
      return this.client.get('/api/deleteFile', {
        params: { id: fileId }
      });
    }
  };

  /**
   * 内容发布API
   */
  publishing = {
    /**
     * 发布视频
     */
    postVideo: async (videoData) => {
      return this.client.post('/api/postVideo', videoData);
    },

    /**
     * 发布图片
     */
    postImage: async (imageData) => {
      return this.client.post('/api/postImage', imageData);
    },

    /**
     * 发布文章
     */
    postArticle: async (articleData) => {
      return this.client.post('/api/postArticle', articleData);
    },

    /**
     * 获取发布状态
     */
    getPublishStatus: async (publishId) => {
      return this.client.get(`/api/publish/status/${publishId}`);
    },

    /**
     * 取消发布
     */
    cancelPublish: async (publishId) => {
      return this.client.post(`/api/publish/cancel/${publishId}`);
    }
  };

  /**
   * 系统监控API
   */
  monitoring = {
    /**
     * 获取系统状态
     */
    getSystemStatus: async () => {
      return this.client.get('/system/status');
    },

    /**
     * 获取API统计
     */
    getAPIStats: async () => {
      return this.client.get('/system/api-stats');
    },

    /**
     * 获取性能指标
     */
    getPerformanceMetrics: async () => {
      return this.client.get('/system/performance');
    },

    /**
     * 健康检查
     */
    healthCheck: async () => {
      return this.client.get('/health');
    }
  };

  /**
   * API市场相关API
   */
  marketplace = {
    /**
     * 获取API列表
     */
    getAPIs: async () => {
      return this.client.get('/marketplace/apis');
    },

    /**
     * 添加API
     */
    addAPI: async (apiData) => {
      return this.client.post('/marketplace/apis', apiData);
    },

    /**
     * 更新API配置
     */
    updateAPI: async (apiId, apiData) => {
      return this.client.put(`/marketplace/apis/${apiId}`, apiData);
    },

    /**
     * 测试API连接
     */
    testAPIConnection: async (apiId) => {
      return this.client.post(`/marketplace/apis/${apiId}/test`);
    }
  };

  /**
   * 通用工具方法
   */

  /**
   * 设置认证token
   */
  setAuthToken(token) {
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  /**
   * 清除认证token
   */
  clearAuthToken() {
    delete this.client.defaults.headers.Authorization;
  }

  /**
   * 设置基础URL
   */
  setBaseURL(url) {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  /**
   * 设置超时时间
   */
  setTimeout(timeout) {
    this.timeout = timeout;
    this.client.defaults.timeout = timeout;
  }

  /**
   * 获取客户端实例
   */
  getClient() {
    return this.client;
  }
}

module.exports = SAUAPIClient;