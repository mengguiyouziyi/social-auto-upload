<template>
  <div class="user-management">
    <!-- 头部操作区 -->
    <div class="management-header">
      <div class="header-left">
        <h2>用户权限管理</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">工作台</el-breadcrumb-item>
          <el-breadcrumb-item>用户权限管理</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="addNewUser">
          <el-icon><Plus /></el-icon>添加用户
        </el-button>
        <el-button @click="importUsers">
          <el-icon><Upload /></el-icon>批量导入
        </el-button>
      </div>
    </div>

    <!-- 权限统计概览 -->
    <div class="permission-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon users-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ permissionStats.totalUsers }}</div>
                <div class="metric-label">总用户数</div>
                <div class="metric-trend">
                  <span class="trend-up">+12</span>
                  本月新增
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon roles-icon">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ permissionStats.totalRoles }}</div>
                <div class="metric-label">角色数量</div>
                <div class="metric-trend">
                  <span class="trend-up">+3</span>
                  新增角色
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon permissions-icon">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ permissionStats.totalPermissions }}</div>
                <div class="metric-label">权限规则</div>
                <div class="metric-trend">
                  <span class="trend-up">+8</span>
                  新增规则
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon security-icon">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ permissionStats.securityScore }}%</div>
                <div class="metric-label">安全评分</div>
                <div class="metric-trend">
                  <span class="trend-up">+2.5</span>
                  提升安全
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区 -->
    <div class="management-content">
      <el-row :gutter="20">
        <!-- 左侧用户列表 -->
        <el-col :span="16">
          <!-- 用户管理 -->
          <el-card class="users-card">
            <template #header>
              <div class="card-header">
                <h3>用户管理</h3>
                <div class="header-actions">
                  <el-input
                    v-model="userSearch"
                    placeholder="搜索用户..."
                    style="width: 200px"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-select v-model="roleFilter" placeholder="角色筛选" clearable>
                    <el-option label="全部角色" value="" />
                    <el-option label="管理员" value="admin" />
                    <el-option label="编辑" value="editor" />
                    <el-option label="作者" value="author" />
                    <el-option label="访客" value="guest" />
                  </el-select>
                </div>
              </div>
            </template>

            <div class="users-table">
              <el-table :data="filteredUsers" style="width: 100%">
                <el-table-column prop="username" label="用户名" width="150">
                  <template #default="scope">
                    <div class="user-cell">
                      <div class="user-avatar">
                        <img :src="scope.row.avatar" :alt="scope.row.username">
                      </div>
                      <div class="user-info">
                        <div class="username">{{ scope.row.username }}</div>
                        <div class="user-email">{{ scope.row.email }}</div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="role" label="角色" width="120">
                  <template #default="scope">
                    <el-tag :type="getRoleTagType(scope.row.role)">
                      {{ getRoleName(scope.row.role) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="department" label="部门" width="120" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                      {{ scope.row.status === 'active' ? '活跃' : '禁用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="lastLogin" label="最后登录" width="150" />
                <el-table-column label="操作" width="200">
                  <template #default="scope">
                    <el-button size="small" @click="editUser(scope.row)">
                      编辑
                    </el-button>
                    <el-button size="small" @click="managePermissions(scope.row)">
                      权限
                    </el-button>
                    <el-dropdown @command="(cmd) => handleUserCommand(cmd, scope.row)">
                      <el-button size="small">
                        更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="reset">重置密码</el-dropdown-item>
                          <el-dropdown-item command="disable" v-if="scope.row.status === 'active'">禁用用户</el-dropdown-item>
                          <el-dropdown-item command="enable" v-if="scope.row.status === 'disabled'">启用用户</el-dropdown-item>
                          <el-dropdown-item command="delete" divided>删除用户</el-dropdown-item>
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
                :total="filteredUsers.length"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
              />
            </div>
          </el-card>

          <!-- 权限规则管理 -->
          <el-card class="permissions-card">
            <template #header>
              <div class="card-header">
                <h3>权限规则管理</h3>
                <el-button type="primary" size="small" @click="addNewPermission">
                  <el-icon><Plus /></el-icon>添加规则
                </el-button>
              </div>
            </template>

            <div class="permissions-grid">
              <div
                v-for="permission in permissions"
                :key="permission.id"
                class="permission-item"
              >
                <div class="permission-header">
                  <div class="permission-icon">
                    <el-icon>
                      <component :is="permission.icon" />
                    </el-icon>
                  </div>
                  <div class="permission-info">
                    <h4>{{ permission.name }}</h4>
                    <p>{{ permission.description }}</p>
                  </div>
                  <div class="permission-status">
                    <el-switch
                      v-model="permission.enabled"
                      @change="togglePermission(permission)"
                    />
                  </div>
                </div>
                <div class="permission-details">
                  <div class="detail-item">
                    <span class="label">权限类型:</span>
                    <span class="value">{{ permission.type }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">影响角色:</span>
                    <div class="role-tags">
                      <el-tag
                        v-for="role in permission.roles"
                        :key="role"
                        size="small"
                        class="role-tag"
                      >
                        {{ getRoleName(role) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div class="permission-actions">
                  <el-button size="small" @click="editPermission(permission)">
                    编辑
                  </el-button>
                  <el-button size="small" @click="deletePermission(permission)">
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧角色管理 -->
        <el-col :span="8">
          <!-- 角色管理 -->
          <el-card class="roles-card">
            <template #header>
              <div class="card-header">
                <h3>角色管理</h3>
                <el-button type="primary" size="small" @click="addNewRole">
                  <el-icon><Plus /></el-icon>添加角色
                </el-button>
              </div>
            </template>

            <div class="roles-list">
              <div
                v-for="role in roles"
                :key="role.id"
                class="role-item"
              >
                <div class="role-header">
                  <div class="role-icon">
                    <el-icon>
                      <component :is="role.icon" />
                    </el-icon>
                  </div>
                  <div class="role-info">
                    <h4>{{ role.name }}</h4>
                    <span class="role-users">{{ role.userCount }} 个用户</span>
                  </div>
                  <div class="role-actions">
                    <el-button size="small" @click="editRole(role)">
                      编辑
                    </el-button>
                  </div>
                </div>
                <div class="role-description">
                  {{ role.description }}
                </div>
                <div class="role-permissions">
                  <div class="permission-count">
                    {{ role.permissions.length }} 个权限
                  </div>
                  <div class="permission-tags">
                    <el-tag
                      v-for="permission in role.permissions.slice(0, 3)"
                      :key="permission"
                      size="small"
                      class="permission-tag"
                    >
                      {{ permission }}
                    </el-tag>
                    <el-tag v-if="role.permissions.length > 3" size="small" class="more-tag">
                      +{{ role.permissions.length - 3 }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 安全设置 -->
          <el-card class="security-card">
            <template #header>
              <div class="card-header">
                <h3>安全设置</h3>
              </div>
            </template>

            <div class="security-settings">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>密码策略</h4>
                  <p>设置密码复杂度要求和定期更换策略</p>
                </div>
                <div class="setting-actions">
                  <el-button size="small" @click="configurePasswordPolicy">
                    配置
                  </el-button>
                </div>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>登录安全</h4>
                  <p>设置登录失败次数限制和验证码策略</p>
                </div>
                <div class="setting-actions">
                  <el-button size="small" @click="configureLoginSecurity">
                    配置
                  </el-button>
                </div>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>会话管理</h4>
                  <p>设置会话超时时间和并发登录限制</p>
                </div>
                <div class="setting-actions">
                  <el-button size="small" @click="configureSessionManagement">
                    配置
                  </el-button>
                </div>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>访问控制</h4>
                  <p>设置IP白名单和访问时间限制</p>
                </div>
                <div class="setting-actions">
                  <el-button size="small" @click="configureAccessControl">
                    配置
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 审计日志 -->
          <el-card class="audit-card">
            <template #header>
              <div class="card-header">
                <h3>审计日志</h3>
                <el-button size="small" @click="exportAuditLogs">
                  <el-icon><Download /></el-icon>导出
                </el-button>
              </div>
            </template>

            <div class="audit-logs">
              <div
                v-for="log in auditLogs"
                :key="log.id"
                class="log-item"
              >
                <div class="log-header">
                  <div class="log-icon">
                    <el-icon>
                      <component :is="log.icon" />
                    </el-icon>
                  </div>
                  <div class="log-info">
                    <div class="log-action">{{ log.action }}</div>
                    <div class="log-user">{{ log.user }}</div>
                  </div>
                  <div class="log-time">{{ log.time }}</div>
                </div>
                <div class="log-details">
                  {{ log.details }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="userDialog.visible"
      :title="userDialog.mode === 'add' ? '添加用户' : '编辑用户'"
      width="600px"
    >
      <el-form :model="userForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号码">
          <el-input v-model="userForm.phone" placeholder="请输入手机号码" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="userForm.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="编辑" value="editor" />
            <el-option label="作者" value="author" />
            <el-option label="访客" value="guest" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="userDialog.mode === 'add'" label="密码">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">活跃</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限管理对话框 -->
    <el-dialog
      v-model="permissionDialog.visible"
      title="权限管理"
      width="800px"
    >
      <div class="permission-management">
        <div class="user-info">
          <h4>{{ permissionDialog.user.username }} 的权限</h4>
          <p>角色: {{ getRoleName(permissionDialog.user.role) }}</p>
        </div>
        <div class="permission-groups">
          <div
            v-for="group in permissionGroups"
            :key="group.name"
            class="permission-group"
          >
            <h5>{{ group.name }}</h5>
            <div class="permission-list">
              <div
                v-for="permission in group.permissions"
                :key="permission.key"
                class="permission-checkbox"
              >
                <el-checkbox
                  v-model="permission.checked"
                  @change="updateUserPermission(permission)"
                >
                  {{ permission.name }}
                </el-checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="permissionDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="saveUserPermissions">保存</el-button>
      </template>
    </el-dialog>

    <!-- 角色编辑对话框 -->
    <el-dialog
      v-model="roleDialog.visible"
      :title="roleDialog.mode === 'add' ? '添加角色' : '编辑角色'"
      width="600px"
    >
      <el-form :model="roleForm" label-width="100px">
        <el-form-item label="角色名称">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="roleForm.description" type="textarea" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="权限设置">
          <div class="role-permissions">
            <el-checkbox-group v-model="roleForm.permissions">
              <div
                v-for="permission in allPermissions"
                :key="permission.key"
                class="permission-option"
              >
                <el-checkbox :label="permission.key">
                  {{ permission.name }}
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveRole">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Search, User, UserFilled, Lock, ArrowDown,
  Edit, Delete, Key, Document, Monitor, Setting, Warning, SuccessFilled,
  View, Hide, Check, Close
} from '@element-plus/icons-vue'

// 响应式数据
const permissionStats = ref({
  totalUsers: 156,
  totalRoles: 8,
  totalPermissions: 42,
  securityScore: 92
})

const userSearch = ref('')
const roleFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const users = ref([
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    phone: '13800138000',
    department: '技术部',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15 14:30',
    avatar: 'https://placeholder.com/40x40'
  },
  {
    id: 2,
    username: 'editor01',
    email: 'editor01@example.com',
    phone: '13800138001',
    department: '内容部',
    role: 'editor',
    status: 'active',
    lastLogin: '2024-01-15 13:45',
    avatar: 'https://placeholder.com/40x40'
  },
  {
    id: 3,
    username: 'author01',
    email: 'author01@example.com',
    phone: '13800138002',
    department: '创作部',
    role: 'author',
    status: 'active',
    lastLogin: '2024-01-15 12:20',
    avatar: 'https://placeholder.com/40x40'
  },
  {
    id: 4,
    username: 'guest01',
    email: 'guest01@example.com',
    phone: '13800138003',
    department: '市场部',
    role: 'guest',
    status: 'disabled',
    lastLogin: '2024-01-14 16:10',
    avatar: 'https://placeholder.com/40x40'
  }
])

const roles = ref([
  {
    id: 1,
    name: '管理员',
    icon: 'UserFilled',
    description: '系统管理员，拥有所有权限',
    userCount: 2,
    permissions: ['用户管理', '角色管理', '权限管理', '系统设置', '数据导出', '日志查看']
  },
  {
    id: 2,
    name: '编辑',
    icon: 'Edit',
    description: '内容编辑，可以管理和发布内容',
    userCount: 5,
    permissions: ['内容管理', '发布管理', '素材管理', '数据分析']
  },
  {
    id: 3,
    name: '作者',
    icon: 'Document',
    description: '内容创作者，可以创建和编辑内容',
    userCount: 12,
    permissions: ['内容创建', '素材上传', '数据分析查看']
  },
  {
    id: 4,
    name: '访客',
    icon: 'View',
    description: '只读用户，只能查看数据',
    userCount: 8,
    permissions: ['数据查看']
  }
])

const permissions = ref([
  {
    id: 1,
    name: '用户管理',
    description: '管理系统用户和权限',
    icon: 'User',
    type: '系统权限',
    roles: ['admin'],
    enabled: true
  },
  {
    id: 2,
    name: '内容管理',
    description: '管理内容和发布',
    icon: 'Document',
    type: '内容权限',
    roles: ['admin', 'editor'],
    enabled: true
  },
  {
    id: 3,
    name: '数据导出',
    description: '导出系统数据',
    icon: 'Download',
    type: '数据权限',
    roles: ['admin', 'editor'],
    enabled: true
  },
  {
    id: 4,
    name: '系统设置',
    description: '修改系统配置',
    icon: 'Setting',
    type: '系统权限',
    roles: ['admin'],
    enabled: true
  },
  {
    id: 5,
    name: '日志查看',
    description: '查看系统日志',
    icon: 'Document',
    type: '审计权限',
    roles: ['admin'],
    enabled: true
  }
])

const auditLogs = ref([
  {
    id: 1,
    action: '用户登录',
    user: 'admin',
    time: '2024-01-15 14:30',
    details: '用户 admin 从 192.168.1.100 登录',
    icon: 'SuccessFilled'
  },
  {
    id: 2,
    action: '权限修改',
    user: 'admin',
    time: '2024-01-15 14:15',
    details: '修改了用户 editor01 的权限',
    icon: 'Edit'
  },
  {
    id: 3,
    action: '用户创建',
    user: 'admin',
    time: '2024-01-15 13:45',
    details: '创建了新用户 author01',
    icon: 'Plus'
  },
  {
    id: 4,
    action: '用户禁用',
    user: 'admin',
    time: '2024-01-15 12:20',
    details: '禁用了用户 guest01',
    icon: 'Close'
  }
])

const userDialog = reactive({
  visible: false,
  mode: 'add'
})

const userForm = reactive({
  username: '',
  email: '',
  phone: '',
  department: '',
  role: '',
  password: '',
  status: 'active'
})

const permissionDialog = reactive({
  visible: false,
  user: {}
})

const roleDialog = reactive({
  visible: false,
  mode: 'add'
})

const roleForm = reactive({
  name: '',
  description: '',
  permissions: []
})

const allPermissions = ref([
  { key: 'user_manage', name: '用户管理' },
  { key: 'role_manage', name: '角色管理' },
  { key: 'permission_manage', name: '权限管理' },
  { key: 'content_manage', name: '内容管理' },
  { key: 'publish_manage', name: '发布管理' },
  { key: 'material_manage', name: '素材管理' },
  { key: 'data_export', name: '数据导出' },
  { key: 'system_setting', name: '系统设置' },
  { key: 'log_view', name: '日志查看' }
])

const permissionGroups = ref([
  {
    name: '用户管理',
    permissions: [
      { key: 'user_view', name: '查看用户', checked: true },
      { key: 'user_create', name: '创建用户', checked: true },
      { key: 'user_edit', name: '编辑用户', checked: true },
      { key: 'user_delete', name: '删除用户', checked: false }
    ]
  },
  {
    name: '内容管理',
    permissions: [
      { key: 'content_view', name: '查看内容', checked: true },
      { key: 'content_create', name: '创建内容', checked: true },
      { key: 'content_edit', name: '编辑内容', checked: true },
      { key: 'content_delete', name: '删除内容', checked: false },
      { key: 'content_publish', name: '发布内容', checked: true }
    ]
  },
  {
    name: '系统管理',
    permissions: [
      { key: 'system_view', name: '查看系统', checked: true },
      { key: 'system_config', name: '系统配置', checked: false },
      { key: 'system_backup', name: '系统备份', checked: false },
      { key: 'system_restore', name: '系统恢复', checked: false }
    ]
  }
])

// 计算属性
const filteredUsers = computed(() => {
  let result = users.value

  if (userSearch.value) {
    result = result.filter(user =>
      user.username.toLowerCase().includes(userSearch.value.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.value.toLowerCase())
    )
  }

  if (roleFilter.value) {
    result = result.filter(user => user.role === roleFilter.value)
  }

  return result
})

// 方法定义
const getRoleTagType = (role) => {
  switch (role) {
    case 'admin': return 'danger'
    case 'editor': return 'warning'
    case 'author': return 'primary'
    case 'guest': return 'info'
    default: return 'info'
  }
}

const getRoleName = (role) => {
  switch (role) {
    case 'admin': return '管理员'
    case 'editor': return '编辑'
    case 'author': return '作者'
    case 'guest': return '访客'
    default: return role
  }
}

const addNewUser = () => {
  userDialog.mode = 'add'
  Object.keys(userForm).forEach(key => {
    userForm[key] = key === 'status' ? 'active' : ''
  })
  userDialog.visible = true
}

const editUser = (user) => {
  userDialog.mode = 'edit'
  Object.keys(userForm).forEach(key => {
    userForm[key] = user[key] || (key === 'status' ? 'active' : '')
  })
  userForm.id = user.id
  userDialog.visible = true
}

const saveUser = () => {
  if (!userForm.username || !userForm.email || !userForm.role) {
    ElMessage.warning('请填写必要信息')
    return
  }

  if (userDialog.mode === 'add') {
    const newUser = {
      id: users.value.length + 1,
      ...userForm,
      avatar: 'https://placeholder.com/40x40',
      lastLogin: '从未登录'
    }
    users.value.push(newUser)
    ElMessage.success('用户添加成功')
  } else {
    const userIndex = users.value.findIndex(u => u.id === userForm.id)
    if (userIndex > -1) {
      users.value[userIndex] = { ...users.value[userIndex], ...userForm }
      ElMessage.success('用户更新成功')
    }
  }

  userDialog.visible = false
}

const managePermissions = (user) => {
  permissionDialog.user = { ...user }
  permissionDialog.visible = true
}

const updateUserPermission = (permission) => {
  // 更新用户权限的逻辑
  console.log('Update permission:', permission)
}

const saveUserPermissions = () => {
  ElMessage.success('用户权限保存成功')
  permissionDialog.visible = false
}

const handleUserCommand = (command, user) => {
  switch (command) {
    case 'reset':
      resetPassword(user)
      break
    case 'disable':
      disableUser(user)
      break
    case 'enable':
      enableUser(user)
      break
    case 'delete':
      deleteUser(user)
      break
  }
}

const resetPassword = (user) => {
  ElMessageBox.confirm(
    `确定要重置用户 ${user.username} 的密码吗？`,
    '重置密码',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`用户 ${user.username} 的密码已重置`)
  }).catch(() => {
    // 用户取消
  })
}

const disableUser = (user) => {
  ElMessageBox.confirm(
    `确定要禁用用户 ${user.username} 吗？`,
    '禁用用户',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    user.status = 'disabled'
    ElMessage.success(`用户 ${user.username} 已禁用`)
  }).catch(() => {
    // 用户取消
  })
}

const enableUser = (user) => {
  ElMessageBox.confirm(
    `确定要启用用户 ${user.username} 吗？`,
    '启用用户',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    user.status = 'active'
    ElMessage.success(`用户 ${user.username} 已启用`)
  }).catch(() => {
    // 用户取消
  })
}

const deleteUser = (user) => {
  ElMessageBox.confirm(
    `确定要删除用户 ${user.username} 吗？此操作不可恢复。`,
    '删除用户',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    const index = users.value.findIndex(u => u.id === user.id)
    if (index > -1) {
      users.value.splice(index, 1)
      ElMessage.success(`用户 ${user.username} 已删除`)
    }
  }).catch(() => {
    // 用户取消
  })
}

const importUsers = () => {
  ElMessage.info('正在打开批量导入功能...')
  // 这里可以实现批量导入功能
}

const togglePermission = (permission) => {
  ElMessage.success(`${permission.name} 已${permission.enabled ? '启用' : '禁用'}`)
}

const addNewPermission = () => {
  ElMessage.info('正在添加新的权限规则...')
  // 这里可以实现添加权限规则功能
}

const editPermission = (permission) => {
  ElMessage.info('正在编辑权限规则...')
  // 这里可以实现编辑权限规则功能
}

const deletePermission = (permission) => {
  ElMessageBox.confirm(
    `确定要删除权限规则 ${permission.name} 吗？`,
    '删除权限',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    const index = permissions.value.findIndex(p => p.id === permission.id)
    if (index > -1) {
      permissions.value.splice(index, 1)
      ElMessage.success(`权限规则 ${permission.name} 已删除`)
    }
  }).catch(() => {
    // 用户取消
  })
}

const addNewRole = () => {
  roleDialog.mode = 'add'
  Object.keys(roleForm).forEach(key => {
    roleForm[key] = key === 'permissions' ? [] : ''
  })
  roleDialog.visible = true
}

const editRole = (role) => {
  roleDialog.mode = 'edit'
  Object.keys(roleForm).forEach(key => {
    roleForm[key] = role[key] || (key === 'permissions' ? [] : '')
  })
  roleForm.id = role.id
  roleDialog.visible = true
}

const saveRole = () => {
  if (!roleForm.name || !roleForm.description) {
    ElMessage.warning('请填写必要信息')
    return
  }

  if (roleDialog.mode === 'add') {
    const newRole = {
      id: roles.value.length + 1,
      ...roleForm,
      icon: 'UserFilled',
      userCount: 0
    }
    roles.value.push(newRole)
    ElMessage.success('角色添加成功')
  } else {
    const roleIndex = roles.value.findIndex(r => r.id === roleForm.id)
    if (roleIndex > -1) {
      roles.value[roleIndex] = { ...roles.value[roleIndex], ...roleForm }
      ElMessage.success('角色更新成功')
    }
  }

  roleDialog.visible = false
}

const configurePasswordPolicy = () => {
  ElMessage.info('正在配置密码策略...')
  // 这里可以实现密码策略配置
}

const configureLoginSecurity = () => {
  ElMessage.info('正在配置登录安全...')
  // 这里可以实现登录安全配置
}

const configureSessionManagement = () => {
  ElMessage.info('正在配置会话管理...')
  // 这里可以实现会话管理配置
}

const configureAccessControl = () => {
  ElMessage.info('正在配置访问控制...')
  // 这里可以实现访问控制配置
}

const exportAuditLogs = () => {
  ElMessage.success('正在导出审计日志...')
  // 这里可以实现审计日志导出
}

// 生命周期钩子
onMounted(() => {
  // 初始化数据
  permissionStats.value.totalUsers = users.value.length
  permissionStats.value.totalRoles = roles.value.length
  permissionStats.value.totalPermissions = permissions.value.length
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.user-management {
  .management-header {
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

  .permission-overview {
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

          &.users-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          &.roles-icon {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }

          &.permissions-icon {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
          }

          &.security-icon {
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

  .management-content {
    .users-card {
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

      .users-table {
        .user-cell {
          display: flex;
          align-items: center;

          .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            margin-right: 8px;
            overflow: hidden;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }

          .user-info {
            .username {
              font-weight: 500;
              color: $text-primary;
            }

            .user-email {
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

    .permissions-card {
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

      .permissions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;

        .permission-item {
          border: 1px solid $border-base;
          border-radius: 8px;
          padding: 16px;

          .permission-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;

            .permission-icon {
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

            .permission-info {
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

          .permission-details {
            margin-bottom: 12px;

            .detail-item {
              display: flex;
              align-items: center;
              margin-bottom: 8px;
              font-size: 14px;

              .label {
                color: $text-secondary;
                min-width: 80px;
              }

              .value {
                color: $text-primary;
              }

              .role-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;

                .role-tag {
                  margin-right: 4px;
                }
              }
            }
          }

          .permission-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }

    .roles-card {
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

      .roles-list {
        .role-item {
          border: 1px solid $border-base;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;

          .role-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;

            .role-icon {
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

            .role-info {
              flex: 1;

              h4 {
                margin: 0 0 4px 0;
                color: $text-primary;
                font-size: 14px;
              }

              .role-users {
                color: $text-secondary;
                font-size: 12px;
              }
            }
          }

          .role-description {
            color: $text-secondary;
            font-size: 14px;
            margin-bottom: 12px;
          }

          .role-permissions {
            .permission-count {
              color: $text-secondary;
              font-size: 12px;
              margin-bottom: 8px;
            }

            .permission-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;

              .permission-tag,
              .more-tag {
                font-size: 11px;
              }
            }
          }
        }
      }
    }

    .security-card {
      margin-bottom: 20px;

      .card-header {
        h3 {
          margin: 0;
          color: $text-primary;
        }
      }

      .security-settings {
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid $border-base;
          border-radius: 8px;
          margin-bottom: 12px;

          .setting-info {
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
      }
    }

    .audit-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          color: $text-primary;
        }
      }

      .audit-logs {
        .log-item {
          padding: 12px;
          border: 1px solid $border-base;
          border-radius: 8px;
          margin-bottom: 8px;

          .log-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;

            .log-icon {
              margin-right: 8px;
              color: $primary-color;
            }

            .log-info {
              flex: 1;

              .log-action {
                font-weight: 500;
                color: $text-primary;
              }

              .log-user {
                color: $text-secondary;
                font-size: 12px;
              }
            }

            .log-time {
              color: $text-secondary;
              font-size: 12px;
            }
          }

          .log-details {
            color: $text-secondary;
            font-size: 12px;
          }
        }
      }
    }
  }

  .permission-management {
    .user-info {
      margin-bottom: 24px;
      padding: 16px;
      background: $bg-color;
      border-radius: 8px;

      h4 {
        margin: 0 0 4px 0;
        color: $text-primary;
      }

      p {
        margin: 0;
        color: $text-secondary;
      }
    }

    .permission-groups {
      .permission-group {
        margin-bottom: 24px;

        h5 {
          margin: 0 0 12px 0;
          color: $text-primary;
        }

        .permission-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;

          .permission-checkbox {
            display: flex;
            align-items: center;
            padding: 8px;
            background: $bg-color;
            border-radius: 4px;
          }
        }
      }
    }
  }

  .role-permissions {
    .permission-option {
      padding: 8px;
      background: $bg-color;
      border-radius: 4px;
      margin-bottom: 8px;
    }
  }
}
</style>