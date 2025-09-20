/**
 * 任务历史记录管理系统
 */

import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { TaskStatus, formatTaskDuration } from './taskTypes'

class TaskHistoryManager {
  constructor() {
    this.history = reactive([])
    this.filters = reactive({
      taskId: null,
      status: null,
      startDate: null,
      endDate: null,
      type: null,
      platform: null
    })
    this.sortBy = 'startTime'
    this sortOrder = 'desc'
    this.pageSize = 50
    this.currentPage = 1
    this.exportFormats = ['json', 'csv', 'excel']
  }

  /**
   * 添加历史记录
   */
  addHistoryRecord(record) {
    const historyRecord = {
      id: record.id || Date.now().toString(),
      taskId: record.taskId,
      taskName: record.taskName || '',
      taskType: record.taskType || '',
      startTime: record.startTime || new Date().toISOString(),
      endTime: record.endTime || null,
      status: record.status || TaskStatus.RUNNING,
      duration: record.duration || null,
      result: record.result || null,
      error: record.error || null,
      logs: record.logs || [],
      metadata: record.metadata || {},
      createdAt: new Date().toISOString()
    }

    this.history.unshift(historyRecord)

    // 限制历史记录数量
    if (this.history.length > 10000) {
      this.history = this.history.slice(0, 10000)
    }

    return historyRecord
  }

  /**
   * 更新历史记录
   */
  updateHistoryRecord(id, updates) {
    const index = this.history.findIndex(h => h.id === id)
    if (index === -1) {
      throw new Error(`历史记录不存在: ${id}`)
    }

    this.history[index] = {
      ...this.history[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return this.history[index]
  }

  /**
   * 获取历史记录
   */
  getHistoryRecords(options = {}) {
    let filtered = [...this.history]

    // 应用过滤器
    if (options.taskId) {
      filtered = filtered.filter(h => h.taskId === options.taskId)
    }

    if (options.status) {
      filtered = filtered.filter(h => h.status === options.status)
    }

    if (options.startDate) {
      const startDate = new Date(options.startDate)
      filtered = filtered.filter(h => new Date(h.startTime) >= startDate)
    }

    if (options.endDate) {
      const endDate = new Date(options.endDate)
      filtered = filtered.filter(h => new Date(h.startTime) <= endDate)
    }

    if (options.type) {
      filtered = filtered.filter(h => h.taskType === options.type)
    }

    if (options.platform) {
      filtered = filtered.filter(h =>
        h.metadata && h.metadata.platforms && h.metadata.platforms.includes(options.platform)
      )
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue = a[this.sortBy]
      let bValue = b[this.sortBy]

      if (this.sortBy === 'startTime' || this.sortBy === 'endTime') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // 分页
    const startIndex = (this.currentPage - 1) * this.pageSize
    const endIndex = startIndex + this.pageSize

    return {
      records: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      page: this.currentPage,
      pageSize: this.pageSize
    }
  }

  /**
   * 获取任务历史记录
   */
  getTaskHistory(taskId, limit = 50) {
    const taskHistory = this.history
      .filter(h => h.taskId === taskId)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))

    return limit ? taskHistory.slice(0, limit) : taskHistory
  }

  /**
   * 获取最新的执行记录
   */
  getLatestExecution(taskId) {
    return this.history
      .filter(h => h.taskId === taskId)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0]
  }

