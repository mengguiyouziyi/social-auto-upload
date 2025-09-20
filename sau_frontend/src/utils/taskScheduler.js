/**
 * 任务调度引擎
 */

import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TaskTypes,
  TaskStatus,
  TaskPriority,
  ScheduleTypes,
  RetryPolicy,
  Platforms,
  getTaskTypeConfig,
  calculateNextRunTime,
  formatTaskDuration,
  validateTaskConfig
} from './taskTypes'

class TaskScheduler {
  constructor() {
    this.tasks = reactive([])
    this.runningTasks = reactive(new Map())
    this.taskHistory = reactive([])
    this.schedulers = new Map()
    this.eventHandlers = new Map()
    this.isRunning = false
    this.checkInterval = null
    this.maxConcurrentTasks = 3
  }

  /**
   * 初始化调度器
   */
  init() {
    if (this.isRunning) return

    this.isRunning = true
    this.checkInterval = setInterval(() => {
      this.checkAndExecuteTasks()
    }, 1000) // 每秒检查一次

    console.log('任务调度器已启动')
  }

  /**
   * 停止调度器
   */
  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    // 停止所有定时任务
    for (const [taskId, scheduler] of this.schedulers) {
      if (scheduler.interval) {
        clearInterval(scheduler.interval)
      }
    }
    this.schedulers.clear()

