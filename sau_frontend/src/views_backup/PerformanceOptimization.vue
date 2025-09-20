<template>
  <div class="performance-optimization">
    <!-- 头部操作区 -->
    <div class="optimization-header">
      <div class="header-left">
        <h2>性能优化中心</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">工作台</el-breadcrumb-item>
          <el-breadcrumb-item>性能优化中心</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="runFullOptimization">
          <el-icon><MagicStick /></el-icon>一键优化
        </el-button>
        <el-button @click="exportPerformanceReport">
          <el-icon><Download /></el-icon>性能报告
        </el-button>
      </div>
    </div>

    <!-- 性能概览 -->
    <div class="performance-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon speed-icon">
                <el-icon><Refresh /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ performanceMetrics.loadTime }}ms</div>
                <div class="metric-label">页面加载时间</div>
                <div class="metric-trend">
                  <span class="trend-down">-15%</span>
                  优化提升
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon memory-icon">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ performanceMetrics.memoryUsage }}MB</div>
                <div class="metric-label">内存使用</div>
                <div class="metric-trend">
                  <span class="trend-down">-8%</span>
                  内存优化
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon bundle-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ performanceMetrics.bundleSize }}KB</div>
                <div class="metric-label">包大小</div>
                <div class="metric-trend">
                  <span class="trend-down">-23%</span>
                  体积优化
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon score-icon">
                <el-icon><Star /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ performanceMetrics.performanceScore }}</div>
                <div class="metric-label">性能评分</div>
                <div class="metric-trend">
                  <span class="trend-up">+12</span>
                  评分提升
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区 -->
    <div class="optimization-content">
      <el-row :gutter="20">
        <!-- 左侧性能分析 -->
        <el-col :span="16">
          <!-- 性能分析 -->
          <el-card class="analysis-card">
            <template #header>
              <div class="card-header">
                <h3>性能分析</h3>
                <div class="header-actions">
                  <el-button type="primary" size="small" @click="analyzePerformance">
                    <el-icon><Refresh /></el-icon>重新分析
                  </el-button>
                  <el-select v-model="analysisType" @change="analyzePerformance" placeholder="分析类型">
                    <el-option label="综合分析" value="comprehensive" />
                    <el-option label="加载性能" value="loading" />
                    <el-option label="运行时性能" value="runtime" />
                    <el-option label="网络性能" value="network" />
                  </el-select>
                </div>
              </div>
            </template>

            <div class="performance-analysis">
              <div class="analysis-tabs">
                <el-tabs v-model="activeAnalysisTab">
                  <el-tab-pane label="性能指标" name="metrics">
                    <div class="metrics-dashboard">
                      <div class="metrics-grid">
                        <div class="metric-group">
                          <h4>加载性能</h4>
                          <div class="metric-bar-group">
                            <div class="metric-bar-item">
                              <span class="metric-label">首次内容绘制</span>
                              <div class="metric-bar">
                                <div class="metric-fill" :style="{width: '85%'}"></div>
                              </div>
                              <span class="metric-value">1.2s</span>
                            </div>
                            <div class="metric-bar-item">
                              <span class="metric-label">最大内容绘制</span>
                              <div class="metric-bar">
                                <div class="metric-fill" :style="{width: '78%'}"></div>
                              </div>
                              <span class="metric-value">2.1s</span>
                            </div>
                            <div class="metric-bar-item">
                              <span class="metric-label">首次输入延迟</span>
                              <div class="metric-bar">
                                <div class="metric-fill" :style="{width: '92%'}"></div>
                              </div>
                              <span class="metric-value">120ms</span>
                            </div>
                          </div>
                        </div>

                        <div class="metric-group">
                          <h4>运行时性能</h4>
                          <div class="metric-bar-group">
                            <div class="metric-bar-item">
                              <span class="metric-label">JavaScript执行时间</span>
                              <div class="metric-bar">
                                <div class="metric-fill" :style="{width: '65%'}"></div>
                              </div>
                              <span class="metric-value">450ms</span>
                            </div>
                            <div class="metric-bar-item">
                              <span class="metric-label">渲染时间</span>
                              <div class="metric-bar">
                                <div class="metric-fill" :style="{width: '70%'}"></div>
                              </div>
                              <span class="metric-value">180ms</span>
                            </div>
                            <div class="metric-bar-item">
                              <span class="metric-label">内存使用</span>
                              <div class="metric-bar">
                                <div class="metric-fill" :style="{width: '75%'}"></div>
                              </div>
                              <span class="metric-value">45MB</span>
                            </div>
                          </div>
                        </div>

                        <div class="metric-group">
                          <h4>网络性能</h4>
                          <div class="metric-bar-group">
                            <div class="metric-bar-item">
                              <span class="metric-label">首字节时间</span>
                              <div class="metric-bar">
                                <div class="metric-fill" :style="{width: '88%'}"></div>
                              </div>
                              <span class="metric-value">280ms</span>
                            </div>
                            <div class="metric-bar-item">
                              <span class="metric-label">资源加载时间</span>
                              <div class="metric-bar">
                                <div class="metric-fill" :style="{width: '72%'}"></div>
                              </div>
                              <span class="metric-value">1.8s</span>
                            </div>
                            <div class="metric-bar-item">
                              <span class="metric-label">缓存命中率</span>
                              <div class="metric-bar">
                                <div class="metric-fill good" :style="{width: '95%'}"></div>
                              </div>
                              <span class="metric-value good">95%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>

                  <el-tab-pane label="资源分析" name="resources">
                    <div class="resource-analysis">
                      <div class="resource-chart">
                        <div class="chart-container" ref="resourceChart"></div>
                      </div>
                      <div class="resource-list">
                        <el-table :data="resourceData" style="width: 100%">
                          <el-table-column prop="name" label="资源名称" width="200" />
                          <el-table-column prop="type" label="类型" width="100">
                            <template #default="scope">
                              <el-tag :type="getResourceTypeTag(scope.row.type)">
                                {{ scope.row.type }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column prop="size" label="大小" width="100" />
                          <el-table-column prop="loadTime" label="加载时间" width="100" />
                          <el-table-column prop="priority" label="优先级">
                            <template #default="scope">
                              <el-tag :type="getPriorityTag(scope.row.priority)">
                                {{ scope.row.priority }}
                              </el-tag>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </div>
                  </el-tab-pane>

                  <el-tab-pane label="优化建议" name="suggestions">
                    <div class="optimization-suggestions">
                      <div
                        v-for="suggestion in optimizationSuggestions"
                        :key="suggestion.id"
                        class="suggestion-item"
                        :class="suggestion.severity"
                      >
                        <div class="suggestion-header">
                          <div class="suggestion-icon">
                            <el-icon>
                              <Warning v-if="suggestion.severity === 'high'" />
                              <InfoFilled v-else-if="suggestion.severity === 'medium'" />
                              <SuccessFilled v-else />
                            </el-icon>
                          </div>
                          <div class="suggestion-title">
                            <h4>{{ suggestion.title }}</h4>
                            <span class="suggestion-category">{{ suggestion.category }}</span>
                          </div>
                          <div class="suggestion-impact">
                            <span class="impact-label">影响:</span>
                            <span class="impact-value">{{ suggestion.impact }}</span>
                          </div>
                        </div>
                        <div class="suggestion-content">
                          <p>{{ suggestion.description }}</p>
                          <div class="suggestion-actions">
                            <el-button size="small" type="primary" @click="applySuggestion(suggestion)">
                              立即优化
                            </el-button>
                            <el-button size="small" @click="viewSuggestionDetails(suggestion)">
                              查看详情
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </el-card>

          <!-- 用户体验优化 -->
          <el-card class="ux-optimization-card">
            <template #header>
              <div class="card-header">
                <h3>用户体验优化</h3>
                <el-button type="primary" size="small" @click="runUXOptimization">
                  <el-icon><MagicStick /></el-icon>优化UX
                </el-button>
              </div>
            </template>

            <div class="ux-optimization">
              <div class="ux-metrics">
                <div class="ux-metric-item">
                  <div class="ux-metric-icon">
                    <el-icon><Monitor /></el-icon>
                  </div>
                  <div class="ux-metric-content">
                    <h4>响应式设计</h4>
                    <div class="ux-metric-bar">
                      <div class="ux-metric-fill" :style="{width: '90%'}"></div>
                    </div>
                    <span class="ux-metric-value">90%</span>
                  </div>
                </div>
                <div class="ux-metric-item">
                  <div class="ux-metric-icon">
                    <el-icon><Pointer /></el-icon>
                  </div>
                  <div class="ux-metric-content">
                    <h4>交互反馈</h4>
                    <div class="ux-metric-bar">
                      <div class="ux-metric-fill" :style="{width: '85%'}"></div>
                    </div>
                    <span class="ux-metric-value">85%</span>
                  </div>
                </div>
                <div class="ux-metric-item">
                  <div class="ux-metric-icon">
                    <el-icon><ChatDotSquare /></el-icon>
                  </div>
                  <div class="ux-metric-content">
                    <h4>用户引导</h4>
                    <div class="ux-metric-bar">
                      <div class="ux-metric-fill" :style="{width: '75%'}"></div>
                    </div>
                    <span class="ux-metric-value">75%</span>
                  </div>
                </div>
                <div class="ux-metric-item">
                  <div class="ux-metric-icon">
                    <el-icon><Star /></el-icon>
                  </div>
                  <div class="ux-metric-content">
                    <h4>易用性</h4>
                    <div class="ux-metric-bar">
                      <div class="ux-metric-fill" :style="{width: '88%'}"></div>
                    </div>
                    <span class="ux-metric-value">88%</span>
                  </div>
                </div>
              </div>

              <div class="ux-features">
                <div class="feature-grid">
                  <div class="feature-item">
                    <div class="feature-icon">
                      <el-icon><Loading /></el-icon>
                    </div>
                    <div class="feature-content">
                      <h4>智能预加载</h4>
                      <p>根据用户行为预测，提前加载可能需要的资源</p>
                      <el-switch
                        v-model="uxFeatures.smartPreload"
                        @change="toggleUXFeature('smartPreload')"
                      />
                    </div>
                  </div>
                  <div class="feature-item">
                    <div class="feature-icon">
                      <el-icon><Picture /></el-icon>
                    </div>
                    <div class="feature-content">
                      <h4>懒加载</h4>
                      <p>延迟加载非关键资源，提升页面加载速度</p>
                      <el-switch
                        v-model="uxFeatures.lazyLoading"
                        @change="toggleUXFeature('lazyLoading')"
                      />
                    </div>
                  </div>
                  <div class="feature-item">
                    <div class="feature-icon">
                      <el-icon><Refresh /></el-icon>
                    </div>
                    <div class="feature-content">
                      <h4>骨架屏</h4>
                      <p>在内容加载时显示骨架屏，提升用户体验</p>
                      <el-switch
                        v-model="uxFeatures.skeletonScreen"
                        @change="toggleUXFeature('skeletonScreen')"
                      />
                    </div>
                  </div>
                  <div class="feature-item">
                    <div class="feature-icon">
                      <el-icon><Bell /></el-icon>
                    </div>
                    <div class="feature-content">
                      <h4>智能通知</h4>
                      <p>根据用户习惯，智能推送相关通知</p>
                      <el-switch
                        v-model="uxFeatures.smartNotifications"
                        @change="toggleUXFeature('smartNotifications')"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧优化工具 -->
        <el-col :span="8">
          <!-- 优化工具 -->
          <el-card class="tools-card">
            <template #header>
              <div class="card-header">
                <h3>优化工具</h3>
              </div>
            </template>

            <div class="tools-list">
              <div class="tool-item" @click="openTool('compress')">
                <div class="tool-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="tool-info">
                  <h4>资源压缩</h4>
                  <p>压缩JS、CSS、图片等资源文件</p>
                </div>
                <div class="tool-status">
                  <el-tag type="success">已启用</el-tag>
                </div>
              </div>
              <div class="tool-item" @click="openTool('cache')">
                <div class="tool-icon">
                  <el-icon><FolderOpened /></el-icon>
                </div>
                <div class="tool-info">
                  <h4>缓存优化</h4>
                  <p>优化缓存策略，提升加载速度</p>
                </div>
                <div class="tool-status">
                  <el-tag type="success">已启用</el-tag>
                </div>
              </div>
              <div class="tool-item" @click="openTool('cdn')">
                <div class="tool-icon">
                  <el-icon><Share /></el-icon>
                </div>
                <div class="tool-info">
                  <h4>CDN加速</h4>
                  <p>启用CDN加速，优化资源分发</p>
                </div>
                <div class="tool-status">
                  <el-tag type="warning">待配置</el-tag>
                </div>
              </div>
              <div class="tool-item" @click="openTool('image')">
                <div class="tool-icon">
                  <el-icon><Picture /></el-icon>
                </div>
                <div class="tool-info">
                  <h4>图片优化</h4>
                  <p>自动优化图片格式和大小</p>
                </div>
                <div class="tool-status">
                  <el-tag type="success">已启用</el-tag>
                </div>
              </div>
              <div class="tool-item" @click="openTool('bundle')">
                <div class="tool-icon">
                  <el-icon><Files /></el-icon>
                </div>
                <div class="tool-info">
                  <h4>代码分割</h4>
                  <p>智能分割代码包，按需加载</p>
                </div>
                <div class="tool-status">
                  <el-tag type="success">已启用</el-tag>
                </div>
              </div>
              <div class="tool-item" @click="openTool('service')">
                <div class="tool-icon">
                  <el-icon><Service /></el-icon>
                </div>
                <div class="tool-info">
                  <h4>Service Worker</h4>
                  <p>离线缓存和推送通知</p>
                </div>
                <div class="tool-status">
                  <el-tag type="info">未启用</el-tag>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 监控面板 -->
          <el-card class="monitoring-card">
            <template #header>
              <div class="card-header">
                <h3>实时监控</h3>
                <el-button size="small" @click="refreshMonitoring">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>

            <div class="monitoring-content">
              <div class="monitoring-item">
                <div class="monitoring-label">CPU使用率</div>
                <div class="monitoring-value">{{ realTimeMetrics.cpu }}%</div>
                <div class="monitoring-bar">
                  <div class="monitoring-fill" :style="{width: realTimeMetrics.cpu + '%'}"></div>
                </div>
              </div>
              <div class="monitoring-item">
                <div class="monitoring-label">内存使用率</div>
                <div class="monitoring-value">{{ realTimeMetrics.memory }}%</div>
                <div class="monitoring-bar">
                  <div class="monitoring-fill" :style="{width: realTimeMetrics.memory + '%'}"></div>
                </div>
              </div>
              <div class="monitoring-item">
                <div class="monitoring-label">网络延迟</div>
                <div class="monitoring-value">{{ realTimeMetrics.network }}ms</div>
                <div class="monitoring-bar">
                  <div class="monitoring-fill good" :style="{width: Math.min(realTimeMetrics.network / 5, 100) + '%'}"></div>
                </div>
              </div>
              <div class="monitoring-item">
                <div class="monitoring-label">并发连接</div>
                <div class="monitoring-value">{{ realTimeMetrics.connections }}</div>
                <div class="monitoring-bar">
                  <div class="monitoring-fill" :style="{width: Math.min(realTimeMetrics.connections / 2, 100) + '%'}"></div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 优化历史 -->
          <el-card class="history-card">
            <template #header>
              <div class="card-header">
                <h3>优化历史</h3>
                <el-button size="small" @click="clearHistory">
                  清空
                </el-button>
              </div>
            </template>

            <div class="optimization-history">
              <div
                v-for="history in optimizationHistory"
                :key="history.id"
                class="history-item"
              >
                <div class="history-icon">
                  <el-icon>
                    <SuccessFilled v-if="history.status === 'success'" />
                    <Warning v-else-if="history.status === 'warning'" />
                    <Close v-else />
                  </el-icon>
                </div>
                <div class="history-content">
                  <div class="history-title">{{ history.title }}</div>
                  <div class="history-time">{{ history.time }}</div>
                  <div class="history-result">{{ history.result }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 优化工具对话框 -->
    <el-dialog
      v-model="toolDialog.visible"
      :title="toolDialog.title"
      width="600px"
    >
      <div class="tool-content">
        <div v-if="toolDialog.type === 'compress'" class="compress-tool">
          <h4>资源压缩设置</h4>
          <el-form :model="compressSettings" label-width="120px">
            <el-form-item label="JS压缩">
              <el-switch v-model="compressSettings.js" />
            </el-form-item>
            <el-form-item label="CSS压缩">
              <el-switch v-model="compressSettings.css" />
            </el-form-item>
            <el-form-item label="图片压缩">
              <el-switch v-model="compressSettings.images" />
            </el-form-item>
            <el-form-item label="压缩级别">
              <el-slider v-model="compressSettings.level" :min="1" :max="10" />
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="toolDialog.type === 'cache'" class="cache-tool">
          <h4>缓存策略设置</h4>
          <el-form :model="cacheSettings" label-width="120px">
            <el-form-item label="浏览器缓存">
              <el-switch v-model="cacheSettings.browser" />
            </el-form-item>
            <el-form-item label="CDN缓存">
              <el-switch v-model="cacheSettings.cdn" />
            </el-form-item>
            <el-form-item label="缓存时间">
              <el-input v-model="cacheSettings.ttl" placeholder="例如: 3600" />
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="toolDialog.type === 'cdn'" class="cdn-tool">
          <h4>CDN配置</h4>
          <el-form :model="cdnSettings" label-width="120px">
            <el-form-item label="CDN提供商">
              <el-select v-model="cdnSettings.provider" placeholder="选择CDN提供商">
                <el-option label="阿里云CDN" value="aliyun" />
                <el-option label="腾讯云CDN" value="tencent" />
                <el-option label="百度云CDN" value="baidu" />
                <el-option label="自定义CDN" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item label="CDN域名">
              <el-input v-model="cdnSettings.domain" placeholder="请输入CDN域名" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="toolDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveToolSettings">保存设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Download, MagicStick, Document, Star,
  Warning, Loading, Picture, Refresh as RefreshIcon,
  Bell, Share, Service, Monitor, Pointer, ChatDotSquare, FolderOpened,
  Files, Close
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const performanceMetrics = ref({
  loadTime: 1250,
  memoryUsage: 45,
  bundleSize: 280,
  performanceScore: 88
})

const analysisType = ref('comprehensive')
const activeAnalysisTab = ref('metrics')

const resourceData = ref([
  { name: 'main.js', type: 'JavaScript', size: '156KB', loadTime: '320ms', priority: 'High' },
  { name: 'style.css', type: 'CSS', size: '45KB', loadTime: '120ms', priority: 'High' },
  { name: 'vendor.js', type: 'JavaScript', size: '280KB', loadTime: '450ms', priority: 'Medium' },
  { name: 'logo.png', type: 'Image', size: '25KB', loadTime: '180ms', priority: 'Low' },
  { name: 'data.json', type: 'JSON', size: '12KB', loadTime: '80ms', priority: 'Medium' }
])

const optimizationSuggestions = ref([
  {
    id: 1,
    title: '优化大图片资源',
    category: '资源优化',
    severity: 'high',
    description: '发现3个大图片资源，建议使用WebP格式和适当压缩',
    impact: '可减少45%的加载时间',
    solution: 'convert_to_webp'
  },
  {
    id: 2,
    title: '启用代码分割',
    category: '代码优化',
    severity: 'medium',
    description: '当前应用包体积较大，建议启用代码分割按需加载',
    impact: '可减少30%的初始加载时间',
    solution: 'enable_code_splitting'
  },
  {
    id: 3,
    title: '优化第三方库',
    category: '依赖优化',
    severity: 'medium',
    description: '发现部分第三方库可以替换为更轻量的替代方案',
    impact: '可减少20%的包体积',
    solution: 'optimize_dependencies'
  },
  {
    id: 4,
    title: '实施缓存策略',
    category: '缓存优化',
    severity: 'low',
    description: '建议为静态资源设置合适的缓存头',
    impact: '可提升15%的重复访问速度',
    solution: 'implement_caching'
  }
])

const uxFeatures = ref({
  smartPreload: true,
  lazyLoading: true,
  skeletonScreen: false,
  smartNotifications: false
})

const realTimeMetrics = ref({
  cpu: 45,
  memory: 62,
  network: 280,
  connections: 15
})

const optimizationHistory = ref([
  { id: 1, title: '图片优化', time: '2024-01-15 14:30', status: 'success', result: '减少45%图片大小' },
  { id: 2, title: '代码分割', time: '2024-01-15 13:45', status: 'success', result: '减少30%加载时间' },
  { id: 3, title: '缓存优化', time: '2024-01-15 12:20', status: 'warning', result: '部分资源未缓存' },
  { id: 4, title: 'CDN配置', time: '2024-01-15 11:15', status: 'success', result: '启用CDN加速' }
])

const toolDialog = reactive({
  visible: false,
  title: '',
  type: ''
})

const compressSettings = reactive({
  js: true,
  css: true,
  images: true,
  level: 8
})

const cacheSettings = reactive({
  browser: true,
  cdn: false,
  ttl: '3600'
})

const cdnSettings = reactive({
  provider: '',
  domain: ''
})

// 图表实例
let resourceChart = null

// 方法定义
const analyzePerformance = () => {
  ElMessage.info('正在分析性能...')
  // 模拟分析过程
  setTimeout(() => {
    updateMetrics()
    ElMessage.success('性能分析完成')
  }, 2000)
}

const updateMetrics = () => {
  // 模拟更新性能指标
  performanceMetrics.value.loadTime = Math.floor(Math.random() * 200) + 1100
  performanceMetrics.value.memoryUsage = Math.floor(Math.random() * 10) + 40
  performanceMetrics.value.bundleSize = Math.floor(Math.random() * 50) + 250
  performanceMetrics.value.performanceScore = Math.floor(Math.random() * 10) + 85
}

const getResourceTypeTag = (type) => {
  switch (type) {
    case 'JavaScript': return 'primary'
    case 'CSS': return 'success'
    case 'Image': return 'warning'
    case 'JSON': return 'info'
    default: return 'info'
  }
}

const getPriorityTag = (priority) => {
  switch (priority) {
    case 'High': return 'danger'
    case 'Medium': return 'warning'
    case 'Low': return 'info'
    default: return 'info'
  }
}

const applySuggestion = (suggestion) => {
  ElMessage.info(`正在应用优化建议: ${suggestion.title}`)
  // 模拟优化过程
  setTimeout(() => {
    const historyItem = {
      id: optimizationHistory.value.length + 1,
      title: suggestion.title,
      time: new Date().toLocaleString(),
      status: 'success',
      result: '优化完成'
    }
    optimizationHistory.value.unshift(historyItem)
    ElMessage.success('优化建议已应用')
  }, 1500)
}

const viewSuggestionDetails = (suggestion) => {
  ElMessage.info(`查看优化建议详情: ${suggestion.title}`)
}

const runFullOptimization = () => {
  ElMessageBox.confirm(
    '确定要运行一键优化吗？这将自动应用所有优化建议。',
    '确认优化',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    ElMessage.info('正在运行一键优化...')
    // 模拟优化过程
    setTimeout(() => {
      const historyItem = {
        id: optimizationHistory.value.length + 1,
        title: '一键优化',
        time: new Date().toLocaleString(),
        status: 'success',
        result: '系统性能提升35%'
      }
      optimizationHistory.value.unshift(historyItem)
      updateMetrics()
      ElMessage.success('一键优化完成')
    }, 3000)
  }).catch(() => {
    // 用户取消
  })
}

const runUXOptimization = () => {
  ElMessage.info('正在优化用户体验...')
  setTimeout(() => {
    ElMessage.success('用户体验优化完成')
  }, 2000)
}

const toggleUXFeature = (feature) => {
  ElMessage.success(`${feature} 已${uxFeatures.value[feature] ? '启用' : '禁用'}`)
}

const openTool = (type) => {
  const toolNames = {
    compress: '资源压缩设置',
    cache: '缓存策略设置',
    cdn: 'CDN配置',
    image: '图片优化设置',
    bundle: '代码分割设置',
    service: 'Service Worker配置'
  }

  toolDialog.title = toolNames[type]
  toolDialog.type = type
  toolDialog.visible = true
}

const saveToolSettings = () => {
  ElMessage.success('设置已保存')
  toolDialog.visible = false
}

const refreshMonitoring = () => {
  ElMessage.info('正在刷新监控数据...')
  // 模拟刷新过程
  setTimeout(() => {
    realTimeMetrics.value.cpu = Math.floor(Math.random() * 30) + 30
    realTimeMetrics.value.memory = Math.floor(Math.random() * 20) + 50
    realTimeMetrics.value.network = Math.floor(Math.random() * 100) + 200
    realTimeMetrics.value.connections = Math.floor(Math.random() * 20) + 10
    ElMessage.success('监控数据已更新')
  }, 1000)
}

const clearHistory = () => {
  ElMessageBox.confirm(
    '确定要清空优化历史吗？',
    '确认清空',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    optimizationHistory.value = []
    ElMessage.success('优化历史已清空')
  }).catch(() => {
    // 用户取消
  })
}