  /**
   * 获取统计信息
   */
  getStatistics(taskId = null, options = {}) {
    let records = this.history

    if (taskId) {
      records = records.filter(h => h.taskId === taskId)
    }

    if (options.startDate) {
      const startDate = new Date(options.startDate)
      records = records.filter(h => new Date(h.startTime) >= startDate)
    }

    if (options.endDate) {
      const endDate = new Date(options.endDate)
      records = records.filter(h => new Date(h.startTime) <= endDate)
    }

    const stats = {
      total: records.length,
      success: records.filter(h => h.status === TaskStatus.COMPLETED).length,
      failed: records.filter(h => h.status === TaskStatus.FAILED).length,
      running: records.filter(h => h.status === TaskStatus.RUNNING).length,
      cancelled: records.filter(h => h.status === TaskStatus.CANCELLED).length,
      averageDuration: 0,
      totalDuration: 0,
      errorRate: 0,
      successRate: 0,
      byType: {},
      byPlatform: {},
      byDay: {},
      byHour: {}
    }

    // 计算成功率和错误率
    if (stats.total > 0) {
      stats.successRate = ((stats.success / stats.total) * 100).toFixed(2)
      stats.errorRate = ((stats.failed / stats.total) * 100).toFixed(2)
    }

    // 计算平均执行时间
    const completedRecords = records.filter(h => h.status === TaskStatus.COMPLETED && h.duration)
    if (completedRecords.length > 0) {
      stats.totalDuration = completedRecords.reduce((sum, h) => sum + h.duration, 0)
      stats.averageDuration = Math.round(stats.totalDuration / completedRecords.length)
    }

    // 按类型统计
    records.forEach(record => {
      const type = record.taskType || 'unknown'
      if (!stats.byType[type]) {
        stats.byType[type] = { total: 0, success: 0, failed: 0 }
      }
      stats.byType[type].total++
      if (record.status === TaskStatus.COMPLETED) {
        stats.byType[type].success++
      } else if (record.status === TaskStatus.FAILED) {
        stats.byType[type].failed++
      }
    })

    // 按平台统计
    records.forEach(record => {
      const platforms = record.metadata?.platforms || []
      platforms.forEach(platform => {
        if (!stats.byPlatform[platform]) {
          stats.byPlatform[platform] = { total: 0, success: 0, failed: 0 }
        }
        stats.byPlatform[platform].total++
        if (record.status === TaskStatus.COMPLETED) {
          stats.byPlatform[platform].success++
        } else if (record.status === TaskStatus.FAILED) {
          stats.byPlatform[platform].failed++
        }
      })
    })

    // 按日期统计
    records.forEach(record => {
      const date = new Date(record.startTime).toISOString().split('T')[0]
      if (!stats.byDay[date]) {
        stats.byDay[date] = { total: 0, success: 0, failed: 0 }
      }
      stats.byDay[date].total++
      if (record.status === TaskStatus.COMPLETED) {
        stats.byDay[date].success++
      } else if (record.status === TaskStatus.FAILED) {
        stats.byDay[date].failed++
      }
    })

    // 按小时统计
    records.forEach(record => {
      const hour = new Date(record.startTime).getHours()
      if (!stats.byHour[hour]) {
        stats.byHour[hour] = { total: 0, success: 0, failed: 0 }
      }
      stats.byHour[hour].total++
      if (record.status === TaskStatus.COMPLETED) {
        stats.byHour[hour].success++
      } else if (record.status === TaskStatus.FAILED) {
        stats.byHour[hour].failed++
      }
    })

    return stats
  }

  /**
   * 获取趋势数据
   */
  getTrendData(taskId = null, days = 7) {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000)

    const records = this.history.filter(h => {
      if (taskId && h.taskId !== taskId) return false
      const recordDate = new Date(h.startTime)
      return recordDate >= startDate && recordDate <= endDate
    })

    const trendData = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      const dayRecords = records.filter(h =>
        new Date(h.startTime).toISOString().split('T')[0] === dateStr
      )

