/**
 * 任务调度系统集成示例
 * 整合所有任务调度相关模块
 */

import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import taskScheduler from './taskScheduler'
import taskHistoryManager from './taskHistory'
import taskDependencyManager from './taskDependencies'
import taskMonitor from './taskMonitor'
import {
  TaskTypes,
  TaskStatus,
  TaskPriority,
  ScheduleTypes,
  RetryPolicy,
  Platforms,
  getTaskTypeConfig,
  validateTaskConfig
} from './taskTypes'

class TaskSystemIntegration {
  constructor() {
    this.initialized = false
    this.eventBus = new Map()
    this.state = reactive({
      tasks: [],
      loading: false,
      error: null,
      stats: {
        total: 0,
        running: 0,
        pending: 0,
        completed: 0,
        failed: 0
      }
    })

    // 绑定事件处理器
    this.bindEventHandlers()
  }

  /**
   * 初始化系统
   */
  async initialize() {
    if (this.initialized) return

    try {
      this.state.loading = true
      this.state.error = null

      // 启动调度器
      taskScheduler.init()

      // 启动监控
      taskMonitor.startMonitoring()

      // 加载初始数据
      await this.loadInitialData()

      // 设置事件监听
      this.setupEventListeners()

      this.initialized = true
      ElMessage.success('任务调度系统初始化成功')

      this.emit('systemInitialized', { timestamp: Date.now() })
    } catch (error) {
      this.state.error = error.message
      ElMessage.error(`系统初始化失败: ${error.message}`)
      this.emit('systemError', { error, timestamp: Date.now() })
    } finally {
      this.state.loading = false
    }
  }

  /**
   * 销毁系统
   */
  destroy() {
    if (!this.initialized) return

    // 停止调度器
    taskScheduler.stop()

    // 停止监控
    taskMonitor.stopMonitoring()

    // 清理事件监听
    this.cleanupEventListeners()

    this.initialized = false
    console.log('任务调度系统已销毁')
  }

  /**
   * 加载初始数据
   */
  async loadInitialData() {
    try {
      // 这里可以从后端API加载任务数据
      // 现在使用模拟数据
      const mockTasks = [
        {
          id: '1',
          name: '每日内容发布任务',
          description: '自动发布优质内容到各平台',
          type: TaskTypes.PUBLISH,
          schedule: ScheduleTypes.DAILY,
          scheduleTime: '09:00',
          platforms: [Platforms.DOUYIN, Platforms.XIAOHONGSHU, Platforms.WECHAT],
          priority: TaskPriority.HIGH,
          config: {
            contentType: 'video',
            fileIds: ['1', '2', '3'],
            titleTemplate: '今日分享：{title}',
            descriptionTemplate: '精彩内容，不容错过！{hashtags}'
          },
          dependencies: [],
          retryPolicy: RetryPolicy.FIXED,
          maxRetries: 3,
          retryInterval: 5,
          timeout: 30
        },
        {
          id: '2',
          name: '周数据分析报告',
          description: '生成平台数据分析报告',
          type: TaskTypes.ANALYSIS,
          schedule: ScheduleTypes.WEEKLY,
          scheduleTime: '10:00',
          platforms: [Platforms.DOUYIN, Platforms.XIAOHONGSHU],
          priority: TaskPriority.MEDIUM,
          config: {
            analysisTypes: ['content', 'audience', 'performance'],
            dateRange: ['2024-01-01', '2024-01-07'],
            dataSources: ['api', 'database']
          },
          dependencies: ['1'],
          retryPolicy: RetryPolicy.EXPONENTIAL,
          maxRetries: 5,
          retryInterval: 10,
          timeout: 60
        }
      ]

      // 添加任务到调度器
      for (const taskData of mockTasks) {
        const task = taskScheduler.addTask(taskData)

        // 添加到监控
        taskMonitor.addMonitoringTask(task)

        // 设置依赖关系
        if (taskData.dependencies && taskData.dependencies.length > 0) {
          for (const depId of taskData.dependencies) {
            try {
              taskDependencyManager.addDependency(task.id, depId)
            } catch (error) {
              console.warn(`设置依赖关系失败: ${error.message}`)
            }
          }
        }
      }

      // 更新状态
      this.updateSystemState()

    } catch (error) {
      console.error('加载初始数据失败:', error)
      throw error
    }
  }

