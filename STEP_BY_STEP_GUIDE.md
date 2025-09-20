# 🎯 一步一步开发和测试指南

## 📋 总览

本指南提供了使用Claude Code工具链进行完整开发的详细步骤，从项目初始化到部署上线的全流程。

## 🚀 快速开始

### 第一步：设置项目环境
```bash
# 1. 克隆项目或创建新项目
git clone <your-repo-url>
cd social-auto-upload

# 2. 运行自动设置脚本
python scripts/setup_dev_environment.py

# 3. 激活虚拟环境
source venv/bin/activate

# 4. 设置项目代理
~/.config/claude/setup-project-agents.sh fullstack .
```

### 第二步：验证环境
```bash
# 运行基础测试
pytest tests/unit/ -v

# 检查代码质量
black --check sau_backend/
isort --check-only sau_backend/

# 启动开发服务器
python native_douyin_backend.py
```

## 🎯 开发流程详解

### 阶段1：项目初始化 (30分钟)

#### 1.1 环境设置
```bash
# 创建新项目
mkdir my-new-project
cd my-new-project

# 初始化Git仓库
git init

# 设置Claude Code代理
~/.config/claude/setup-project-agents.sh fullstack .

# 验证代理配置
cat .claude/agents/README.md
```

#### 1.2 项目结构创建
```bash
# 创建标准项目结构
mkdir -p {app/{models,views,services,utils},tests/{unit,integration,e2e},docs,scripts}

# 创建基础文件
touch {requirements.txt,requirements-dev.txt,.env.example,.gitignore}

# 创建README.md
cat > README.md << 'EOF'
# 项目名称

## 描述
简要描述项目的主要功能和目标。

## 技术栈
- 后端：Flask + SQLAlchemy
- 前端：Vue.js 3
- 数据库：PostgreSQL
- 缓存：Redis

## 开发环境设置
1. 运行 `python scripts/setup_dev_environment.py`
2. 激活虚拟环境 `source venv/bin/activate`
3. 安装依赖 `pip install -r requirements.txt`
4. 启动开发服务器
EOF
```

### 阶段2：需求分析 (1-2小时)

#### 2.1 使用业务分析师代理
```bash
# 启动业务分析师
claude code --agent business-analyst
```

**在对话中提供：**
- 项目背景和目标
- 目标用户群体
- 核心功能需求
- 技术约束和业务约束
- 成功标准和验收条件

#### 2.2 创建需求文档
```markdown
# 需求分析文档

## 项目概述
**项目名称**: 社交媒体自动发布系统
**目标用户**: 县乡小店主、中小商户
**核心价值**: 降低内容创作门槛，提高运营效率

## 功能需求

### 用户管理
- **用户注册/登录**: 支持邮箱和手机号注册
- **账号管理**: 管理多个社交媒体平台账号
- **权限控制**: 基于角色的访问控制

### 内容创作
- **AI文案生成**: 基于产品信息自动生成营销文案
- **图片转视频**: 将产品图片转换为营销视频
- **语音合成**: 为视频添加语音解说
- **模板库**: 提供行业特定模板

### 发布管理
- **多平台发布**: 支持抖音、B站、小红书等平台
- **定时发布**: 设置发布时间，自动发布
- **批量操作**: 批量处理多个内容

## 非功能需求
- **性能**: 页面加载时间 < 2秒
- **安全性**: JWT认证，数据加密
- **可用性**: 99.5% uptime
- **扩展性**: 支持1000+并发用户

## 技术约束
- 后端框架：Flask
- 前端框架：Vue.js 3
- 数据库：PostgreSQL
- 部署：Docker + Nginx
```

### 阶段3：架构设计 (2-3小时)

#### 3.1 使用架构师代理
```bash
# 启动架构师
claude code --agent architect-review
```

**提供信息：**
- 需求文档
- 技术约束
- 团队技能
- 扩展性要求

#### 3.2 创建架构设计
```bash
# 创建架构文档
mkdir -p docs/architecture
cat > docs/architecture/system_design.md << 'EOF'
# 系统架构设计

## 整体架构
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   前端应用   │    │   API网关    │    │   微服务     │
│  (Vue.js)   │────│  (Nginx)    │────│  (Flask)    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                ┌─────────────────────┐
                │     数据层          │
                │ (PostgreSQL+Redis)  │
                └─────────────────────┘
```

