# 社交媒体自动上传系统

> 🚀 基于 AI 的智能社交媒体内容生成和自动发布平台

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Vue](https://img.shields.io/badge/vue-3.4+-green.svg)
![Docker](https://img.shields.io/badge/docker-supported-blue.svg)

## 📋 项目简介

这是一个基于 Flask + Vue3 构建的智能社交媒体自动上传系统，支持多平台内容发布、AI 内容生成、数据分析等功能。

### ✨ 主要特性

- 🤖 **AI 内容生成**: 集成多种 AI 模型，智能生成文案和视频脚本
- 🎯 **多平台支持**: 支持抖音、小红书、B站、腾讯视频等平台
- 📊 **数据分析**: 实时数据分析和性能优化建议
- 🔄 **任务调度**: 智能任务调度和批量处理
- 🛡️ **安全认证**: JWT 认证和权限管理
- 📱 **响应式设计**: 完美适配移动端和桌面端
- 🐳 **容器化部署**: Docker 支持，一键部署

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Vue3)   │────│   后端 (Flask)  │────│   数据库        │
│                 │    │                 │    │                 │
│  - Element Plus │    │  - AI 服务      │    │  - PostgreSQL  │
│  - Pinia        │    │  - 平台集成     │    │  - Redis 缓存   │
│  - Vue Router   │    │  - 文件处理     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- FFmpeg (视频处理)
- PostgreSQL (生产环境)

### 1. 克隆项目

```bash
git clone https://github.com/mengguiyouziyi/social-auto-upload.git
cd social-auto-upload
```

### 2. 配置环境

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
vim .env
```

### 3. 安装依赖

```bash
# 安装 Python 依赖
pip install -r requirements.txt

# 安装前端依赖
cd sau_frontend
npm install
```

### 4. 初始化数据库

```bash
# 创建数据库表
python scripts/init_db.py
```

### 5. 启动服务

#### 开发环境

```bash
# 启动后端服务
python run_backend.py

# 启动前端开发服务器 (新终端)
cd sau_frontend
npm run dev
```

访问 http://localhost:5173 查看前端界面

#### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 初始化数据库
docker-compose --profile init up db-init
```

## 📖 使用指南

### 默认账户

- **管理员**: `admin / admin123`
- **测试用户**: `test / test123`

### 主要功能

1. **AI 内容生成**
   - 智能文案生成
   - 视频脚本生成
   - 内容优化建议

2. **账户管理**
   - 多平台账户绑定
   - 账户状态监控
   - 批量操作

3. **内容发布**
   - 视频上传
   - 定时发布
   - 多平台同步

4. **数据分析**
   - 发布效果分析
   - 用户画像分析
   - 性能优化建议

## 🔧 配置说明

### 环境变量

主要配置项说明：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DEBUG` | 调试模式 | `True` |
| `DATABASE_URL` | 数据库连接 | `sqlite:///db/database.db` |
| `SECRET_KEY` | 应用密钥 | 必须设置 |
| `OPENAI_API_KEY` | OpenAI API 密钥 | 必须设置 |
| `JWT_SECRET_KEY` | JWT 密钥 | 必须设置 |

### AI 服务配置

支持多种 AI 服务提供商：

- **OpenAI**: GPT-3.5, GPT-4
- **百度文心一言**: ERNIE Bot
- **阿里云通义千问**: Qwen
- **智谱AI**: GLM

### 平台配置

各平台需要单独配置：

- **抖音**: 需要 Cookie 和 User-Agent
- **小红书**: 需要登录凭证
- **B站**: 需要账号密码
- **腾讯视频**: 需要授权

## 🐳 Docker 部署

### 开发环境

```bash
# 启动开发环境
docker-compose --profile dev up -d
```

### 生产环境

```bash
# 启动生产环境
docker-compose --profile prod up -d

# 查看日志
docker-compose logs -f
```

### 环境配置

生产环境需要配置：

- 数据库连接
- Redis 缓存
- SSL 证书
- 域名解析
- 监控告警

## 📊 API 文档

启动服务后访问：

- **Swagger UI**: http://localhost:5409/api/docs
- **ReDoc**: http://localhost:5409/api/redoc

### 主要 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/ai/generate` | POST | AI 内容生成 |
| `/api/content/publish` | POST | 内容发布 |
| `/api/accounts` | GET | 账户列表 |
| `/api/analytics` | GET | 数据分析 |

## 🛠️ 开发指南

### 项目结构

```
social-auto-upload/
├── sau_backend/          # 后端代码
│   ├── api/             # API 路由
│   ├── models/          # 数据模型
│   ├── services/        # 业务逻辑
│   ├── platforms/       # 平台集成
│   └── utils/           # 工具函数
├── sau_frontend/         # 前端代码
│   ├── src/             # 源代码
│   │   ├── components/  # 组件
│   │   ├── views/       # 页面
│   │   ├── stores/      # 状态管理
│   │   └── utils/       # 工具函数
│   └── public/          # 静态资源
├── scripts/             # 脚本文件
├── uploads/             # 上传文件
├── logs/                # 日志文件
└── docs/               # 文档
```

### 代码规范

- **Python**: 遵循 PEP 8 规范
- **JavaScript**: 使用 ESLint 和 Prettier
- **Vue**: 使用 Vue 3 Composition API
- **Git**: 使用 Conventional Commits

### 测试

```bash
# 运行后端测试
pytest tests/

# 运行前端测试
cd sau_frontend
npm test

# 运行端到端测试
npm run test:e2e
```

## 🔒 安全配置

### 基本安全

- 使用 HTTPS
- 配置 CORS
- 设置强密码
- 定期更新依赖

### 生产环境

- 使用环境变量
- 配置防火墙
- 启用日志监控
- 定期备份数据

## 📈 监控和维护

### 日志查看

```bash
# 查看应用日志
tail -f logs/app.log

# Docker 日志
docker-compose logs -f backend
```

### 性能监控

- **内存使用**: 监控 Redis 和数据库内存
- **CPU 使用**: 监控后端服务 CPU 占用
- **响应时间**: 监控 API 响应时间
- **错误率**: 监控 5xx 错误率

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -m 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Flask](https://flask.palletsprojects.com/) - Python Web 框架
- [Vue.js](https://vuejs.org/) - 前端框架
- [Element Plus](https://element-plus.org/) - UI 组件库
- [OpenAI](https://openai.com/) - AI 服务提供商

## 📞 联系我们

- **Issues**: [GitHub Issues](https://github.com/mengguiyouziyi/social-auto-upload/issues)
- **Email**: your-email@example.com
- **文档**: [Wiki](https://github.com/mengguiyouziyi/social-auto-upload/wiki)

---

⭐ 如果这个项目对你有帮助，请给它一个 star！