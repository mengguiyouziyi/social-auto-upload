/**
 * 任务类型定义和配置
 */

// 任务类型枚举
export const TaskTypes = {
  PUBLISH: 'publish',
  ANALYSIS: 'analysis',
  MONITOR: 'monitor',
  SYNC: 'sync',
  MAINTENANCE: 'maintenance'
}

// 任务状态枚举
export const TaskStatus = {
  RUNNING: 'running',
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled'
}

// 任务优先级枚举
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

// 任务执行计划类型
export const ScheduleTypes = {
  IMMEDIATE: 'immediate',
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom'
}

// 重试策略类型
export const RetryPolicy = {
  NONE: 'none',
  FIXED: 'fixed',
  EXPONENTIAL: 'exponential'
}

// 平台枚举
export const Platforms = {
  DOUYIN: 'douyin',
  XIAOHONGSHU: 'xiaohongshu',
  WECHAT: 'wechat',
  KUAISHOU: 'kuaishou',
  BILIBILI: 'bilibili',
  BAIJIA: 'baijia',
  TIKTOK: 'tiktok'
}

// 任务类型配置
export const TaskTypeConfig = {
  [TaskTypes.PUBLISH]: {
    name: '内容发布',
    icon: 'Upload',
    color: '#409eff',
    description: '自动发布内容到各平台',
    supportedPlatforms: [
      Platforms.DOUYIN,
      Platforms.XIAOHONGSHU,
      Platforms.WECHAT,
      Platforms.KUAISHOU,
      Platforms.BILIBILI,
      Platforms.BAIJIA,
      Platforms.TIKTOK
    ],
    configSchema: {
      contentType: {
        type: 'string',
        enum: ['video', 'image', 'text'],
        required: true,
        label: '内容类型'
      },
      fileIds: {
        type: 'array',
        items: { type: 'string' },
        required: true,
        label: '文件ID列表'
      },
      titleTemplate: {
        type: 'string',
        required: false,
        label: '标题模板',
        placeholder: '支持变量: {date}, {time}, {platform}'
      },
      descriptionTemplate: {
        type: 'string',
        required: false,
        label: '描述模板',
        placeholder: '支持变量: {date}, {time}, {platform}'
      },
      hashtags: {
        type: 'array',
        items: { type: 'string' },
        required: false,
        label: '话题标签'
      },
      publishTime: {
        type: 'string',
        required: false,
        label: '发布时间',
        format: 'HH:mm'
      }
    }
  },
  [TaskTypes.ANALYSIS]: {
    name: '数据分析',
    icon: 'DataAnalysis',
    color: '#67c23a',
    description: '生成平台数据分析报告',
    supportedPlatforms: [
      Platforms.DOUYIN,
      Platforms.XIAOHONGSHU,
      Platforms.WECHAT,
      Platforms.KUAISHOU,
      Platforms.BILIBILI
    ],
    configSchema: {
      analysisTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['content', 'audience', 'performance', 'competitor']
        },
        required: true,
        label: '分析类型'
      },
      dateRange: {
        type: 'array',
        items: { type: 'string' },
        required: true,
        label: '时间范围'
      },
      dataSources: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['api', 'database', 'file', 'third_party']
        },
        required: true,
        label: '数据源'
      },
      exportFormat: {
        type: 'string',
        enum: ['pdf', 'excel', 'json'],
        required: false,
        label: '导出格式'
      },
      emailNotification: {
        type: 'boolean',
        required: false,
        label: '邮件通知'
      }
    }
  },
  [TaskTypes.MONITOR]: {
    name: '账号监控',
    icon: 'Monitor',
    color: '#e6a23c',
    description: '监控账号状态和异常行为',
    supportedPlatforms: [
      Platforms.DOUYIN,
      Platforms.XIAOHONGSHU,
      Platforms.WECHAT,
      Platforms.KUAISHOU
    ],
    configSchema: {
      metrics: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['followers', 'likes', 'comments', 'shares', 'engagement']
        },
        required: true,
        label: '监控指标'
      },
      threshold: {
        type: 'number',
        required: true,
        label: '告警阈值',
        min: 0,
        max: 100
      },
      alertMethods: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['email', 'sms', 'notification', 'webhook']
        },
        required: true,
        label: '告警方式'
      },
      checkInterval: {
        type: 'number',
        required: false,
        label: '检查间隔(分钟)',
        min: 1,
        max: 1440
      },
      webhookUrl: {
        type: 'string',
        required: false,
        label: 'Webhook URL',
        format: 'uri'
      }
    }
  },
  [TaskTypes.SYNC]: {
    name: '数据同步',
    icon: 'Refresh',
    color: '#909399',
    description: '同步各平台数据到本地',
    supportedPlatforms: [
      Platforms.DOUYIN,
      Platforms.XIAOHONGSHU,
      Platforms.WECHAT,
      Platforms.KUAISHOU,
      Platforms.BILIBILI
    ],
    configSchema: {
      syncTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['posts', 'analytics', 'followers', 'comments']
        },
        required: true,
        label: '同步类型'
      },
      targetDatabase: {
        type: 'string',
        required: true,
        label: '目标数据库'
      },
      conflictResolution: {
        type: 'string',
        enum: ['overwrite', 'merge', 'skip'],
        required: false,
        label: '冲突解决策略'
      },
      incrementalSync: {
        type: 'boolean',
        required: false,
        label: '增量同步'
      },
      cleanupOld: {
        type: 'boolean',
        required: false,
        label: '清理旧数据'
      }
    }
  },
  [TaskTypes.MAINTENANCE]: {
    name: '系统维护',
    icon: 'Tools',
    color: '#f56c6c',
    description: '执行系统维护和清理任务',
    supportedPlatforms: ['system'],
    configSchema: {
      maintenanceType: {
        type: 'string',
        enum: ['cleanup', 'backup', 'update', 'optimize'],
        required: true,
        label: '维护类型'
      },
      targetPaths: {
        type: 'array',
        items: { type: 'string' },
        required: false,
        label: '目标路径'
      },
      retentionDays: {
        type: 'number',
        required: false,
        label: '保留天数',
        min: 1,
        max: 365
      },
      excludePatterns: {
        type: 'array',
        items: { type: 'string' },
        required: false,
        label: '排除模式'
      },
      sendReport: {
        type: 'boolean',
        required: false,
        label: '发送报告'
      }
    }
  }
}