    console.log('任务调度器已停止')
  }

  /**
   * 添加任务
   */
  addTask(task) {
    // 验证任务配置
    const validation = validateTaskConfig(task)
    if (!validation.valid) {
      throw new Error(`任务配置无效: ${validation.errors.join(', ')}`)
    }

    // 生成任务ID
    const taskId = task.id || Date.now().toString()

    // 创建任务对象
    const newTask = {
      id: taskId,
      ...task,
      status: TaskStatus.PENDING,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: calculateNextRunTime(task),
      lastRunDuration: null,
      runCount: 0,
      errorCount: 0,
      progress: 0,
      dependencies: task.dependencies || [],
      retryPolicy: task.retryPolicy || RetryPolicy.FIXED,
      maxRetries: task.maxRetries || 3,
      retryInterval: task.retryInterval || 5,
      timeout: task.timeout || 30,
      config: task.config || {}
    }

    this.tasks.push(newTask)

    // 如果任务有定时计划，设置定时器
    if (task.schedule !== ScheduleTypes.IMMEDIATE) {
      this.setupTaskScheduler(newTask)
    }

    this.emit('taskAdded', newTask)
    return newTask
  }

  /**
   * 更新任务
   */
  updateTask(taskId, updates) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) {
      throw new Error(`任务不存在: ${taskId}`)
    }

    const task = this.tasks[taskIndex]
    const updatedTask = { ...task, ...updates }

    // 重新计算下次执行时间
    if (updates.schedule || updates.scheduleTime) {
      updatedTask.nextRun = calculateNextRunTime(updatedTask)
    }

    // 验证更新后的配置
    const validation = validateTaskConfig(updatedTask)
    if (!validation.valid) {
      throw new Error(`任务配置无效: ${validation.errors.join(', ')}`)
    }

    this.tasks[taskIndex] = updatedTask

    // 重新设置定时器
    if (updates.schedule || updates.scheduleTime) {
      this.removeTaskScheduler(taskId)
      if (updatedTask.schedule !== ScheduleTypes.IMMEDIATE) {
        this.setupTaskScheduler(updatedTask)
      }
    }

    this.emit('taskUpdated', updatedTask)
    return updatedTask
  }

  /**
   * 删除任务
   */
  deleteTask(taskId) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) {
      throw new Error(`任务不存在: ${taskId}`)
    }

    const task = this.tasks[taskIndex]

    // 如果任务正在运行，先停止
    if (task.status === TaskStatus.RUNNING) {
      this.stopTask(taskId)
    }

    // 移除定时器
    this.removeTaskScheduler(taskId)

    // 从任务列表中移除
    this.tasks.splice(taskIndex, 1)

    this.emit('taskDeleted', task)
    return true
  }

  /**
   * 立即执行任务
   */
  async executeTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`)
    }

    // 检查依赖任务
    if (task.dependencies && task.dependencies.length > 0) {
      const dependencyResults = await this.checkDependencies(task.dependencies)
      if (!dependencyResults.allCompleted) {
        throw new Error(`依赖任务未完成: ${dependencyResults.pending.join(', ')}`)
      }
    }

    // 检查并发限制
    if (this.runningTasks.size >= this.maxConcurrentTasks) {
      throw new Error('已达到最大并发任务数限制')
    }

    // 更新任务状态
    const taskIndex = this.tasks.findIndex(t => t.id === taskId)
    this.tasks[taskIndex].status = TaskStatus.RUNNING
    this.tasks[taskIndex].lastRun = new Date().toISOString()
    this.tasks[taskIndex].progress = 0

    // 创建执行记录
    const execution = {
      id: Date.now().toString(),
      taskId: taskId,
      startTime: new Date().toISOString(),
      endTime: null,
      status: TaskStatus.RUNNING,
      duration: null,
      result: null,
      error: null,
      logs: []
    }

    this.taskHistory.push(execution)
    this.runningTasks.set(taskId, execution)

    this.emit('taskStarted', { task, execution })

    try {
      // 执行任务
      const result = await this.runTask(task, execution)

      // 更新执行记录
      execution.endTime = new Date().toISOString()
      execution.duration = new Date(execution.endTime) - new Date(execution.startTime)
      execution.status = TaskStatus.COMPLETED
      execution.result = result

      // 更新任务状态
      this.tasks[taskIndex].status = TaskStatus.COMPLETED
      this.tasks[taskIndex].lastRunDuration = execution.duration
      this.tasks[taskIndex].runCount += 1
      this.tasks[taskIndex].progress = 100
      this.tasks[taskIndex].errorCount = 0

      // 计算下次执行时间
      this.tasks[taskIndex].nextRun = calculateNextRunTime(task)

      this.emit('taskCompleted', { task, execution, result })

      return result
    } catch (error) {
      // 更新执行记录
      execution.endTime = new Date().toISOString()
      execution.duration = new Date(execution.endTime) - new Date(execution.startTime)
      execution.status = TaskStatus.FAILED
      execution.error = error.message

      // 更新任务状态
      this.tasks[taskIndex].status = TaskStatus.FAILED
      this.tasks[taskIndex].lastRunDuration = execution.duration
      this.tasks[taskIndex].errorCount += 1

      // 重试逻辑
      if (this.shouldRetry(task)) {
        this.scheduleRetry(task)
      }

      this.emit('taskFailed', { task, execution, error })

      throw error
    } finally {
      // 清理运行状态
      this.runningTasks.delete(taskId)
    }
  }

  /**
   * 停止任务
   */
  stopTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`)
    }

    if (task.status !== TaskStatus.RUNNING) {
      throw new Error('任务未在运行中')
    }

    // 更新任务状态
    const taskIndex = this.tasks.findIndex(t => t.id === taskId)
    this.tasks[taskIndex].status = TaskStatus.PAUSED

    // 更新执行记录
    const execution = this.runningTasks.get(taskId)
    if (execution) {
      execution.endTime = new Date().toISOString()
      execution.duration = new Date(execution.endTime) - new Date(execution.startTime)
      execution.status = TaskStatus.CANCELLED
      execution.error = '任务被手动停止'

      this.runningTasks.delete(taskId)
    }

    this.emit('taskStopped', { task, execution })
  }

  /**
   * 暂停任务
   */
  pauseTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`)
    }

    if (task.status === TaskStatus.PAUSED) {
      return // 已经暂停
    }

    // 如果任务正在运行，先停止
    if (task.status === TaskStatus.RUNNING) {
      this.stopTask(taskId)
    }

    // 更新任务状态
    const taskIndex = this.tasks.findIndex(t => t.id === taskId)
    this.tasks[taskIndex].status = TaskStatus.PAUSED

    // 暂停定时器
    const scheduler = this.schedulers.get(taskId)
    if (scheduler) {
      scheduler.paused = true
    }

    this.emit('taskPaused', task)
  }

  /**
   * 恢复任务
   */
  resumeTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId)
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`)
    }

    if (task.status !== TaskStatus.PAUSED) {
      return // 未暂停
    }

    // 更新任务状态
    const taskIndex = this.tasks.findIndex(t => t.id === taskId)
    this.tasks[taskIndex].status = TaskStatus.PENDING

    // 恢复定时器
    const scheduler = this.schedulers.get(taskId)
    if (scheduler) {
      scheduler.paused = false
    }

    this.emit('taskResumed', task)
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId) {
    const task = this.tasks.find(t => t.id === taskId)
    return task ? task.status : null
  }

  /**
   * 获取任务执行历史
   */
  getTaskHistory(taskId, limit = 50) {
    return this.taskHistory
      .filter(h => h.taskId === taskId)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, limit)
  }

  /**
   * 获取系统统计
   */
  getSystemStats() {
    return {
      totalTasks: this.tasks.length,
      runningTasks: this.tasks.filter(t => t.status === TaskStatus.RUNNING).length,
      pendingTasks: this.tasks.filter(t => t.status === TaskStatus.PENDING).length,
      completedTasks: this.tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      failedTasks: this.tasks.filter(t => t.status === TaskStatus.FAILED).length,
      pausedTasks: this.tasks.filter(t => t.status === TaskStatus.PAUSED).length,
      totalExecutions: this.taskHistory.length,
      successRate: this.calculateSuccessRate(),
      averageExecutionTime: this.calculateAverageExecutionTime()
    }
  }

  /**
   * 设置任务定时器
   */
  setupTaskScheduler(task) {
    if (task.schedule === ScheduleTypes.IMMEDIATE) return

    const scheduler = {
      interval: null,
      paused: false,
      lastExecution: null
    }

    switch (task.schedule) {
      case ScheduleTypes.DAILY:
        scheduler.interval = setInterval(() => {
          if (!scheduler.paused && this.shouldExecuteTask(task)) {
            this.executeTask(task.id).catch(error => {
              console.error(`定时任务执行失败: ${task.id}`, error)
            })
          }
        }, 60000) // 每分钟检查一次
        break

      case ScheduleTypes.WEEKLY:
        scheduler.interval = setInterval(() => {
          if (!scheduler.paused && this.shouldExecuteTask(task)) {
            this.executeTask(task.id).catch(error => {
              console.error(`定时任务执行失败: ${task.id}`, error)
            })
          }
        }, 3600000) // 每小时检查一次
        break

      case ScheduleTypes.MONTHLY:
        scheduler.interval = setInterval(() => {
          if (!scheduler.paused && this.shouldExecuteTask(task)) {
            this.executeTask(task.id).catch(error => {
              console.error(`定时任务执行失败: ${task.id}`, error)
            })
          }
        }, 86400000) // 每天检查一次
        break

      case ScheduleTypes.CUSTOM:
        // 自定义Cron表达式处理
        scheduler.interval = setInterval(() => {
          if (!scheduler.paused && this.shouldExecuteTask(task)) {
            this.executeTask(task.id).catch(error => {
              console.error(`定时任务执行失败: ${task.id}`, error)
            })
          }
        }, 60000) // 每分钟检查一次
        break
    }

    this.schedulers.set(task.id, scheduler)
  }

  /**
   * 移除任务定时器
   */
  removeTaskScheduler(taskId) {
    const scheduler = this.schedulers.get(taskId)
    if (scheduler) {
      if (scheduler.interval) {
        clearInterval(scheduler.interval)
      }
      this.schedulers.delete(taskId)
    }
  }

  /**
   * 检查是否应该执行任务
   */
  shouldExecuteTask(task) {
    if (task.status !== TaskStatus.PENDING) return false

    const now = new Date()
    const nextRun = new Date(task.nextRun)

    // 检查是否到了执行时间
    if (now < nextRun) return false

    // 检查是否已经执行过
    const scheduler = this.schedulers.get(task.id)
    if (scheduler && scheduler.lastExecution) {
      const lastExecution = new Date(scheduler.lastExecution)
      const timeSinceLastExecution = now - lastExecution

      // 防止频繁执行
      if (timeSinceLastExecution < 60000) { // 1分钟内不重复执行
        return false
      }
    }

    return true
  }

  /**
   * 检查并执行任务
   */
  async checkAndExecuteTasks() {
    if (!this.isRunning) return

    const pendingTasks = this.tasks.filter(t => t.status === TaskStatus.PENDING)

    for (const task of pendingTasks) {
      if (this.runningTasks.size >= this.maxConcurrentTasks) {
        break // 达到并发限制
      }

      if (this.shouldExecuteTask(task)) {
        try {
          await this.executeTask(task.id)
        } catch (error) {
          console.error(`任务执行失败: ${task.id}`, error)
        }
      }
    }
  }

  /**
   * 运行具体任务
   */
  async runTask(task, execution) {
    const config = getTaskTypeConfig(task.type)
    if (!config) {
      throw new Error(`未知的任务类型: ${task.type}`)
    }

    this.addLog(execution, `开始执行任务: ${task.name}`)
    this.addLog(execution, `任务类型: ${config.name}`)
    this.addLog(execution, `目标平台: ${task.platforms.join(', ')}`)

    switch (task.type) {
      case TaskTypes.PUBLISH:
        return await this.runPublishTask(task, execution)
      case TaskTypes.ANALYSIS:
        return await this.runAnalysisTask(task, execution)
      case TaskTypes.MONITOR:
        return await this.runMonitorTask(task, execution)
      case TaskTypes.SYNC:
        return await this.runSyncTask(task, execution)
      case TaskTypes.MAINTENANCE:
        return await this.runMaintenanceTask(task, execution)
      default:
        throw new Error(`不支持的任务类型: ${task.type}`)
    }
  }

  /**
   * 运行发布任务
   */
  async runPublishTask(task, execution) {
    this.addLog(execution, '开始执行发布任务')

    // 模拟发布过程
    const results = []
    for (const platform of task.platforms) {
      this.addLog(execution, `正在发布到 ${platform}`)

      // 模拟发布延迟
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 模拟发布结果
      const result = {
        platform,
        success: Math.random() > 0.2, // 80% 成功率
        postId: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: `https://${platform}.com/post/${Date.now()}`
      }

      results.push(result)
      this.addLog(execution, `${platform} 发布${result.success ? '成功' : '失败'}`)

      // 更新进度
      const progress = ((results.length / task.platforms.length) * 100).toFixed(0)
      this.updateTaskProgress(task.id, parseInt(progress))
    }

    const successCount = results.filter(r => r.success).length
    const result = {
      totalPlatforms: task.platforms.length,
      successCount,
      failedCount: task.platforms.length - successCount,
      results
    }

    this.addLog(execution, `发布任务完成，成功: ${successCount}/${task.platforms.length}`)
    return result
  }

  /**
   * 运行分析任务
   */
  async runAnalysisTask(task, execution) {
    this.addLog(execution, '开始执行分析任务')

    // 模拟分析过程
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 模拟分析结果
    const result = {
      analysisDate: new Date().toISOString(),
      platforms: task.platforms,
      metrics: {
        totalPosts: Math.floor(Math.random() * 1000) + 100,
        totalEngagement: Math.floor(Math.random() * 50000) + 5000,
        avgEngagementRate: (Math.random() * 10 + 2).toFixed(2),
        topPerformingContent: []
      }
    }

    this.addLog(execution, '分析任务完成')
    return result
  }

  /**
   * 运行监控任务
   */
  async runMonitorTask(task, execution) {
    this.addLog(execution, '开始执行监控任务')

    // 模拟监控过程
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 模拟监控结果
    const result = {
      checkTime: new Date().toISOString(),
      platforms: task.platforms,
      alerts: [],
      metrics: {
        followers: Math.floor(Math.random() * 10000) + 1000,
        engagement: (Math.random() * 5 + 1).toFixed(2),
        health: 'good'
      }
    }

    // 随机生成告警
    if (Math.random() > 0.7) {
      result.alerts.push({
        type: 'engagement_drop',
        message: '互动率下降超过阈值',
        severity: 'warning'
      })
    }

    this.addLog(execution, `监控任务完成，发现 ${result.alerts.length} 个告警`)
    return result
  }

  /**
   * 运行同步任务
   */
  async runSyncTask(task, execution) {
    this.addLog(execution, '开始执行同步任务')

    // 模拟同步过程
    await new Promise(resolve => setTimeout(resolve, 8000))

    // 模拟同步结果
    const result = {
      syncTime: new Date().toISOString(),
      platforms: task.platforms,
      records: {
        synced: Math.floor(Math.random() * 500) + 100,
        failed: Math.floor(Math.random() * 10),
        duplicates: Math.floor(Math.random() * 20)
      }
    }

    this.addLog(execution, `同步任务完成，同步 ${result.records.synced} 条记录`)
    return result
  }

  /**
   * 运行维护任务
   */
  async runMaintenanceTask(task, execution) {
    this.addLog(execution, '开始执行维护任务')

    // 模拟维护过程
    await new Promise(resolve => setTimeout(resolve, 6000))

    // 模拟维护结果
    const result = {
      maintenanceTime: new Date().toISOString(),
      operations: [
        {
          type: 'cleanup',
          description: '清理临时文件',
          filesRemoved: Math.floor(Math.random() * 100) + 50,
          spaceFreed: `${(Math.random() * 100 + 50).toFixed(2)}MB`
        },
        {
          type: 'optimization',
          description: '数据库优化',
          tablesOptimized: Math.floor(Math.random() * 10) + 5
        }
      ]
    }

    this.addLog(execution, '维护任务完成')
    return result
  }

  /**
   * 检查任务依赖
   */
  async checkDependencies(dependencies) {
    const results = {
      allCompleted: true,
      pending: [],
      failed: []
    }

    for (const depId of dependencies) {
      const depTask = this.tasks.find(t => t.id === depId)
      if (!depTask) {
        results.pending.push(depId)
        results.allCompleted = false
        continue
      }

      if (depTask.status !== TaskStatus.COMPLETED) {
        if (depTask.status === TaskStatus.FAILED) {
          results.failed.push(depId)
        } else {
          results.pending.push(depId)
        }
        results.allCompleted = false
      }
    }

    return results
  }

  /**
   * 判断是否应该重试
   */
  shouldRetry(task) {
    if (task.retryPolicy === RetryPolicy.NONE) return false
    if (task.errorCount >= task.maxRetries) return false
    return true
  }

  /**
   * 安排重试
   */
  scheduleRetry(task) {
    const retryDelay = this.calculateRetryDelay(task)

    setTimeout(() => {
      if (task.status === TaskStatus.FAILED) {
        this.updateTask(task.id, {
          status: TaskStatus.PENDING,
          errorCount: task.errorCount + 1
        })
        this.emit('taskRetryScheduled', { task, retryDelay })
      }
    }, retryDelay)
  }

  /**
   * 计算重试延迟
   */
  calculateRetryDelay(task) {
    const baseDelay = task.retryInterval * 60000 // 转换为毫秒

    switch (task.retryPolicy) {
      case RetryPolicy.FIXED:
        return baseDelay
      case RetryPolicy.EXPONENTIAL:
        return baseDelay * Math.pow(2, task.errorCount)
      default:
        return baseDelay
    }
  }

  /**
   * 更新任务进度
   */
  updateTaskProgress(taskId, progress) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      this.tasks[taskIndex].progress = Math.min(100, Math.max(0, progress))
      this.emit('taskProgressUpdated', { taskId, progress })
    }
  }

  /**
   * 添加日志
   */
  addLog(execution, message) {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message
    }
    execution.logs.push(log)
    this.emit('taskLogAdded', { execution, log })
  }

  /**
   * 计算成功率
   */
  calculateSuccessRate() {
    const completed = this.taskHistory.filter(h => h.status === TaskStatus.COMPLETED)
    const failed = this.taskHistory.filter(h => h.status === TaskStatus.FAILED)
    const total = completed.length + failed.length

    if (total === 0) return 0
    return (completed.length / total * 100).toFixed(2)
  }

  /**
   * 计算平均执行时间
   */
  calculateAverageExecutionTime() {
    const completed = this.taskHistory.filter(h => h.status === TaskStatus.COMPLETED && h.duration)
    if (completed.length === 0) return 0

    const totalTime = completed.reduce((sum, h) => sum + h.duration, 0)
    return Math.round(totalTime / completed.length)
  }

  /**
   * 事件处理
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event).push(handler)
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event)
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
   * 获取任务列表
   */
  getTasks(filters = {}) {
    let filteredTasks = [...this.tasks]

    if (filters.status) {
      filteredTasks = filteredTasks.filter(t => t.status === filters.status)
    }

    if (filters.type) {
      filteredTasks = filteredTasks.filter(t => t.type === filters.type)
    }

    if (filters.platform) {
      filteredTasks = filteredTasks.filter(t => t.platforms.includes(filters.platform))
    }

    return filteredTasks
  }

  /**
   * 获取运行中的任务
   */
  getRunningTasks() {
    return Array.from(this.runningTasks.values())
  }
}

// 创建全局调度器实例
const taskScheduler = new TaskScheduler()

// 导出调度器实例
export default taskScheduler

// 导出调度器类（用于测试和扩展）
export { TaskScheduler }