      trendData.push({
        date: dateStr,
        total: dayRecords.length,
        success: dayRecords.filter(h => h.status === TaskStatus.COMPLETED).length,
        failed: dayRecords.filter(h => h.status === TaskStatus.FAILED).length,
        averageDuration: dayRecords.filter(h => h.duration).length > 0
          ? Math.round(dayRecords.filter(h => h.duration).reduce((sum, h) => sum + h.duration, 0) / dayRecords.filter(h => h.duration).length)
          : 0
      })
    }

    return trendData
  }

  /**
   * 清理历史记录
   */
  cleanupHistory(olderThanDays = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const beforeCount = this.history.length
    this.history = this.history.filter(h => new Date(h.startTime) >= cutoffDate)
    const afterCount = this.history.length

    return {
      removed: beforeCount - afterCount,
      remaining: afterCount
    }
  }

  /**
   * 导出历史记录
   */
  exportHistory(format = 'json', options = {}) {
    const records = this.getHistoryRecords(options).records

    switch (format) {
      case 'json':
        return this.exportToJson(records)
      case 'csv':
        return this.exportToCsv(records)
      case 'excel':
        return this.exportToExcel(records)
      default:
        throw new Error(`不支持的导出格式: ${format}`)
    }
  }

  /**
   * 导出为JSON
   */
  exportToJson(records) {
    return JSON.stringify(records, null, 2)
  }

  /**
   * 导出为CSV
   */
  exportToCsv(records) {
    const headers = [
      'ID', '任务ID', '任务名称', '任务类型', '开始时间', '结束时间',
      '状态', '执行时长', '结果', '错误信息'
    ]

    const rows = records.map(record => [
      record.id,
      record.taskId,
      record.taskName,
      record.taskType,
      record.startTime,
      record.endTime || '',
      record.status,
      record.duration ? formatTaskDuration(record.duration) : '',
      JSON.stringify(record.result || ''),
      record.error || ''
    ])

    return this.convertToCsv(headers, rows)
  }

  /**
   * 导出为Excel
   */
  exportToExcel(records) {
    // 这里应该使用Excel库，现在返回CSV格式
    return this.exportToCsv(records)
  }

  /**
   * 转换为CSV格式
   */
  convertToCsv(headers, rows) {
    const csvHeaders = headers.map(h => `"${h}"`).join(',')
    const csvRows = rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    return [csvHeaders, ...csvRows].join('\n')
  }

  /**
   * 搜索历史记录
   */
  searchHistory(query, options = {}) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)

    let results = this.history.filter(record => {
      const searchText = [
        record.taskName,
        record.taskType,
        record.error,
        JSON.stringify(record.result),
        record.logs.map(log => log.message).join(' ')
      ].join(' ').toLowerCase()

      return searchTerms.every(term => searchText.includes(term))
    })

    // 应用其他过滤器
    if (options.taskId) {
      results = results.filter(h => h.taskId === options.taskId)
    }

    if (options.status) {
      results = results.filter(h => h.status === options.status)
    }

    if (options.startDate) {
      const startDate = new Date(options.startDate)
      results = results.filter(h => new Date(h.startTime) >= startDate)
    }

    if (options.endDate) {
      const endDate = new Date(options.endDate)
      results = results.filter(h => new Date(h.startTime) <= endDate)
    }

    return {
      results,
      total: results.length,
      query
    }
  }

  /**
   * 获取错误统计
   */
  getErrorStatistics(taskId = null, days = 7) {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    const errorRecords = this.history.filter(h => {
      if (h.status !== TaskStatus.FAILED) return false
      if (taskId && h.taskId !== taskId) return false
      const recordDate = new Date(h.startTime)
      return recordDate >= startDate && recordDate <= endDate
    })

    const errorStats = {
      total: errorRecords.length,
      byErrorType: {},
      byTask: {},
      byDay: {},
      commonErrors: []
    }

    // 按错误类型统计
    errorRecords.forEach(record => {
      const errorType = this.categorizeError(record.error)
      if (!errorStats.byErrorType[errorType]) {
        errorStats.byErrorType[errorType] = 0
      }
      errorStats.byErrorType[errorType]++
    })

    // 按任务统计
    errorRecords.forEach(record => {
      if (!errorStats.byTask[record.taskId]) {
        errorStats.byTask[record.taskId] = {
          taskName: record.taskName,
          count: 0
        }
      }
      errorStats.byTask[record.taskId].count++
    })

    // 按日期统计
    errorRecords.forEach(record => {
      const date = new Date(record.startTime).toISOString().split('T')[0]
      if (!errorStats.byDay[date]) {
        errorStats.byDay[date] = 0
      }
      errorStats.byDay[date]++
    })

    // 获取常见错误
    const errorCounts = Object.entries(errorStats.byErrorType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)

    errorStats.commonErrors = errorCounts.map(([error, count]) => ({
      error,
      count,
      percentage: ((count / errorStats.total) * 100).toFixed(2)
    }))

    return errorStats
  }

  /**
   * 错误分类
   */
  categorizeError(error) {
    if (!error) return '未知错误'

    const errorLower = error.toLowerCase()

    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return '网络错误'
    } else if (errorLower.includes('timeout')) {
      return '超时错误'
    } else if (errorLower.includes('auth') || errorLower.includes('unauthorized')) {
      return '认证错误'
    } else if (errorLower.includes('permission') || errorLower.includes('forbidden')) {
      return '权限错误'
    } else if (errorLower.includes('not found')) {
      return '资源不存在'
    } else if (errorLower.includes('invalid') || errorLower.includes('validation')) {
      return '验证错误'
    } else if (errorLower.includes('database') || errorLower.includes('sql')) {
      return '数据库错误'
    } else if (errorLower.includes('memory') || errorLower.includes('out of memory')) {
      return '内存错误'
    } else if (errorLower.includes('disk') || errorLower.includes('storage')) {
      return '存储错误'
    } else {
      return '其他错误'
    }
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(taskId = null, days = 7) {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    const records = this.history.filter(h => {
      if (taskId && h.taskId !== taskId) return false
      if (h.status !== TaskStatus.COMPLETED) return false
      if (!h.duration) return false
      const recordDate = new Date(h.startTime)
      return recordDate >= startDate && recordDate <= endDate
    })

    const durations = records.map(h => h.duration)

    if (durations.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        percentile95: 0,
        trend: []
      }
    }

    durations.sort((a, b) => a - b)

    const metrics = {
      count: durations.length,
      average: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length),
      min: durations[0],
      max: durations[durations.length - 1],
      percentile95: durations[Math.floor(durations.length * 0.95)],
      trend: []
    }

    // 计算趋势
    const trendByDay = {}
    records.forEach(record => {
      const day = new Date(record.startTime).toISOString().split('T')[0]
      if (!trendByDay[day]) {
        trendByDay[day] = []
      }
      trendByDay[day].push(record.duration)
    })

    Object.keys(trendByDay).sort().forEach(day => {
      const dayDurations = trendByDay[day]
      metrics.trend.push({
        date: day,
        average: Math.round(dayDurations.reduce((sum, d) => sum + d, 0) / dayDurations.length),
        min: Math.min(...dayDurations),
        max: Math.max(...dayDurations)
      })
    })

    return metrics
  }

  /**
   * 设置过滤器
   */
  setFilters(filters) {
    Object.assign(this.filters, filters)
  }

  /**
   * 设置排序
   */
  setSort(sortBy, sortOrder = 'desc') {
    this.sortBy = sortBy
    this.sortOrder = sortOrder
  }

  /**
   * 设置分页
   */
  setPagination(page, pageSize) {
    this.currentPage = page
    this.pageSize = pageSize
  }
}

// 创建全局历史记录管理器实例
const taskHistoryManager = new TaskHistoryManager()

// 导出管理器实例
export default taskHistoryManager

// 导出管理器类（用于测试和扩展）
export { TaskHistoryManager }