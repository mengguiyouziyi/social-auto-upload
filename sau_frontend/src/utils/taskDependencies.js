/**
 * 任务依赖管理系统
 */

import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { TaskStatus } from './taskTypes'

class TaskDependencyManager {
  constructor() {
    this.dependencies = reactive(new Map()) // taskId -> Set of dependencyIds
    this.reverseDependencies = reactive(new Map()) // taskId -> Set of dependentIds
    this.dependencyGraph = reactive(new Map()) // 完整的依赖图
    this.circularDependencies = reactive(new Set()) // 循环依赖集合
    this.executionOrder = reactive([]) // 拓扑排序结果
  }

  /**
   * 添加任务依赖
   */
  addDependency(taskId, dependencyId) {
    if (taskId === dependencyId) {
      throw new Error('任务不能依赖自己')
    }

    // 初始化依赖关系
    if (!this.dependencies.has(taskId)) {
      this.dependencies.set(taskId, new Set())
    }
    if (!this.reverseDependencies.has(dependencyId)) {
      this.reverseDependencies.set(dependencyId, new Set())
    }

    // 添加依赖关系
    this.dependencies.get(taskId).add(dependencyId)
    this.reverseDependencies.get(dependencyId).add(taskId)

    // 更新依赖图
    this.updateDependencyGraph()

    // 检查循环依赖
    if (this.hasCircularDependency()) {
      // 如果发现循环依赖，移除刚才添加的依赖
      this.removeDependency(taskId, dependencyId)
      throw new Error('添加依赖会创建循环依赖')
    }

    // 更新执行顺序
    this.updateExecutionOrder()

    return true
  }

  /**
   * 移除任务依赖
   */
  removeDependency(taskId, dependencyId) {
    if (!this.dependencies.has(taskId)) return false

    const removed = this.dependencies.get(taskId).delete(dependencyId)
    if (removed) {
      this.reverseDependencies.get(dependencyId)?.delete(taskId)
      this.updateDependencyGraph()
      this.updateExecutionOrder()
    }

    return removed
  }

  /**
   * 设置任务的依赖列表
   */
  setTaskDependencies(taskId, dependencyIds) {
    // 清除现有依赖
    this.clearTaskDependencies(taskId)

    // 添加新依赖
    for (const dependencyId of dependencyIds) {
      try {
        this.addDependency(taskId, dependencyId)
      } catch (error) {
        // 回滚所有已添加的依赖
        this.clearTaskDependencies(taskId)
        throw error
      }
    }

    return true
  }

  /**
   * 清除任务的所有依赖
   */
  clearTaskDependencies(taskId) {
    if (!this.dependencies.has(taskId)) return

    const dependencies = Array.from(this.dependencies.get(taskId))
    for (const dependencyId of dependencies) {
      this.removeDependency(taskId, dependencyId)
    }
  }

  /**
   * 获取任务的直接依赖
   */
  getTaskDependencies(taskId) {
    return Array.from(this.dependencies.get(taskId) || [])
  }

  /**
   * 获取依赖当前任务的任务
   */
  getTaskDependents(taskId) {
    return Array.from(this.reverseDependencies.get(taskId) || [])
  }

  /**
   * 获取任务的所有依赖（包括间接依赖）
   */
  getAllDependencies(taskId) {
    const allDependencies = new Set()
    const visited = new Set()

    const traverse = (currentTaskId) => {
      if (visited.has(currentTaskId)) return
      visited.add(currentTaskId)

      const dependencies = this.dependencies.get(currentTaskId) || []
      for (const dependencyId of dependencies) {
        if (!allDependencies.has(dependencyId)) {
          allDependencies.add(dependencyId)
          traverse(dependencyId)
        }
      }
    }

    traverse(taskId)
    return Array.from(allDependencies)
  }

  /**
   * 获取所有依赖当前任务的任务（包括间接依赖）
   */
  getAllDependents(taskId) {
    const allDependents = new Set()
    const visited = new Set()

    const traverse = (currentTaskId) => {
      if (visited.has(currentTaskId)) return
      visited.add(currentTaskId)

      const dependents = this.reverseDependencies.get(currentTaskId) || []
      for (const dependentId of dependents) {
        if (!allDependents.has(dependentId)) {
          allDependents.add(dependentId)
          traverse(dependentId)
        }
      }
    }

    traverse(taskId)
    return Array.from(allDependents)
  }