## 微服务划分
1. **用户服务**: 用户管理、认证、授权
2. **内容服务**: 内容创作、AI生成、媒体处理
3. **发布服务**: 多平台发布、定时任务
4. **分析服务**: 数据分析、统计报表

## 数据库设计
### 核心表结构
- `users` - 用户基本信息
- `platform_accounts` - 社交媒体平台账号
- `content` - 创作内容
- `publish_tasks` - 发布任务
- `templates` - 内容模板

## API设计
### 认证流程
1. 用户登录 → JWT Token
2. Token验证 → 用户身份
3. 权限检查 → API访问

### 核心API端点
```
POST   /api/v1/auth/login           # 用户登录
POST   /api/v1/auth/refresh          # 刷新Token
GET    /api/v1/users/profile        # 获取用户信息
POST   /api/v1/content/generate     # AI生成内容
POST   /api/v1/media/upload         # 媒体文件上传
POST   /api/v1/publish/schedule     # 定时发布
GET    /api/v1/analytics/stats      # 统计数据
```
EOF
```

### 阶段4：开发实施 (1-2周)

#### 4.1 创建开发分支
```bash
# 创建功能分支
git checkout -b feature/user-management

# 或者创建迭代分支
git checkout -b sprint-1-user-auth
```

#### 4.2 使用开发代理
```bash
# 后端开发
claude code --agent backend-architect

# 前端开发
claude code --agent frontend-developer

# 数据库开发
claude code --agent database-optimizer
```

#### 4.3 测试驱动开发 (TDD)
```bash
# 启动TDD编排器
claude code --agent tdd-orchestrator
```

**TDD流程示例：**

```python
# 1. 编写失败的测试
def test_user_registration():
    """测试用户注册"""
    # 测试代码
    pass

# 2. 运行测试确认失败
pytest tests/unit/test_user.py::test_user_registration -v

# 3. 编写最少的代码让测试通过
# 4. 重构代码
# 5. 运行所有测试确保通过
```

#### 4.4 模块开发顺序

1. **用户认证模块**
   ```bash
   # 创建用户模型
   claude code --agent backend-architect
   # 在对话中要求创建用户模型和认证系统
   ```

2. **内容生成模块**
   ```bash
   # 集成AI服务
   claude code --agent backend-architect
   # 在对话中要求集成AI文案生成功能
   ```

3. **媒体处理模块**
   ```bash
   # 媒体上传和处理
   claude code --agent backend-architect
   # 在对话中要求实现媒体处理功能
   ```

4. **发布管理模块**
   ```bash
   # 多平台发布
   claude code --agent backend-architect
   # 在对话中要求实现发布管理功能
   ```

### 阶段5：测试验证 (持续进行)

#### 5.1 单元测试
```bash
# 运行单元测试
pytest tests/unit/ -v

# 运行特定测试文件
pytest tests/unit/test_user.py -v

# 生成覆盖率报告
pytest tests/unit/ --cov=app --cov-report=html

# 运行性能测试
pytest --benchmark-only
```

#### 5.2 集成测试
```bash
# 运行集成测试
pytest tests/integration/ -v

# 启动测试服务器
# 在一个终端中运行：
python scripts/test_server.py

# 在另一个终端中运行测试：
pytest tests/integration/ -v
```

#### 5.3 端到端测试
```bash
# 运行端到端测试
pytest tests/e2e/ -v

# 使用Playwright进行UI测试
npx playwright test
```

### 阶段6：代码质量检查 (每次提交)

#### 6.1 自动化检查
```bash
# 代码格式化
black app/
isort app/

# 代码检查
flake8 app/
mypy app/

# 安全检查
bandit -r app/

# 依赖检查
safety check
```

#### 6.2 使用代码审查代理
```bash
# 启动代码审查
claude code --agent code-reviewer
```

**在对话中提供：**
- 需要审查的代码文件
- 功能需求和约束
- 性能要求
- 安全考虑

#### 6.3 预提交钩子
```bash
# 安装预提交钩子
pre-commit install

# 手动运行预提交检查
pre-commit run --all-files