const exportPerformanceReport = () => {
  ElMessage.info('正在导出性能报告...')
  setTimeout(() => {
    ElMessage.success('性能报告导出成功')
  }, 1500)
}

// 图表初始化
const initResourceChart = () => {
  nextTick(() => {
    const chartDom = document.querySelector('.chart-container')
    if (!chartDom) return

    resourceChart = echarts.init(chartDom)
    const option = {
      tooltip: {
        trigger: 'item'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 156, name: 'JavaScript', itemStyle: { color: '#409EFF' } },
          { value: 45, name: 'CSS', itemStyle: { color: '#67C23A' } },
          { value: 25, name: 'Images', itemStyle: { color: '#E6A23C' } },
          { value: 280, name: 'Vendor', itemStyle: { color: '#F56C6C' } },
          { value: 12, name: 'Other', itemStyle: { color: '#909399' } }
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
    resourceChart.setOption(option)
  })
}

// 生命周期钩子
onMounted(() => {
  initResourceChart()

  // 模拟实时数据更新
  setInterval(() => {
    realTimeMetrics.value.cpu = Math.floor(Math.random() * 20) + 40
    realTimeMetrics.value.memory = Math.floor(Math.random() * 15) + 55
    realTimeMetrics.value.network = Math.floor(Math.random() * 50) + 250
    realTimeMetrics.value.connections = Math.floor(Math.random() * 10) + 12
  }, 5000)
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.performance-optimization {
  .optimization-header {
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

  .performance-overview {
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

          &.speed-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          &.memory-icon {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }

          &.bundle-icon {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
          }

          &.score-icon {
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

            .trend-down {
              color: $success-color;
              font-weight: 600;
            }

            .trend-up {
              color: $danger-color;
              font-weight: 600;
            }
          }
        }
      }
    }
  }

  .optimization-content {
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

      .performance-analysis {
        .metrics-dashboard {
          .metrics-grid {
            display: grid;
            gap: 24px;

            .metric-group {
              h4 {
                margin: 0 0 16px 0;
                color: $text-primary;
              }

              .metric-bar-group {
                .metric-bar-item {
                  display: flex;
                  align-items: center;
                  margin-bottom: 12px;

                  .metric-label {
                    width: 120px;
                    color: $text-secondary;
                    font-size: 14px;
                  }

                  .metric-bar {
                    flex: 1;
                    height: 8px;
                    background: $border-base;
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 0 12px;

                    .metric-fill {
                      height: 100%;
                      background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
                    }

                    &.good {
                      background: linear-gradient(90deg, #67C23A 0%, #43e97b 100%);
                    }
                  }

                  .metric-value {
                    width: 60px;
                    text-align: right;
                    font-weight: 600;
                    color: $text-primary;

                    &.good {
                      color: $success-color;
                    }
                  }
                }
              }
            }
          }
        }

        .resource-analysis {
          .resource-chart {
            height: 300px;
            margin-bottom: 24px;
          }
        }

        .optimization-suggestions {
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

                .suggestion-category {
                  color: $text-secondary;
                  font-size: 12px;
                }
              }

              .suggestion-impact {
                .impact-label {
                  color: $text-secondary;
                  font-size: 12px;
                }

                .impact-value {
                  font-weight: 600;
                  color: $text-primary;
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

              .suggestion-actions {
                display: flex;
                gap: 8px;
              }
            }
          }
        }
      }
    }

    .ux-optimization-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          color: $text-primary;
        }
      }

      .ux-optimization {
        .ux-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;

          .ux-metric-item {
            display: flex;
            align-items: center;
            padding: 16px;
            border: 1px solid $border-base;
            border-radius: 8px;

            .ux-metric-icon {
              width: 40px;
              height: 40px;
              border-radius: 8px;
              background: $primary-color;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              margin-right: 12px;
            }

            .ux-metric-content {
              flex: 1;

              h4 {
                margin: 0 0 8px 0;
                color: $text-primary;
                font-size: 14px;
              }

              .ux-metric-bar {
                height: 6px;
                background: $border-base;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 4px;

                .ux-metric-fill {
                  height: 100%;
                  background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
                }
              }

              .ux-metric-value {
                font-size: 12px;
                font-weight: 600;
                color: $primary-color;
              }
            }
          }
        }

        .ux-features {
          .feature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;

            .feature-item {
              display: flex;
              align-items: flex-start;
              padding: 16px;
              border: 1px solid $border-base;
              border-radius: 8px;

              .feature-icon {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                background: $bg-color;
                display: flex;
                align-items: center;
                justify-content: center;
                color: $primary-color;
                margin-right: 12px;
                margin-top: 2px;
              }

              .feature-content {
                flex: 1;

                h4 {
                  margin: 0 0 4px 0;
                  color: $text-primary;
                  font-size: 14px;
                }

                p {
                  margin: 0 0 8px 0;
                  color: $text-secondary;
                  font-size: 12px;
                }
              }
            }
          }
        }
      }
    }

    .tools-card {
      margin-bottom: 20px;

      .card-header {
        h3 {
          margin: 0;
          color: $text-primary;
        }
      }

      .tools-list {
        .tool-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 1px solid $border-base;
          border-radius: 8px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: background-color 0.2s;

          &:hover {
            background: $bg-color;
          }

          .tool-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: $primary-color;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            margin-right: 12px;
          }

          .tool-info {
            flex: 1;

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

          .tool-status {
            margin-left: 12px;
          }
        }
      }
    }

    .monitoring-card {
      margin-bottom: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          color: $text-primary;
        }
      }

      .monitoring-content {
        .monitoring-item {
          padding: 12px;
          border: 1px solid $border-base;
          border-radius: 8px;
          margin-bottom: 12px;

          .monitoring-label {
            color: $text-secondary;
            font-size: 14px;
            margin-bottom: 4px;
          }

          .monitoring-value {
            font-size: 18px;
            font-weight: 600;
            color: $text-primary;
            margin-bottom: 8px;
          }

          .monitoring-bar {
            height: 6px;
            background: $border-base;
            border-radius: 3px;
            overflow: hidden;

            .monitoring-fill {
              height: 100%;
              background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);

              &.good {
                background: linear-gradient(90deg, #67C23A 0%, #43e97b 100%);
              }
            }
          }
        }
      }
    }

    .history-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          color: $text-primary;
        }
      }

      .optimization-history {
        .history-item {
          display: flex;
          align-items: flex-start;
          padding: 12px;
          border: 1px solid $border-base;
          border-radius: 8px;
          margin-bottom: 8px;

          .history-icon {
            margin-right: 12px;
            margin-top: 2px;

            .el-icon {
              color: $success-color;
            }
          }

          .history-content {
            flex: 1;

            .history-title {
              font-weight: 500;
              color: $text-primary;
              margin-bottom: 4px;
            }

            .history-time {
              color: $text-secondary;
              font-size: 12px;
              margin-bottom: 4px;
            }

            .history-result {
              color: $text-secondary;
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  .tool-content {
    .compress-tool,
    .cache-tool,
    .cdn-tool {
      h4 {
        margin: 0 0 20px 0;
        color: $text-primary;
      }
    }
  }
}
</style>