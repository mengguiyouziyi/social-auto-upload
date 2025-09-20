<template>
  <div class="content-analysis">
    <!-- 头部操作区 -->
    <div class="analysis-header">
      <div class="header-left">
        <h2>内容分析与优化</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">工作台</el-breadcrumb-item>
          <el-breadcrumb-item>内容分析</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="startNewAnalysis">
          <el-icon><Refresh /></el-icon>开始分析
        </el-button>
        <el-button @click="exportAnalysisReport">
          <el-icon><Download /></el-icon>导出报告
        </el-button>
      </div>
    </div>

    <!-- 分析概览 -->
    <div class="analysis-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon analysis-icon">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ analysisStats.totalAnalyzed }}</div>
                <div class="metric-label">已分析内容</div>
                <div class="metric-trend">
                  <span class="trend-up">+12.5%</span>
                  较上周
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon optimization-icon">
                <el-icon><MagicStick /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ analysisStats.optimizationScore }}</div>
                <div class="metric-label">优化得分</div>
                <div class="metric-trend">
                  <span class="trend-up">+8.3%</span>
                  提升空间
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon insight-icon">
                <el-icon><Sunny /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ analysisStats.insightsGenerated }}</div>
                <div class="metric-label">洞察建议</div>
                <div class="metric-trend">
                  <span class="trend-up">+15.2%</span>
                  新建议
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon performance-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ analysisStats.performanceBoost }}%</div>
                <div class="metric-label">性能提升</div>
                <div class="metric-trend">
                  <span class="trend-up">+5.7%</span>
                  预期提升
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区 -->
    <div class="analysis-content">
      <el-row :gutter="20">
        <!-- 左侧分析面板 -->
        <el-col :span="16">
          <!-- 内容质量分析 -->
          <el-card class="analysis-card">
            <template #header>
              <div class="card-header">
                <h3>内容质量分析</h3>
                <div class="header-actions">
                  <el-select v-model="selectedContentType" @change="analyzeContent" placeholder="内容类型">
                    <el-option label="全部内容" value="all" />
                    <el-option label="短视频" value="video" />
                    <el-option label="图文" value="image" />
                    <el-option label="文案" value="text" />
                  </el-select>
                  <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    @change="analyzeContent"
                  />
                </div>
              </div>
            </template>

            <div class="quality-analysis">
              <div class="analysis-tabs">
                <el-tabs v-model="activeAnalysisTab">
                  <el-tab-pane label="整体评分" name="overall">
                    <div class="score-breakdown">
                      <div class="score-chart">
                        <div class="radar-chart" ref="radarChart"></div>
                      </div>
                      <div class="score-details">
                        <div class="score-item">
                          <span class="label">内容吸引力</span>
                          <div class="score-bar">
                            <div class="score-fill" :style="{width: qualityScores.engagement + '%'}"></div>
                          </div>
                          <span class="value">{{ qualityScores.engagement }}%</span>
                        </div>
                        <div class="score-item">
                          <span class="label">信息价值</span>
                          <div class="score-bar">
                            <div class="score-fill" :style="{width: qualityScores.value + '%'}"></div>
                          </div>
                          <span class="value">{{ qualityScores.value }}%</span>
                        </div>
                        <div class="score-item">
                          <span class="label">创意独特性</span>
                          <div class="score-bar">
                            <div class="score-fill" :style="{width: qualityScores.creativity + '%'}"></div>
                          </div>
                          <span class="value">{{ qualityScores.creativity }}%</span>
                        </div>
                        <div class="score-item">
                          <span class="label">目标契合度</span>
                          <div class="score-bar">
                            <div class="score-fill" :style="{width: qualityScores.relevance + '%'}"></div>
                          </div>
                          <span class="value">{{ qualityScores.relevance }}%</span>
                        </div>
                        <div class="score-item">
                          <span class="label">传播潜力</span>
                          <div class="score-bar">
                            <div class="score-fill" :style="{width: qualityScores.virality + '%'}"></div>
                          </div>
                          <span class="value">{{ qualityScores.virality }}%</span>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>

                  <el-tab-pane label="关键词分析" name="keywords">
                    <div class="keyword-analysis">
                      <div class="keyword-cloud">
                        <div
                          v-for="(keyword, index) in keywordCloud"
                          :key="index"
                          class="keyword-item"
                          :style="{fontSize: keyword.size + 'px', color: keyword.color}"
                        >
                          {{ keyword.word }}
                        </div>
                      </div>
                      <div class="keyword-table">
                        <el-table :data="topKeywords" style="width: 100%">
                          <el-table-column prop="keyword" label="关键词" width="150" />
                          <el-table-column prop="frequency" label="出现频率" width="120" />
                          <el-table-column prop="engagement" label="互动率" width="120" />
                          <el-table-column prop="sentiment" label="情感倾向" width="120">
                            <template #default="scope">
                              <el-tag :type="getSentimentType(scope.row.sentiment)">
                                {{ scope.row.sentiment }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column prop="trend" label="趋势">
                            <template #default="scope">
                              <el-icon :class="scope.row.trend > 0 ? 'trend-up' : 'trend-down'">
                                <ArrowUp v-if="scope.row.trend > 0" />
                                <ArrowDown v-else />
                              </el-icon>
                              {{ Math.abs(scope.row.trend) }}%
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </div>
                  </el-tab-pane>

                  <el-tab-pane label="情感分析" name="sentiment">
                    <div class="sentiment-analysis">
                      <div class="sentiment-chart">
                        <div class="chart-container" ref="sentimentChart"></div>
                      </div>
                      <div class="sentiment-details">
                        <div class="sentiment-item positive">
                          <div class="sentiment-icon">😊</div>
                          <div class="sentiment-info">
                            <div class="sentiment-label">正面情感</div>
                            <div class="sentiment-value">{{ sentimentData.positive }}%</div>
                            <div class="sentiment-desc">用户反响积极</div>
                          </div>
                        </div>
                        <div class="sentiment-item neutral">
                          <div class="sentiment-icon">😐</div>
                          <div class="sentiment-info">
                            <div class="sentiment-label">中性情感</div>
                            <div class="sentiment-value">{{ sentimentData.neutral }}%</div>
                            <div class="sentiment-desc">态度中立客观</div>
                          </div>
                        </div>
                        <div class="sentiment-item negative">
                          <div class="sentiment-icon">😞</div>
                          <div class="sentiment-info">
                            <div class="sentiment-label">负面情感</div>
                            <div class="sentiment-value">{{ sentimentData.negative }}%</div>
                            <div class="sentiment-desc">需要改进优化</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </el-card>

          <!-- 竞品分析 -->
          <el-card class="analysis-card">
            <template #header>
              <div class="card-header">
                <h3>竞品对比分析</h3>
                <el-button type="primary" size="small" @click="refreshCompetitorAnalysis">
                  <el-icon><Refresh /></el-icon>刷新分析
                </el-button>
              </div>
            </template>

            <div class="competitor-analysis">
              <div class="competitor-grid">
                <div
                  v-for="competitor in competitors"
                  :key="competitor.id"
                  class="competitor-card"
                >
                  <div class="competitor-header">
                    <img :src="competitor.avatar" :alt="competitor.name" class="competitor-avatar">
                    <div class="competitor-info">
                      <h4>{{ competitor.name }}</h4>
                      <p>{{ competitor.category }}</p>
                    </div>
                  </div>
                  <div class="competitor-metrics">
                    <div class="metric-row">
                      <span class="metric-label">粉丝数</span>
                      <span class="metric-value">{{ competitor.followers }}</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">平均互动</span>
                      <span class="metric-value">{{ competitor.avgEngagement }}%</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">发布频率</span>
                      <span class="metric-value">{{ competitor.postFrequency }}/天</span>
                    </div>
                  </div>
                  <div class="competitor-analysis">
                    <div class="analysis-item">
                      <span class="analysis-label">优势</span>
                      <p class="analysis-value">{{ competitor.strengths }}</p>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">劣势</span>
                      <p class="analysis-value">{{ competitor.weaknesses }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧建议面板 -->
        <el-col :span="8">
          <!-- AI优化建议 -->
          <el-card class="suggestions-card">
            <template #header>
              <div class="card-header">
                <h3>AI优化建议</h3>
                <el-button type="primary" size="small" @click="generateNewSuggestions">
                  <el-icon><MagicStick /></el-icon>生成建议
                </el-button>
              </div>
            </template>

            <div class="suggestions-list">
              <div
                v-for="(suggestion, index) in optimizationSuggestions"
                :key="index"
                class="suggestion-item"
                :class="suggestion.priority"
              >
                <div class="suggestion-header">
                  <div class="suggestion-icon">
                    <el-icon>
                      <Sunny v-if="suggestion.priority === 'high'" />
                      <Warning v-else-if="suggestion.priority === 'medium'" />
                      <InfoFilled v-else />
                    </el-icon>
                  </div>
                  <div class="suggestion-title">
                    <h4>{{ suggestion.title }}</h4>
                    <span class="suggestion-type">{{ suggestion.type }}</span>
                  </div>
                </div>
                <div class="suggestion-content">
                  <p>{{ suggestion.description }}</p>
                  <div class="suggestion-impact">
                    <span class="impact-label">预期影响:</span>
                    <div class="impact-meter">
                      <div
                        class="impact-fill"
                        :style="{width: suggestion.impact + '%'}"
                      ></div>
                    </div>
                    <span class="impact-value">{{ suggestion.impact }}%</span>
                  </div>
                </div>
                <div class="suggestion-actions">
                  <el-button size="small" type="primary" @click="applySuggestion(suggestion)">
                    应用建议
                  </el-button>
                  <el-button size="small" @click="dismissSuggestion(index)">
                    忽略
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 内容优化工具 -->
          <el-card class="tools-card">
            <template #header>
              <div class="card-header">
                <h3>优化工具</h3>
              </div>
            </template>

            <div class="tools-list">
              <div class="tool-item" @click="openTool('title')">
                <div class="tool-icon">
                  <el-icon><EditPen /></el-icon>
                </div>
                <div class="tool-info">
                  <h4>标题优化器</h4>
                  <p>优化标题吸引力和点击率</p>
                </div>
              </div>
              <div class="tool-item" @click="openTool('hashtag')">
                <div class="tool-icon">
                  <el-icon><PriceTag /></el-icon>
                </div>
                <div class="tool-info">
                  <h4>标签推荐</h4>
                  <p>智能推荐热门标签</p>
                </div>
              </div>
              <div class="tool-item" @click="openTool('timing')">
                <div class="tool-icon">
                  <el-icon><Timer /></el-icon>
                </div>
                <div class="tool-info">
                  <h4>发布时机</h4>
                  <p>分析最佳发布时间</p>
                </div>
              </div>
              <div class="tool-item" @click="openTool('format')">
                <div class="tool-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="tool-info">
                  <h4>格式优化</h4>
                  <p>内容格式和结构调整</p>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 分析报告 -->
          <el-card class="report-card">
            <template #header>
              <div class="card-header">
                <h3>分析报告</h3>
                <el-button type="primary" size="small" @click="generateReport">
                  <el-icon><Document /></el-icon>生成报告
                </el-button>
              </div>
            </template>

            <div class="report-list">
              <div
                v-for="report in analysisReports"
                :key="report.id"
                class="report-item"
              >
                <div class="report-info">
                  <h4>{{ report.title }}</h4>
                  <p>{{ report.date }}</p>
                </div>
                <div class="report-actions">
                  <el-button size="small" @click="viewReport(report)">
                    查看
                  </el-button>
                  <el-button size="small" @click="downloadReport(report)">
                    下载
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 工具对话框 -->
    <el-dialog
      v-model="toolDialog.visible"
      :title="toolDialog.title"
      width="600px"
    >
      <div class="tool-content">
        <div v-if="toolDialog.type === 'title'" class="title-optimizer">
          <el-form :model="titleForm" label-width="100px">
            <el-form-item label="原标题">
              <el-input
                v-model="titleForm.original"
                type="textarea"
                :rows="2"
                placeholder="请输入原标题"
              />
            </el-form-item>
            <el-form-item label="内容类型">
              <el-select v-model="titleForm.contentType" placeholder="选择内容类型">
                <el-option label="短视频" value="video" />
                <el-option label="图文" value="image" />
                <el-option label="文章" value="article" />
              </el-select>
            </el-form-item>
            <el-form-item label="目标受众">
              <el-input v-model="titleForm.targetAudience" placeholder="描述目标受众" />
            </el-form-item>
          </el-form>
          <div class="optimization-results">
            <h4>优化建议</h4>
            <div class="suggestion-list">
              <div
                v-for="(suggestion, index) in titleOptimizations"
                :key="index"
                class="title-suggestion"
              >
                <div class="suggestion-text">{{ suggestion.text }}</div>
                <div class="suggestion-score">
                  <span class="score-label">评分:</span>
                  <span class="score-value">{{ suggestion.score }}</span>
                </div>
                <el-button size="small" type="primary" @click="useTitleSuggestion(suggestion)">
                  使用此标题
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="toolDialog.type === 'hashtag'" class="hashtag-recommender">
          <el-form :model="hashtagForm" label-width="100px">
            <el-form-item label="内容描述">
              <el-input
                v-model="hashtagForm.description"
                type="textarea"
                :rows="3"
                placeholder="描述您的内容主题"
              />
            </el-form-item>
            <el-form-item label="内容类型">
              <el-select v-model="hashtagForm.contentType" placeholder="选择内容类型">
                <el-option label="短视频" value="video" />
                <el-option label="图文" value="image" />
                <el-option label="文章" value="article" />
              </el-select>
            </el-form-item>
          </el-form>
          <div class="hashtag-results">
            <h4>推荐标签</h4>
            <div class="hashtag-cloud">
              <el-tag
                v-for="tag in recommendedHashtags"
                :key="tag.name"
                :type="getTagType(tag.popularity)"
                class="hashtag-tag"
                @click="selectHashtag(tag)"
              >
                #{{ tag.name }}
                <span class="tag-popularity">{{ tag.popularity }}</span>
              </el-tag>
            </div>
          </div>
        </div>

        <div v-else-if="toolDialog.type === 'timing'" class="timing-analyzer">
          <div class="timing-chart">
            <div class="chart-container" ref="timingChart"></div>
          </div>
          <div class="timing-recommendations">
            <h4>推荐发布时间</h4>
            <div class="time-slots">
              <div
                v-for="slot in recommendedTimes"
                :key="slot.time"
                class="time-slot"
              >
                <div class="time">{{ slot.time }}</div>
                <div class="engagement">{{ slot.engagement }}% 互动率</div>
                <div class="reason">{{ slot.reason }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="toolDialog.type === 'format'" class="format-optimizer">
          <el-form :model="formatForm" label-width="100px">
            <el-form-item label="内容类型">
              <el-select v-model="formatForm.contentType" placeholder="选择内容类型">
                <el-option label="短视频" value="video" />
                <el-option label="图文" value="image" />
                <el-option label="文章" value="article" />
              </el-select>
            </el-form-item>
            <el-form-item label="平台">
              <el-select v-model="formatForm.platform" placeholder="选择发布平台">
                <el-option label="抖音" value="douyin" />
                <el-option label="快手" value="kuaishou" />
                <el-option label="小红书" value="xiaohongshu" />
                <el-option label="微博" value="weibo" />
              </el-select>
            </el-form-item>
          </el-form>
          <div class="format-recommendations">
            <h4>格式建议</h4>
            <div class="format-tips">
              <div
                v-for="tip in formatTips"
                :key="tip.id"
                class="format-tip"
              >
                <div class="tip-icon">
                  <el-icon><Sunny /></el-icon>
                </div>
                <div class="tip-content">
                  <h5>{{ tip.title }}</h5>
                  <p>{{ tip.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="toolDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis, MagicStick, TrendCharts, Refresh, Download,
  ArrowUp, ArrowDown, EditPen, PriceTag, Timer, Document, Warning,
  InfoFilled, Sunny
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const analysisStats = ref({
  totalAnalyzed: 1234,
  optimizationScore: 85,
  insightsGenerated: 67,
  performanceBoost: 23
})

const selectedContentType = ref('all')
const dateRange = ref([])
const activeAnalysisTab = ref('overall')

const qualityScores = ref({
  engagement: 78,
  value: 85,
  creativity: 72,
  relevance: 90,
  virality: 65
})

const keywordCloud = ref([
  { word: '美食', size: 32, color: '#409EFF' },
  { word: '探店', size: 28, color: '#67C23A' },
  { word: '推荐', size: 24, color: '#E6A23C' },
  { word: '教程', size: 20, color: '#F56C6C' },
  { word: '生活', size: 18, color: '#909399' },
  { word: '分享', size: 16, color: '#409EFF' },
  { word: '体验', size: 14, color: '#67C23A' }
])

const topKeywords = ref([
  { keyword: '美食推荐', frequency: 156, engagement: 12.5, sentiment: '正面', trend: 8.2 },
  { keyword: '探店vlog', frequency: 142, engagement: 15.3, sentiment: '正面', trend: 12.1 },
  { keyword: '美食教程', frequency: 128, engagement: 18.7, sentiment: '中性', trend: -2.3 },
  { keyword: '生活分享', frequency: 115, engagement: 9.8, sentiment: '正面', trend: 5.6 },
  { keyword: '体验评测', frequency: 98, engagement: 22.1, sentiment: '中性', trend: 15.8 }
])

const sentimentData = ref({
  positive: 68,
  neutral: 25,
  negative: 7
})

const competitors = ref([
  {
    id: 1,
    name: '美食达人小李',
    category: '美食博主',
    avatar: 'https://placeholder.com/100x100',
    followers: '125万',
    avgEngagement: 8.5,
    postFrequency: 1.2,
    strengths: '内容制作精良，粉丝互动率高',
    weaknesses: '更新频率不稳定，内容创新不足'
  },
  {
    id: 2,
    name: '生活美学家',
    category: '生活方式',
    avatar: 'https://placeholder.com/100x100',
    followers: '89万',
    avgEngagement: 12.3,
    postFrequency: 2.1,
    strengths: '内容质量高，品牌合作多',
    weaknesses: '商业化过重，用户粘性下降'
  }
])

const optimizationSuggestions = ref([
  {
    title: '优化标题关键词',
    type: '标题优化',
    priority: 'high',
    description: '当前标题关键词密度过低，建议增加相关关键词以提高搜索曝光率',
    impact: 85
  },
  {
    title: '增加互动引导',
    type: '内容优化',
    priority: 'medium',
    description: '在内容结尾增加互动性问题，可以提高用户参与度',
    impact: 65
  },
  {
    title: '调整发布时间',
    type: '发布策略',
    priority: 'medium',
    description: '根据用户活跃度分析，建议将发布时间调整至晚上8-10点',
    impact: 45
  }
])

const analysisReports = ref([
  { id: 1, title: '周度内容分析报告', date: '2024-01-15' },
  { id: 2, title: '竞品对比分析', date: '2024-01-08' },
  { id: 3, title: '关键词优化建议', date: '2024-01-01' }
])

const toolDialog = reactive({
  visible: false,
  title: '',
  type: ''
})

const titleForm = reactive({
  original: '',
  contentType: '',
  targetAudience: ''
})

const hashtagForm = reactive({
  description: '',
  contentType: ''
})

const formatForm = reactive({
  contentType: '',
  platform: ''
})

const titleOptimizations = ref([
  { text: '【必看】这家隐藏在小巷的神仙美食，99%的人不知道！', score: 95 },
  { text: '美食探店vlog：意外发现的宝藏店铺，味道绝了！', score: 88 },
  { text: '本地美食推荐：这家小店让我连去3天，太上头了！', score: 82 }
])

const recommendedHashtags = ref([
  { name: '美食探店', popularity: '热门' },
  { name: '美食推荐', popularity: '热门' },
  { name: '美食vlog', popularity: '推荐' },
  { name: '探店日记', popularity: '推荐' },
  { name: '美食分享', popularity: '普通' }
])

const recommendedTimes = ref([
  { time: '20:00-21:00', engagement: 18.5, reason: '用户下班后休闲时间' },
  { time: '12:30-13:30', engagement: 15.2, reason: '午休时段，用户活跃' },
  { time: '19:00-20:00', engagement: 12.8, reason: '晚餐时间，轻松浏览' }
])

const formatTips = ref([
  { id: 1, title: '视频时长控制', description: '建议控制在15-30秒，完播率更高' },
  { id: 2, title: '封面优化', description: '使用高清封面，添加文字标题' },
  { id: 3, title: '背景音乐', description: '选择热门BGM，提高推荐几率' },
  { id: 4, title: '字幕设置', description: '添加醒目字幕，提高观看体验' }
])

// 图表实例
let radarChart = null
let sentimentChart = null
let timingChart = null

// 方法定义
const startNewAnalysis = () => {
  ElMessage.success('开始新的内容分析...')
  // 模拟分析过程
  setTimeout(() => {
    ElMessage.success('内容分析完成！')
  }, 2000)
}

const exportAnalysisReport = () => {
  ElMessage.success('正在导出分析报告...')
  // 模拟导出过程
  setTimeout(() => {
    ElMessage.success('分析报告导出成功！')
  }, 1500)
}

const analyzeContent = () => {
  ElMessage.info('正在分析内容...')
  // 模拟分析过程
  setTimeout(() => {
    updateCharts()
    ElMessage.success('内容分析更新完成！')
  }, 1000)
}

const getSentimentType = (sentiment) => {
  switch (sentiment) {
    case '正面': return 'success'
    case '负面': return 'danger'
    default: return 'info'
  }
}

const refreshCompetitorAnalysis = () => {
  ElMessage.info('正在刷新竞品分析...')
  // 模拟刷新过程
  setTimeout(() => {
    ElMessage.success('竞品分析更新完成！')
  }, 1500)
}

const generateNewSuggestions = () => {
  ElMessage.info('正在生成新的优化建议...')
  // 模拟生成过程
  setTimeout(() => {
    const newSuggestion = {
      title: '内容形式多样化',
      type: '内容策略',
      priority: 'medium',
      description: '建议尝试更多样的内容形式，如直播、问答等',
      impact: 70
    }
    optimizationSuggestions.value.push(newSuggestion)
    ElMessage.success('新的优化建议已生成！')
  }, 2000)
}

const applySuggestion = (suggestion) => {
  ElMessageBox.confirm(
    `确定要应用建议"${suggestion.title}"吗？`,
    '确认应用',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    ElMessage.success(`建议"${suggestion.title}"已应用！`)
  }).catch(() => {
    // 用户取消
  })
}

const dismissSuggestion = (index) => {
  optimizationSuggestions.value.splice(index, 1)
  ElMessage.info('建议已忽略')
}

const openTool = (type) => {
  const toolNames = {
    title: '标题优化器',
    hashtag: '标签推荐',
    timing: '发布时机分析',
    format: '格式优化'
  }

  toolDialog.title = toolNames[type]
  toolDialog.type = type
  toolDialog.visible = true

  nextTick(() => {
    if (type === 'timing') {
      initTimingChart()
    }
  })
}

const generateReport = () => {
  ElMessage.info('正在生成分析报告...')
  // 模拟生成过程
  setTimeout(() => {
    const newReport = {
      id: analysisReports.value.length + 1,
      title: `内容分析报告 - ${new Date().toLocaleDateString()}`,
      date: new Date().toLocaleDateString()
    }
    analysisReports.value.unshift(newReport)
    ElMessage.success('分析报告生成完成！')
  }, 2000)
}

const viewReport = (report) => {
  ElMessage.info(`查看报告: ${report.title}`)
  // 这里可以打开报告详情页面
}

const downloadReport = (report) => {
  ElMessage.success(`正在下载报告: ${report.title}`)
  // 这里可以实现文件下载
}

const useTitleSuggestion = (suggestion) => {
  ElMessage.success('已使用优化标题！')
  toolDialog.visible = false
}

const selectHashtag = (tag) => {
  ElMessage.success(`已选择标签: #${tag.name}`)
  // 这里可以将选中的标签添加到内容中
}

const getTagType = (popularity) => {
  switch (popularity) {
    case '热门': return 'danger'
    case '推荐': return 'warning'
    default: return 'info'
  }
}

// 图表初始化
const initCharts = () => {
  nextTick(() => {
    initRadarChart()
    initSentimentChart()
  })
}

const initRadarChart = () => {
  const chartDom = document.querySelector('.radar-chart')
  if (!chartDom) return

  radarChart = echarts.init(chartDom)
  const option = {
    radar: {
      indicator: [
        { name: '内容吸引力', max: 100 },
        { name: '信息价值', max: 100 },
        { name: '创意独特性', max: 100 },
        { name: '目标契合度', max: 100 },
        { name: '传播潜力', max: 100 }
      ]
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          qualityScores.value.engagement,
          qualityScores.value.value,
          qualityScores.value.creativity,
          qualityScores.value.relevance,
          qualityScores.value.virality
        ],
        name: '当前得分',
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.2)'
        },
        lineStyle: {
          color: '#409EFF'
        }
      }]
    }]
  }
  radarChart.setOption(option)
}

