<template>
  <div class="task-scheduler">
    <!-- 页面头部 -->
    <el-card class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">自动化任务调度</h1>
          <p class="page-description">管理和调度自动化任务，实现内容发布、数据分析等任务的自动化执行</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showCreateTaskDialog">
            <el-icon><Plus /></el-icon>
            创建任务
          </el-button>
          <el-button @click="refreshTasks">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon running">
              <el-icon><VideoPlay /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.running }}</div>
              <div class="stats-label">运行中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.pending }}</div>
              <div class="stats-label">待执行</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon completed">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.completed }}</div>
              <div class="stats-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon failed">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.failed }}</div>
              <div class="stats-label">失败</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务列表 -->
    <el-card class="task-list-card">
      <div class="task-list-header">
        <div class="filter-section">
          <el-input
            v-model="searchQuery"
            placeholder="搜索任务名称或描述"
            clearable
            style="width: 250px;"
            @input="filterTasks"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="statusFilter" placeholder="任务状态" clearable @change="filterTasks">
            <el-option label="运行中" value="running" />
            <el-option label="待执行" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
            <el-option label="暂停" value="paused" />
          </el-select>
          <el-select v-model="typeFilter" placeholder="任务类型" clearable @change="filterTasks">
            <el-option label="内容发布" value="publish" />
            <el-option label="数据分析" value="analysis" />
            <el-option label="账号监控" value="monitor" />
            <el-option label="数据同步" value="sync" />
            <el-option label="系统维护" value="maintenance" />
          </el-select>
        </div>
        <div class="action-section">
          <el-button @click="exportTasks">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button @click="showBatchActionDialog" :disabled="!selectedTasks.length">
            <el-icon><Operation /></el-icon>
            批量操作
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredTasks"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="任务名称" min-width="200">
          <template #default="{ row }">
            <div class="task-name-cell">
              <el-icon :class="['task-icon', `task-${row.type}`]">
                <component :is="getTaskIcon(row.type)" />
              </el-icon>
              <div class="task-info">
                <div class="task-name">{{ row.name }}</div>
                <div class="task-description">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTaskTypeTag(row.type)">{{ getTaskTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="schedule" label="执行计划" width="150">
          <template #default="{ row }">
            <div class="schedule-info">
              <div>{{ formatSchedule(row.schedule) }}</div>
              <div class="schedule-time">{{ row.scheduleTime }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastRun" label="最后执行" width="150">
          <template #default="{ row }">
            <div class="run-info">
              <div>{{ row.lastRun ? formatTime(row.lastRun) : '从未执行' }}</div>
              <div v-if="row.lastRunDuration" class="run-duration">
                耗时: {{ formatDuration(row.lastRunDuration) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="nextRun" label="下次执行" width="150">
          <template #default="{ row }">
            <div class="next-run-info">
              <div>{{ row.nextRun ? formatTime(row.nextRun) : '未安排' }}</div>
              <div v-if="row.nextRun" class="time-until">
                {{ getTimeUntil(row.nextRun) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                size="small"
                :type="row.status === 'running' ? 'danger' : 'success'"
                @click="toggleTask(row)"
              >
                <el-icon><component :is="row.status === 'running' ? 'VideoPause' : 'VideoPlay'" /></el-icon>
                {{ row.status === 'running' ? '暂停' : '启动' }}
              </el-button>
              <el-button size="small" @click="editTask(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" @click="viewTaskHistory(row)">
                <el-icon><Document /></el-icon>
                历史
              </el-button>
              <el-dropdown @command="(cmd) => handleTaskAction(cmd, row)">
                <el-button size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="run">立即执行</el-dropdown-item>
                    <el-dropdown-item command="clone">克隆任务</el-dropdown-item>
                    <el-dropdown-item command="logs">查看日志</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除任务</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalTasks"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑任务对话框 -->
    <el-dialog
      v-model="taskDialogVisible"
      :title="editingTask ? '编辑任务' : '创建任务'"
      width="800px"
      :before-close="handleTaskDialogClose"
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskRules"
        label-width="120px"
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务名称" prop="name">
              <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务类型" prop="type">
              <el-select v-model="taskForm.type" placeholder="请选择任务类型" style="width: 100%">
                <el-option label="内容发布" value="publish">
                  <div class="option-content">
                    <el-icon><Upload /></el-icon>
                    <span>内容发布</span>
                  </div>
                </el-option>
                <el-option label="数据分析" value="analysis">
                  <div class="option-content">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>数据分析</span>
                  </div>
                </el-option>
                <el-option label="账号监控" value="monitor">
                  <div class="option-content">
                    <el-icon><Monitor /></el-icon>
                    <span>账号监控</span>
                  </div>
                </el-option>
                <el-option label="数据同步" value="sync">
                  <div class="option-content">
                    <el-icon><Refresh /></el-icon>
                    <span>数据同步</span>
                  </div>
                </el-option>
                <el-option label="系统维护" value="maintenance">
                  <div class="option-content">
                    <el-icon><Tools /></el-icon>
                    <span>系统维护</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="执行计划" prop="schedule">
              <el-select v-model="taskForm.schedule" placeholder="请选择执行计划" style="width: 100%">
                <el-option label="立即执行" value="immediate" />
                <el-option label="单次执行" value="once" />
                <el-option label="每日执行" value="daily" />
                <el-option label="每周执行" value="weekly" />
                <el-option label="每月执行" value="monthly" />
                <el-option label="自定义Cron" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行时间" prop="scheduleTime">
              <el-time-picker
                v-model="taskForm.scheduleTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择执行时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="目标平台" prop="platforms">
              <el-select
                v-model="taskForm.platforms"
                multiple
                placeholder="请选择目标平台"
                style="width: 100%"
              >
                <el-option label="抖音" value="douyin" />
                <el-option label="小红书" value="xiaohongshu" />
                <el-option label="微信视频号" value="wechat" />
                <el-option label="快手" value="kuaishou" />
                <el-option label="B站" value="bilibili" />
                <el-option label="百家号" value="baijia" />
                <el-option label="TikTok" value="tiktok" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="taskForm.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="urgent" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="任务配置" prop="config">
          <el-card class="config-card">
            <template #header>
              <div class="config-header">
                <span>任务参数配置</span>
                <el-button size="small" @click="resetConfig">重置配置</el-button>
              </div>
            </template>
            <div class="config-content">
              <div v-if="taskForm.type === 'publish'" class="publish-config">
                <el-form-item label="内容类型">
                  <el-radio-group v-model="taskForm.config.contentType">
                    <el-radio label="video">视频</el-radio>
                    <el-radio label="image">图文</el-radio>
                    <el-radio label="text">纯文案</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="文件选择">
                  <el-select
                    v-model="taskForm.config.fileIds"
                    multiple
                    placeholder="请选择要发布的文件"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="file in availableFiles"
                      :key="file.id"
                      :label="file.filename"
                      :value="file.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="标题模板">
                  <el-input
                    v-model="taskForm.config.titleTemplate"
                    placeholder="支持变量: {date}, {time}, {platform}"
                  />
                </el-form-item>
                <el-form-item label="描述模板">
                  <el-input
                    v-model="taskForm.config.descriptionTemplate"
                    type="textarea"
                    :rows="2"
                    placeholder="支持变量: {date}, {time}, {platform}"
                  />
                </el-form-item>
              </div>

              <div v-if="taskForm.type === 'analysis'" class="analysis-config">
                <el-form-item label="分析类型">
                  <el-checkbox-group v-model="taskForm.config.analysisTypes">
                    <el-checkbox label="content">内容分析</el-checkbox>
                    <el-checkbox label="audience">受众分析</el-checkbox>
                    <el-checkbox label="performance">表现分析</el-checkbox>
                    <el-checkbox label="competitor">竞品分析</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="时间范围">
                  <el-date-picker
                    v-model="taskForm.config.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="数据源">
                  <el-select
                    v-model="taskForm.config.dataSources"
                    multiple
                    placeholder="请选择数据源"
                    style="width: 100%"
                  >
                    <el-option label="平台API" value="api" />
                    <el-option label="数据库" value="database" />
                    <el-option label="文件" value="file" />
                    <el-option label="第三方服务" value="third_party" />
                  </el-select>
                </el-form-item>
              </div>

              <div v-if="taskForm.type === 'monitor'" class="monitor-config">
                <el-form-item label="监控指标">
                  <el-checkbox-group v-model="taskForm.config.metrics">
                    <el-checkbox label="followers">粉丝数</el-checkbox>
                    <el-checkbox label="likes">点赞数</el-checkbox>
                    <el-checkbox label="comments">评论数</el-checkbox>
                    <el-checkbox label="shares">分享数</el-checkbox>
                    <el-checkbox label="engagement">互动率</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="告警阈值">
                  <el-input-number
                    v-model="taskForm.config.threshold"
                    :min="0"
                    :max="100"
                    placeholder="变化百分比"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="告警方式">
                  <el-select
                    v-model="taskForm.config.alertMethods"
                    multiple
                    placeholder="请选择告警方式"
                    style="width: 100%"
                  >
                    <el-option label="邮件" value="email" />
                    <el-option label="短信" value="sms" />
                    <el-option label="站内信" value="notification" />
                    <el-option label="Webhook" value="webhook" />
                  </el-select>
                </el-form-item>
              </div>
            </div>
          </el-card>
        </el-form-item>

        <el-form-item label="依赖任务" prop="dependencies">
          <el-select
            v-model="taskForm.dependencies"
            multiple
            placeholder="请选择依赖的任务（可选）"
            style="width: 100%"
          >
            <el-option
              v-for="task in availableTasks"
              :key="task.id"
              :label="task.name"
              :value="task.id"
              :disabled="task.id === editingTask?.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="重试策略" prop="retryPolicy">
          <el-radio-group v-model="taskForm.retryPolicy">
            <el-radio label="none">不重试</el-radio>
            <el-radio label="fixed">固定间隔</el-radio>
            <el-radio label="exponential">指数退避</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-row :gutter="20" v-if="taskForm.retryPolicy !== 'none'">
          <el-col :span="12">
            <el-form-item label="最大重试次数">
              <el-input-number
                v-model="taskForm.maxRetries"
                :min="1"
                :max="10"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重试间隔(分钟)">
              <el-input-number
                v-model="taskForm.retryInterval"
                :min="1"
                :max="1440"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="任务超时(分钟)" prop="timeout">
          <el-input-number
            v-model="taskForm.timeout"
            :min="1"
            :max="1440"
            placeholder="任务执行超时时间"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="taskDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTask" :loading="saving">
            {{ editingTask ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量操作对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量操作"
      width="500px"
    >
      <div class="batch-content">
        <div class="batch-info">
          <el-icon><Warning /></el-icon>
          <span>已选择 {{ selectedTasks.length }} 个任务</span>
        </div>
        <el-form label-width="100px">
          <el-form-item label="操作类型">
            <el-radio-group v-model="batchAction">
              <el-radio label="start">启动任务</el-radio>
              <el-radio label="stop">停止任务</el-radio>
              <el-radio label="delete">删除任务</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="执行方式">
            <el-radio-group v-model="batchExecuteMode">
              <el-radio label="immediate">立即执行</el-radio>
              <el-radio label="scheduled">定时执行</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="执行时间" v-if="batchExecuteMode === 'scheduled'">
            <el-date-picker
              v-model="batchExecuteTime"
              type="datetime"
              placeholder="选择执行时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="executeBatchAction">执行</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 任务历史记录对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="任务执行历史"
      width="1000px"
      :before-close="handleHistoryDialogClose"
    >
      <div class="history-content">
        <div class="history-header">
          <h3>{{ currentTask?.name }} - 执行历史</h3>
          <div class="history-actions">
            <el-button size="small" @click="refreshHistory">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button size="small" @click="exportHistory">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>

        <el-table :data="taskHistory" style="width: 100%">
          <el-table-column prop="startTime" label="开始时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="endTime" label="结束时间" width="180">
            <template #default="{ row }">
              {{ row.endTime ? formatTime(row.endTime) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.status)">{{ getStatusName(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="执行时长" width="120">
            <template #default="{ row }">
              {{ row.duration ? formatDuration(row.duration) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="result" label="执行结果">
            <template #default="{ row }">
              <div class="result-content">
                <div v-if="row.status === 'success'" class="success-result">
                  <el-icon><CircleCheck /></el-icon>
                  <span>执行成功</span>
                </div>
                <div v-if="row.status === 'failed'" class="failed-result">
                  <el-icon><CircleClose /></el-icon>
                  <span>{{ row.error || '执行失败' }}</span>
                </div>
                <div v-if="row.status === 'running'" class="running-result">
                  <el-icon><Loading /></el-icon>
                  <span>执行中...</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="viewTaskLogs(row)">查看日志</el-button>
              <el-button size="small" @click="rerunTask(row)">重新执行</el-button>
              </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="historyDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 任务日志对话框 -->
    <el-dialog
      v-model="logsDialogVisible"
      title="任务执行日志"
      width="800px"
      :before-close="handleLogsDialogClose"
    >
      <div class="logs-content">
        <div class="logs-header">
          <span>执行时间: {{ currentExecution?.startTime ? formatTime(currentExecution.startTime) : '-' }}</span>
          <el-button size="small" @click="copyLogs">复制日志</el-button>
        </div>
        <div class="logs-container">
          <pre class="task-logs">{{ taskLogs }}</pre>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="logsDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Refresh, VideoPlay, Clock, CircleCheck, CircleClose, Search, Download, Operation,
  Edit, Document, MoreFilled, VideoPause, DataAnalysis, Monitor, Upload, Tools,
  Warning, Loading
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const selectedTasks = ref([])
const taskDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const logsDialogVisible = ref(false)
const editingTask = ref(null)
const currentTask = ref(null)
const currentExecution = ref(null)
const taskLogs = ref('')
const batchAction = ref('start')
const batchExecuteMode = ref('immediate')
const batchExecuteTime = ref(null)

// 统计数据
const stats = reactive({
  running: 0,
  pending: 0,
  completed: 0,
  failed: 0
})

// 任务数据
const tasks = ref([])
const taskHistory = ref([])
const availableFiles = ref([])
const availableTasks = ref([])

// 任务表单
const taskFormRef = ref()
const taskForm = reactive({
  name: '',
  type: '',
  description: '',
  schedule: 'daily',
  scheduleTime: '09:00',
  platforms: [],
  priority: 'medium',
  config: {
    contentType: 'video',
    fileIds: [],
    titleTemplate: '',
    descriptionTemplate: '',
    analysisTypes: [],
    dateRange: [],
    dataSources: [],
    metrics: [],
    threshold: 10,
    alertMethods: []
  },
  dependencies: [],
  retryPolicy: 'fixed',
  maxRetries: 3,
  retryInterval: 5,
  timeout: 30
})

// 表单验证规则
const taskRules = {
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
  scheduleTime: [
    { required: true, message: '请选择执行时间', trigger: 'change' }
  ],
  platforms: [
    { required: true, message: '请选择目标平台', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  timeout: [
    { required: true, message: '请设置任务超时时间', trigger: 'blur' }
  ]
}

// 计算属性
const filteredTasks = computed(() => {
  let filtered = tasks.value

  if (searchQuery.value) {
    filtered = filtered.filter(task =>
      task.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(task => task.status === statusFilter.value)
  }

  if (typeFilter.value) {
    filtered = filtered.filter(task => task.type === typeFilter.value)
  }

  return filtered
})

const totalTasks = computed(() => filteredTasks.value.length)

// 工具函数
const getTaskIcon = (type) => {
  const icons = {
    publish: Upload,
    analysis: DataAnalysis,
    monitor: Monitor,
    sync: Refresh,
    maintenance: Tools
  }
  return icons[type] || Tools
}

const getTaskTypeTag = (type) => {
  const tags = {
    publish: 'primary',
    analysis: 'success',
    monitor: 'warning',
    sync: 'info',
    maintenance: 'danger'
  }
  return tags[type] || 'info'
}

const getTaskTypeName = (type) => {
  const names = {
    publish: '内容发布',
    analysis: '数据分析',
    monitor: '账号监控',
    sync: '数据同步',
    maintenance: '系统维护'
  }
  return names[type] || type
}

const getStatusTag = (status) => {
  const tags = {
    running: 'primary',
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    paused: 'info'
  }
  return tags[status] || 'info'
}

const getStatusName = (status) => {
  const names = {
    running: '运行中',
    pending: '待执行',
    completed: '已完成',
    failed: '失败',
    paused: '暂停'
  }
  return names[status] || status
}

const formatSchedule = (schedule) => {
  const schedules = {
    immediate: '立即执行',
    once: '单次执行',
    daily: '每日执行',
    weekly: '每周执行',
    monthly: '每月执行',
    custom: '自定义'
  }
  return schedules[schedule] || schedule
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

const formatDuration = (duration) => {
  if (!duration) return '-'
  if (duration < 1000) return `${duration}ms`
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
  return `${(duration / 60000).toFixed(1)}min`
}

const getTimeUntil = (nextRun) => {
  if (!nextRun) return '-'
  const now = new Date()
  const target = new Date(nextRun)
  const diff = target - now

  if (diff <= 0) return '已过期'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

// 事件处理函数
const handleSelectionChange = (selection) => {
  selectedTasks.value = selection
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const filterTasks = () => {
  currentPage.value = 1
}

const refreshTasks = async () => {
  loading.value = true
  try {
    await fetchTasks()
    await fetchStats()
    ElMessage.success('任务列表已刷新')
  } catch (error) {
    ElMessage.error('刷新任务列表失败')
  } finally {
    loading.value = false
  }
}

const showCreateTaskDialog = () => {
  editingTask.value = null
  resetTaskForm()
  taskDialogVisible.value = true
}

const editTask = (task) => {
  editingTask.value = task
  Object.assign(taskForm, task)
  taskDialogVisible.value = true
}

const handleTaskDialogClose = (done) => {
  ElMessageBox.confirm('确认关闭对话框？未保存的更改将丢失。', '提示', {
    type: 'warning'
  }).then(() => {
    done()
    resetTaskForm()
  }).catch(() => {})
}

const handleHistoryDialogClose = (done) => {
  done()
  currentTask.value = null
  taskHistory.value = []
}

const handleLogsDialogClose = (done) => {
  done()
  currentExecution.value = null
  taskLogs.value = ''
}

const resetTaskForm = () => {
  Object.assign(taskForm, {
    name: '',
    type: '',
    description: '',
    schedule: 'daily',
    scheduleTime: '09:00',
    platforms: [],
    priority: 'medium',
    config: {
      contentType: 'video',
      fileIds: [],
      titleTemplate: '',
      descriptionTemplate: '',
      analysisTypes: [],
      dateRange: [],
      dataSources: [],
      metrics: [],
      threshold: 10,
      alertMethods: []
    },
    dependencies: [],
    retryPolicy: 'fixed',
    maxRetries: 3,
    retryInterval: 5,
    timeout: 30
  })
}

const resetConfig = () => {
  taskForm.config = {
    contentType: 'video',
    fileIds: [],
    titleTemplate: '',
    descriptionTemplate: '',
    analysisTypes: [],
    dateRange: [],
    dataSources: [],
    metrics: [],
    threshold: 10,
    alertMethods: []
  }
}

const saveTask = async () => {
  if (!taskFormRef.value) return

  try {
    await taskFormRef.value.validate()
    saving.value = true

    const taskData = { ...taskForm }

    if (editingTask.value) {
      // 更新任务
      const index = tasks.value.findIndex(t => t.id === editingTask.value.id)
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...taskData }
      }
      ElMessage.success('任务更新成功')
    } else {
      // 创建新任务
      const newTask = {
        id: Date.now().toString(),
        ...taskData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: null,
        lastRunDuration: null,
        runCount: 0
      }
      tasks.value.unshift(newTask)
      ElMessage.success('任务创建成功')
    }

    taskDialogVisible.value = false
    resetTaskForm()
    await refreshStats()
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    saving.value = false
  }
}

const toggleTask = async (task) => {
  try {
    const newStatus = task.status === 'running' ? 'paused' : 'running'
    const index = tasks.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      tasks.value[index].status = newStatus
      await refreshStats()
      ElMessage.success(`任务已${newStatus === 'running' ? '启动' : '暂停'}`)
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleTaskAction = async (action, task) => {
  switch (action) {
    case 'run':
      await runTask(task)
      break
    case 'clone':
      await cloneTask(task)
      break
    case 'logs':
      await viewTaskLogs(task)
      break
    case 'delete':
      await deleteTask(task)
      break
  }
}

const runTask = async (task) => {
  try {
    ElMessage.success(`任务 "${task.name}" 已加入执行队列`)
    // 模拟任务执行
    setTimeout(() => {
      const index = tasks.value.findIndex(t => t.id === task.id)
      if (index !== -1) {
        tasks.value[index].lastRun = new Date().toISOString()
        tasks.value[index].lastRunDuration = Math.floor(Math.random() * 30000) + 10000
        tasks.value[index].runCount = (tasks.value[index].runCount || 0) + 1
      }
    }, 2000)
  } catch (error) {
    ElMessage.error('执行任务失败')
  }
}

const cloneTask = (task) => {
  editingTask.value = null
  Object.assign(taskForm, {
    ...task,
    name: `${task.name} (副本)`,
    status: 'pending'
  })
  taskDialogVisible.value = true
}

const deleteTask = async (task) => {
  try {
    await ElMessageBox.confirm(`确认删除任务 "${task.name}"？`, '删除任务', {
      type: 'warning'
    })

    const index = tasks.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
      await refreshStats()
      ElMessage.success('任务删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除任务失败')
    }
  }
}

const viewTaskHistory = async (task) => {
  currentTask.value = task
  await fetchTaskHistory(task.id)
  historyDialogVisible.value = true
}

const viewTaskLogs = async (execution) => {
  currentExecution.value = execution
  await fetchTaskLogs(execution.id)
  logsDialogVisible.value = true
}

const rerunTask = async (execution) => {
  try {
    ElMessage.success('任务已重新执行')
  } catch (error) {
    ElMessage.error('重新执行任务失败')
  }
}

const copyLogs = () => {
  if (taskLogs.value) {
    navigator.clipboard.writeText(taskLogs.value).then(() => {
      ElMessage.success('日志已复制到剪贴板')
    }).catch(() => {
      ElMessage.error('复制日志失败')
    })
  }
}

const showBatchActionDialog = () => {
  batchDialogVisible.value = true
}

const executeBatchAction = async () => {
  try {
    const actionNames = {
      start: '启动',
      stop: '停止',
      delete: '删除'
    }

    ElMessage.success(`批量${actionNames[batchAction.value]}操作已执行`)
    batchDialogVisible.value = false
    selectedTasks.value = []
    await refreshTasks()
  } catch (error) {
    ElMessage.error('批量操作执行失败')
  }
}

const exportTasks = () => {
  ElMessage.success('任务数据导出成功')
}

const exportHistory = () => {
  ElMessage.success('历史记录导出成功')
}

// 数据获取函数
const fetchTasks = async () => {
  try {
    // 模拟API调用
    tasks.value = [
      {
        id: '1',
        name: '每日内容发布任务',
        description: '自动发布优质内容到各平台',
        type: 'publish',
        schedule: 'daily',
        scheduleTime: '09:00',
        platforms: ['douyin', 'xiaohongshu', 'wechat'],
        priority: 'high',
        status: 'running',
        createdAt: '2024-01-01T00:00:00Z',
        lastRun: '2024-01-15T09:00:00Z',
        nextRun: '2024-01-16T09:00:00Z',
        lastRunDuration: 25000,
        runCount: 15,
        config: {
          contentType: 'video',
          fileIds: ['1', '2', '3'],
          titleTemplate: '今日分享：{title}',
          descriptionTemplate: '精彩内容，不容错过！{hashtags}'
        },
        dependencies: [],
        retryPolicy: 'fixed',
        maxRetries: 3,
        retryInterval: 5,
        timeout: 30
      },
      {
        id: '2',
        name: '周数据分析报告',
        description: '生成平台数据分析报告',
        type: 'analysis',
        schedule: 'weekly',
        scheduleTime: '10:00',
        platforms: ['douyin', 'xiaohongshu'],
        priority: 'medium',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        lastRun: '2024-01-08T10:00:00Z',
        nextRun: '2024-01-15T10:00:00Z',
        lastRunDuration: 120000,
        runCount: 2,
        config: {
          analysisTypes: ['content', 'audience', 'performance'],
          dateRange: ['2024-01-01', '2024-01-07'],
          dataSources: ['api', 'database']
        },
        dependencies: [],
        retryPolicy: 'exponential',
        maxRetries: 5,
        retryInterval: 10,
        timeout: 60
      },
      {
        id: '3',
        name: '账号健康监控',
        description: '监控账号状态和异常行为',
        type: 'monitor',
        schedule: 'daily',
        scheduleTime: '08:00',
        platforms: ['douyin', 'wechat', 'kuaishou'],
        priority: 'high',
        status: 'running',
        createdAt: '2024-01-01T00:00:00Z',
        lastRun: '2024-01-15T08:00:00Z',
        nextRun: '2024-01-16T08:00:00Z',
        lastRunDuration: 5000,
        runCount: 15,
        config: {
          metrics: ['followers', 'likes', 'comments', 'engagement'],
          threshold: 10,
          alertMethods: ['email', 'notification']
        },
        dependencies: [],
        retryPolicy: 'fixed',
        maxRetries: 3,
        retryInterval: 15,
        timeout: 15
      }
    ]

    // 更新可用任务列表
    availableTasks.value = tasks.value.filter(task =>
      task.status !== 'deleted' && task.id !== editingTask.value?.id
    )
  } catch (error) {
    console.error('获取任务列表失败:', error)
  }
}

const fetchStats = async () => {
  try {
    // 计算统计数据
    stats.running = tasks.value.filter(t => t.status === 'running').length
    stats.pending = tasks.value.filter(t => t.status === 'pending').length
    stats.completed = tasks.value.filter(t => t.status === 'completed').length
    stats.failed = tasks.value.filter(t => t.status === 'failed').length
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const fetchTaskHistory = async (taskId) => {
  try {
    // 模拟历史记录数据
    taskHistory.value = [
      {
        id: '1',
        taskId: taskId,
        startTime: '2024-01-15T09:00:00Z',
        endTime: '2024-01-15T09:00:25Z',
        status: 'success',
        duration: 25000,
        result: '成功发布到3个平台',
        error: null
      },
      {
        id: '2',
        taskId: taskId,
        startTime: '2024-01-14T09:00:00Z',
        endTime: '2024-01-14T09:00:18Z',
        status: 'success',
        duration: 18000,
        result: '成功发布到3个平台',
        error: null
      },
      {
        id: '3',
        taskId: taskId,
        startTime: '2024-01-13T09:00:00Z',
        endTime: '2024-01-13T09:00:45Z',
        status: 'failed',
        duration: 45000,
        result: '部分平台发布失败',
        error: '抖音平台API调用失败'
      }
    ]
  } catch (error) {
    console.error('获取任务历史失败:', error)
  }
}

const fetchTaskLogs = async (executionId) => {
  try {
    // 模拟日志数据
    taskLogs.value = `[2024-01-15 09:00:00] INFO: 任务开始执行
[2024-01-15 09:00:01] INFO: 初始化发布器
[2024-01-15 09:00:02] INFO: 连接抖音平台API
[2024-01-15 09:00:03] INFO: 上传视频文件
[2024-01-15 09:00:05] INFO: 设置发布参数
[2024-01-15 09:00:08] INFO: 抖音平台发布成功
[2024-01-15 09:00:09] INFO: 连接小红书平台API
[2024-01-15 09:00:10] INFO: 上传视频文件
[2024-01-15 09:00:12] INFO: 设置发布参数
[2024-01-15 09:00:15] INFO: 小红书平台发布成功
[2024-01-15 09:00:16] INFO: 连接微信视频号API
[2024-01-15 09:00:17] INFO: 上传视频文件
[2024-01-15 09:00:20] INFO: 设置发布参数
[2024-01-15 09:00:23] INFO: 微信视频号发布成功
[2024-01-15 09:00:24] INFO: 任务执行完成
[2024-01-15 09:00:25] INFO: 清理临时文件`
  } catch (error) {
    console.error('获取任务日志失败:', error)
  }
}

const refreshHistory = async () => {
  if (currentTask.value) {
    await fetchTaskHistory(currentTask.value.id)
  }
}

const refreshStats = async () => {
  await fetchStats()
}

// 模拟获取可用文件
const fetchAvailableFiles = async () => {
  try {
    availableFiles.value = [
      { id: '1', filename: '产品介绍视频.mp4', size: '25MB', type: 'video' },
      { id: '2', filename: '使用教程.mp4', size: '18MB', type: 'video' },
      { id: '3', filename: '品牌故事.mp4', size: '32MB', type: 'video' },
      { id: '4', filename: '活动海报.png', size: '2MB', type: 'image' },
      { id: '5', filename: '产品图片.jpg', size: '1.5MB', type: 'image' }
    ]
  } catch (error) {
    console.error('获取可用文件失败:', error)
  }
}

// 定时器
let statsRefreshInterval

// 生命周期
onMounted(async () => {
  await fetchTasks()
  await fetchStats()
  await fetchAvailableFiles()

  // 每30秒刷新统计数据
  statsRefreshInterval = setInterval(refreshStats, 30000)
})

onUnmounted(() => {
  if (statsRefreshInterval) {
    clearInterval(statsRefreshInterval)
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.task-scheduler {
  padding: 20px;
  background-color: $bg-color-page;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 20px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
      }

      .page-description {
        margin: 0;
        color: $text-secondary;
        font-size: 14px;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }
}

.stats-row {
  margin-bottom: 20px;

  .stats-card {
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: $box-shadow-light;
      transform: translateY(-2px);
    }

    .stats-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .stats-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;

        &.running {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.pending {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.completed {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.failed {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }
      }

      .stats-info {
        .stats-number {
          font-size: 28px;
          font-weight: 600;
          color: $text-primary;
          line-height: 1.2;
        }

        .stats-label {
          color: $text-secondary;
          font-size: 14px;
        }
      }
    }
  }
}

.task-list-card {
  .task-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .filter-section {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .action-section {
      display: flex;
      gap: 8px;
    }
  }

  .task-name-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .task-icon {
      font-size: 20px;

      &.task-publish {
        color: $primary-color;
      }

      &.task-analysis {
        color: $success-color;
      }

      &.task-monitor {
        color: $warning-color;
      }

      &.task-sync {
        color: $info-color;
      }

      &.task-maintenance {
        color: $danger-color;
      }
    }

    .task-info {
      .task-name {
        font-weight: 500;
        color: $text-primary;
        margin-bottom: 2px;
      }

      .task-description {
        color: $text-secondary;
        font-size: 12px;
      }
    }
  }

  .schedule-info {
    .schedule-time {
      font-size: 12px;
      color: $text-secondary;
      margin-top: 2px;
    }
  }

  .run-info {
    .run-duration {
      font-size: 12px;
      color: $text-secondary;
      margin-top: 2px;
    }
  }

  .next-run-info {
    .time-until {
      font-size: 12px;
      color: $success-color;
      margin-top: 2px;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.config-card {
  .config-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .config-content {
    .publish-config,
    .analysis-config,
    .monitor-config {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  }
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-content {
  .batch-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    padding: 12px;
    background-color: $bg-color-overlay;
    border-radius: 6px;
    color: $warning-color;

    .el-icon {
      font-size: 20px;
    }
  }
}

.history-content {
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      color: $text-primary;
    }

    .history-actions {
      display: flex;
      gap: 8px;
    }
  }

  .result-content {
    .success-result {
      display: flex;
      align-items: center;
      gap: 6px;
      color: $success-color;

      .el-icon {
        font-size: 16px;
      }
    }

    .failed-result {
      display: flex;
      align-items: center;
      gap: 6px;
      color: $danger-color;

      .el-icon {
        font-size: 16px;
      }
    }

    .running-result {
      display: flex;
      align-items: center;
      gap: 6px;
      color: $primary-color;

      .el-icon {
        font-size: 16px;
        animation: spin 1s linear infinite;
      }
    }
  }
}

.logs-content {
  .logs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background-color: $bg-color-overlay;
    border-radius: 6px;
  }

  .logs-container {
    .task-logs {
      background-color: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 6px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      line-height: 1.5;
      max-height: 400px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>