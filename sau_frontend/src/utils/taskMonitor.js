/**
 * 任务监控和告警系统
 */

import { reactive, ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { TaskStatus, TaskPriority } from './taskTypes'

class TaskMonitor {
  constructor() {
    this.metrics = reactive({
      system: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
        uptime: 0
      },
      tasks: {
        total: 0,
        running: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        paused: 0
      },
      performance: {
        averageExecutionTime: 0,
        successRate: 0,
        errorRate: 0,
        throughput: 0
      }
    })

    this.alerts = reactive([])
    this.alertRules = reactive(new Map())
    this.notificationChannels = reactive(new Map())
    this.monitoringTasks = reactive(new Set())
    this.performanceHistory = reactive([])
    this.systemHistory = reactive([])
    this.isMonitoring = false
    this.monitoringInterval = null

    // 初始化通知渠道
    this.initializeNotificationChannels()
  }

  /**
   * 初始化通知渠道
   */
  initializeNotificationChannels() {
    this.notificationChannels.set('browser', {
      name: '浏览器通知',
      enabled: true,
      config: {}
    })

    this.notificationChannels.set('email', {
      name: '邮件通知',
      enabled: false,
      config: {
        smtp: '',
        port: 587,
        username: '',
        password: '',
        recipients: []
      }
    })

    this.notificationChannels.set('webhook', {
      name: 'Webhook',
      enabled: false,
      config: {
        url: '',
        method: 'POST',
        headers: {}
      }
    })

    this.notificationChannels.set('slack', {
      name: 'Slack',
      enabled: false,
      config: {
        webhookUrl: '',
        channel: '#alerts'
      }
    })
  }

  /**
   * 启动监控
   */
  startMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
      this.checkAlerts()
      this.cleanupOldAlerts()
    }, 5000) // 每5秒收集一次指标

    console.log('任务监控系统已启动')
  }

  /**
   * 停止监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    console.log('任务监控系统已停止')
  }

  /**
   * 收集系统指标
   */
  async collectMetrics() {
    // 收集系统指标（模拟）
    const systemMetrics = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100,
      uptime: Date.now()
    }

    // 收集任务指标
    const taskMetrics = {
      total: this.monitoringTasks.size,
      running: Array.from(this.monitoringTasks).filter(t => t.status === TaskStatus.RUNNING).length,
      pending: Array.from(this.monitoringTasks).filter(t => t.status === TaskStatus.PENDING).length,
      completed: Array.from(this.monitoringTasks).filter(t => t.status === TaskStatus.COMPLETED).length,
      failed: Array.from(this.monitoringTasks).filter(t => t.status === TaskStatus.FAILED).length,
      paused: Array.from(this.monitoringTasks).filter(t => t.status === TaskStatus.PAUSED).length
    }

    // 计算性能指标
    const performanceMetrics = {
      averageExecutionTime: this.calculateAverageExecutionTime(),
      successRate: this.calculateSuccessRate(),
      errorRate: this.calculateErrorRate(),
      throughput: this.calculateThroughput()
    }

    // 更新指标
    Object.assign(this.metrics.system, systemMetrics)
    Object.assign(this.metrics.tasks, taskMetrics)
    Object.assign(this.metrics.performance, performanceMetrics)

    // 记录历史数据
    this.recordMetrics()
  }

  /**
   * 记录指标历史
   */
  recordMetrics() {
    const timestamp = Date.now()

    // 记录系统历史
    this.systemHistory.push({
      timestamp,
      ...this.metrics.system
    })

    // 记录性能历史
    this.performanceHistory.push({
      timestamp,
      ...this.metrics.performance
    })

    // 限制历史数据长度
    if (this.systemHistory.length > 1000) {
      this.systemHistory = this.systemHistory.slice(-1000)
    }

    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000)
    }
  }

  /**
   * 添加监控任务
   */
  addMonitoringTask(task) {
    this.monitoringTasks.add(task)

    // 为任务创建默认告警规则
    this.createDefaultAlertRules(task.id)

    console.log(`任务 ${task.id} 已添加到监控`)
  }

  /**
   * 移除监控任务
   */
  removeMonitoringTask(taskId) {
    this.monitoringTasks.delete(taskId)
    this.alertRules.delete(taskId)

    console.log(`任务 ${taskId} 已从监控中移除`)
  }

  /**
   * 创建默认告警规则
   */
  createDefaultAlertRules(taskId) {
    const rules = [
      {
        id: `${taskId}_execution_time`,
        name: '执行时间过长',
        condition: 'execution_time > 300000', // 5分钟
        severity: 'warning',
        enabled: true,
        description: '任务执行时间超过5分钟'
      },
      {
        id: `${taskId}_failure_rate`,
        name: '失败率过高',
        condition: 'failure_rate > 20', // 20%
        severity: 'error',
        enabled: true,
        description: '任务失败率超过20%'
      },
      {
        id: `${taskId}_resource_usage`,
        name: '资源使用率过高',
        condition: 'cpu > 80 || memory > 80',
        severity: 'warning',
        enabled: true,
        description: 'CPU或内存使用率超过80%'
      }
    ]

    this.alertRules.set(taskId, rules)
  }

  /**
   * 添加告警规则
   */
  addAlertRule(taskId, rule) {
    if (!this.alertRules.has(taskId)) {
      this.alertRules.set(taskId, [])
    }

    const newRule = {
      id: rule.id || `${taskId}_${Date.now()}`,
      name: rule.name,
      condition: rule.condition,
      severity: rule.severity || 'warning',
      enabled: rule.enabled !== false,
      description: rule.description || '',
      cooldown: rule.cooldown || 300000, // 5分钟冷却时间
      lastTriggered: null,
      ...rule
    }

    this.alertRules.get(taskId).push(newRule)
    return newRule
  }

  /**
   * 移除告警规则
   */
  removeAlertRule(taskId, ruleId) {
    const rules = this.alertRules.get(taskId)
    if (rules) {
      const index = rules.findIndex(r => r.id === ruleId)
      if (index !== -1) {
        rules.splice(index, 1)
        return true
      }
    }
    return false
  }

  /**
   * 检查告警
   */
  async checkAlerts() {
    for (const [taskId, rules] of this.alertRules) {
      const task = Array.from(this.monitoringTasks).find(t => t.id === taskId)
      if (!task) continue

      for (const rule of rules) {
        if (!rule.enabled) continue

        // 检查冷却时间
        if (rule.lastTriggered && Date.now() - rule.lastTriggered < rule.cooldown) {
          continue
        }

        // 评估条件
        if (this.evaluateAlertCondition(rule.condition, task)) {
          await this.triggerAlert(rule, task)
          rule.lastTriggered = Date.now()
        }
      }
    }
  }

  /**
   * 评估告警条件
   */
  evaluateAlertCondition(condition, task) {
    try {
      // 创建评估上下文
      const context = {
        task,
        system: this.metrics.system,
        performance: this.metrics.performance,
        execution_time: task.lastRunDuration || 0,
        failure_rate: this.calculateTaskFailureRate(task.id),
        success_rate: this.calculateTaskSuccessRate(task.id),
        cpu: this.metrics.system.cpu,
        memory: this.metrics.system.memory,
        disk: this.metrics.system.disk
      }

      // 简单的条件评估（实际使用时应该使用更安全的表达式解析器）
      return this.evaluateSimpleCondition(condition, context)
    } catch (error) {
      console.error('评估告警条件失败:', error)
      return false
    }
  }

  /**
   * 评估简单条件
   */
  evaluateSimpleCondition(condition, context) {
    // 简化的条件评估，实际使用时应该使用更安全的表达式解析器
    if (condition.includes('execution_time >')) {
      const threshold = parseInt(condition.match(/execution_time > (\d+)/)?.[1] || 0)
      return context.execution_time > threshold
    }

    if (condition.includes('failure_rate >')) {
      const threshold = parseInt(condition.match(/failure_rate > (\d+)/)?.[1] || 0)
      return context.failure_rate > threshold
    }

    if (condition.includes('cpu >')) {
      const threshold = parseInt(condition.match(/cpu > (\d+)/)?.[1] || 0)
      return context.cpu > threshold
    }

    if (condition.includes('memory >')) {
      const threshold = parseInt(condition.match(/memory > (\d+)/)?.[1] || 0)
      return context.memory > threshold
    }

    if (condition.includes('||')) {
      const conditions = condition.split('||')
      return conditions.some(cond => this.evaluateSimpleCondition(cond.trim(), context))
    }

    return false
  }

  /**
   * 触发告警
   */
  async triggerAlert(rule, task) {
    const alert = {
      id: Date.now().toString(),
      ruleId: rule.id,
      ruleName: rule.name,
      taskId: task.id,
      taskName: task.name,
      severity: rule.severity,
      message: this.formatAlertMessage(rule, task),
      timestamp: Date.now(),
      resolved: false,
      metadata: {
        rule,
        task,
        metrics: { ...this.metrics }
      }
    }

    this.alerts.unshift(alert)

    // 限制告警数量
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(0, 1000)
    }

    // 发送通知
    await this.sendNotifications(alert)

    console.log(`告警触发: ${alert.message}`)
  }

  /**
   * 格式化告警消息
   */
  formatAlertMessage(rule, task) {
    const timestamp = new Date().toLocaleString()
    return `[${timestamp}] ${rule.name}: 任务 "${task.name}" ${rule.description}`
  }

  /**
   * 发送通知
   */
  async sendNotifications(alert) {
    const promises = []

    for (const [channelId, channel] of this.notificationChannels) {
      if (!channel.enabled) continue

      switch (channelId) {
        case 'browser':
          promises.push(this.sendBrowserNotification(alert))
          break
        case 'email':
          promises.push(this.sendEmailNotification(alert, channel.config))
          break
        case 'webhook':
          promises.push(this.sendWebhookNotification(alert, channel.config))
          break
        case 'slack':
          promises.push(this.sendSlackNotification(alert, channel.config))
          break
      }
    }

    await Promise.allSettled(promises)
  }

  /**
   * 发送浏览器通知
   */
  async sendBrowserNotification(alert) {
    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
      new Notification('任务告警', {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission()
    }

    // 显示ElementPlus通知
    ElNotification({
      title: '任务告警',
      message: alert.message,
      type: alert.severity === 'error' ? 'error' : 'warning',
      duration: 5000
    })
  }

  /**
   * 发送邮件通知
   */
  async sendEmailNotification(alert, config) {
    // 这里应该实现邮件发送逻辑
    console.log('发送邮件通知:', alert.message, config)
  }

  /**
   * 发送Webhook通知
   */
  async sendWebhookNotification(alert, config) {
    try {
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify({
          alert,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`Webhook请求失败: ${response.status}`)
      }
    } catch (error) {
      console.error('Webhook通知失败:', error)
    }
  }

  /**
   * 发送Slack通知
   */
  async sendSlackNotification(alert, config) {
    try {
      const payload = {
        text: alert.message,
        attachments: [
          {
            color: alert.severity === 'error' ? 'danger' : 'warning',
            fields: [
              {
                title: '任务',
                value: alert.taskName,
                short: true
              },
              {
                title: '严重程度',
                value: alert.severity,
                short: true
              },
              {
                title: '时间',
                value: new Date(alert.timestamp).toLocaleString(),
                short: true
              }
            ]
          }
        ]
      }

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Slack通知失败: ${response.status}`)
      }
    } catch (error) {
      console.error('Slack通知失败:', error)
    }
  }

  /**
   * 解决告警
   */
  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      return true
    }
    return false
  }

  /**
   * 清理旧告警
   */
  cleanupOldAlerts() {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const before = this.alerts.length

    this.alerts = this.alerts.filter(alert => {
      // 保留未解决的告警和一周内的告警
      return !alert.resolved || alert.timestamp > oneWeekAgo
    })

    const removed = before - this.alerts.length
    if (removed > 0) {
      console.log(`清理了 ${removed} 个旧告警`)
    }
  }

  /**
   * 获取告警统计
   */
  getAlertStats() {
    const stats = {
      total: this.alerts.length,
      active: this.alerts.filter(a => !a.resolved).length,
      resolved: this.alerts.filter(a => a.resolved).length,
      bySeverity: {
        error: this.alerts.filter(a => a.severity === 'error').length,
        warning: this.alerts.filter(a => a.severity === 'warning').length,
        info: this.alerts.filter(a => a.severity === 'info').length
      },
      byTask: {},
      recent: this.alerts.slice(0, 10)
    }

    // 按任务统计
    for (const alert of this.alerts) {
      if (!stats.byTask[alert.taskId]) {
        stats.byTask[alert.taskId] = {
          taskName: alert.taskName,
          total: 0,
          active: 0
        }
      }
      stats.byTask[alert.taskId].total++
      if (!alert.resolved) {
        stats.byTask[alert.taskId].active++
      }
    }

    return stats
  }

  /**
   * 获取性能趋势
   */
  getPerformanceTrend(hours = 24) {
    const now = Date.now()
    const startTime = now - hours * 60 * 60 * 1000

    const trend = []
    const interval = 60 * 60 * 1000 // 1小时间隔

    for (let time = startTime; time <= now; time += interval) {
      const point = {
        timestamp: time,
        cpu: 0,
        memory: 0,
        successRate: 0,
        averageExecutionTime: 0
      }

      // 计算该时间段的平均值
      const periodData = this.performanceHistory.filter(
        h => h.timestamp >= time && h.timestamp < time + interval
      )

      if (periodData.length > 0) {
        point.successRate = periodData.reduce((sum, h) => sum + h.successRate, 0) / periodData.length
        point.averageExecutionTime = periodData.reduce((sum, h) => sum + h.averageExecutionTime, 0) / periodData.length
      }

      const systemData = this.systemHistory.filter(
        h => h.timestamp >= time && h.timestamp < time + interval
      )

      if (systemData.length > 0) {
        point.cpu = systemData.reduce((sum, h) => sum + h.cpu, 0) / systemData.length
        point.memory = systemData.reduce((sum, h) => sum + h.memory, 0) / systemData.length
      }

      trend.push(point)
    }

    return trend
  }

  /**
   * 计算平均执行时间
   */
  calculateAverageExecutionTime() {
    const completedTasks = Array.from(this.monitoringTasks).filter(t => t.lastRunDuration)
    if (completedTasks.length === 0) return 0

    const totalTime = completedTasks.reduce((sum, t) => sum + t.lastRunDuration, 0)
    return Math.round(totalTime / completedTasks.length)
  }

  /**
   * 计算成功率
   */
  calculateSuccessRate() {
    const completedTasks = Array.from(this.monitoringTasks).filter(t => t.runCount > 0)
    if (completedTasks.length === 0) return 100

    const successfulExecutions = completedTasks.reduce((sum, t) => {
      return sum + (t.runCount - (t.errorCount || 0))
    }, 0)

    const totalExecutions = completedTasks.reduce((sum, t) => sum + t.runCount, 0)

    return totalExecutions > 0 ? (successfulExecutions / totalExecutions * 100).toFixed(2) : 100
  }

  /**
   * 计算错误率
   */
  calculateErrorRate() {
    const successRate = parseFloat(this.calculateSuccessRate())
    return (100 - successRate).toFixed(2)
  }

  /**
   * 计算吞吐量
   */
  calculateThroughput() {
    // 计算每分钟执行的任务数
    const recentTasks = Array.from(this.monitoringTasks).filter(t => t.lastRun)
    if (recentTasks.length === 0) return 0

    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    const recentExecutions = recentTasks.filter(t => new Date(t.lastRun) >= oneHourAgo)
    return recentExecutions.length
  }

  /**
   * 计算任务失败率
   */
  calculateTaskFailureRate(taskId) {
    const task = Array.from(this.monitoringTasks).find(t => t.id === taskId)
    if (!task || task.runCount === 0) return 0

    return ((task.errorCount || 0) / task.runCount * 100).toFixed(2)
  }

  /**
   * 计算任务成功率
   */
  calculateTaskSuccessRate(taskId) {
    const failureRate = parseFloat(this.calculateTaskFailureRate(taskId))
    return (100 - failureRate).toFixed(2)
  }

  /**
   * 获取系统健康状态
   */
  getSystemHealth() {
    const health = {
      overall: 'healthy',
      components: {
        cpu: 'healthy',
        memory: 'healthy',
        disk: 'healthy',
        tasks: 'healthy'
      },
      issues: []
    }

    // 检查CPU
    if (this.metrics.system.cpu > 80) {
      health.components.cpu = 'warning'
      health.issues.push('CPU使用率过高')
    }
    if (this.metrics.system.cpu > 90) {
      health.components.cpu = 'critical'
      health.overall = 'critical'
    }

    // 检查内存
    if (this.metrics.system.memory > 80) {
      health.components.memory = 'warning'
      health.issues.push('内存使用率过高')
    }
    if (this.metrics.system.memory > 90) {
      health.components.memory = 'critical'
      health.overall = 'critical'
    }

    // 检查磁盘
    if (this.metrics.system.disk > 80) {
      health.components.disk = 'warning'
      health.issues.push('磁盘使用率过高')
    }
    if (this.metrics.system.disk > 90) {
      health.components.disk = 'critical'
      health.overall = 'critical'
    }

    // 检查任务状态
    const errorRate = parseFloat(this.calculateErrorRate())
    if (errorRate > 10) {
      health.components.tasks = 'warning'
      health.issues.push('任务错误率过高')
    }
    if (errorRate > 20) {
      health.components.tasks = 'critical'
      health.overall = 'critical'
    }

    return health
  }

  /**
   * 更新通知渠道配置
   */
  updateNotificationChannel(channelId, config) {
    const channel = this.notificationChannels.get(channelId)
    if (channel) {
      Object.assign(channel.config, config)
      return true
    }
    return false
  }

  /**
   * 启用/禁用通知渠道
   */
  toggleNotificationChannel(channelId, enabled) {
    const channel = this.notificationChannels.get(channelId)
    if (channel) {
      channel.enabled = enabled
      return true
    }
    return false
  }

  /**
   * 获取监控状态
   */
  getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      monitoredTasks: this.monitoringTasks.size,
      alertRules: this.alertRules.size,
      activeAlerts: this.alerts.filter(a => !a.resolved).length,
      systemHealth: this.getSystemHealth()
    }
  }
}

// 创建全局监控实例
const taskMonitor = new TaskMonitor()

// 导出监控实例
export default taskMonitor

// 导出监控类（用于测试和扩展）
export { TaskMonitor }