const initSentimentChart = () => {
  const chartDom = document.querySelector('.sentiment-chart .chart-container')
  if (!chartDom) return

  sentimentChart = echarts.init(chartDom)
  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: sentimentData.value.positive, name: '正面情感', itemStyle: { color: '#67C23A' } },
        { value: sentimentData.value.neutral, name: '中性情感', itemStyle: { color: '#909399' } },
        { value: sentimentData.value.negative, name: '负面情感', itemStyle: { color: '#F56C6C' } }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  sentimentChart.setOption(option)
}

const initTimingChart = () => {
  const chartDom = document.querySelector('.timing-chart .chart-container')
  if (!chartDom) return

  timingChart = echarts.init(chartDom)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['6:00', '9:00', '12:00', '15:00', '18:00', '21:00', '24:00']
    },
    yAxis: {
      type: 'value',
      name: '互动率(%)'
    },
    series: [{
      data: [5, 8, 15, 12, 18, 22, 8],
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(64, 158, 255, 0.2)'
      },
      lineStyle: {
        color: '#409EFF'
      }
    }]
  }
  timingChart.setOption(option)
}

const updateCharts = () => {
  if (radarChart) {
    radarChart.setOption({
      series: [{
        data: [{
          value: [
            qualityScores.value.engagement,
            qualityScores.value.value,
            qualityScores.value.creativity,
            qualityScores.value.relevance,
            qualityScores.value.virality
          ]
        }]
      }]
    })
  }

  if (sentimentChart) {
    sentimentChart.setOption({
      series: [{
        data: [
          { value: sentimentData.value.positive, name: '正面情感' },
          { value: sentimentData.value.neutral, name: '中性情感' },
          { value: sentimentData.value.negative, name: '负面情感' }
        ]
      }]
    })
  }
}