# 跳过预提交钩子（不推荐）
git commit -m "feat: add new feature" --no-verify
```

### 阶段7：合并和部署 (每次迭代结束)

#### 7.1 代码审查
```bash
# 创建Pull Request
git push origin feature/user-management
# 然后在GitHub上创建PR

# 或者在命令行中（需要GitHub CLI）
gh pr create --title "Add user management" --body "Implement user registration and login"

# 等待CI/CD完成
gh pr view
```

#### 7.2 部署到测试环境
```bash
# 合并到develop分支
git checkout develop
git merge feature/user-management
git push origin develop

# 触发部署到测试环境
# 等待CI/CD自动部署
```

#### 7.3 部署到生产环境
```bash
# 合并到main分支
git checkout main
git merge develop
git push origin main

# 触发部署到生产环境
# 监控部署状态
```

## 🔄 日常开发流程

### 每日开发流程
```bash
# 1. 更新代码
git pull origin main

# 2. 创建新分支
git checkout -b feature/feature-name

# 3. 开发新功能
# 使用相关代理协助开发
claude code --agent backend-architect

# 4. 运行测试
pytest

# 5. 提交代码
git add .
git commit -m "feat: add new feature"

# 6. 推送分支
git push origin feature/feature-name

# 7. 创建PR
gh pr create
```

### 每周质量检查
```bash
# 周一：代码审查
claude code --agent code-reviewer

# 周三：安全审计
claude code --agent security-auditor

# 周五：性能评估
claude code --agent performance-engineer
```

## 🚨 问题处理

### 常见问题及解决方案

#### 1. 环境问题
```bash
# 重新设置环境
python scripts/setup_dev_environment.py

# 重新安装依赖
pip install -r requirements.txt --force-reinstall

# 清理虚拟环境
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 2. 测试失败
```bash
# 运行特定测试并查看详细信息
pytest tests/unit/test_user.py -v -s

# 调试测试
pytest tests/unit/test_user.py --pdb

# 查看覆盖率报告
open htmlcov/index.html
```

#### 3. 代码质量问题
```bash
# 自动修复格式问题
black app/
isort app/

# 查看flake8详细错误
flake8 app/ --statistics

# 查看mypy错误详情
mypy app/ --show-error-codes
```

#### 4. 性能问题
```bash
# 使用性能分析器
python -m cProfile -o profile.prof app.py

# 分析性能数据
python -m pstats profile.prof

# 使用内存分析器
python -m memory_profiler app.py
```

## 📊 进度跟踪

### 开发进度检查清单

- [ ] 需求分析完成
- [ ] 架构设计完成
- [ ] 用户认证模块开发完成
- [ ] 内容生成模块开发完成
- [ ] 媒体处理模块开发完成
- [ ] 发布管理模块开发完成
- [ ] 前端界面开发完成
- [ ] 单元测试覆盖率达到80%+
- [ ] 集成测试通过
- [ ] 端到端测试通过
- [ ] 安全审计通过
- [ ] 性能测试通过
- [ ] 部署文档完成

### 使用项目管理工具
```bash
# 创建项目任务
echo """
## Sprint 1 任务

### 后端任务
- [ ] 用户认证系统
- [ ] 基础API框架
- [ ] 数据库模型设计

### 前端任务
- [ ] 登录页面
- [ ] 用户管理界面
- [ ] API集成

### 测试任务
- [ ] 单元测试
- [ ] 集成测试
- [ ] 端到端测试
""" > SPRINT_1_TASKS.md
```

## 🎉 完成标准

### 代码质量标准
- [ ] 所有测试通过
- [ ] 代码覆盖率 >= 80%
- [ ] 代码格式化检查通过
- [ ] 安全检查通过
- [ ] 性能测试通过

### 功能标准
- [ ] 所有需求功能实现
- [ ] 用户验收测试通过
- [ ] 文档完整
- [ ] 部署成功

### 维护标准
- [ ] 监控系统正常
- [ ] 日志记录完整
- [ ] 错误处理完善
- [ ] 备份策略有效

---

## 📞 获取帮助

如果在开发过程中遇到问题：

1. **查看文档**: 检查相关文档和README
2. **使用调试代理**: `claude code --agent debugger`
3. **代码审查**: `claude code --agent code-reviewer`
4. **性能分析**: `claude code --agent performance-engineer`

记住，这是一个迭代的过程，每个阶段都可以根据项目实际情况进行调整。