  /**
   * 更新系统状态
   */
  updateSystemState() {
    this.state.tasks = taskScheduler.getTasks()

    // 更新统计
    this.state.stats = {
      total: this.state.tasks.length,
      running: this.state.tasks.filter(t => t.status === TaskStatus.RUNNING).length,
      pending: this.state.tasks.filter(t => t.status === TaskStatus.PENDING).length,
      completed: this.state.tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      failed: this.state.tasks.filter(t => t.status === TaskStatus.FAILED).length
    }

    this.emit('stateUpdated', { state: this.state, timestamp: Date.now() })
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 调度器事件
    taskScheduler.on('taskAdded', (data) => {
      this.handleTaskAdded(data)
    })

    taskScheduler.on('taskUpdated', (data) => {
      this.handleTaskUpdated(data)
    })

    taskScheduler.on('taskStarted', (data) => {
      this.handleTaskStarted(data)
    })

    taskScheduler.on('taskCompleted', (data) => {
      this.handleTaskCompleted(data)
    })

    taskScheduler.on('taskFailed', (data) => {
      this.handleTaskFailed(data)
    })

    taskScheduler.on('taskStopped', (data) => {
      this.handleTaskStopped(data)
    })

    // 监控事件
    taskMonitor.on('alertTriggered', (data) => {
      this.handleAlertTriggered(data)
    })
  }

  /**
   * 清理事件监听
   */
  cleanupEventListeners() {
    // 这里可以清理事件监听器
  }

  /**
   * 绑定事件处理器
   */
  bindEventHandlers() {
    this.handleTaskAdded = this.handleTaskAdded.bind(this)
    this.handleTaskUpdated = this.handleTaskUpdated.bind(this)
    this.handleTaskStarted = this.handleTaskStarted.bind(this)
    this.handleTaskCompleted = this.handleTaskCompleted.bind(this)
    this.handleTaskFailed = this.handleTaskFailed.bind(this)
    this.handleTaskStopped = this.handleTaskStopped.bind(this)
    this.handleAlertTriggered = this.handleAlertTriggered.bind(this)
  }

  /**
   * 事件处理器
   */
  handleTaskAdded(data) {
    console.log('任务已添加:', data.task.name)
    this.updateSystemState()
    this.emit('taskAdded', data)
  }

  handleTaskUpdated(data) {
    console.log('任务已更新:', data.task.name)
    this.updateSystemState()
    this.emit('taskUpdated', data)
  }

  handleTaskStarted(data) {
    console.log('任务已启动:', data.task.name)

    // 添加历史记录
    taskHistoryManager.addHistoryRecord({
      taskId: data.task.id,
      taskName: data.task.name,
      taskType: data.task.type,
      startTime: data.execution.startTime,
      status: TaskStatus.RUNNING,
      metadata: {
        platforms: data.task.platforms
      }
    })

    this.updateSystemState()
    this.emit('taskStarted', data)
  }

  handleTaskCompleted(data) {
    console.log('任务已完成:', data.task.name)

    // 更新历史记录
    const execution = taskHistoryManager.getLatestExecution(data.task.id)
    if (execution) {
      taskHistoryManager.updateHistoryRecord(execution.id, {
        endTime: data.execution.endTime,
        status: TaskStatus.COMPLETED,
        duration: data.execution.duration,
        result: data.result
      })
    }

    this.updateSystemState()
    this.emit('taskCompleted', data)
  }

  handleTaskFailed(data) {
    console.error('任务执行失败:', data.task.name, data.error.message)

    // 更新历史记录
    const execution = taskHistoryManager.getLatestExecution(data.task.id)
    if (execution) {
      taskHistoryManager.updateHistoryRecord(execution.id, {
        endTime: data.execution.endTime,
        status: TaskStatus.FAILED,
        duration: data.execution.duration,
        error: data.error.message
      })
    }

    this.updateSystemState()
    this.emit('taskFailed', data)
  }

  handleTaskStopped(data) {
    console.log('任务已停止:', data.task.name)

    // 更新历史记录
    const execution = taskHistoryManager.getLatestExecution(data.task.id)
    if (execution) {
      taskHistoryManager.updateHistoryRecord(execution.id, {
        endTime: data.execution.endTime,
        status: TaskStatus.CANCELLED,
        error: '任务被手动停止'
      })
    }

    this.updateSystemState()
    this.emit('taskStopped', data)
  }

