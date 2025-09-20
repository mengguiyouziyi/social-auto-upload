# 使用官方 Python 运行时作为基础镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# 安装系统依赖
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        ffmpeg \
        libpq-dev \
        curl \
        gnupg \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js (用于前端构建)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# 复制 requirements 文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制前端文件
COPY sau_frontend/package.json sau_frontend/package-lock.json ./sau_frontend/
WORKDIR /app/sau_frontend

# 安装前端依赖
RUN npm ci --only=production

# 构建前端
RUN npm run build

# 返回应用根目录
WORKDIR /app

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p logs uploads/videos uploads/images uploads/temp cookies

# 设置权限
RUN chmod +x scripts/init_db.py

# 创建非 root 用户
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# 暴露端口
EXPOSE 5409

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5409/health || exit 1

# 启动命令
CMD ["python", "run_backend.py"]