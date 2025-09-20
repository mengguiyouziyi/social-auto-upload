# 🎯 完整的开发和测试流程

## 📋 概述

本指南详细说明了如何使用Claude Code工具链进行系统性的开发和测试，确保代码质量和项目稳定性。

## 🏗️ 开发流程总览

```
项目初始化 → 需求分析 → 架构设计 → 开发实施 → 测试验证 → 部署上线 → 监控维护
    ↓           ↓           ↓           ↓           ↓           ↓           ↓
 设置代理     分析需求     架构评审     代码开发     测试执行     部署检查     性能监控
```

## 🔧 第一步：项目环境设置

### 1.1 初始化项目结构
```bash
# 创建新项目
mkdir my-new-project
cd my-new-project

# 初始化Git仓库
git init

# 设置项目代理（使用我们的工具链）
~/.config/claude/setup-project-agents.sh fullstack .

# 查看可用代理
cat .claude/agents/README.md
```

### 1.2 配置项目环境
```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装基础依赖
pip install flask sqlalchemy pytest pytest-cov black isort mypy

# 创建项目结构
mkdir -p {app,tests,docs,scripts,.github/workflows}
touch requirements.txt README.md .gitignore
```

## 🎯 第二步：需求分析

### 2.1 使用业务分析师代理
```bash
# 启动业务分析师进行需求分析
claude code --agent business-analyst
```

**在对话中说明：**
- 项目目标和用户需求
- 功能需求和非功能需求
- 技术约束和业务约束
- 成功标准和验收条件

### 2.2 创建需求文档
```markdown
# 需求分析模板

## 项目概述
- 项目名称：
- 目标用户：
- 核心价值：

## 功能需求
### 用户故事
- **作为** [用户角色]
- **我希望** [功能描述]
- **以便** [获得价值]

### API端点
- `POST /api/users` - 创建用户
- `GET /api/users/{id}` - 获取用户信息
- `PUT /api/users/{id}` - 更新用户信息

## 非功能需求
- 性能：响应时间 < 1s
- 安全：HTTPS，JWT认证
- 可用性：99.9% uptime
- 扩展性：支持1000并发用户

## 技术栈
- 后端：Flask + SQLAlchemy
- 前端：Vue.js 3
- 数据库：PostgreSQL
- 缓存：Redis
```

## 🏛️ 第三步：架构设计

### 3.1 使用架构师代理
```bash
# 启动架构师进行设计
claude code --agent architect-review
```

**提供的信息：**
- 需求文档
- 技术约束
- 扩展性要求
- 团队技能

### 3.2 创建架构设计文档
```markdown
# 架构设计文档

## 系统架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用       │    │   API网关        │    │   微服务集群      │
│   (Vue.js)      │────│   (Nginx)       │────│   (Flask)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │   数据层        │
                    │ (PostgreSQL)    │
                    │   + Redis       │
                    └─────────────────┘
```

## 数据库设计
### 核心表结构
- `users` - 用户信息
- `products` - 产品信息
- `orders` - 订单信息
- `payments` - 支付信息

## API设计
### 认证流程
1. 用户登录 → JWT Token
2. Token验证 → 用户身份
3. 权限检查 → API访问

### 核心API
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新Token
- `GET /api/users/profile` - 获取用户信息
- `POST /api/orders` - 创建订单

## 安全设计
- JWT认证 + RBAC权限控制
- API密钥管理
- 数据加密存储
- 请求速率限制
```

## 💻 第四步：开发实施

### 4.1 开发环境设置
```bash
# 创建开发分支
git checkout -b feature/your-feature-name

# 创建虚拟环境
python -m venv venv-dev
source venv-dev/bin/activate

# 安装依赖
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 4.2 使用开发代理
```bash
# 后端开发
claude code --agent backend-architect

# 前端开发
claude code --agent frontend-developer

# 数据库开发
claude code --agent database-optimizer
```

### 4.3 代码开发流程