// 生命周期钩子
onMounted(() => {
  initCharts()

  // 模拟数据更新
  setInterval(() => {
    // 更新分析统计数据
    analysisStats.value.totalAnalyzed += Math.floor(Math.random() * 5)
    analysisStats.value.insightsGenerated += Math.floor(Math.random() * 3)
  }, 30000)
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.content-analysis {
  .analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .header-left {
      h2 {
        margin: 0 0 8px 0;
        color: $text-primary;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .analysis-overview {
    margin-bottom: 24px;

    .metric-card {
      height: 120px;

      .metric-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;

          &.analysis-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          &.optimization-icon {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }

          &.insight-icon {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
          }

          &.performance-icon {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            color: white;
          }
        }

        .metric-info {
          flex: 1;

          .metric-value {
            font-size: 24px;
            font-weight: 600;
            color: $text-primary;
            margin-bottom: 4px;
          }

          .metric-label {
            color: $text-secondary;
            font-size: 14px;
            margin-bottom: 4px;
          }

          .metric-trend {
            font-size: 12px;
            color: $text-secondary;

            .trend-up {
              color: $success-color;
              font-weight: 600;
            }
          }
        }
      }
    }
  }

  .analysis-content {
    .analysis-card {
      margin-bottom: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          color: $text-primary;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
      }

      .quality-analysis {
        .analysis-tabs {
          .score-breakdown {
            display: flex;
            gap: 24px;
            align-items: center;

            .score-chart {
              flex: 1;
              height: 300px;
            }

            .score-details {
              flex: 1;

              .score-item {
                display: flex;
                align-items: center;
                margin-bottom: 16px;

                .label {
                  width: 100px;
                  color: $text-secondary;
                }

                .score-bar {
                  flex: 1;
                  height: 8px;
                  background: $border-base;
                  border-radius: 4px;
                  overflow: hidden;
                  margin: 0 12px;

                  .score-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
                    border-radius: 4px;
                  }
                }

                .value {
                  width: 50px;
                  text-align: right;
                  font-weight: 600;
                  color: $text-primary;
                }
              }
            }
          }

          .keyword-analysis {
            .keyword-cloud {
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
              margin-bottom: 24px;
              padding: 20px;
              background: $bg-color;
              border-radius: 8px;

              .keyword-item {
                cursor: pointer;
                transition: transform 0.2s;

                &:hover {
                  transform: scale(1.1);
                }
              }
            }
          }

          .sentiment-analysis {
            display: flex;
            gap: 24px;

            .sentiment-chart {
              flex: 1;
              height: 300px;
            }

            .sentiment-details {
              flex: 1;

              .sentiment-item {
                display: flex;
                align-items: center;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 16px;

                &.positive {
                  background: rgba(103, 194, 58, 0.1);
                }

                &.neutral {
                  background: rgba(144, 147, 153, 0.1);
                }

                &.negative {
                  background: rgba(245, 108, 108, 0.1);
                }

                .sentiment-icon {
                  font-size: 24px;
                  margin-right: 16px;
                }

                .sentiment-info {
                  flex: 1;

                  .sentiment-label {
                    font-weight: 600;
                    color: $text-primary;
                    margin-bottom: 4px;
                  }

                  .sentiment-value {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 4px;
                  }

                  .sentiment-desc {
                    color: $text-secondary;
                    font-size: 14px;
                  }
                }
              }
            }
          }
        }
      }

      .competitor-analysis {
        .competitor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;

          .competitor-card {
            border: 1px solid $border-base;
            border-radius: 8px;
            padding: 16px;

            .competitor-header {
              display: flex;
              align-items: center;
              margin-bottom: 16px;

              .competitor-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                margin-right: 12px;
              }

              .competitor-info {
                h4 {
                  margin: 0 0 4px 0;
                  color: $text-primary;
                }

                p {
                  margin: 0;
                  color: $text-secondary;
                  font-size: 14px;
                }
              }
            }

            .competitor-metrics {
              margin-bottom: 16px;

              .metric-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;

                .metric-label {
                  color: $text-secondary;
                }

                .metric-value {
                  font-weight: 600;
                  color: $text-primary;
                }
              }
            }

            .competitor-analysis {
              .analysis-item {
                margin-bottom: 12px;

                .analysis-label {
                  font-weight: 600;
                  color: $text-primary;
                  font-size: 14px;
                  margin-bottom: 4px;
                }

                .analysis-value {
                  color: $text-secondary;
                  font-size: 14px;
                  margin: 0;
                }
              }
            }
          }
        }
      }
    }

    .suggestions-card {
      margin-bottom: 20px;

      .suggestions-list {
        .suggestion-item {
          border: 1px solid $border-base;
          border-radius: 8px;
          margin-bottom: 12px;
          overflow: hidden;

          &.high {
            border-left: 4px solid $danger-color;
          }

          &.medium {
            border-left: 4px solid $warning-color;
          }

          &.low {
            border-left: 4px solid $info-color;
          }

          .suggestion-header {
            display: flex;
            align-items: center;
            padding: 12px;
            background: $bg-color;

            .suggestion-icon {
              margin-right: 12px;
              color: $primary-color;
            }

            .suggestion-title {
              flex: 1;

              h4 {
                margin: 0 0 4px 0;
                color: $text-primary;
                font-size: 14px;
              }

              .suggestion-type {
                color: $text-secondary;
                font-size: 12px;
              }
            }
          }

          .suggestion-content {
            padding: 12px;

            p {
              margin: 0 0 12px 0;
              color: $text-secondary;
              font-size: 14px;
            }

            .suggestion-impact {
              display: flex;
              align-items: center;
              gap: 8px;

              .impact-label {
                color: $text-secondary;
                font-size: 12px;
              }

              .impact-meter {
                flex: 1;
                height: 6px;
                background: $border-base;
                border-radius: 3px;
                overflow: hidden;

                .impact-fill {
                  height: 100%;
                  background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
                }
              }

              .impact-value {
                font-weight: 600;
                color: $text-primary;
                font-size: 12px;
                min-width: 40px;
                text-align: right;
              }
            }
          }

          .suggestion-actions {
            display: flex;
            gap: 8px;
            padding: 12px;
            background: $bg-color;
            border-top: 1px solid $border-base;
          }
        }
      }
    }

    .tools-card {
      margin-bottom: 20px;

      .tools-list {
        .tool-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;

          &:hover {
            background: $bg-color;
          }

          .tool-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            margin-right: 12px;
          }

          .tool-info {
            h4 {
              margin: 0 0 4px 0;
              color: $text-primary;
              font-size: 14px;
            }

            p {
              margin: 0;
              color: $text-secondary;
              font-size: 12px;
            }
          }
        }
      }
    }

    .report-card {
      .report-list {
        .report-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid $border-base;

          &:last-child {
            border-bottom: none;
          }

          .report-info {
            h4 {
              margin: 0 0 4px 0;
              color: $text-primary;
              font-size: 14px;
            }

            p {
              margin: 0;
              color: $text-secondary;
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  .tool-content {
    .title-optimizer,
    .hashtag-recommender,
    .format-optimizer {
      .optimization-results,
      .hashtag-results,
      .format-recommendations {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid $border-base;

        h4 {
          margin: 0 0 16px 0;
          color: $text-primary;
        }

        .suggestion-list {
          .title-suggestion {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            border: 1px solid $border-base;
            border-radius: 8px;
            margin-bottom: 12px;

            .suggestion-text {
              flex: 1;
              font-size: 14px;
              color: $text-primary;
            }

            .suggestion-score {
              margin: 0 12px;
              font-weight: 600;
              color: $primary-color;
            }
          }
        }

        .hashtag-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .hashtag-tag {
            cursor: pointer;
            transition: transform 0.2s;

            &:hover {
              transform: scale(1.05);
            }

            .tag-popularity {
              margin-left: 4px;
              font-size: 12px;
            }
          }
        }

        .format-tips {
          .format-tip {
            display: flex;
            align-items: flex-start;
            padding: 12px;
            border: 1px solid $border-base;
            border-radius: 8px;
            margin-bottom: 12px;

            .tip-icon {
              margin-right: 12px;
              color: $primary-color;
              margin-top: 2px;
            }

            .tip-content {
              flex: 1;

              h5 {
                margin: 0 0 4px 0;
                color: $text-primary;
                font-size: 14px;
              }

              p {
                margin: 0;
                color: $text-secondary;
                font-size: 13px;
              }
            }
          }
        }
      }
    }

    .timing-analyzer {
      .timing-chart {
        height: 300px;
        margin-bottom: 24px;
      }

      .timing-recommendations {
        .time-slots {
          .time-slot {
            padding: 16px;
            border: 1px solid $border-base;
            border-radius: 8px;
            margin-bottom: 12px;

            .time {
              font-size: 16px;
              font-weight: 600;
              color: $text-primary;
              margin-bottom: 4px;
            }

            .engagement {
              color: $success-color;
              font-weight: 600;
              margin-bottom: 4px;
            }

            .reason {
              color: $text-secondary;
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}

.trend-up {
  color: $success-color;
}

.trend-down {
  color: $danger-color;
}
</style>