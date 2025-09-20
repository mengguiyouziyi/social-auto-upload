<template>
  <div class="content-recommendation-container">
    <h1>智能内容推荐</h1>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="recommendation-settings">
        <div class="setting-item">
          <label>推荐类型:</label>
          <select v-model="recommendationType" @change="updateRecommendations">
            <option value="trending">热门趋势</option>
            <option value="personalized">个性化推荐</option>
            <option value="similar">相似内容</option>
            <option value="timely">时效性推荐</option>
          </select>
        </div>

        <div class="setting-item">
          <label>平台筛选:</label>
          <div class="platform-filters">
            <label v-for="platform in platforms" :key="platform.id" class="platform-checkbox">
              <input
                type="checkbox"
                :value="platform.id"
                v-model="selectedPlatforms"
                @change="updateRecommendations"
              >
              <span>{{ platform.name }}</span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label>内容类型:</label>
          <div class="content-type-filters">
            <label v-for="type in contentTypes" :key="type.id" class="type-checkbox">
              <input
                type="checkbox"
                :value="type.id"
                v-model="selectedContentTypes"
                @change="updateRecommendations"
              >
              <span>{{ platform.name }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="refresh-btn" @click="refreshRecommendations" :disabled="isLoading">
          <i class="refresh-icon">🔄</i> 刷新推荐
        </button>
        <button class="export-btn" @click="exportRecommendations">
          <i class="export-icon">📊</i> 导出数据
        </button>
      </div>
    </div>

    <!-- 推荐内容展示区 -->
    <div class="recommendations-container">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在生成智能推荐...</p>
      </div>

      <div v-else-if="recommendations.length === 0" class="empty-state">
        <div class="empty-image"></div>
        <p class="empty-text">暂无推荐内容，请调整筛选条件</p>
      </div>

      <div v-else class="recommendations-grid">
        <div
          v-for="recommendation in recommendations"
          :key="recommendation.id"
          class="recommendation-card"
          :class="getRecommendationClass(recommendation)"
        >
          <!-- 推荐分数标识 -->
          <div class="recommendation-score" :title="`推荐分数: ${recommendation.score}`">
            {{ formatScore(recommendation.score) }}
          </div>

          <!-- 内容预览 -->
          <div class="content-preview">
            <img
              v-if="recommendation.thumbnail"
              :src="recommendation.thumbnail"
              :alt="recommendation.title"
              class="thumbnail"
            >
            <div v-else class="placeholder-thumbnail">
              <i class="placeholder-icon">📝</i>
            </div>
          </div>

          <!-- 内容信息 -->
          <div class="content-info">
            <h3 class="content-title" :title="recommendation.title">
              {{ recommendation.title }}
            </h3>

            <div class="content-meta">
              <span class="platform-tag">{{ getPlatformName(recommendation.platform) }}</span>
              <span class="content-type-tag">{{ getContentTypeName(recommendation.contentType) }}</span>
              <span class="trend-indicator" :class="getTrendClass(recommendation.trend)">
                {{ getTrendIcon(recommendation.trend) }}
              </span>
            </div>

            <div class="content-stats">
              <span class="stat-item">
                <i class="stat-icon">👁️</i> {{ formatNumber(recommendation.views) }}
              </span>
              <span class="stat-item">
                <i class="stat-icon">👍</i> {{ formatNumber(recommendation.likes) }}
              </span>
              <span class="stat-item">
                <i class="stat-icon">💬</i> {{ formatNumber(recommendation.comments) }}
              </span>
            </div>

            <div class="content-description">
              {{ recommendation.description }}
            </div>

            <!-- AI分析标签 -->
            <div class="ai-tags">
              <span
                v-for="tag in recommendation.aiTags"
                :key="tag"
                class="ai-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="content-actions">
            <button
              class="action-btn view-btn"
              @click="viewContent(recommendation)"
              title="查看详情"
            >
              <i class="action-icon">👁️</i>
            </button>
            <button
              class="action-btn create-btn"
              @click="createSimilarContent(recommendation)"
              title="创建相似内容"
            >
              <i class="action-icon">✨</i>
            </button>
            <button
              class="action-btn schedule-btn"
              @click="scheduleContent(recommendation)"
              title="安排发布"
            >
              <i class="action-icon">📅</i>
            </button>
            <button
              class="action-btn ignore-btn"
              @click="ignoreRecommendation(recommendation.id)"
              title="忽略推荐"
            >
              <i class="action-icon">❌</i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- AI分析面板 -->
    <div class="ai-analysis-panel">
      <div class="panel-header">
        <h3>AI智能分析</h3>
        <button class="toggle-btn" @click="toggleAnalysisPanel">
          {{ isAnalysisPanelOpen ? '收起' : '展开' }}
        </button>
      </div>

      <div v-if="isAnalysisPanelOpen" class="panel-content">
        <div class="analysis-sections">
          <!-- 趋势分析 -->
          <div class="analysis-section">
            <h4>📈 热门趋势</h4>
            <div class="trend-analysis">
              <div v-for="trend in trendAnalysis" :key="trend.keyword" class="trend-item">
                <span class="trend-keyword">{{ trend.keyword }}</span>
                <span class="trend-growth" :class="getGrowthClass(trend.growth)">
                  {{ trend.growth > 0 ? '+' : '' }}{{ trend.growth }}%
                </span>
                <div class="trend-bar">
                  <div
                    class="trend-fill"
                    :style="{ width: Math.abs(trend.growth) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 用户偏好分析 -->
          <div class="analysis-section">
            <h4>👤 用户偏好</h4>
            <div class="user-preferences">
              <div class="preference-chart">
                <canvas ref="preferenceChart"></canvas>
              </div>
              <div class="preference-stats">
                <div v-for="pref in userPreferences" :key="pref.type" class="preference-item">
                  <span class="pref-type">{{ pref.type }}</span>
                  <span class="pref-value">{{ pref.value }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 最佳发布时间 -->
          <div class="analysis-section">
            <h4>⏰ 最佳发布时间</h4>
            <div class="best-times">
              <div v-for="time in bestPublishTimes" :key="time.time" class="time-slot">
                <span class="time">{{ time.time }}</span>
                <span class="engagement">{{ time.engagement }}% 参与度</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';

// 响应式数据
const recommendationType = ref('trending');
const selectedPlatforms = ref(['douyin', 'weibo', 'xiaohongshu']);
const selectedContentTypes = ref(['video', 'image']);
const isLoading = ref(false);
const recommendations = ref([]);
const isAnalysisPanelOpen = ref(true);
const trendAnalysis = ref([]);
const userPreferences = ref([]);
const bestPublishTimes = ref([]);

// 平台配置
const platforms = [
  { id: 'douyin', name: '抖音' },
  { id: 'weibo', name: '微博' },
  { id: 'xiaohongshu', name: '小红书' },
  { id: 'bilibili', name: 'B站' },
  { id: 'zhihu', name: '知乎' }
];

// 内容类型配置
const contentTypes = [
  { id: 'video', name: '视频' },
  { id: 'image', name: '图文' },
  { id: 'article', name: '文章' },
  { id: 'live', name: '直播' }
];

// 更新推荐
const updateRecommendations = async () => {
  await fetchRecommendations();
  await fetchAIAnalysis();
};

// 刷新推荐
const refreshRecommendations = async () => {
  await updateRecommendations();
};

// 获取推荐内容
const fetchRecommendations = async () => {
  isLoading.value = true;
  try {
    const params = {
      type: recommendationType.value,
      platforms: selectedPlatforms.value.join(','),
      contentTypes: selectedContentTypes.value.join(',')
    };

    const response = await axios.get('/ai/recommendations', { params });

    if (response.data.code === 200) {
      recommendations.value = response.data.data || [];
    } else {
      // 模拟数据用于演示
      recommendations.value = generateMockRecommendations();
    }
  } catch (error) {
    console.error('获取推荐内容失败:', error);
    // 使用模拟数据
    recommendations.value = generateMockRecommendations();
  } finally {
    isLoading.value = false;
  }
};

// 获取AI分析数据
const fetchAIAnalysis = async () => {
  try {
    const response = await axios.get('/ai/analysis');

    if (response.data.code === 200) {
      const data = response.data.data;
      trendAnalysis.value = data.trendAnalysis || [];
      userPreferences.value = data.userPreferences || [];
      bestPublishTimes.value = data.bestPublishTimes || [];
    } else {
      // 使用模拟数据
      trendAnalysis.value = generateMockTrendAnalysis();
      userPreferences.value = generateMockUserPreferences();
      bestPublishTimes.value = generateMockBestTimes();
    }
  } catch (error) {
    console.error('获取AI分析失败:', error);
    // 使用模拟数据
    trendAnalysis.value = generateMockTrendAnalysis();
    userPreferences.value = generateMockUserPreferences();
    bestPublishTimes.value = generateMockBestTimes();
  }
};

// 生成模拟推荐数据
const generateMockRecommendations = () => {
  const mockData = [
    {
      id: 1,
      title: '2024年夏季时尚穿搭指南',
      description: '探索最新夏季时尚趋势，打造个性化穿搭风格，包含多种场合的搭配建议。',
      platform: 'xiaohongshu',
      contentType: 'image',
      score: 95,
      views: 125000,
      likes: 8900,
      comments: 234,
      trend: 'up',
      aiTags: ['时尚', '夏季', '穿搭', '高互动性'],
      thumbnail: null
    },
    {
      id: 2,
      title: 'AI工具提升工作效率完全指南',
      description: '全面介绍各种AI工具的使用方法，帮助职场人士提升工作效率和创造力。',
      platform: 'zhihu',
      contentType: 'article',
      score: 88,
      views: 89000,
      likes: 6700,
      comments: 189,
      trend: 'stable',
      aiTags: ['AI', '效率', '职场', '教育性'],
      thumbnail: null
    },
    {
      id: 3,
      title: '5分钟学会制作美味早餐',
      description: '简单易学的早餐制作教程，营养搭配合理，适合忙碌的都市生活。',
      platform: 'douyin',
      contentType: 'video',
      score: 92,
      views: 256000,
      likes: 15600,
      comments: 567,
      trend: 'up',
      aiTags: ['美食', '生活', '教程', '高转化率'],
      thumbnail: null
    }
  ];

  return mockData;
};

// 生成模拟趋势分析
const generateMockTrendAnalysis = () => {
  return [
    { keyword: 'AI工具', growth: 45 },
    { keyword: '夏日穿搭', growth: 32 },
    { keyword: '健康饮食', growth: 28 },
    { keyword: '远程工作', growth: 19 },
    { keyword: '可持续生活', growth: 15 }
  ];
};

// 生成模拟用户偏好
const generateMockUserPreferences = () => {
  return [
    { type: '教育内容', value: 35 },
    { type: '娱乐内容', value: 28 },
    { type: '生活方式', value: 22 },
    { type: '科技资讯', value: 15 }
  ];
};

// 生成模拟最佳发布时间
const generateMockBestTimes = () => {
  return [
    { time: '19:00-21:00', engagement: 85 },
    { time: '12:00-13:00', engagement: 72 },
    { time: '08:00-09:00', engagement: 68 },
    { time: '21:00-22:00', engagement: 65 }
  ];
};

// 工具函数
const formatScore = (score) => {
  return score + '%';
};

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  return num.toString();
};

const getPlatformName = (platformId) => {
  const platform = platforms.find(p => p.id === platformId);
  return platform ? platform.name : platformId;
};

const getContentTypeName = (contentTypeId) => {
  const type = contentTypes.find(t => t.id === contentTypeId);
  return type ? type.name : contentTypeId;
};

const getRecommendationClass = (recommendation) => {
  if (recommendation.score >= 90) return 'high-score';
  if (recommendation.score >= 80) return 'medium-score';
  return 'low-score';
};

const getTrendClass = (trend) => {
  switch (trend) {
    case 'up': return 'trend-up';
    case 'down': return 'trend-down';
    default: return 'trend-stable';
  }
};

const getTrendIcon = (trend) => {
  switch (trend) {
    case 'up': return '📈';
    case 'down': return '📉';
    default: return '➡️';
  }
};

const getGrowthClass = (growth) => {
  if (growth > 30) return 'high-growth';
  if (growth > 10) return 'medium-growth';
  return 'low-growth';
};

// 交互功能
const viewContent = (recommendation) => {
  console.log('查看内容:', recommendation.title);
  // 实现查看详情功能
};

const createSimilarContent = (recommendation) => {
  console.log('创建相似内容:', recommendation.title);
  // 实现创建相似内容功能
};

const scheduleContent = (recommendation) => {
  console.log('安排发布:', recommendation.title);
  // 实现安排发布功能
};

const ignoreRecommendation = (id) => {
  recommendations.value = recommendations.value.filter(r => r.id !== id);
};

const exportRecommendations = () => {
  console.log('导出推荐数据');
  // 实现导出功能
};

const toggleAnalysisPanel = () => {
  isAnalysisPanelOpen.value = !isAnalysisPanelOpen.value;
};

// 组件挂载时初始化
onMounted(async () => {
  await fetchRecommendations();
  await fetchAIAnalysis();
});
</script>

<style scoped>
.content-recommendation-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
  color: #333;
}

