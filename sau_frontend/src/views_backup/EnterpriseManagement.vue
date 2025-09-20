<template>
  <div class="enterprise-management">
    <!-- 头部操作区 -->
    <div class="enterprise-header">
      <div class="header-left">
        <h2>企业管理中心</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">工作台</el-breadcrumb-item>
          <el-breadcrumb-item>企业管理中心</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="createNewEnterprise">
          <el-icon><Plus /></el-icon>创建企业
        </el-button>
        <el-button @click="openEnterpriseTemplates">
          <el-icon><Document /></el-icon>企业模板
        </el-button>
      </div>
    </div>

    <!-- 企业统计概览 -->
    <div class="enterprise-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon enterprises-icon">
                <el-icon><OfficeBuilding /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ enterpriseStats.totalEnterprises }}</div>
                <div class="metric-label">企业总数</div>
                <div class="metric-trend">
                  <span class="trend-up">+8</span>
                  本月新增
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon users-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ enterpriseStats.totalUsers }}</div>
                <div class="metric-label">企业用户</div>
                <div class="metric-trend">
                  <span class="trend-up">+156</span>
                  本月新增
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
                <div class="metric-value">{{ enterpriseStats.monthlyRevenue }}</div>
                <div class="metric-label">本月收入</div>
                <div class="metric-trend">
                  <span class="trend-up">+12.5%</span>
                  较上月
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon activity-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ enterpriseStats.activeRate }}%</div>
                <div class="metric-label">活跃率</div>
                <div class="metric-trend">
                  <span class="trend-up">+3.2%</span>
                  提升活跃
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区 -->
    <div class="enterprise-content">
      <el-row :gutter="20">
        <!-- 左侧企业列表 -->
        <el-col :span="16">
          <!-- 企业管理 -->
          <el-card class="enterprises-card">
            <template #header>
              <div class="card-header">
                <h3>企业管理</h3>
                <div class="header-actions">
                  <el-input
                    v-model="enterpriseSearch"
                    placeholder="搜索企业..."
                    style="width: 200px"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-select v-model="statusFilter" placeholder="状态筛选" clearable>
                    <el-option label="全部状态" value="" />
                    <el-option label="活跃" value="active" />
                    <el-option label="试用" value="trial" />
                    <el-option label="暂停" value="suspended" />
                    <el-option label="已过期" value="expired" />
                  </el-select>
                  <el-select v-model="planFilter" placeholder="套餐筛选" clearable>
                    <el-option label="全部套餐" value="" />
                    <el-option label="基础版" value="basic" />
                    <el-option label="专业版" value="professional" />
                    <el-option label="企业版" value="enterprise" />
                    <el-option label="定制版" value="custom" />
                  </el-select>
                </div>
              </div>
            </template>

            <div class="enterprises-table">
              <el-table :data="filteredEnterprises" style="width: 100%">
                <el-table-column prop="name" label="企业名称" width="200">
                  <template #default="scope">
                    <div class="enterprise-cell">
                      <div class="enterprise-logo">
                        <img :src="scope.row.logo" :alt="scope.row.name">
                      </div>
                      <div class="enterprise-info">
                        <div class="enterprise-name">{{ scope.row.name }}</div>
                        <div class="enterprise-domain">{{ scope.row.domain }}</div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="plan" label="套餐" width="100">
                  <template #default="scope">
                    <el-tag :type="getPlanTagType(scope.row.plan)">
                      {{ getPlanName(scope.row.plan) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="users" label="用户数" width="80" />
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="scope">
                    <el-tag :type="getStatusTagType(scope.row.status)">
                      {{ getStatusName(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="created" label="创建时间" width="120" />
                <el-table-column prop="revenue" label="月收入" width="100" />
                <el-table-column label="操作" width="200">
                  <template #default="scope">
                    <el-button size="small" @click="manageEnterprise(scope.row)">
                      管理
                    </el-button>
                    <el-dropdown @command="(cmd) => handleEnterpriseCommand(cmd, scope.row)">
                      <el-button size="small">
                        更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="edit">编辑企业</el-dropdown-item>
                          <el-dropdown-item command="billing">账单管理</el-dropdown-item>
                          <el-dropdown-item command="analytics">数据分析</el-dropdown-item>
                          <el-dropdown-item command="settings">企业设置</el-dropdown-item>
                          <el-dropdown-item command="suspend" v-if="scope.row.status === 'active'">暂停服务</el-dropdown-item>
                          <el-dropdown-item command="activate" v-if="scope.row.status === 'suspended'">激活服务</el-dropdown-item>
                          <el-dropdown-item command="delete" divided>删除企业</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="pagination">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="filteredEnterprises.length"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
              />
            </div>
          </el-card>

          <!-- 企业资源分配 -->
          <el-card class="resources-card">
            <template #header>
              <div class="card-header">
                <h3>资源分配监控</h3>
                <el-button type="primary" size="small" @click="allocateResources">
                  <el-icon><Setting /></el-icon>分配资源
                </el-button>
              </div>
            </template>

            <div class="resources-grid">
              <div
                v-for="resource in resources"
                :key="resource.id"
                class="resource-item"
              >
                <div class="resource-header">
                  <div class="resource-icon">
                    <el-icon>
                      <component :is="resource.icon" />
                    </el-icon>
                  </div>
                  <div class="resource-info">
                    <h4>{{ resource.name }}</h4>
                    <p>{{ resource.description }}</p>
                  </div>
                </div>
                <div class="resource-usage">
                  <div class="usage-bar">
                    <div
                      class="usage-fill"
                      :style="{width: resource.usagePercentage + '%'}"
                    ></div>
                  </div>
                  <div class="usage-info">
                    <span class="usage-text">{{ resource.used }} / {{ resource.total }}</span>
                    <span class="usage-percentage">{{ resource.usagePercentage }}%</span>
                  </div>
                </div>
                <div class="resource-alerts">
                  <el-alert
                    v-if="resource.usagePercentage > 80"
                    :title="`资源使用率过高: ${resource.usagePercentage}%`"
                    type="warning"
                    :closable="false"
                    size="small"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧管理面板 -->
        <el-col :span="8">
          <!-- 套餐管理 -->
          <el-card class="plans-card">
            <template #header>
              <div class="card-header">
                <h3>套餐管理</h3>
                <el-button type="primary" size="small" @click="createNewPlan">
                  <el-icon><Plus /></el-icon>新增套餐
                </el-button>
              </div>
            </template>

            <div class="plans-list">
              <div
                v-for="plan in subscriptionPlans"
                :key="plan.id"
                class="plan-item"
                :class="{ 'popular': plan.popular }"
              >
                <div class="plan-header">
                  <div class="plan-name">
                    <h4>{{ plan.name }}</h4>
                    <el-tag v-if="plan.popular" type="danger" size="small">热门</el-tag>
                  </div>
                  <div class="plan-price">
                    <span class="price">¥{{ plan.price }}</span>
                    <span class="period">/月</span>
                  </div>
                </div>
                <div class="plan-features">
                  <div
                    v-for="feature in plan.features"
                    :key="feature"
                    class="feature-item"
                  >
                    <el-icon><Check /></el-icon>
                    <span>{{ feature }}</span>
                  </div>
                </div>
                <div class="plan-stats">
                  <div class="stat-item">
                    <span class="stat-label">企业数:</span>
                    <span class="stat-value">{{ plan.enterpriseCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">月收入:</span>
                    <span class="stat-value">¥{{ plan.monthlyRevenue }}</span>
                  </div>
                </div>
                <div class="plan-actions">
                  <el-button size="small" @click="editPlan(plan)">
                    编辑
                  </el-button>
                  <el-button size="small" @click="viewPlanAnalytics(plan)">
                    分析
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 账单管理 -->
          <el-card class="billing-card">
            <template #header>
              <div class="card-header">
                <h3>账单管理</h3>
                <el-button size="small" @click="generateInvoice">
                  <el-icon><Document /></el-icon>生成账单
                </el-button>
              </div>
            </template>

            <div class="billing-summary">
              <div class="summary-item">
                <span class="label">本月应收</span>
                <span class="value">¥{{ billingSummary.monthlyReceivable }}</span>
              </div>
              <div class="summary-item">
                <span class="label">已收款</span>
                <span class="value">¥{{ billingSummary.paid }}</span>
              </div>
              <div class="summary-item">
                <span class="label">逾期</span>
                <span class="value overdue">¥{{ billingSummary.overdue }}</span>
              </div>
            </div>

            <div class="recent-bills">
              <div
                v-for="bill in recentBills"
                :key="bill.id"
                class="bill-item"
              >
                <div class="bill-info">
                  <div class="bill-enterprise">{{ bill.enterprise }}</div>
                  <div class="bill-amount">¥{{ bill.amount }}</div>
                </div>
                <div class="bill-status">
                  <el-tag :type="getBillStatusType(bill.status)" size="small">
                    {{ bill.status }}
                  </el-tag>
                </div>
                <div class="bill-date">{{ bill.date }}</div>
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
                <div class="monitoring-label">系统负载</div>
                <div class="monitoring-value">{{ monitoring.systemLoad }}%</div>
                <div class="monitoring-trend">
                  <el-icon :class="monitoring.loadTrend > 0 ? 'trend-up' : 'trend-down'">
                    <ArrowUp v-if="monitoring.loadTrend > 0" />
                    <ArrowDown v-else />
                  </el-icon>
                  {{ Math.abs(monitoring.loadTrend) }}%
                </div>
              </div>
              <div class="monitoring-item">
                <div class="monitoring-label">存储使用</div>
                <div class="monitoring-value">{{ monitoring.storageUsage }}%</div>
                <div class="monitoring-trend">
                  <el-icon :class="monitoring.storageTrend > 0 ? 'trend-up' : 'trend-down'">
                    <ArrowUp v-if="monitoring.storageTrend > 0" />
                    <ArrowDown v-else />
                  </el-icon>
                  {{ Math.abs(monitoring.storageTrend) }}%
                </div>
              </div>
              <div class="monitoring-item">
                <div class="monitoring-label">API调用</div>
                <div class="monitoring-value">{{ monitoring.apiCalls }}/分钟</div>
                <div class="monitoring-trend">
                  <el-icon :class="monitoring.apiTrend > 0 ? 'trend-up' : 'trend-down'">
                    <ArrowUp v-if="monitoring.apiTrend > 0" />
                    <ArrowDown v-else />
                  </el-icon>
                  {{ Math.abs(monitoring.apiTrend) }}%
                </div>
              </div>
              <div class="monitoring-item">
                <div class="monitoring-label">数据库连接</div>
                <div class="monitoring-value">{{ monitoring.dbConnections }}</div>
                <div class="monitoring-trend">
                  <el-icon :class="monitoring.dbTrend > 0 ? 'trend-up' : 'trend-down'">
                    <ArrowUp v-if="monitoring.dbTrend > 0" />
                    <ArrowDown v-else />
                  </el-icon>
                  {{ Math.abs(monitoring.dbTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 创建/编辑企业对话框 -->
    <el-dialog
      v-model="enterpriseDialog.visible"
      :title="enterpriseDialog.mode === 'create' ? '创建企业' : '编辑企业'"
      width="700px"
    >
      <el-form :model="enterpriseForm" label-width="120px">
        <el-form-item label="企业名称">
          <el-input v-model="enterpriseForm.name" placeholder="请输入企业名称" />
        </el-form-item>
        <el-form-item label="企业域名">
          <el-input v-model="enterpriseForm.domain" placeholder="请输入企业域名" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="enterpriseForm.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="enterpriseForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱地址">
          <el-input v-model="enterpriseForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="选择套餐">
          <el-select v-model="enterpriseForm.plan" placeholder="请选择套餐">
            <el-option label="基础版" value="basic" />
            <el-option label="专业版" value="professional" />
            <el-option label="企业版" value="enterprise" />
            <el-option label="定制版" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户数量">
          <el-input-number v-model="enterpriseForm.userLimit" :min="1" :max="10000" />
        </el-form-item>
        <el-form-item label="存储空间">
          <el-select v-model="enterpriseForm.storage" placeholder="请选择存储空间">
            <el-option label="10GB" value="10GB" />
            <el-option label="50GB" value="50GB" />
            <el-option label="100GB" value="100GB" />
            <el-option label="500GB" value="500GB" />
            <el-option label="1TB" value="1TB" />
          </el-select>
        </el-form-item>
        <el-form-item label="企业描述">
          <el-input v-model="enterpriseForm.description" type="textarea" placeholder="请输入企业描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="enterpriseDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveEnterprise">确定</el-button>
      </template>
    </el-dialog>

    <!-- 企业管理面板 -->
    <el-dialog
      v-model="managementDialog.visible"
      title="企业管理面板"
      width="90%"
      fullscreen
    >
      <div class="management-panel">
        <div class="panel-header">
          <h3>{{ managementDialog.enterprise.name }} - 管理面板</h3>
          <el-tabs v-model="activeManagementTab">
            <el-tab-pane label="概览" name="overview">
              <div class="overview-content">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-card>
                      <div class="stat-card">
                        <div class="stat-value">{{ managementDialog.enterprise.users }}</div>
                        <div class="stat-label">用户总数</div>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="6">
                    <el-card>
                      <div class="stat-card">
                        <div class="stat-value">{{ managementDialog.enterprise.contentCount }}</div>
                        <div class="stat-label">内容总数</div>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="6">
                    <el-card>
                      <div class="stat-card">
                        <div class="stat-value">{{ managementDialog.enterprise.apiCalls }}</div>
                        <div class="stat-label">API调用</div>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="6">
                    <el-card>
                      <div class="stat-card">
                        <div class="stat-value">{{ managementDialog.enterprise.storageUsed }}</div>
                        <div class="stat-label">存储使用</div>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
            <el-tab-pane label="用户管理" name="users">
              <div class="users-management">
                <div class="users-list">
                  <!-- 用户管理内容 -->
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="权限设置" name="permissions">
              <div class="permissions-settings">
                <!-- 权限设置内容 -->
              </div>
            </el-tab-pane>
            <el-tab-pane label="数据统计" name="analytics">
              <div class="analytics-data">
                <!-- 数据统计内容 -->
              </div>
            </el-tab-pane>
            <el-tab-pane label="系统设置" name="settings">
              <div class="system-settings">
                <!-- 系统设置内容 -->
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
      <template #footer>
        <el-button @click="managementDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Document, Search, OfficeBuilding, User, Money, TrendCharts,
  ArrowDown, Setting, Check, DataBoard, Monitor, Edit, Delete, View,
  Clock, CreditCard, Key, Cloudy
} from '@element-plus/icons-vue'

// 响应式数据
const enterpriseStats = ref({
  totalEnterprises: 45,
  totalUsers: 1234,
  monthlyRevenue: '¥45,680',
  activeRate: 87.5
})

const enterpriseSearch = ref('')
const statusFilter = ref('')
const planFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const enterprises = ref([
  {
    id: 1,
    name: '上海科技有限公司',
    domain: 'shanghai-tech.example.com',
    logo: 'https://placeholder.com/50x50',
    plan: 'enterprise',
    users: 45,
    status: 'active',
    created: '2024-01-15',
    revenue: '¥2,800',
    contact: '张三',
    phone: '13800138000',
    email: 'contact@shanghai-tech.com',
    description: '专业的科技公司，提供软件开发服务'
  },
  {
    id: 2,
    name: '北京文化传媒',
    domain: 'beijing-media.example.com',
    logo: 'https://placeholder.com/50x50',
    plan: 'professional',
    users: 23,
    status: 'active',
    created: '2024-01-10',
    revenue: '¥1,500',
    contact: '李四',
    phone: '13800138001',
    email: 'contact@beijing-media.com',
    description: '文化传媒公司，专注于内容创作'
  },
  {
    id: 3,
    name: '深圳创新工场',
    domain: 'shenzhen-innovate.example.com',
    logo: 'https://placeholder.com/50x50',
    plan: 'basic',
    users: 12,
    status: 'trial',
    created: '2024-01-08',
    revenue: '¥800',
    contact: '王五',
    phone: '13800138002',
    email: 'contact@shenzhen-innovate.com',
    description: '创新创业公司，孵化器模式'
  },
  {
    id: 4,
    name: '广州电商集团',
    domain: 'guangzhou-ecommerce.example.com',
    logo: 'https://placeholder.com/50x50',
    plan: 'enterprise',
    users: 67,
    status: 'suspended',
    created: '2024-01-05',
    revenue: '¥3,200',
    contact: '赵六',
    phone: '13800138003',
    email: 'contact@guangzhou-ecommerce.com',
    description: '大型电商集团，多平台运营'
  }
])

const subscriptionPlans = ref([
  {
    id: 1,
    name: '基础版',
    price: 299,
    popular: false,
    features: ['5个用户', '10GB存储', '基础功能', '邮件支持'],
    enterpriseCount: 15,
    monthlyRevenue: 4485
  },
  {
    id: 2,
    name: '专业版',
    price: 799,
    popular: true,
    features: ['20个用户', '50GB存储', '高级功能', '优先支持', 'API访问'],
    enterpriseCount: 22,
    monthlyRevenue: 17578
  },
  {
    id: 3,
    name: '企业版',
    price: 1999,
    popular: false,
    features: ['无限用户', '500GB存储', '全部功能', '专属支持', '定制开发'],
    enterpriseCount: 8,
    monthlyRevenue: 15992
  },
  {
    id: 4,
    name: '定制版',
    price: '定制',
    popular: false,
    features: ['完全定制', '专属服务器', '7x24支持', '现场服务'],
    enterpriseCount: 2,
    monthlyRevenue: 8000
  }
])

const resources = ref([
  {
    id: 1,
    name: '服务器资源',
    description: 'CPU、内存、磁盘使用情况',
    icon: 'Monitor',
    used: '120',
    total: '200',
    usagePercentage: 60
  },
  {
    id: 2,
    name: '数据库连接',
    description: '数据库连接池使用情况',
    icon: 'DataBoard',
    used: '85',
    total: '100',
    usagePercentage: 85
  },
  {
    id: 3,
    name: '存储空间',
    description: '文件存储使用情况',
    icon: 'DataBoard',
    used: '1.2TB',
    total: '2TB',
    usagePercentage: 60
  },
  {
    id: 4,
    name: 'API调用',
    description: 'API调用配额使用情况',
    icon: 'DataBoard',
    used: '850000',
    total: '1000000',
    usagePercentage: 85
  }
])

const billingSummary = ref({
  monthlyReceivable: 45680,
  paid: 42150,
  overdue: 3530
})

const recentBills = ref([
  { id: 1, enterprise: '上海科技有限公司', amount: 2800, status: '已支付', date: '2024-01-15' },
  { id: 2, enterprise: '北京文化传媒', amount: 1500, status: '待支付', date: '2024-01-15' },
  { id: 3, enterprise: '深圳创新工场', amount: 800, status: '已支付', date: '2024-01-14' },
  { id: 4, enterprise: '广州电商集团', amount: 3200, status: '逾期', date: '2024-01-10' }
])

const monitoring = ref({
  systemLoad: 68,
  loadTrend: 2.3,
  storageUsage: 62,
  storageTrend: -1.2,
  apiCalls: 1250,
  apiTrend: 5.6,
  dbConnections: 85,
  dbTrend: 3.1
})

const enterpriseDialog = reactive({
  visible: false,
  mode: 'create'
})

const enterpriseForm = reactive({
  name: '',
  domain: '',
  contact: '',
  phone: '',
  email: '',
  plan: '',
  userLimit: 10,
  storage: '10GB',
  description: ''
})

const managementDialog = reactive({
  visible: false,
  enterprise: {}
})

const activeManagementTab = ref('overview')

// 计算属性
const filteredEnterprises = computed(() => {
  let result = enterprises.value

  if (enterpriseSearch.value) {
    result = result.filter(enterprise =>
      enterprise.name.toLowerCase().includes(enterpriseSearch.value.toLowerCase()) ||
      enterprise.domain.toLowerCase().includes(enterpriseSearch.value.toLowerCase())
    )
  }

  if (statusFilter.value) {
    result = result.filter(enterprise => enterprise.status === statusFilter.value)
  }

  if (planFilter.value) {
    result = result.filter(enterprise => enterprise.plan === planFilter.value)
  }

  return result
})

// 方法定义
const getPlanTagType = (plan) => {
  switch (plan) {
    case 'basic': return 'info'
    case 'professional': return 'warning'
    case 'enterprise': return 'success'
    case 'custom': return 'danger'
    default: return 'info'
  }
}

const getPlanName = (plan) => {
  switch (plan) {
    case 'basic': return '基础版'
    case 'professional': return '专业版'
    case 'enterprise': return '企业版'
    case 'custom': return '定制版'
    default: return plan
  }
}

const getStatusTagType = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'trial': return 'warning'
    case 'suspended': return 'danger'
    case 'expired': return 'info'
    default: return 'info'
  }
}

const getStatusName = (status) => {
  switch (status) {
    case 'active': return '活跃'
    case 'trial': return '试用'
    case 'suspended': return '暂停'
    case 'expired': return '已过期'
    default: return status
  }
}

const getBillStatusType = (status) => {
  switch (status) {
    case '已支付': return 'success'
    case '待支付': return 'warning'
    case '逾期': return 'danger'
    default: return 'info'
  }
}

const createNewEnterprise = () => {
  enterpriseDialog.mode = 'create'
  Object.keys(enterpriseForm).forEach(key => {
    enterpriseForm[key] = ''
  })
  enterpriseForm.userLimit = 10
  enterpriseForm.storage = '10GB'
  enterpriseDialog.visible = true
}

const editEnterprise = (enterprise) => {
  enterpriseDialog.mode = 'edit'
  Object.keys(enterpriseForm).forEach(key => {
    enterpriseForm[key] = enterprise[key] || ''
  })
  enterpriseForm.id = enterprise.id
  enterpriseDialog.visible = true
}

const saveEnterprise = () => {
  if (!enterpriseForm.name || !enterpriseForm.domain || !enterpriseForm.plan) {
    ElMessage.warning('请填写必要信息')
    return
  }

  if (enterpriseDialog.mode === 'create') {
    const newEnterprise = {
      id: enterprises.value.length + 1,
      ...enterpriseForm,
      logo: 'https://placeholder.com/50x50',
      users: 0,
      status: 'trial',
      created: new Date().toISOString().split('T')[0],
      revenue: '¥0'
    }
    enterprises.value.push(newEnterprise)
    ElMessage.success('企业创建成功')
  } else {
    const enterpriseIndex = enterprises.value.findIndex(e => e.id === enterpriseForm.id)
    if (enterpriseIndex > -1) {
      enterprises.value[enterpriseIndex] = { ...enterprises.value[enterpriseIndex], ...enterpriseForm }
      ElMessage.success('企业更新成功')
    }
  }

  enterpriseDialog.visible = false
}

const manageEnterprise = (enterprise) => {
  managementDialog.enterprise = {
    ...enterprise,
    users: enterprise.users + Math.floor(Math.random() * 10),
    contentCount: Math.floor(Math.random() * 1000),
    apiCalls: Math.floor(Math.random() * 10000),
    storageUsed: Math.floor(Math.random() * 100) + 'GB'
  }
  managementDialog.visible = true
}

const handleEnterpriseCommand = (command, enterprise) => {
  switch (command) {
    case 'edit':
      editEnterprise(enterprise)
      break
    case 'billing':
      manageBilling(enterprise)
      break
    case 'analytics':
      viewAnalytics(enterprise)
      break
    case 'settings':
      enterpriseSettings(enterprise)
      break
    case 'suspend':
      suspendEnterprise(enterprise)
      break
    case 'activate':
      activateEnterprise(enterprise)
      break
    case 'delete':
      deleteEnterprise(enterprise)
      break
  }
}

const manageBilling = (enterprise) => {
  ElMessage.info(`正在管理 ${enterprise.name} 的账单...`)
}

const viewAnalytics = (enterprise) => {
  ElMessage.info(`正在查看 ${enterprise.name} 的数据分析...`)
}

const enterpriseSettings = (enterprise) => {
  ElMessage.info(`正在配置 ${enterprise.name} 的企业设置...`)
}

const suspendEnterprise = (enterprise) => {
  ElMessageBox.confirm(
    `确定要暂停 ${enterprise.name} 的服务吗？`,
    '暂停服务',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    enterprise.status = 'suspended'
    ElMessage.success(`${enterprise.name} 的服务已暂停`)
  }).catch(() => {
    // 用户取消
  })
}

const activateEnterprise = (enterprise) => {
  ElMessageBox.confirm(
    `确定要激活 ${enterprise.name} 的服务吗？`,
    '激活服务',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    enterprise.status = 'active'
    ElMessage.success(`${enterprise.name} 的服务已激活`)
  }).catch(() => {
    // 用户取消
  })
}

const deleteEnterprise = (enterprise) => {
  ElMessageBox.confirm(
    `确定要删除企业 ${enterprise.name} 吗？此操作不可恢复。`,
    '删除企业',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    const index = enterprises.value.findIndex(e => e.id === enterprise.id)
    if (index > -1) {
      enterprises.value.splice(index, 1)
      ElMessage.success(`企业 ${enterprise.name} 已删除`)
    }
  }).catch(() => {
    // 用户取消
  })
}

const openEnterpriseTemplates = () => {
  ElMessage.info('正在打开企业模板...')
}

const allocateResources = () => {
  ElMessage.info('正在分配资源...')
}

const createNewPlan = () => {
  ElMessage.info('正在创建新套餐...')
}

const editPlan = (plan) => {
  ElMessage.info(`正在编辑套餐 ${plan.name}...`)
}

const viewPlanAnalytics = (plan) => {
  ElMessage.info(`正在查看套餐 ${plan.name} 的分析...`)
}

const generateInvoice = () => {
  ElMessage.info('正在生成账单...')
}

// 生命周期钩子
onMounted(() => {
  // 初始化数据
  enterpriseStats.value.totalEnterprises = enterprises.value.length

  // 模拟数据更新
  setInterval(() => {
    // 更新监控数据
    monitoring.value.systemLoad = Math.floor(Math.random() * 30) + 50
    monitoring.value.storageUsage = Math.floor(Math.random() * 20) + 50
    monitoring.value.apiCalls = Math.floor(Math.random() * 500) + 1000
    monitoring.value.dbConnections = Math.floor(Math.random() * 30) + 70
  }, 30000)
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.enterprise-management {
  .enterprise-header {
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

  .enterprise-overview {
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

          &.enterprises-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          &.users-icon {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }

          &.revenue-icon {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
          }

          &.activity-icon {
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

  .enterprise-content {
    .enterprises-card {
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

      .enterprises-table {
        .enterprise-cell {
          display: flex;
          align-items: center;

          .enterprise-logo {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            margin-right: 8px;
            overflow: hidden;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }

          .enterprise-info {
            .enterprise-name {
              font-weight: 500;
              color: $text-primary;
            }

            .enterprise-domain {
              font-size: 12px;
              color: $text-secondary;
            }
          }
        }
      }

      .pagination {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
      }
    }

    .resources-card {
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

      .resources-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;

        .resource-item {
          border: 1px solid $border-base;
          border-radius: 8px;
          padding: 16px;

          .resource-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;

            .resource-icon {
              width: 40px;
              height: 40px;
              border-radius: 8px;
              background: $bg-color;
              display: flex;
              align-items: center;
              justify-content: center;
              color: $primary-color;
              margin-right: 12px;
            }

            .resource-info {
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
          }

          .resource-usage {
            margin-bottom: 12px;

            .usage-bar {
              height: 8px;
              background: $border-base;
              border-radius: 4px;
              overflow: hidden;
              margin-bottom: 8px;

              .usage-fill {
                height: 100%;
                background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
              }
            }

            .usage-info {
              display: flex;
              justify-content: space-between;
              font-size: 12px;

              .usage-text {
                color: $text-secondary;
              }

              .usage-percentage {
                font-weight: 600;
                color: $text-primary;
              }
            }
          }

          .resource-alerts {
            .el-alert {
              margin-bottom: 8px;
            }
          }
        }
      }
    }

    .plans-card {
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

      .plans-list {
        .plan-item {
          border: 1px solid $border-base;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          position: relative;

          &.popular {
            border-color: $danger-color;
            background: rgba($danger-color, 0.05);
          }

          .plan-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .plan-name {
              display: flex;
              align-items: center;
              gap: 8px;

              h4 {
                margin: 0;
                color: $text-primary;
              }
            }

            .plan-price {
              .price {
                font-size: 24px;
                font-weight: 600;
                color: $primary-color;
              }

              .period {
                font-size: 14px;
                color: $text-secondary;
              }
            }
          }

          .plan-features {
            margin-bottom: 12px;

            .feature-item {
              display: flex;
              align-items: center;
              margin-bottom: 8px;
              font-size: 14px;
              color: $text-secondary;

              .el-icon {
                color: $success-color;
                margin-right: 8px;
              }
            }
          }

          .plan-stats {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;

            .stat-item {
              .stat-label {
                color: $text-secondary;
              }

              .stat-value {
                font-weight: 600;
                color: $text-primary;
                margin-left: 4px;
              }
            }
          }

          .plan-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }

    .billing-card {
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

      .billing-summary {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 16px;

        .summary-item {
          padding: 12px;
          background: $bg-color;
          border-radius: 8px;
          text-align: center;

          .label {
            display: block;
            color: $text-secondary;
            font-size: 12px;
            margin-bottom: 4px;
          }

          .value {
            font-size: 16px;
            font-weight: 600;
            color: $text-primary;

            &.overdue {
              color: $danger-color;
            }
          }
        }
      }

      .recent-bills {
        .bill-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid $border-base;

          &:last-child {
            border-bottom: none;
          }

          .bill-info {
            flex: 1;

            .bill-enterprise {
              font-weight: 500;
              color: $text-primary;
            }

            .bill-amount {
              font-size: 14px;
              color: $text-secondary;
            }
          }

          .bill-status {
            margin: 0 12px;
          }

          .bill-date {
            font-size: 12px;
            color: $text-secondary;
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
          padding: 12px;
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

  .management-panel {
    .panel-header {
      h3 {
        margin: 0 0 16px 0;
        color: $text-primary;
      }

      .overview-content {
        .stat-card {
          text-align: center;
          padding: 20px;

          .stat-value {
            font-size: 32px;
            font-weight: 600;
            color: $primary-color;
            margin-bottom: 8px;
          }

          .stat-label {
            color: $text-secondary;
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