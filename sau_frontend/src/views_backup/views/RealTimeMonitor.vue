<template>
  <div class="real-time-monitor">
    <div class="page-header">
      <h1>实时数据监控</h1>
      <p>监控平台运营数据、用户行为和系统状态</p>
    </div>

    <!-- 实时概览仪表板 -->
    <div class="dashboard-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon users-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ realTimeData.activeUsers }}</div>
                <div class="metric-label">在线用户</div>
                <div class="metric-trend" :class="getTrendClass(realTimeData.userTrend)">
                  <el-icon><component :is="getTrendIcon(realTimeData.userTrend)" /></el-icon>
                  {{ Math.abs(realTimeData.userTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon views-icon">
                <el-icon><View /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ formatNumber(realTimeData.pageViews) }}</div>
                <div class="metric-label">页面浏览</div>
                <div class="metric-trend" :class="getTrendClass(realTimeData.viewsTrend)">
                  <el-icon><component :is="getTrendIcon(realTimeData.viewsTrend)" /></el-icon>
                  {{ Math.abs(realTimeData.viewsTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon engagement-icon">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ formatNumber(realTimeData.engagement) }}</div>
                <div class="metric-label">用户互动</div>
                <div class="metric-trend" :class="getTrendClass(realTimeData.engagementTrend)">
                  <el-icon><component :is="getTrendIcon(realTimeData.engagementTrend)" /></el-icon>
                  {{ Math.abs(realTimeData.engagementTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon revenue-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">¥{{ formatNumber(realTimeData.revenue) }}</div>
                <div class="metric-label">今日收入</div>
                <div class="metric-trend" :class="getTrendClass(realTimeData.revenueTrend)">
                  <el-icon><component :is="getTrendIcon(realTimeData.revenueTrend)" /></el-icon>
                  {{ Math.abs(realTimeData.revenueTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要监控区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧实时数据 -->
      <el-col :span="16">
        <el-card class="realtime-data-card">
          <template #header>
            <div class="card-header">
              <span>实时数据流</span>
              <div class="header-actions">
                <el-button size="small" @click="toggleRealtime" :type="isRealtimeActive ? 'success' : 'info'">
                  <el-icon><VideoPlay /></el-icon>
                  {{ isRealtimeActive ? '监控中' : '启动监控' }}
                </el-button>
                <el-button size="small" @click="exportData">
                  <el-icon><Download /></el-icon>导出数据
                </el-button>
              </div>
            </div>
          </template>

          <!-- 实时图表 -->
          <div class="chart-container">
            <div class="chart-tabs">
              <el-tabs v-model="activeChartTab">
                <el-tab-pane label="用户活跃度" name="userActivity">
                  <div class="chart-wrapper">
                    <canvas ref="userActivityChart"></canvas>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="内容表现" name="contentPerformance">
                  <div class="chart-wrapper">
                    <canvas ref="contentChart"></canvas>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="平台流量" name="platformTraffic">
                  <div class="chart-wrapper">
                    <canvas ref="trafficChart"></canvas>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>

          <!-- 实时事件列表 -->
          <div class="events-list">
            <h3>实时事件</h3>
            <div class="events-container">
              <div v-for="event in recentEvents" :key="event.id" class="event-item">
                <div class="event-indicator" :class="event.type"></div>
                <div class="event-content">
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-description">{{ event.description }}</div>
                  <div class="event-meta">
                    <span class="event-time">{{ event.time }}</span>
                    <span class="event-source">{{ event.source }}</span>
                  </div>
                </div>
                <div class="event-actions">
                  <el-button size="small" @click="handleEventAction(event)">处理</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧通知和警报 -->
      <el-col :span="8">
        <!-- 系统状态 -->
        <el-card class="system-status-card">
          <template #header>
            <div class="card-header">
              <span>系统状态</span>
              <el-badge :value="systemStatus.alerts" :hidden="systemStatus.alerts === 0" class="alert-badge">
                <el-button size="small" @click="refreshSystemStatus">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </el-badge>
            </div>
          </template>

          <div class="status-list">
            <div v-for="service in systemStatus.services" :key="service.name" class="status-item">
              <div class="service-info">
                <div class="service-name">{{ service.name }}</div>
                <div class="service-details">
                  <span class="service-uptime">{{ service.uptime }}% 正常运行</span>
                  <span class="service-response">{{ service.responseTime }}ms</span>
                </div>
              </div>
              <div class="status-indicator" :class="service.status">
                <el-icon><component :is="getStatusIcon(service.status)" /></el-icon>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 通知中心 -->
        <el-card class="notifications-card">
          <template #header>
            <div class="card-header">
              <span>通知中心</span>
              <div class="header-actions">
                <el-badge :value="unreadNotifications" class="notification-badge">
                  <el-button size="small" @click="markAllAsRead">全部已读</el-button>
                </el-badge>
              </div>
            </div>
          </template>

          <div class="notifications-list">
            <div v-for="notification in notifications" :key="notification.id" class="notification-item" :class="{ unread: !notification.read }">
              <div class="notification-icon" :class="notification.type">
                <el-icon><component :is="getNotificationIcon(notification.type)" /></el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">{{ notification.time }}</div>
              </div>
              <div class="notification-actions">
                <el-button v-if="!notification.read" size="small" text @click="markAsRead(notification)">
                  <el-icon><Check /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 警报设置 -->
        <el-card class="alert-settings-card">
          <template #header>
            <div class="card-header">
              <span>警报设置</span>
            </div>
          </template>

          <div class="alert-settings">
            <el-form label-position="top">
              <el-form-item label="启用警报">
                <el-switch v-model="alertSettings.enabled" />
              </el-form-item>
              <el-form-item label="警报类型">
                <el-checkbox-group v-model="alertSettings.types">
                  <el-checkbox label="system">系统故障</el-checkbox>
                  <el-checkbox label="performance">性能异常</el-checkbox>
                  <el-checkbox label="security">安全威胁</el-checkbox>
                  <el-checkbox label="business">业务异常</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="通知方式">
                <el-checkbox-group v-model="alertSettings.channels">
                  <el-checkbox label="email">邮件通知</el-checkbox>
                  <el-checkbox label="sms">短信通知</el-checkbox>
                  <el-checkbox label="webhook">Webhook</el-checkbox>
                  <el-checkbox label="slack">Slack</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-button type="primary" @click="saveAlertSettings">保存设置</el-button>
            </el-form>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 历史数据分析 -->
    <el-card class="historical-analysis-card">
      <template #header>
        <div class="card-header">
          <span>历史数据分析</span>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD HH:mm"
              @change="loadHistoricalData"
            />
            <el-button @click="generateReport">生成报告</el-button>
          </div>
        </div>
      </template>

      <div class="analysis-content">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="analysis-metric">
              <h4>用户增长趋势</h4>
              <div class="metric-chart">
                <canvas ref="userGrowthChart"></canvas>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="analysis-metric">
              <h4>内容互动分析</h4>
              <div class="metric-chart">
                <canvas ref="engagementChart"></canvas>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="analysis-metric">
              <h4>平台表现对比</h4>
              <div class="metric-chart">
                <canvas ref="platformChart"></canvas>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import {
  User, View, ChatDotRound, Money, VideoPlay, Download, Refresh,
  Check, Warning, CircleCheck, CircleClose, Loading, Bell, Message,
  DataLine, TrendCharts
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 实时数据
const realTimeData = reactive({
  activeUsers: 1247,
  userTrend: 12.5,
  pageViews: 45678,
  viewsTrend: 8.3,
  engagement: 8934,
  engagementTrend: 15.7,
  revenue: 23456,
  revenueTrend: 22.1
})

// 系统状态
const systemStatus = reactive({
  alerts: 3,
  services: [
    { name: 'Web服务器', status: 'healthy', uptime: 99.9, responseTime: 45 },
    { name: '数据库', status: 'healthy', uptime: 99.8, responseTime: 23 },
    { name: '缓存服务', status: 'warning', uptime: 95.2, responseTime: 89 },
    { name: '文件存储', status: 'healthy', uptime: 99.7, responseTime: 34 },
    { name: 'API网关', status: 'error', uptime: 87.3, responseTime: 156 }
  ]
})

// 实时事件
const recentEvents = ref([
  {
    id: 1,
    type: 'info',
    title: '用户登录高峰',
    description: '检测到用户登录量突增，系统运行正常',
    time: '14:32:15',
    source: '认证系统'
  },
  {
    id: 2,
    type: 'warning',
    title: '数据库连接缓慢',
    description: '数据库响应时间超过阈值，正在优化',
    time: '14:28:42',
    source: '数据库监控'
  },
  {
    id: 3,
    type: 'error',
    title: 'API网关异常',
    description: '部分API请求失败，影响用户体验',
    time: '14:25:18',
    source: 'API监控'
  }
])

// 通知列表
const notifications = ref([
  {
    id: 1,
    type: 'success',
    title: '系统优化完成',
    message: '数据库性能优化已完成，响应时间提升40%',
    time: '10分钟前',
    read: false
  },
  {
    id: 2,
    type: 'warning',
    title: '存储空间不足',
    message: '文件存储空间使用率达到85%，请及时清理',
    time: '25分钟前',
    read: false
  },
  {
    id: 3,
    type: 'error',
    title: '支付接口异常',
    message: '第三方支付接口响应超时，影响订单处理',
    time: '1小时前',
    read: true
  }
])

// 状态控制
const isRealtimeActive = ref(false)
const activeChartTab = ref('userActivity')
const dateRange = ref([])

// 警报设置
const alertSettings = reactive({
  enabled: true,
  types: ['system', 'performance'],
  channels: ['email', 'slack']
})

// 图表引用
const userActivityChart = ref(null)
const contentChart = ref(null)
const trafficChart = ref(null)
const userGrowthChart = ref(null)
const engagementChart = ref(null)
const platformChart = ref(null)

// 计算属性
const unreadNotifications = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// 方法
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const getTrendClass = (trend) => {
  return trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-stable'
}

const getTrendIcon = (trend) => {
  return trend > 0 ? 'ArrowUp' : trend < 0 ? 'ArrowDown' : 'Minus'
}

const getStatusIcon = (status) => {
  const icons = {
    healthy: 'CircleCheck',
    warning: 'Warning',
    error: 'CircleClose',
    loading: 'Loading'
  }
  return icons[status] || 'CircleCheck'
}

const getNotificationIcon = (type) => {
  const icons = {
    success: 'CircleCheck',
    warning: 'Warning',
    error: 'CircleClose',
    info: 'Bell'
  }
  return icons[type] || 'Bell'
}

const toggleRealtime = () => {
  isRealtimeActive.value = !isRealtimeActive.value
  if (isRealtimeActive.value) {
    startRealtimeMonitoring()
    ElMessage.success('实时监控已启动')
  } else {
    stopRealtimeMonitoring()
    ElMessage.info('实时监控已停止')
  }
}

const startRealtimeMonitoring = () => {
  // 模拟实时数据更新
  setInterval(() => {
    if (isRealtimeActive.value) {
      updateRealtimeData()
    }
  }, 3000)
}

const stopRealtimeMonitoring = () => {
  // 停止监控
}

const updateRealtimeData = () => {
  // 模拟数据更新
  realTimeData.activeUsers += Math.floor(Math.random() * 20) - 10
  realTimeData.pageViews += Math.floor(Math.random() * 100) - 50
  realTimeData.engagement += Math.floor(Math.random() * 50) - 25
  realTimeData.revenue += Math.floor(Math.random() * 1000) - 500
}

const refreshSystemStatus = () => {
  ElMessage.success('系统状态已刷新')
}

const handleEventAction = (event) => {
  ElMessageBox.confirm(
    `确定要处理事件"${event.title}"吗？`,
    '处理事件',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    const index = recentEvents.value.findIndex(e => e.id === event.id)
    if (index > -1) {
      recentEvents.value.splice(index, 1)
    }
    ElMessage.success('事件已处理')
  })
}

const markAsRead = (notification) => {
  notification.read = true
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
  ElMessage.success('所有通知已标记为已读')
}

const saveAlertSettings = () => {
  ElMessage.success('警报设置已保存')
}

const exportData = () => {
  ElMessage.success('数据导出中...')
  setTimeout(() => {
    ElMessage.success('数据已成功导出')
  }, 2000)
}

const loadHistoricalData = () => {
  ElMessage.info('正在加载历史数据...')
}

const generateReport = () => {
  ElMessage.success('正在生成分析报告...')
}

// 初始化图表
const initCharts = () => {
  // 这里应该使用Chart.js或其他图表库来初始化图表
  // 为了演示，我们只显示占位符
  console.log('初始化图表...')
}

// 组件挂载
onMounted(() => {
  nextTick(() => {
    initCharts()
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.real-time-monitor {
  .page-header {
    margin-bottom: 24px;

    h1 {
      font-size: 28px;
      font-weight: 600;
      color: $text-primary;
      margin: 0 0 8px 0;
    }

    p {
      color: $text-secondary;
      margin: 0;
    }
  }

  .dashboard-overview {
    margin-bottom: 24px;

    .metric-card {
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .metric-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;

          &.users-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.views-icon {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.engagement-icon {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.revenue-icon {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        }

        .metric-info {
          flex: 1;

          .metric-value {
            font-size: 24px;
            font-weight: 600;
            color: $text-primary;
          }

          .metric-label {
            font-size: 14px;
            color: $text-secondary;
          }

          .metric-trend {
            display: flex;
            align-items: center;
            gap: 2px;
            font-size: 12px;
            margin-top: 4px;

            &.trend-up {
              color: #67C23A;
            }

            &.trend-down {
              color: #F56C6C;
            }

            &.trend-stable {
              color: #909399;
            }

            .el-icon {
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  .main-content {
    margin-bottom: 24px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;

      .header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    }

    .realtime-data-card {
      .chart-container {
        margin-bottom: 24px;

        .chart-wrapper {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
      }

      .events-list {
        h3 {
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
          margin: 0 0 16px 0;
        }

        .events-container {
          max-height: 300px;
          overflow-y: auto;

          .event-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;

            &:last-child {
              border-bottom: none;
            }

            .event-indicator {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              flex-shrink: 0;
              margin-top: 6px;

              &.info {
                background: #409EFF;
              }

              &.warning {
                background: #E6A23C;
              }

              &.error {
                background: #F56C6C;
              }

              &.success {
                background: #67C23A;
              }
            }

            .event-content {
              flex: 1;

              .event-title {
                font-weight: 500;
                color: $text-primary;
                margin-bottom: 4px;
              }

              .event-description {
                font-size: 14px;
                color: $text-secondary;
                margin-bottom: 8px;
              }

              .event-meta {
                display: flex;
                gap: 16px;
                font-size: 12px;
                color: $text-secondary;
              }
            }

            .event-actions {
              flex-shrink: 0;
            }
          }
        }
      }
    }

    .system-status-card {
      margin-bottom: 20px;

      .alert-badge {
        margin-right: 8px;
      }

      .status-list {
        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .service-info {
            .service-name {
              font-weight: 500;
              color: $text-primary;
              margin-bottom: 4px;
            }

            .service-details {
              display: flex;
              gap: 16px;
              font-size: 12px;
              color: $text-secondary;
            }
          }

          .status-indicator {
            font-size: 20px;

            &.healthy {
              color: #67C23A;
            }

            &.warning {
              color: #E6A23C;
            }

            &.error {
              color: #F56C6C;
            }

            &.loading {
              color: #409EFF;
            }
          }
        }
      }
    }

    .notifications-card {
      margin-bottom: 20px;

      .notification-badge {
        margin-right: 8px;
      }

      .notifications-list {
        max-height: 300px;
        overflow-y: auto;

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s ease;

          &:last-child {
            border-bottom: none;
          }

          &.unread {
            background: rgba(64, 158, 255, 0.05);
          }

          .notification-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            &.success {
              background: rgba(103, 194, 58, 0.1);
              color: #67C23A;
            }

            &.warning {
              background: rgba(230, 162, 60, 0.1);
              color: #E6A23C;
            }

            &.error {
              background: rgba(245, 108, 108, 0.1);
              color: #F56C6C;
            }

            &.info {
              background: rgba(64, 158, 255, 0.1);
              color: #409EFF;
            }
          }

          .notification-content {
            flex: 1;

            .notification-title {
              font-weight: 500;
              color: $text-primary;
              margin-bottom: 4px;
            }

            .notification-message {
              font-size: 14px;
              color: $text-secondary;
              margin-bottom: 8px;
            }

            .notification-time {
              font-size: 12px;
              color: $text-secondary;
            }
          }

          .notification-actions {
            flex-shrink: 0;
          }
        }
      }
    }

    .alert-settings-card {
      .alert-settings {
        .el-form-item {
          margin-bottom: 16px;
        }
      }
    }
  }

  .historical-analysis-card {
    .analysis-content {
      .analysis-metric {
        h4 {
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
          margin: 0 0 16px 0;
        }

        .metric-chart {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
      }
    }
  }
}
</style>