// 平台配置
export const PlatformConfig = {
  [Platforms.DOUYIN]: {
    name: '抖音',
    icon: '🎵',
    color: '#fe2c55',
    description: '短视频平台'
  },
  [Platforms.XIAOHONGSHU]: {
    name: '小红书',
    icon: '📔',
    color: '#ff2442',
    description: '生活方式分享平台'
  },
  [Platforms.WECHAT]: {
    name: '微信视频号',
    icon: '💬',
    color: '#07c160',
    description: '微信短视频平台'
  },
  [Platforms.KUAISHOU]: {
    name: '快手',
    icon: '⚡',
    color: '#ff7700',
    description: '短视频平台'
  },
  [Platforms.BILIBILI]: {
    name: 'B站',
    icon: '📺',
    color: '#fb7299',
    description: '视频分享平台'
  },
  [Platforms.BAIJIA]: {
    name: '百家号',
    icon: '📰',
    color: '#4285f4',
    description: '内容创作平台'
  },
  [Platforms.TIKTOK]: {
    name: 'TikTok',
    icon: '🎭',
    color: '#000000',
    description: '国际短视频平台'
  }
}

// 任务验证规则
export const TaskValidationRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '任务名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择任务类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入任务描述', trigger: 'blur' }
  ],
  schedule: [
    { required: true, message: '请选择执行计划', trigger: 'change' }
  ],
  platforms: [
    { required: true, message: '请选择目标平台', trigger: 'change' },
    { type: 'array', min: 1, message: '至少选择一个平台', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  timeout: [
    { required: true, message: '请设置任务超时时间', trigger: 'blur' },
    { type: 'number', min: 1, max: 1440, message: '超时时间在 1 到 1440 分钟之间', trigger: 'blur' }
  ]
}

// 工具函数
export const getTaskTypeConfig = (type) => {
  return TaskTypeConfig[type] || null
}

export const getPlatformConfig = (platform) => {
  return PlatformConfig[platform] || null
}

export const validateTaskConfig = (task) => {
  const config = getTaskTypeConfig(task.type)
  if (!config) return { valid: false, errors: ['无效的任务类型'] }

  const errors = []

  // 验证平台
  if (task.platforms && task.platforms.length > 0) {
    const invalidPlatforms = task.platforms.filter(p => !config.supportedPlatforms.includes(p))
    if (invalidPlatforms.length > 0) {
      errors.push(`不支持的平台: ${invalidPlatforms.join(', ')}`)
    }
  }

  // 验证配置字段
  if (config.configSchema && task.config) {
    for (const [field, schema] of Object.entries(config.configSchema)) {
      if (schema.required && (task.config[field] === undefined || task.config[field] === null)) {
        errors.push(`缺少必填字段: ${schema.label}`)
        continue
      }

      if (task.config[field] !== undefined && task.config[field] !== null) {
        // 类型验证
        if (schema.type === 'array' && !Array.isArray(task.config[field])) {
          errors.push(`${schema.label} 必须是数组`)
        }

        if (schema.type === 'number' && typeof task.config[field] !== 'number') {
          errors.push(`${schema.label} 必须是数字`)
        }

        // 范围验证
        if (schema.min !== undefined && task.config[field] < schema.min) {
          errors.push(`${schema.label} 不能小于 ${schema.min}`)
        }

        if (schema.max !== undefined && task.config[field] > schema.max) {
          errors.push(`${schema.label} 不能大于 ${schema.max}`)
        }

        // 枚举验证
        if (schema.enum && !schema.enum.includes(task.config[field])) {
          errors.push(`${schema.label} 必须是: ${schema.enum.join(', ')}`)
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export const formatTaskDuration = (duration) => {
  if (!duration) return '-'
  if (duration < 1000) return `${duration}ms`
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
  return `${(duration / 60000).toFixed(1)}min`
}

export const calculateNextRunTime = (task) => {
  const now = new Date()

  switch (task.schedule) {
    case ScheduleTypes.IMMEDIATE:
      return now.toISOString()

    case ScheduleTypes.ONCE:
      return task.scheduleTime ? new Date(task.scheduleTime).toISOString() : now.toISOString()

    case ScheduleTypes.DAILY:
      const daily = new Date()
      if (task.scheduleTime) {
        const [hours, minutes] = task.scheduleTime.split(':')
        daily.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        if (daily <= now) {
          daily.setDate(daily.getDate() + 1)
        }
      }
      return daily.toISOString()

    case ScheduleTypes.WEEKLY:
      const weekly = new Date()
      if (task.scheduleTime) {
        const [hours, minutes] = task.scheduleTime.split(':')
        weekly.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        // 假设每周一执行
        weekly.setDate(weekly.getDate() + (1 - weekly.getDay() + 7) % 7)
        if (weekly <= now) {
          weekly.setDate(weekly.getDate() + 7)
        }
      }
      return weekly.toISOString()

    case ScheduleTypes.MONTHLY:
      const monthly = new Date()
      if (task.scheduleTime) {
        const [hours, minutes] = task.scheduleTime.split(':')
        monthly.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        monthly.setDate(1) // 每月1号
        if (monthly <= now) {
          monthly.setMonth(monthly.getMonth() + 1)
        }
      }
      return monthly.toISOString()

    default:
      return now.toISOString()
  }
}

export const getTaskStatusColor = (status) => {
  const colors = {
    [TaskStatus.RUNNING]: '#409eff',
    [TaskStatus.PENDING]: '#e6a23c',
    [TaskStatus.COMPLETED]: '#67c23a',
    [TaskStatus.FAILED]: '#f56c6c',
    [TaskStatus.PAUSED]: '#909399',
    [TaskStatus.CANCELLED]: '#f56c6c'
  }
  return colors[status] || '#909399'
}

export const getTaskPriorityColor = (priority) => {
  const colors = {
    [TaskPriority.LOW]: '#909399',
    [TaskPriority.MEDIUM]: '#e6a23c',
    [TaskPriority.HIGH]: '#f56c6c',
    [TaskPriority.URGENT]: '#ff0000'
  }
  return colors[priority] || '#909399'
}