  /**
   * 检查任务是否可以执行
   */
  canExecuteTask(taskId, taskStatuses) {
    const dependencies = this.getTaskDependencies(taskId)

    for (const dependencyId of dependencies) {
      const status = taskStatuses.get(dependencyId)
      if (status !== TaskStatus.COMPLETED) {
        return {
          canExecute: false,
          blockingDependencies: [dependencyId],
          reason: `依赖任务 ${dependencyId} 未完成`
        }
      }
    }

    return {
      canExecute: true,
      blockingDependencies: [],
      reason: null
    }
  }

  /**
   * 获取任务的执行状态
   */
  getTaskExecutionStatus(taskId, taskStatuses) {
    const dependencies = this.getTaskDependencies(taskId)
    const dependents = this.getTaskDependents(taskId)

    const completedDependencies = dependencies.filter(depId =>
      taskStatuses.get(depId) === TaskStatus.COMPLETED
    )

    const blockedDependents = dependents.filter(depId => {
      const depDependencies = this.getTaskDependencies(depId)
      return depDependencies.some(dId =>
        taskStatuses.get(dId) !== TaskStatus.COMPLETED && dId !== taskId
      )
    })

    return {
      taskId,
      dependencies,
      dependents,
      completedDependencies,
      pendingDependencies: dependencies.filter(depId =>
        taskStatuses.get(depId) !== TaskStatus.COMPLETED
      ),
      blockedDependents,
      isExecutable: completedDependencies.length === dependencies.length,
      dependencyProgress: dependencies.length > 0
        ? (completedDependencies.length / dependencies.length * 100).toFixed(2)
        : 100,
      status: taskStatuses.get(taskId)
    }
  }

  /**
   * 获取依赖链
   */
  getDependencyChain(taskId) {
    const chains = []
    const currentChain = []

    const traverse = (currentTaskId, visited = new Set()) => {
      if (visited.has(currentTaskId)) {
        // 发现循环
        chains.push([...currentChain, currentTaskId])
        return
      }

      visited.add(currentTaskId)
      currentChain.push(currentTaskId)

      const dependencies = this.dependencies.get(currentTaskId) || []
      for (const dependencyId of dependencies) {
        traverse(dependencyId, new Set(visited))
      }

      currentChain.pop()
    }

    traverse(taskId)

    return chains
  }

  /**
   * 检查循环依赖
   */
  hasCircularDependency() {
    const visited = new Set()
    const recursionStack = new Set()
    this.circularDependencies.clear()

    const hasCycle = (taskId) => {
      if (recursionStack.has(taskId)) {
        this.circularDependencies.add(taskId)
        return true
      }

      if (visited.has(taskId)) return false

      visited.add(taskId)
      recursionStack.add(taskId)

      const dependencies = this.dependencies.get(taskId) || []
      for (const dependencyId of dependencies) {
        if (hasCycle(dependencyId)) {
          return true
        }
      }

      recursionStack.delete(taskId)
      return false
    }

    // 检查所有任务
    for (const taskId of this.dependencies.keys()) {
      if (!visited.has(taskId) && hasCycle(taskId)) {
        return true
      }
    }

    return false
  }

  /**
   * 获取循环依赖
   */
  getCircularDependencies() {
    this.hasCircularDependency() // 重新检测循环依赖
    return Array.from(this.circularDependencies)
  }

  /**
   * 更新依赖图
   */
  updateDependencyGraph() {
    this.dependencyGraph.clear()

    for (const [taskId, dependencies] of this.dependencies) {
      this.dependencyGraph.set(taskId, new Set(dependencies))
    }
  }