#### 步骤1：API设计
```python
# app/api/v1/users.py
from flask import Blueprint, request, jsonify
from app.services.user_service import UserService
from app.decorators import require_auth

bp = Blueprint('users', __name__, url_prefix='/api/v1/users')

@bp.route('', methods=['GET'])
@require_auth
def get_users():
    """获取用户列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    users = UserService.get_users(page=page, per_page=per_page)
    return jsonify(users)
```

#### 步骤2：服务层开发
```python
# app/services/user_service.py
from typing import List, Dict, Optional
from app.models.user import User
from app.database import db
from app.cache import cache_manager

class UserService:
    @staticmethod
    @cache_manager.cache_result(ttl=300)
    def get_users(page: int = 1, per_page: int = 10) -> Dict:
        """获取用户列表"""
        users = User.query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        return {
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': users.page
        }
```

#### 步骤3：模型层开发
```python
# app/models/user.py
from datetime import datetime
from app.database import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }
```

#### 步骤4：测试驱动开发
```python
# tests/test_user_service.py
import pytest
from app.services.user_service import UserService
from app.models.user import User
from app.database import db

class TestUserService:
    def test_get_users_empty(self):
        """测试获取空用户列表"""
        result = UserService.get_users()
        assert result['users'] == []
        assert result['total'] == 0

    def test_get_users_with_data(self):
        """测试获取用户列表"""
        # 创建测试用户
        user = User(username='testuser', email='test@example.com')
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()

        result = UserService.get_users()
        assert len(result['users']) == 1
        assert result['total'] == 1
        assert result['users'][0]['username'] == 'testuser'
```

## 🧪 第五步：测试验证

### 5.1 使用TDD编排器
```bash
# 启动TDD编排器
claude code --agent tdd-orchestrator
```

### 5.2 测试策略

#### 单元测试
```python
# tests/unit/test_user_model.py
import pytest
from app.models.user import User

def test_user_creation():
    """测试用户创建"""
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')

    assert user.username == 'testuser'
    assert user.email == 'test@example.com'
    assert user.check_password('password123')
    assert not user.check_password('wrongpassword')
```

#### 集成测试
```python
# tests/integration/test_user_api.py
import pytest
import json
from app import create_app

class TestUserAPI:
    def setup_method(self):
        """设置测试环境"""
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def teardown_method(self):
        """清理测试环境"""
        self.app_context.pop()

    def test_create_user(self):
        """测试创建用户"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }

        response = self.client.post('/api/v1/users',
                                   data=json.dumps(data),
                                   content_type='application/json')

        assert response.status_code == 201
        assert b'User created successfully' in response.data
```

#### 端到端测试
```python
# tests/e2e/test_user_workflow.py
import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By

class TestUserWorkflow:
    def setup_method(self):
        """设置测试环境"""
        self.driver = webdriver.Chrome()
        self.driver.implicitly_wait(10)

    def teardown_method(self):
        """清理测试环境"""
        self.driver.quit()

    def test_user_registration_workflow(self):
        """测试用户注册工作流"""
        # 打开注册页面
        self.driver.get('http://localhost:3000/register')

        # 填写注册表单
        username_input = self.driver.find_element(By.NAME, 'username')
        email_input = self.driver.find_element(By.NAME, 'email')
        password_input = self.driver.find_element(By.NAME, 'password')
        submit_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')

        username_input.send_keys('testuser')
        email_input.send_keys('test@example.com')
        password_input.send_keys('password123')
        submit_button.click()

        # 验证注册成功
        time.sleep(2)
        assert 'Registration successful' in self.driver.page_source
```

### 5.3 运行测试
```bash
# 运行所有测试
pytest

# 运行单元测试
pytest tests/unit/

# 运行集成测试
pytest tests/integration/

# 运行端到端测试
pytest tests/e2e/

# 生成覆盖率报告
pytest --cov=app --cov-report=html

# 运行性能测试
pytest --benchmark-only
```

## 🤖 第六步：代码质量检查

### 6.1 使用代码审查代理
```bash
# 启动代码审查
claude code --agent code-reviewer
```

### 6.2 自动化代码检查
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

