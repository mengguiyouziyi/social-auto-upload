<template>
  <div class="api-marketplace">
    <!-- 头部操作区 -->
    <div class="marketplace-header">
      <div class="header-left">
        <h2>API市场</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">工作台</el-breadcrumb-item>
          <el-breadcrumb-item>API市场</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openAddAPI">
          <el-icon><Plus /></el-icon>添加API
        </el-button>
        <el-button @click="openAPIDocs">
          <el-icon><Document /></el-icon>API文档
        </el-button>
      </div>
    </div>

    <!-- API统计概览 -->
    <div class="api-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon connected-icon">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ apiStats.connected }}</div>
                <div class="metric-label">已连接API</div>
                <div class="metric-trend">
                  <span class="trend-up">+5</span>
                  本月新增
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon requests-icon">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ apiStats.totalRequests }}</div>
                <div class="metric-label">本月调用量</div>
                <div class="metric-trend">
                  <span class="trend-up">+12.8%</span>
                  较上月
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon success-icon">
                <el-icon><SuccessFilled /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ apiStats.successRate }}%</div>
                <div class="metric-label">成功率</div>
                <div class="metric-trend">
                  <span class="trend-up">+2.1%</span>
                  性能提升
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon plugins-icon">
                <el-icon><MagicStick /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ apiStats.plugins }}</div>
                <div class="metric-label">活跃插件</div>
                <div class="metric-trend">
                  <span class="trend-up">+3</span>
                  新增插件
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区 -->
    <div class="marketplace-content">
      <el-row :gutter="20">
        <!-- 左侧API列表 -->
        <el-col :span="16">
          <!-- API分类标签 -->
          <el-card class="category-card">
            <div class="category-tabs">
              <el-tabs v-model="activeCategory" @tab-click="handleCategoryChange">
                <el-tab-pane label="全部" name="all">
                  <div class="category-content">
                    <div class="category-grid">
                      <div
                        v-for="category in categories"
                        :key="category.id"
                        class="category-item"
                        :class="{ active: selectedCategory === category.id }"
                        @click="selectCategory(category.id)"
                      >
                        <div class="category-icon">
                          <el-icon>
                            <component :is="category.icon" />
                          </el-icon>
                        </div>
                        <div class="category-info">
                          <h4>{{ category.name }}</h4>
                          <p>{{ category.count }} 个API</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="AI服务" name="ai">
                  <div class="category-content">
                    <div class="api-grid">
                      <div
                        v-for="api in filteredAPIs('ai')"
                        :key="api.id"
                        class="api-card"
                      >
                        <div class="api-header">
                          <div class="api-logo">
                            <img :src="api.logo" :alt="api.name">
                          </div>
                          <div class="api-info">
                            <h3>{{ api.name }}</h3>
                            <p>{{ api.provider }}</p>
                          </div>
                          <div class="api-status">
                            <el-tag :type="api.status === 'connected' ? 'success' : 'info'">
                              {{ api.status === 'connected' ? '已连接' : '未连接' }}
                            </el-tag>
                          </div>
                        </div>
                        <div class="api-description">
                          {{ api.description }}
                        </div>
                        <div class="api-features">
                          <div class="feature-item">
                            <el-icon><Check /></el-icon>
                            <span>{{ api.features }}</span>
                          </div>
                        </div>
                        <div class="api-footer">
                          <div class="api-pricing">
                            <span class="price">{{ api.pricing }}</span>
                          </div>
                          <div class="api-actions">
                            <el-button
                              size="small"
                              :type="api.status === 'connected' ? 'warning' : 'primary'"
                              @click="toggleAPI(api)"
                            >
                              {{ api.status === 'connected' ? '断开连接' : '连接' }}
                            </el-button>
                            <el-button size="small" @click="viewAPIDetail(api)">
                              详情
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="数据分析" name="analytics">
                  <div class="category-content">
                    <div class="api-grid">
                      <div
                        v-for="api in filteredAPIs('analytics')"
                        :key="api.id"
                        class="api-card"
                      >
                        <div class="api-header">
                          <div class="api-logo">
                            <img :src="api.logo" :alt="api.name">
                          </div>
                          <div class="api-info">
                            <h3>{{ api.name }}</h3>
                            <p>{{ api.provider }}</p>
                          </div>
                          <div class="api-status">
                            <el-tag :type="api.status === 'connected' ? 'success' : 'info'">
                              {{ api.status === 'connected' ? '已连接' : '未连接' }}
                            </el-tag>
                          </div>
                        </div>
                        <div class="api-description">
                          {{ api.description }}
                        </div>
                        <div class="api-features">
                          <div class="feature-item">
                            <el-icon><Check /></el-icon>
                            <span>{{ api.features }}</span>
                          </div>
                        </div>
                        <div class="api-footer">
                          <div class="api-pricing">
                            <span class="price">{{ api.pricing }}</span>
                          </div>
                          <div class="api-actions">
                            <el-button
                              size="small"
                              :type="api.status === 'connected' ? 'warning' : 'primary'"
                              @click="toggleAPI(api)"
                            >
                              {{ api.status === 'connected' ? '断开连接' : '连接' }}
                            </el-button>
                            <el-button size="small" @click="viewAPIDetail(api)">
                              详情
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="社交媒体" name="social">
                  <div class="category-content">
                    <div class="api-grid">
                      <div
                        v-for="api in filteredAPIs('social')"
                        :key="api.id"
                        class="api-card"
                      >
                        <div class="api-header">
                          <div class="api-logo">
                            <img :src="api.logo" :alt="api.name">
                          </div>
                          <div class="api-info">
                            <h3>{{ api.name }}</h3>
                            <p>{{ api.provider }}</p>
                          </div>
                          <div class="api-status">
                            <el-tag :type="api.status === 'connected' ? 'success' : 'info'">
                              {{ api.status === 'connected' ? '已连接' : '未连接' }}
                            </el-tag>
                          </div>
                        </div>
                        <div class="api-description">
                          {{ api.description }}
                        </div>
                        <div class="api-features">
                          <div class="feature-item">
                            <el-icon><Check /></el-icon>
                            <span>{{ api.features }}</span>
                          </div>
                        </div>
                        <div class="api-footer">
                          <div class="api-pricing">
                            <span class="price">{{ api.pricing }}</span>
                          </div>
                          <div class="api-actions">
                            <el-button
                              size="small"
                              :type="api.status === 'connected' ? 'warning' : 'primary'"
                              @click="toggleAPI(api)"
                            >
                              {{ api.status === 'connected' ? '断开连接' : '连接' }}
                            </el-button>
                            <el-button size="small" @click="viewAPIDetail(api)">
                              详情
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="存储服务" name="storage">
                  <div class="category-content">
                    <div class="api-grid">
                      <div
                        v-for="api in filteredAPIs('storage')"
                        :key="api.id"
                        class="api-card"
                      >
                        <div class="api-header">
                          <div class="api-logo">
                            <img :src="api.logo" :alt="api.name">
                          </div>
                          <div class="api-info">
                            <h3>{{ api.name }}</h3>
                            <p>{{ api.provider }}</p>
                          </div>
                          <div class="api-status">
                            <el-tag :type="api.status === 'connected' ? 'success' : 'info'">
                              {{ api.status === 'connected' ? '已连接' : '未连接' }}
                            </el-tag>
                          </div>
                        </div>
                        <div class="api-description">
                          {{ api.description }}
                        </div>
                        <div class="api-features">
                          <div class="feature-item">
                            <el-icon><Check /></el-icon>
                            <span>{{ api.features }}</span>
                          </div>
                        </div>
                        <div class="api-footer">
                          <div class="api-pricing">
                            <span class="price">{{ api.pricing }}</span>
                          </div>
                          <div class="api-actions">
                            <el-button
                              size="small"
                              :type="api.status === 'connected' ? 'warning' : 'primary'"
                              @click="toggleAPI(api)"
                            >
                              {{ api.status === 'connected' ? '断开连接' : '连接' }}
                            </el-button>
                            <el-button size="small" @click="viewAPIDetail(api)">
                              详情
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>

          <!-- API调用统计 -->
          <el-card class="stats-card">
            <template #header>
              <div class="card-header">
                <h3>API调用统计</h3>
                <el-select v-model="statsTimeRange" @change="updateAPIStats" placeholder="时间范围">
                  <el-option label="今天" value="today" />
                  <el-option label="本周" value="week" />
                  <el-option label="本月" value="month" />
                  <el-option label="本年" value="year" />
                </el-select>
              </div>
            </template>

            <div class="stats-content">
              <div class="stats-chart">
                <div class="chart-container" ref="apiStatsChart"></div>
              </div>
              <div class="stats-table">
                <el-table :data="apiCallStats" style="width: 100%">
                  <el-table-column prop="name" label="API名称" width="150" />
                  <el-table-column prop="requests" label="调用次数" width="120" />
                  <el-table-column prop="success" label="成功次数" width="120" />
                  <el-table-column prop="failure" label="失败次数" width="120" />
                  <el-table-column prop="avgResponse" label="平均响应时间" width="150" />
                  <el-table-column prop="cost" label="费用" />
                </el-table>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧插件管理 -->
        <el-col :span="8">
          <!-- 插件市场 -->
          <el-card class="plugins-card">
            <template #header>
              <div class="card-header">
                <h3>插件市场</h3>
                <el-button type="primary" size="small" @click="openPluginStore">
                  <el-icon><Shop /></el-icon>商店
                </el-button>
              </div>
            </template>

            <div class="plugins-list">
              <div
                v-for="plugin in installedPlugins"
                :key="plugin.id"
                class="plugin-item"
              >
                <div class="plugin-header">
                  <div class="plugin-icon">
                    <el-icon>
                      <component :is="plugin.icon" />
                    </el-icon>
                  </div>
                  <div class="plugin-info">
                    <h4>{{ plugin.name }}</h4>
                    <span class="plugin-version">v{{ plugin.version }}</span>
                  </div>
                  <div class="plugin-status">
                    <el-switch
                      v-model="plugin.enabled"
                      @change="togglePlugin(plugin)"
                    />
                  </div>
                </div>
                <div class="plugin-description">
                  {{ plugin.description }}
                </div>
                <div class="plugin-actions">
                  <el-button size="small" @click="configurePlugin(plugin)">
                    配置
                  </el-button>
                  <el-button size="small" @click="uninstallPlugin(plugin)">
                    卸载
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- API密钥管理 -->
          <el-card class="keys-card">
            <template #header>
              <div class="card-header">
                <h3>API密钥管理</h3>
                <el-button type="primary" size="small" @click="addNewKey">
                  <el-icon><Key /></el-icon>新增密钥
                </el-button>
              </div>
            </template>

            <div class="keys-list">
              <div
                v-for="key in apiKeys"
                :key="key.id"
                class="key-item"
              >
                <div class="key-info">
                  <div class="key-name">{{ key.name }}</div>
                  <div class="key-service">{{ key.service }}</div>
                  <div class="key-meta">
                    <span class="key-created">创建于 {{ key.createdAt }}</span>
                    <span class="key-status">
                      <el-tag :type="key.status === 'active' ? 'success' : 'info'">
                        {{ key.status === 'active' ? '活跃' : '已禁用' }}
                      </el-tag>
                    </span>
                  </div>
                </div>
                <div class="key-actions">
                  <el-button size="small" @click="copyKey(key)">
                    复制
                  </el-button>
                  <el-button size="small" @click="editKey(key)">
                    编辑
                  </el-button>
                  <el-button size="small" type="danger" @click="revokeKey(key)">
                    撤销
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 系统监控 -->
          <el-card class="monitoring-card">
            <template #header>
              <div class="card-header">
                <h3>系统监控</h3>
              </div>
            </template>

            <div class="monitoring-content">
              <div class="monitoring-item">
                <div class="monitoring-label">API响应时间</div>
                <div class="monitoring-value">{{ monitoring.avgResponse }}ms</div>
                <div class="monitoring-trend">
                  <el-icon :class="monitoring.responseTrend > 0 ? 'trend-up' : 'trend-down'">
                    <ArrowUp v-if="monitoring.responseTrend > 0" />
                    <ArrowDown v-else />
                  </el-icon>
                  {{ Math.abs(monitoring.responseTrend) }}%
                </div>
              </div>
              <div class="monitoring-item">
                <div class="monitoring-label">错误率</div>
                <div class="monitoring-value">{{ monitoring.errorRate }}%</div>
                <div class="monitoring-trend">
                  <el-icon :class="monitoring.errorTrend > 0 ? 'trend-up' : 'trend-down'">
                    <ArrowUp v-if="monitoring.errorTrend > 0" />
                    <ArrowDown v-else />
                  </el-icon>
                  {{ Math.abs(monitoring.errorTrend) }}%
                </div>
              </div>
              <div class="monitoring-item">
                <div class="monitoring-label">并发连接数</div>
                <div class="monitoring-value">{{ monitoring.concurrentConnections }}</div>
                <div class="monitoring-trend">
                  <el-icon :class="monitoring.connectionTrend > 0 ? 'trend-up' : 'trend-down'">
                    <ArrowUp v-if="monitoring.connectionTrend > 0" />
                    <ArrowDown v-else />
                  </el-icon>
                  {{ Math.abs(monitoring.connectionTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 添加API对话框 -->
    <el-dialog
      v-model="addAPIDialog.visible"
      title="添加API"
      width="600px"
    >
      <el-form :model="addAPIForm" label-width="100px">
        <el-form-item label="API名称">
          <el-input v-model="addAPIForm.name" placeholder="请输入API名称" />
        </el-form-item>
        <el-form-item label="API类型">
          <el-select v-model="addAPIForm.type" placeholder="请选择API类型">
            <el-option label="AI服务" value="ai" />
            <el-option label="数据分析" value="analytics" />
            <el-option label="社交媒体" value="social" />
            <el-option label="存储服务" value="storage" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务提供商">
          <el-input v-model="addAPIForm.provider" placeholder="请输入服务提供商" />
        </el-form-item>
        <el-form-item label="API地址">
          <el-input v-model="addAPIForm.endpoint" placeholder="请输入API地址" />
        </el-form-item>
        <el-form-item label="认证方式">
          <el-select v-model="addAPIForm.authType" placeholder="请选择认证方式">
            <el-option label="API Key" value="apikey" />
            <el-option label="OAuth 2.0" value="oauth" />
            <el-option label="Basic Auth" value="basic" />
            <el-option label="Bearer Token" value="bearer" />
          </el-select>
        </el-form-item>
        <el-form-item label="API密钥">
          <el-input v-model="addAPIForm.apiKey" type="password" placeholder="请输入API密钥" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="addAPIForm.description" type="textarea" placeholder="请输入API描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addAPIDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddAPI">确定</el-button>
      </template>
    </el-dialog>

    <!-- API详情对话框 -->
    <el-dialog
      v-model="apiDetailDialog.visible"
      title="API详情"
      width="800px"
    >
      <div class="api-detail-content">
        <div class="detail-header">
          <div class="detail-logo">
            <img :src="apiDetailDialog.api.logo" :alt="apiDetailDialog.api.name">
          </div>
          <div class="detail-info">
            <h3>{{ apiDetailDialog.api.name }}</h3>
            <p>{{ apiDetailDialog.api.provider }}</p>
            <el-tag :type="apiDetailDialog.api.status === 'connected' ? 'success' : 'info'">
              {{ apiDetailDialog.api.status === 'connected' ? '已连接' : '未连接' }}
            </el-tag>
          </div>
        </div>
        <div class="detail-section">
          <h4>API描述</h4>
          <p>{{ apiDetailDialog.api.description }}</p>
        </div>
        <div class="detail-section">
          <h4>主要功能</h4>
          <p>{{ apiDetailDialog.api.features }}</p>
        </div>
        <div class="detail-section">
          <h4>调用统计</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">总调用次数</span>
              <span class="stat-value">{{ apiDetailDialog.api.totalCalls }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">成功率</span>
              <span class="stat-value">{{ apiDetailDialog.api.successRate }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均响应时间</span>
              <span class="stat-value">{{ apiDetailDialog.api.avgResponse }}ms</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">本月费用</span>
              <span class="stat-value">{{ apiDetailDialog.api.monthlyCost }}</span>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4>API文档</h4>
          <el-button type="primary" @click="viewAPIDocumentation">
            查看完整文档
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="apiDetailDialog.visible = false">关闭</el-button>
        <el-button
          :type="apiDetailDialog.api.status === 'connected' ? 'warning' : 'primary'"
          @click="toggleAPI(apiDetailDialog.api)"
        >
          {{ apiDetailDialog.api.status === 'connected' ? '断开连接' : '连接' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 插件配置对话框 -->
    <el-dialog
      v-model="pluginConfigDialog.visible"
      :title="`配置 ${pluginConfigDialog.plugin.name}`"
      width="500px"
    >
      <el-form :model="pluginConfigDialog.config" label-width="100px">
        <div v-for="(config, key) in pluginConfigDialog.plugin.config" :key="key">
          <el-form-item :label="config.label">
            <el-input
              v-if="config.type === 'text'"
              v-model="pluginConfigDialog.config[key].value"
              :placeholder="config.placeholder"
            />
            <el-switch
              v-else-if="config.type === 'boolean'"
              v-model="pluginConfigDialog.config[key].value"
            />
            <el-select
              v-else-if="config.type === 'select'"
              v-model="pluginConfigDialog.config[key].value"
              :placeholder="config.placeholder"
            >
              <el-option
                v-for="option in config.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="pluginConfigDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="savePluginConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Document, Connection, DataAnalysis, SuccessFilled, MagicStick,
  Check, Shop, Key, ArrowUp, ArrowDown, Setting, VideoCamera, Picture,
  Message, Cloudy, Monitor, Edit, Delete
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const apiStats = ref({
  connected: 12,
  totalRequests: 45892,
  successRate: 99.2,
  plugins: 8
})

const activeCategory = ref('all')
const selectedCategory = ref('all')
const statsTimeRange = ref('month')

const categories = ref([
  { id: 'ai', name: 'AI服务', icon: 'MagicStick', count: 8 },
  { id: 'analytics', name: '数据分析', icon: 'DataAnalysis', count: 6 },
  { id: 'social', name: '社交媒体', icon: 'Message', count: 12 },
  { id: 'storage', name: '存储服务', icon: 'Cloudy', count: 4 }
])

const apis = ref([
  {
    id: 1,
    name: 'Claude AI',
    provider: 'Anthropic',
    logo: 'https://placeholder.com/50x50',
    description: '强大的AI助手，提供文本生成、问答等功能',
    features: '文本生成、代码编写、多轮对话',
    pricing: '按量计费',
    status: 'connected',
    type: 'ai',
    totalCalls: 15420,
    successRate: 99.5,
    avgResponse: 850,
    monthlyCost: '¥156.80'
  },
  {
    id: 2,
    name: '百度AI开放平台',
    provider: '百度',
    logo: 'https://placeholder.com/50x50',
    description: '提供语音识别、图像识别等多种AI服务',
    features: '语音识别、图像识别、自然语言处理',
    pricing: '免费+付费',
    status: 'connected',
    type: 'ai',
    totalCalls: 8934,
    successRate: 98.8,
    avgResponse: 1200,
    monthlyCost: '¥89.50'
  },
  {
    id: 3,
    name: '阿里云分析',
    provider: '阿里云',
    logo: 'https://placeholder.com/50x50',
    description: '专业的数据分析服务，支持多种数据源',
    features: '数据分析、报表生成、实时监控',
    pricing: '按量计费',
    status: 'disconnected',
    type: 'analytics',
    totalCalls: 0,
    successRate: 0,
    avgResponse: 0,
    monthlyCost: '¥0.00'
  },
  {
    id: 4,
    name: '微信API',
    provider: '腾讯',
    logo: 'https://placeholder.com/50x50',
    description: '微信公众平台API，支持消息管理、用户管理等',
    features: '消息发送、用户管理、素材管理',
    pricing: '免费',
    status: 'connected',
    type: 'social',
    totalCalls: 23156,
    successRate: 99.8,
    avgResponse: 320,
    monthlyCost: '¥0.00'
  },
  {
    id: 5,
    name: '抖音开放平台',
    provider: '字节跳动',
    logo: 'https://placeholder.com/50x50',
    description: '抖音平台API，支持视频管理、数据分析等',
    features: '视频管理、数据分析、评论管理',
    pricing: '免费',
    status: 'connected',
    type: 'social',
    totalCalls: 18723,
    successRate: 99.2,
    avgResponse: 450,
    monthlyCost: '¥0.00'
  },
  {
    id: 6,
    name: '阿里云OSS',
    provider: '阿里云',
    logo: 'https://placeholder.com/50x50',
    description: '对象存储服务，提供高可靠的云存储',
    features: '文件存储、CDN加速、安全防护',
    pricing: '按量计费',
    status: 'connected',
    type: 'storage',
    totalCalls: 5678,
    successRate: 99.9,
    avgResponse: 180,
    monthlyCost: '¥45.20'
  }
])

const installedPlugins = ref([
  {
    id: 1,
    name: 'AI内容生成器',
    icon: 'MagicStick',
    version: '2.1.0',
    description: '使用AI自动生成高质量内容',
    enabled: true,
    config: {
      model: { label: 'AI模型', type: 'select', placeholder: '选择AI模型', value: 'claude-3', options: [
        { label: 'Claude 3', value: 'claude-3' },
        { label: 'GPT-4', value: 'gpt-4' },
        { label: '文心一言', value: 'wenxin' }
      ]},
      creativity: { label: '创意程度', type: 'select', placeholder: '选择创意程度', value: 'medium', options: [
        { label: '低', value: 'low' },
        { label: '中', value: 'medium' },
        { label: '高', value: 'high' }
      ]}
    }
  },
  {
    id: 2,
    name: '数据导出器',
    icon: 'Document',
    version: '1.5.2',
    description: '支持多种格式的数据导出功能',
    enabled: true,
    config: {
      format: { label: '默认格式', type: 'select', placeholder: '选择默认格式', value: 'excel', options: [
        { label: 'Excel', value: 'excel' },
        { label: 'PDF', value: 'pdf' },
        { label: 'CSV', value: 'csv' }
      ]},
      autoExport: { label: '自动导出', type: 'boolean', placeholder: '启用自动导出', value: false }
    }
  },
  {
    id: 3,
    name: '社交媒体同步',
    icon: 'Message',
    version: '3.0.1',
    description: '自动同步内容到多个社交平台',
    enabled: false,
    config: {
      platforms: { label: '同步平台', type: 'select', placeholder: '选择平台', value: ['douyin'], options: [
        { label: '抖音', value: 'douyin' },
        { label: '快手', value: 'kuaishou' },
        { label: '小红书', value: 'xiaohongshu' }
      ]}
    }
  }
])

const apiKeys = ref([
  { id: 1, name: 'Claude API Key', service: 'Claude AI', createdAt: '2024-01-15', status: 'active' },
  { id: 2, name: '微信AppID', service: '微信API', createdAt: '2024-01-10', status: 'active' },
  { id: 3, name: '抖音Access Token', service: '抖音开放平台', createdAt: '2024-01-08', status: 'active' }
])

const monitoring = ref({
  avgResponse: 680,
  responseTrend: -5.2,
  errorRate: 0.8,
  errorTrend: -2.1,
  concurrentConnections: 142,
  connectionTrend: 8.7
})

const apiCallStats = ref([
  { name: 'Claude AI', requests: 15420, success: 15342, failure: 78, avgResponse: '850ms', cost: '¥156.80' },
  { name: '百度AI', requests: 8934, success: 8827, failure: 107, avgResponse: '1200ms', cost: '¥89.50' },
  { name: '微信API', requests: 23156, success: 23110, failure: 46, avgResponse: '320ms', cost: '¥0.00' },
  { name: '抖音API', requests: 18723, success: 18576, failure: 147, avgResponse: '450ms', cost: '¥0.00' },
  { name: '阿里云OSS', requests: 5678, success: 5672, failure: 6, avgResponse: '180ms', cost: '¥45.20' }
])

const addAPIDialog = reactive({
  visible: false
})

const addAPIForm = reactive({
  name: '',
  type: '',
  provider: '',
  endpoint: '',
  authType: '',
  apiKey: '',
  description: ''
})

const apiDetailDialog = reactive({
  visible: false,
  api: {}
})

const pluginConfigDialog = reactive({
  visible: false,
  plugin: {},
  config: {}
})

// 图表实例
let apiStatsChart = null

// 方法定义
const openAddAPI = () => {
  addAPIDialog.visible = true
}

const openAPIDocs = () => {
  ElMessage.info('正在打开API文档...')
  // 这里可以打开API文档页面
}

const handleCategoryChange = (tab) => {
  selectedCategory.value = tab.props.name
}

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  activeCategory.value = categoryId
}

const filteredAPIs = (type) => {
  return apis.value.filter(api => api.type === type)
}

const toggleAPI = (api) => {
  if (api.status === 'connected') {
    ElMessageBox.confirm(
      `确定要断开与 ${api.name} 的连接吗？`,
      '确认断开',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      api.status = 'disconnected'
      apiStats.value.connected--
      ElMessage.success(`已断开与 ${api.name} 的连接`)
    }).catch(() => {
      // 用户取消
    })
  } else {
    ElMessage.info(`正在连接到 ${api.name}...`)
    setTimeout(() => {
      api.status = 'connected'
      apiStats.value.connected++
      ElMessage.success(`已连接到 ${api.name}`)
    }, 1500)
  }
}

const viewAPIDetail = (api) => {
  apiDetailDialog.api = { ...api }
  apiDetailDialog.visible = true
}

const confirmAddAPI = () => {
  if (!addAPIForm.name || !addAPIForm.type || !addAPIForm.endpoint) {
    ElMessage.warning('请填写必要信息')
    return
  }

  const newAPI = {
    id: apis.value.length + 1,
    name: addAPIForm.name,
    provider: addAPIForm.provider,
    logo: 'https://placeholder.com/50x50',
    description: addAPIForm.description,
    features: '自定义API',
    pricing: '自定义',
    status: 'disconnected',
    type: addAPIForm.type,
    totalCalls: 0,
    successRate: 0,
    avgResponse: 0,
    monthlyCost: '¥0.00'
  }

  apis.value.push(newAPI)
  addAPIDialog.visible = false
  ElMessage.success('API添加成功')

  // 重置表单
  Object.keys(addAPIForm).forEach(key => {
    addAPIForm[key] = ''
  })
}

const updateAPIStats = () => {
  ElMessage.info('正在更新API统计数据...')
  // 模拟更新过程
  setTimeout(() => {
    updateAPIStatsChart()
    ElMessage.success('API统计数据更新完成')
  }, 1000)
}

const openPluginStore = () => {
  ElMessage.info('正在打开插件商店...')
  // 这里可以打开插件商店页面
}

const togglePlugin = (plugin) => {
  ElMessage.success(`${plugin.name} ${plugin.enabled ? '已启用' : '已禁用'}`)
}

const configurePlugin = (plugin) => {
  pluginConfigDialog.plugin = { ...plugin }
  pluginConfigDialog.config = { ...plugin.config }
  pluginConfigDialog.visible = true
}

const savePluginConfig = () => {
  const plugin = installedPlugins.value.find(p => p.id === pluginConfigDialog.plugin.id)
  if (plugin) {
    plugin.config = { ...pluginConfigDialog.config }
    ElMessage.success('插件配置保存成功')
  }
  pluginConfigDialog.visible = false
}

const uninstallPlugin = (plugin) => {
  ElMessageBox.confirm(
    `确定要卸载 ${plugin.name} 插件吗？`,
    '确认卸载',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = installedPlugins.value.findIndex(p => p.id === plugin.id)
    if (index > -1) {
      installedPlugins.value.splice(index, 1)
      ElMessage.success('插件卸载成功')
    }
  }).catch(() => {
    // 用户取消
  })
}

const addNewKey = () => {
  ElMessageBox.prompt('请输入API密钥名称', '新增API密钥', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(({ value }) => {
    const newKey = {
      id: apiKeys.value.length + 1,
      name: value,
      service: '未配置',
      createdAt: new Date().toLocaleDateString(),
      status: 'active'
    }
    apiKeys.value.push(newKey)
    ElMessage.success('API密钥创建成功')
  }).catch(() => {
    // 用户取消
  })
}

const copyKey = (key) => {
  // 模拟复制功能
  ElMessage.success('API密钥已复制到剪贴板')
}

const editKey = (key) => {
  ElMessageBox.prompt('请输入新的密钥名称', '编辑API密钥', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: key.name
  }).then(({ value }) => {
    key.name = value
    ElMessage.success('API密钥更新成功')
  }).catch(() => {
    // 用户取消
  })
}

const revokeKey = (key) => {
  ElMessageBox.confirm(
    `确定要撤销 ${key.name} 密钥吗？此操作不可恢复。`,
    '确认撤销',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    key.status = 'revoked'
    ElMessage.success('API密钥已撤销')
  }).catch(() => {
    // 用户取消
  })
}

const viewAPIDocumentation = () => {
  ElMessage.info('正在打开API文档...')
  // 这里可以打开文档页面
}

// 图表初始化
const initAPIStatsChart = () => {
  nextTick(() => {
    const chartDom = document.querySelector('.chart-container')
    if (!chartDom) return

    apiStatsChart = echarts.init(chartDom)
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value',
        name: '调用次数'
      },
      series: [
        {
          name: 'Claude AI',
          type: 'line',
          data: [2100, 2300, 2200, 2400, 2350, 2200, 2150],
          smooth: true
        },
        {
          name: '百度AI',
          type: 'line',
          data: [1200, 1300, 1250, 1400, 1350, 1300, 1250],
          smooth: true
        },
        {
          name: '微信API',
          type: 'line',
          data: [3200, 3400, 3300, 3500, 3450, 3300, 3250],
          smooth: true
        },
        {
          name: '抖音API',
          type: 'line',
          data: [2600, 2800, 2700, 2900, 2850, 2700, 2650],
          smooth: true
        }
      ]
    }
    apiStatsChart.setOption(option)
  })
}

const updateAPIStatsChart = () => {
  if (apiStatsChart) {
    // 模拟数据更新
    const newData = [
      Math.floor(Math.random() * 1000) + 2000,
      Math.floor(Math.random() * 1000) + 1000,
      Math.floor(Math.random() * 1000) + 3000,
      Math.floor(Math.random() * 1000) + 2500
    ]

    apiStatsChart.setOption({
      series: apiStatsChart.getOption().series.map((series, index) => ({
        ...series,
        data: series.data.map(() => Math.floor(Math.random() * 1000) + newData[index])
      }))
    })
  }
}

// 生命周期钩子
onMounted(() => {
  initAPIStatsChart()

  // 模拟数据更新
  setInterval(() => {
    // 更新监控数据
    monitoring.value.avgResponse = Math.floor(Math.random() * 200) + 600
    monitoring.value.errorRate = (Math.random() * 2).toFixed(1)
    monitoring.value.concurrentConnections = Math.floor(Math.random() * 50) + 120
  }, 30000)
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.api-marketplace {
  .marketplace-header {
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

  .api-overview {
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

          &.connected-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          &.requests-icon {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }

          &.success-icon {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
          }

          &.plugins-icon {
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

  .marketplace-content {
    .category-card {
      margin-bottom: 20px;

      .category-tabs {
        .category-content {
          .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;

            .category-item {
              display: flex;
              align-items: center;
              padding: 16px;
              border: 1px solid $border-base;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;

              &:hover {
                border-color: $primary-color;
                background: rgba($primary-color, 0.05);
              }

              &.active {
                border-color: $primary-color;
                background: rgba($primary-color, 0.1);
              }

              .category-icon {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                background: $bg-color;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                color: $primary-color;
              }

              .category-info {
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

          .api-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;

            .api-card {
              border: 1px solid $border-base;
              border-radius: 8px;
              overflow: hidden;

              .api-header {
                display: flex;
                align-items: center;
                padding: 16px;
                background: $bg-color;

                .api-logo {
                  width: 40px;
                  height: 40px;
                  border-radius: 8px;
                  margin-right: 12px;
                  overflow: hidden;

                  img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  }
                }

                .api-info {
                  flex: 1;

                  h3 {
                    margin: 0 0 4px 0;
                    color: $text-primary;
                    font-size: 16px;
                  }

                  p {
                    margin: 0;
                    color: $text-secondary;
                    font-size: 14px;
                  }
                }

                .api-status {
                  margin-left: 12px;
                }
              }

              .api-description {
                padding: 16px;
                color: $text-secondary;
                font-size: 14px;
                line-height: 1.5;
              }

              .api-features {
                padding: 0 16px 16px;

                .feature-item {
                  display: flex;
                  align-items: center;
                  font-size: 14px;
                  color: $text-secondary;

                  .el-icon {
                    color: $success-color;
                    margin-right: 8px;
                  }
                }
              }

              .api-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                background: $bg-color;
                border-top: 1px solid $border-base;

                .api-pricing {
                  .price {
                    color: $primary-color;
                    font-weight: 600;
                  }
                }

                .api-actions {
                  display: flex;
                  gap: 8px;
                }
              }
            }
          }
        }
      }
    }

    .stats-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          color: $text-primary;
        }
      }

      .stats-content {
        .stats-chart {
          height: 300px;
          margin-bottom: 24px;
        }
      }
    }

    .plugins-card {
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

      .plugins-list {
        .plugin-item {
          border: 1px solid $border-base;
          border-radius: 8px;
          margin-bottom: 12px;
          overflow: hidden;

          .plugin-header {
            display: flex;
            align-items: center;
            padding: 16px;
            background: $bg-color;

            .plugin-icon {
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

            .plugin-info {
              flex: 1;

              h4 {
                margin: 0 0 4px 0;
                color: $text-primary;
                font-size: 14px;
              }

              .plugin-version {
                color: $text-secondary;
                font-size: 12px;
              }
            }

            .plugin-status {
              margin-left: 12px;
            }
          }

          .plugin-description {
            padding: 16px;
            color: $text-secondary;
            font-size: 14px;
          }

          .plugin-actions {
            display: flex;
            gap: 8px;
            padding: 16px;
            background: $bg-color;
            border-top: 1px solid $border-base;
          }
        }
      }
    }

    .keys-card {
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

      .keys-list {
        .key-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid $border-base;
          border-radius: 8px;
          margin-bottom: 12px;

          .key-info {
            flex: 1;

            .key-name {
              font-weight: 600;
              color: $text-primary;
              margin-bottom: 4px;
            }

            .key-service {
              color: $text-secondary;
              font-size: 14px;
              margin-bottom: 8px;
            }

            .key-meta {
              display: flex;
              align-items: center;
              gap: 12px;
              font-size: 12px;

              .key-created {
                color: $text-secondary;
              }
            }
          }

          .key-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }

    .monitoring-card {
      .card-header {
        h3 {
          margin: 0;
          color: $text-primary;
        }
      }

      .monitoring-content {
        .monitoring-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid $border-base;
          border-radius: 8px;
          margin-bottom: 12px;

          .monitoring-label {
            color: $text-secondary;
            font-size: 14px;
          }

          .monitoring-value {
            font-weight: 600;
            color: $text-primary;
            font-size: 16px;
          }

          .monitoring-trend {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;

            .trend-up {
              color: $success-color;
            }

            .trend-down {
              color: $danger-color;
            }
          }
        }
      }
    }
  }

  .api-detail-content {
    .detail-header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;

      .detail-logo {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        margin-right: 16px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .detail-info {
        flex: 1;

        h3 {
          margin: 0 0 8px 0;
          color: $text-primary;
        }

        p {
          margin: 0 0 12px 0;
          color: $text-secondary;
        }
      }
    }

    .detail-section {
      margin-bottom: 24px;

      h4 {
        margin: 0 0 12px 0;
        color: $text-primary;
      }

      p {
        margin: 0;
        color: $text-secondary;
        line-height: 1.5;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: $bg-color;
          border-radius: 8px;

          .stat-label {
            color: $text-secondary;
            font-size: 14px;
          }

          .stat-value {
            font-weight: 600;
            color: $text-primary;
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