  /**
   * 更新执行顺序（拓扑排序）
   */
  updateExecutionOrder() {
    const graph = new Map()
    const inDegree = new Map()

    // 构建图和入度表
    for (const [taskId, dependencies] of this.dependencies) {
      if (!graph.has(taskId)) {
        graph.set(taskId, [])
      }
      if (!inDegree.has(taskId)) {
        inDegree.set(taskId, 0)
      }

      for (const dependencyId of dependencies) {
        if (!graph.has(dependencyId)) {
          graph.set(dependencyId, [])
        }
        graph.get(dependencyId).push(taskId)
        inDegree.set(taskId, (inDegree.get(taskId) || 0) + 1)
        if (!inDegree.has(dependencyId)) {
          inDegree.set(dependencyId, 0)
        }
      }
    }

    // 添加没有依赖关系的任务
    for (const taskId of this.dependencies.keys()) {
      for (const dependencyId of this.dependencies.get(taskId)) {
        if (!inDegree.has(dependencyId)) {
          inDegree.set(dependencyId, 0)
        }
      }
    }

    // 拓扑排序
    const queue = []
    const result = []

    // 找到所有入度为0的节点
    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(taskId)
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()
      result.push(current)

      if (graph.has(current)) {
        for (const neighbor of graph.get(current)) {
          inDegree.set(neighbor, inDegree.get(neighbor) - 1)
          if (inDegree.get(neighbor) === 0) {
            queue.push(neighbor)
          }
        }
      }
    }