### 6.3 预提交钩子
```bash
# 安装预提交钩子
pip install pre-commit
pre-commit install

# 创建.pre-commit-config.yaml
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/psf/black
    rev: 22.3.0
    hooks:
      - id: black
        language_version: python3.8

  - repo: https://github.com/pycqa/isort
    rev: 5.10.1
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 4.0.1
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v0.950
    hooks:
      - id: mypy
EOF
```

## 🚀 第七步：部署上线

### 7.1 使用DevOps代理
```bash
# 启动DevOps专家
claude code --agent devops-troubleshooter
```

### 7.2 部署流程

#### Docker化
```dockerfile
# Dockerfile
FROM python:3.8-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install -r requirements.txt

# 复制应用代码
COPY . .

# 创建非root用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web
    restart: unless-stopped

volumes:
  postgres_data:
```

### 7.3 部署脚本
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 开始部署..."

# 停止现有服务
docker-compose down

# 构建新镜像
docker-compose build

# 运行数据库迁移
docker-compose run --rm web python manage.py db upgrade

# 启动服务
docker-compose up -d

# 健康检查
sleep 10
curl -f http://localhost:5000/health || exit 1

echo "✅ 部署完成！"
```

## 📊 第八步：监控维护

### 8.1 使用性能工程师
```bash
# 启动性能工程师
claude code --agent performance-engineer
```

### 8.2 监控配置

#### 应用监控
```python
# app/monitoring.py
import time
import psutil
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# 定义监控指标
REQUEST_COUNT = Counter('app_requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('app_request_duration_seconds', 'Request duration')
ACTIVE_USERS = Gauge('app_active_users', 'Active users')
MEMORY_USAGE = Gauge('app_memory_usage_bytes', 'Memory usage')
CPU_USAGE = Gauge('app_cpu_usage_percent', 'CPU usage')

def setup_monitoring():
    """设置监控"""
    start_http_server(8000)

def monitor_resources():
    """监控资源使用"""
    MEMORY_USAGE.set(psutil.virtual_memory().used)
    CPU_USAGE.set(psutil.cpu_percent())

def log_request(func):
    """请求监控装饰器"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start_time

        REQUEST_COUNT.labels(method=request.method, endpoint=request.endpoint).inc()
        REQUEST_DURATION.observe(duration)

        return result
    return wrapper
```

#### 日志监控
```python
# app/logging_config.py
import logging
from logging.handlers import RotatingFileHandler
import structlog

def setup_logging():
    """设置日志配置"""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # 配置文件日志
    handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)
```

## 🔄 第九步：持续改进

### 9.1 定期代码审查
```bash
# 每周运行代码审查
claude code --agent code-reviewer

# 每月运行安全审计
claude code --agent security-auditor

# 每季度运行架构评估
claude code --agent architect-review
```

### 9.2 性能优化
```bash
# 定期性能分析
claude code --agent performance-engineer

# 监控数据分析
python scripts/analyze_metrics.py

# 缓存效果评估
python scripts/evaluate_cache.py
```

## 📋 总结

这个完整的开发和测试流程提供了：

1. **结构化的开发流程** - 从需求到部署的完整生命周期
2. **Claude Code工具链集成** - 充分利用专家代理的优势
3. **最佳实践** - 测试驱动开发、代码质量检查、持续集成
4. **自动化** - 自动化测试、部署、监控
5. **可维护性** - 完整的文档和监控系统

使用这个流程，您可以确保高质量的代码交付和稳定的项目运行。

---

**快速开始命令：**
```bash
# 1. 设置项目
~/.config/claude/setup-project-agents.sh fullstack .

# 2. 需求分析
claude code --agent business-analyst

# 3. 架构设计
claude code --agent architect-review

# 4. 开发实施
claude code --agent backend-architect
claude code --agent frontend-developer

# 5. 测试验证
claude code --agent tdd-orchestrator
pytest

# 6. 代码审查
claude code --agent code-reviewer

# 7. 部署上线
claude code --agent devops-troubleshooter

# 8. 监控维护
claude code --agent performance-engineer
```