  handleAlertTriggered(data) {
    console.warn('告警触发:', data.alert.message)
    this.emit('alertTriggered', data)
  }

  /**
   * 创建任务
   */
  async createTask(taskData) {
    try {
      // 验证任务配置
      const validation = validateTaskConfig(taskData)
      if (!validation.valid) {
        throw new Error(`任务配置无效: ${validation.errors.join(', ')}`)
      }

      // 创建任务
      const task = taskScheduler.addTask(taskData)

      // 添加到监控
      taskMonitor.addMonitoringTask(task)

      // 设置依赖关系
      if (taskData.dependencies && taskData.dependencies.length > 0) {
        for (const depId of taskData.dependencies) {
          try {
            taskDependencyManager.addDependency(task.id, depId)
          } catch (error) {
            console.warn(`设置依赖关系失败: ${error.message}`)
          }
        }
      }

      ElMessage.success(`任务 "${task.name}" 创建成功`)
      this.updateSystemState()

      return task
    } catch (error) {
      ElMessage.error(`创建任务失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 更新任务
   */
  async updateTask(taskId, updates) {
    try {
      const task = taskScheduler.updateTask(taskId, updates)

      // 更新监控
      if (updates.name || updates.type) {
        taskMonitor.removeMonitoringTask(taskId)
        taskMonitor.addMonitoringTask(task)
      }

      // 更新依赖关系
      if (updates.dependencies !== undefined) {
        taskDependencyManager.setTaskDependencies(taskId, updates.dependencies || [])
      }

      ElMessage.success(`任务 "${task.name}" 更新成功`)
      this.updateSystemState()

      return task
    } catch (error) {
      ElMessage.error(`更新任务失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId) {
    try {
      const task = taskScheduler.getTasks().find(t => t.id === taskId)
      if (!task) {
        throw new Error('任务不存在')
      }

      // 删除任务
      taskScheduler.deleteTask(taskId)

      // 从监控中移除
      taskMonitor.removeMonitoringTask(taskId)

      // 清理依赖关系
      taskDependencyManager.clearTaskDependencies(taskId)

      ElMessage.success(`任务 "${task.name}" 删除成功`)
      this.updateSystemState()

      return true
    } catch (error) {
      ElMessage.error(`删除任务失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 执行任务
   */
  async executeTask(taskId) {
    try {
      const task = taskScheduler.getTasks().find(t => t.id === taskId)
      if (!task) {
        throw new Error('任务不存在')
      }

      const result = await taskScheduler.executeTask(taskId)
      ElMessage.success(`任务 "${task.name}" 执行成功`)

      return result
    } catch (error) {
      ElMessage.error(`执行任务失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 停止任务
   */
  async stopTask(taskId) {
    try {
      const task = taskScheduler.getTasks().find(t => t.id === taskId)
      if (!task) {
        throw new Error('任务不存在')
      }

      taskScheduler.stopTask(taskId)
      ElMessage.success(`任务 "${task.name}" 已停止`)

      this.updateSystemState()
      return true
    } catch (error) {
      ElMessage.error(`停止任务失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 批量操作
   */
  async batchExecuteTasks(taskIds) {
    const results = []
    const errors = []

    for (const taskId of taskIds) {
      try {
        const result = await this.executeTask(taskId)
        results.push({ taskId, success: true, result })
      } catch (error) {
        errors.push({ taskId, error: error.message })
        results.push({ taskId, success: false, error: error.message })
      }
    }

    if (results.length > 0) {
      const successCount = results.filter(r => r.success).length
      ElMessage.success(`批量执行完成：${successCount}/${results.length} 个任务执行成功`)
    }

    if (errors.length > 0) {
      ElMessage.warning(`${errors.length} 个任务执行失败`)
    }

    return { results, errors }
  }

  /**
   * 获取任务列表
   */
  getTasks(filters = {}) {
    return taskScheduler.getTasks(filters)
  }

  /**
   * 获取任务详情
   */
  getTaskDetail(taskId) {
    const task = taskScheduler.getTasks().find(t => t.id === taskId)
    if (!task) return null

    const history = taskHistoryManager.getTaskHistory(taskId)
    const dependencies = taskDependencyManager.getTaskDependencies(taskId)
    const dependents = taskDependencyManager.getTaskDependents(taskId)
    const canExecute = taskDependencyManager.canExecuteTask(taskId, new Map(
      taskScheduler.getTasks().map(t => [t.id, t.status])
    ))

    return {
      ...task,
      history,
      dependencies,
      dependents,
      canExecute,
      stats: taskHistoryManager.getStatistics(taskId)
    }
  }

  /**
   * 获取系统统计
   */
  getSystemStats() {
    return {
      tasks: this.state.stats,
      scheduler: taskScheduler.getSystemStats(),
      history: taskHistoryManager.getStatistics(),
      dependencies: taskDependencyManager.getDependencyStats(),
      monitoring: taskMonitor.getMonitoringStatus(),
      alerts: taskMonitor.getAlertStats()
    }
  }

  /**
   * 获取系统健康状态
   */
  getSystemHealth() {
    return {
      overall: 'healthy',
      scheduler: {
        isRunning: taskScheduler.isRunning,
        activeTasks: taskScheduler.getRunningTasks().length
      },
      monitoring: {
        isRunning: taskMonitor.isMonitoring,
        activeAlerts: taskMonitor.alerts.filter(a => !a.resolved).length
      },
      dependencies: {
        hasCircularDependencies: taskDependencyManager.hasCircularDependency(),
        totalDependencies: taskDependencyManager.dependencies.size
      },
      performance: {
        successRate: taskMonitor.calculateSuccessRate(),
        averageExecutionTime: taskMonitor.calculateAverageExecutionTime()
      }
    }
  }

  /**
   * 事件系统
   */
  on(event, handler) {
    if (!this.eventBus.has(event)) {
      this.eventBus.set(event, [])
    }
    this.eventBus.get(event).push(handler)
  }

  emit(event, data) {
    const handlers = this.eventBus.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`事件处理器错误: ${event}`, error)
        }
      })
    }
  }

  /**
   * 导出数据
   */
  exportData(format = 'json') {
    const data = {
      tasks: taskScheduler.getTasks(),
      history: taskHistoryManager.getHistoryRecords(),
      dependencies: Array.from(taskDependencyManager.dependencies.entries()),
      alerts: taskMonitor.alerts,
      stats: this.getSystemStats(),
      exportedAt: new Date().toISOString()
    }

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2)
      case 'csv':
        return this.exportToCsv(data)
      default:
        throw new Error(`不支持的导出格式: ${format}`)
    }
  }

  /**
   * 导出为CSV
   */
  exportToCsv(data) {
    // 简化的CSV导出
    const headers = ['任务ID', '任务名称', '类型', '状态', '创建时间', '最后执行时间']
    const rows = data.tasks.map(task => [
      task.id,
      task.name,
      task.type,
      task.status,
      task.createdAt,
      task.lastRun || ''
    ])

    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
  }
}

// 创建全局系统集成实例
const taskSystem = new TaskSystemIntegration()

// Vue组合式API钩子
export function useTaskSystem() {
  const systemState = computed(() => taskSystem.state)
  const systemStats = computed(() => taskSystem.getSystemStats())
  const systemHealth = computed(() => taskSystem.getSystemHealth())

  const initialize = async () => {
    await taskSystem.initialize()
  }

  const destroy = () => {
    taskSystem.destroy()
  }

  const createTask = async (taskData) => {
    return await taskSystem.createTask(taskData)
  }

  const updateTask = async (taskId, updates) => {
    return await taskSystem.updateTask(taskId, updates)
  }

  const deleteTask = async (taskId) => {
    return await taskSystem.deleteTask(taskId)
  }

  const executeTask = async (taskId) => {
    return await taskSystem.executeTask(taskId)
  }

  const stopTask = async (taskId) => {
    return await taskSystem.stopTask(taskId)
  }

  const batchExecuteTasks = async (taskIds) => {
    return await taskSystem.batchExecuteTasks(taskIds)
  }

  const getTasks = (filters = {}) => {
    return taskSystem.getTasks(filters)
  }

  const getTaskDetail = (taskId) => {
    return taskSystem.getTaskDetail(taskId)
  }

  const exportData = (format = 'json') => {
    return taskSystem.exportData(format)
  }

  return {
    systemState,
    systemStats,
    systemHealth,
    initialize,
    destroy,
    createTask,
    updateTask,
    deleteTask,
    executeTask,
    stopTask,
    batchExecuteTasks,
    getTasks,
    getTaskDetail,
    exportData
  }
}

// 导出系统集成实例
export default taskSystem

// 导出系统集成类（用于测试和扩展）
export { TaskSystemIntegration }