    this.executionOrder = result
  }

  /**
   * 获取执行顺序
   */
  getExecutionOrder() {
    return [...this.executionOrder]
  }

  /**
   * 获取可以执行的任务
   */
  getExecutableTasks(taskStatuses) {
    const executable = []

    for (const taskId of this.executionOrder) {
      const canExecute = this.canExecuteTask(taskId, taskStatuses)
      if (canExecute.canExecute && taskStatuses.get(taskId) === TaskStatus.PENDING) {
        executable.push(taskId)
      }
    }

    return executable
  }

  /**
   * 批量验证依赖关系
   */
  validateDependencies(taskDependencies) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      circularDependencies: [],
      missingTasks: []
    }

    // 临时添加依赖关系进行验证
    const originalDependencies = new Map(this.dependencies)
    const originalReverseDependencies = new Map(this.reverseDependencies)

    try {
      // 清除现有依赖
      this.dependencies.clear()
      this.reverseDependencies.clear()

      // 添加新的依赖关系
      for (const [taskId, dependencyIds] of Object.entries(taskDependencies)) {
        for (const dependencyId of dependencyIds) {
          if (taskId === dependencyId) {
            validation.warnings.push(`任务 ${taskId} 不能依赖自己`)
            continue
          }

          if (!this.dependencies.has(taskId)) {
            this.dependencies.set(taskId, new Set())
          }
          if (!this.reverseDependencies.has(dependencyId)) {
            this.reverseDependencies.set(dependencyId, new Set())
          }

          this.dependencies.get(taskId).add(dependencyId)
          this.reverseDependencies.get(dependencyId).add(taskId)
        }
      }

      // 检查循环依赖
      if (this.hasCircularDependency()) {
        validation.valid = false
        validation.circularDependencies = this.getCircularDependencies()
        validation.errors.push(`发现循环依赖: ${validation.circularDependencies.join(', ')}`)
      }

    } catch (error) {
      validation.valid = false
      validation.errors.push(error.message)
    } finally {
      // 恢复原始依赖关系
      this.dependencies.clear()
      this.reverseDependencies.clear()
      for (const [taskId, dependencyIds] of originalDependencies) {
        this.dependencies.set(taskId, new Set(dependencyIds))
      }
      for (const [taskId, dependentIds] of originalReverseDependencies) {
        this.reverseDependencies.set(taskId, new Set(dependentIds))
      }
    }

    return validation
  }

  /**
   * 获取依赖统计信息
   */
  getDependencyStats() {
    const stats = {
      totalTasks: this.dependencies.size,
      totalDependencies: 0,
      averageDependencies: 0,
      maxDependencies: 0,
      minDependencies: 0,
      tasksWithNoDependencies: 0,
      tasksWithMostDependencies: [],
      circularDependencies: this.getCircularDependencies().length,
      executionOrderLength: this.executionOrder.length
    }

    const dependencyCounts = []

    for (const [taskId, dependencies] of this.dependencies) {
      const count = dependencies.size
      dependencyCounts.push(count)
      stats.totalDependencies += count

      if (count === 0) {
        stats.tasksWithNoDependencies++
      }
    }

    if (dependencyCounts.length > 0) {
      stats.averageDependencies = (stats.totalDependencies / dependencyCounts.length).toFixed(2)
      stats.maxDependencies = Math.max(...dependencyCounts)
      stats.minDependencies = Math.min(...dependencyCounts)

      // 获取依赖最多的任务
      const maxCount = Math.max(...dependencyCounts)
      stats.tasksWithMostDependencies = Array.from(this.dependencies.entries())
        .filter(([taskId, deps]) => deps.size === maxCount)
        .map(([taskId, deps]) => ({ taskId, dependencyCount: deps.size }))
    }

    return stats
  }

  /**
   * 获取依赖可视化数据
   */
  getVisualizationData() {
    const nodes = []
    const edges = []

    // 收集所有节点
    const allTasks = new Set()
    for (const [taskId, dependencies] of this.dependencies) {
      allTasks.add(taskId)
      dependencies.forEach(depId => allTasks.add(depId))
    }

    // 创建节点
    for (const taskId of allTasks) {
      const isCircular = this.circularDependencies.has(taskId)
      const dependents = this.getTaskDependents(taskId)
      const dependencies = this.getTaskDependencies(taskId)

      nodes.push({
        id: taskId,
        label: `任务 ${taskId}`,
        type: isCircular ? 'circular' : 'normal',
        dependencies: dependencies.length,
        dependents: dependents.length
      })
    }

    // 创建边
    for (const [taskId, dependencies] of this.dependencies) {
      for (const dependencyId of dependencies) {
        edges.push({
          from: dependencyId,
          to: taskId,
          type: 'dependency'
        })
      }
    }

    return {
      nodes,
      edges,
      stats: this.getDependencyStats()
    }
  }

  /**
   * 查找影响路径
   */
  findImpactPath(taskId) {
    const impactPath = new Set()
    const visited = new Set()

    const findDependents = (currentTaskId) => {
      if (visited.has(currentTaskId)) return
      visited.add(currentTaskId)
      impactPath.add(currentTaskId)

      const dependents = this.reverseDependencies.get(currentTaskId) || []
      for (const dependentId of dependents) {
        findDependents(dependentId)
      }
    }

    findDependents(taskId)

    return Array.from(impactPath)
  }

  /**
   * 模拟任务执行
   */
  simulateExecution(taskStatuses, startTasks = []) {
    const simulation = {
      executionOrder: [],
      executedTasks: new Set(),
      failedTasks: new Set(),
      pendingTasks: new Set(),
      timeline: []
    }

    const executeTask = (taskId, depth = 0) => {
      if (simulation.executedTasks.has(taskId)) return

      // 检查依赖
      const dependencies = this.getTaskDependencies(taskId)
      for (const dependencyId of dependencies) {
        if (!simulation.executedTasks.has(dependencyId)) {
          executeTask(dependencyId, depth + 1)
        }
      }

      // 执行任务
      const status = taskStatuses.get(taskId)
      simulation.executionOrder.push(taskId)
      simulation.timeline.push({
        taskId,
        depth,
        status,
        timestamp: simulation.timeline.length
      })

      if (status === TaskStatus.COMPLETED) {
        simulation.executedTasks.add(taskId)
      } else if (status === TaskStatus.FAILED) {
        simulation.failedTasks.add(taskId)
      } else {
        simulation.pendingTasks.add(taskId)
      }
    }

    // 从指定的起始任务开始
    for (const taskId of startTasks) {
      executeTask(taskId)
    }

    // 执行所有可以执行的任务
    for (const taskId of this.executionOrder) {
      if (!simulation.executedTasks.has(taskId)) {
        executeTask(taskId)
      }
    }

    return simulation
  }

  /**
   * 清理无效的依赖关系
   */
  cleanup() {
    const removed = []

    // 清理空的依赖关系
    for (const [taskId, dependencies] of this.dependencies) {
      if (dependencies.size === 0) {
        this.dependencies.delete(taskId)
        removed.push(taskId)
      }
    }

    for (const [taskId, dependents] of this.reverseDependencies) {
      if (dependents.size === 0) {
        this.reverseDependencies.delete(taskId)
      }
    }

    this.updateDependencyGraph()
    this.updateExecutionOrder()

    return {
      removed,
      remaining: this.dependencies.size
    }
  }
}

// 创建全局依赖管理器实例
const taskDependencyManager = new TaskDependencyManager()

// 导出管理器实例
export default taskDependencyManager

// 导出管理器类（用于测试和扩展）
export { TaskDependencyManager }