/* 控制面板样式 */
.control-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recommendation-settings {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.platform-filters,
.content-type-filters {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.platform-checkbox,
.type-checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  cursor: pointer;
}

.platform-checkbox input,
.type-checkbox input {
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.refresh-btn,
.export-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.refresh-btn {
  background-color: #6366f1;
  color: white;
}

.refresh-btn:disabled {
  background-color: #a5a6f6;
  cursor: not-allowed;
}

.export-btn {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

/* 推荐内容展示区 */
.recommendations-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 20px;
}

.empty-image {
  width: 120px;
  height: 120px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d1d5db" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>');
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0.5;
}

.empty-text {
  color: #9ca3af;
  font-size: 14px;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.recommendation-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

.recommendation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.recommendation-card.high-score {
  border-color: #10b981;
}

.recommendation-card.medium-score {
  border-color: #f59e0b;
}

.recommendation-card.low-score {
  border-color: #ef4444;
}

.recommendation-score {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  z-index: 10;
}

.content-preview {
  height: 180px;
  background-color: #f9fafb;
  position: relative;
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-thumbnail {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.5;
}

.content-info {
  padding: 15px;
}

.content-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.4;
  max-height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.content-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.platform-tag,
.content-type-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.platform-tag {
  background-color: #dbeafe;
  color: #1e40af;
}

.content-type-tag {
  background-color: #f3e8ff;
  color: #7c3aed;
}

.trend-indicator {
  font-size: 14px;
}

.trend-up {
  color: #10b981;
}

.trend-stable {
  color: #6b7280;
}

.trend-down {
  color: #ef4444;
}

.content-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #6b7280;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.stat-icon {
  font-size: 12px;
}

.content-description {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 10px;
  max-height: 3em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.ai-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.ai-tag {
  background-color: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.content-actions {
  display: flex;
  justify-content: space-around;
  padding: 10px;
  border-top: 1px solid #f3f4f6;
  background-color: #fafafa;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #f3f4f6;
}

.action-icon {
  font-size: 16px;
}

/* AI分析面板 */
.ai-analysis-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.toggle-btn {
  background: none;
  border: 1px solid #d1d5db;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.analysis-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.analysis-section {
  padding: 15px;
  background-color: #f9fafb;
  border-radius: 6px;
}

.analysis-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 500;
  color: #374151;
}

.trend-analysis {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.trend-keyword {
  font-weight: 500;
  color: #374151;
  min-width: 80px;
}

.trend-growth {
  font-weight: 500;
  min-width: 40px;
}

.high-growth {
  color: #10b981;
}

.medium-growth {
  color: #f59e0b;
}

.low-growth {
  color: #6b7280;
}

.trend-bar {
  flex: 1;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.trend-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transition: width 0.3s ease;
}

.user-preferences {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preference-chart {
  height: 120px;
  background-color: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 10px;
}

.preference-stats {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pref-type {
  color: #6b7280;
  font-size: 14px;
}

.pref-value {
  font-weight: 500;
  color: #374151;
}

.best-times {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.time {
  font-weight: 500;
  color: #374151;
}

.engagement {
  color: #6366f1;
  font-weight: 500;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .recommendation-settings {
    flex-direction: column;
    gap: 20px;
  }

  .platform-filters,
  .content-type-filters {
    flex-direction: column;
    gap: 8px;
  }

  .recommendations-grid {
    grid-template-columns: 1fr;
  }

  .analysis-sections {
    grid-template-columns: 1fr;
  }
}
</style>