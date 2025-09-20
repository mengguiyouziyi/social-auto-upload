import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import AccountManagement from '../views/AccountManagement.vue'
import MaterialManagement from '../views/MaterialManagement.vue'
import PublishCenter from '../views/PublishCenter.vue'
import About from '../views/About.vue'
import ContentAnalysis from '../views/ContentAnalysis.vue'
import EnterpriseManagement from '../views/EnterpriseManagement.vue'
import UserManagement from '../views/UserManagement.vue'
import PerformanceOptimization from '../views/PerformanceOptimization.vue'
import RealTimeMonitor from '../views/RealTimeMonitor.vue'
import APIMarketplace from '../views/APIMarketplace.vue'
import AIContentGenerator from '../views/AIContentGenerator.vue'
import TaskScheduler from '../views/TaskScheduler.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/account-management',
    name: 'AccountManagement',
    component: AccountManagement
  },
  {
    path: '/material-management',
    name: 'MaterialManagement',
    component: MaterialManagement
  },
  {
    path: '/publish-center',
    name: 'PublishCenter',
    component: PublishCenter
  },
  {
    path: '/content-analysis',
    name: 'ContentAnalysis',
    component: ContentAnalysis,
    meta: { title: '内容分析', icon: 'DataAnalysis' }
  },
  {
    path: '/enterprise-management',
    name: 'EnterpriseManagement',
    component: EnterpriseManagement,
    meta: { title: '企业管理', icon: 'OfficeBuilding' }
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: UserManagement,
    meta: { title: '用户管理', icon: 'UserFilled' }
  },
  {
    path: '/performance-optimization',
    name: 'PerformanceOptimization',
    component: PerformanceOptimization,
    meta: { title: '性能优化', icon: 'Lightning' }
  },
  {
    path: '/real-time-monitor',
    name: 'RealTimeMonitor',
    component: RealTimeMonitor,
    meta: { title: '实时监控', icon: 'Monitor' }
  },
  {
    path: '/api-marketplace',
    name: 'APIMarketplace',
    component: APIMarketplace,
    meta: { title: 'API市场', icon: 'Connection' }
  },
  {
    path: '/ai-content-generator',
    name: 'AIContentGenerator',
    component: AIContentGenerator,
    meta: { title: 'AI内容生成器', icon: 'MagicStick' }
  },
  {
    path: '/task-scheduler',
    name: 'TaskScheduler',
    component: TaskScheduler,
    meta: { title: '任务调度', icon: 'Timer' }
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router