# -*- coding: utf-8 -*-
"""
Gunicorn configuration for production deployment
"""

import multiprocessing
import os

# 基础配置
bind = os.environ.get('GUNICORN_BIND', '0.0.0.0:5409')
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
timeout = 30
keepalive = 2

# 应用配置
pythonpath = os.getcwd()
wsgi_app = 'wsgi:app'

# 日志配置
accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('LOG_LEVEL', 'info')

# 安全配置
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190

# 性能优化
max_requests = 1000
max_requests_jitter = 50
preload_app = True

# 重启配置
graceful_timeout = 30
stop_timeout = 10

# 开发环境配置
if os.environ.get('FLASK_ENV') == 'development':
    workers = 1
    worker_class = 'sync'
    timeout = 120
    reload = True
    loglevel = 'debug'

# 生产环境配置
if os.environ.get('FLASK_ENV') == 'production':
    # 使用 gevent 提高并发性能
    try:
        import gevent
        worker_class = 'gevent'
        worker_connections = 1000
    except ImportError:
        worker_class = 'sync'
        worker_connections = 100

# 健康检查
def on_starting(server):
    """应用启动前的钩子"""
    print("🚀 Starting Social Auto Upload application...")

def when_ready(server):
    """应用就绪时的钩子"""
    print(f"✅ Server is ready and listening on {bind}")
    print(f"👥 Running with {workers} workers")

def on_reload(server):
    """应用重载时的钩子"""
    print("🔄 Reloading application...")

def worker_int(worker):
    """工作进程中断时的钩子"""
    print(f"⚠️  Worker {worker.pid} received interrupt")

def worker_abort(worker):
    """工作进程中止时的钩子"""
    print(f"❌ Worker {worker.pid} aborted")

def child_exit(server, worker):
    """子进程退出时的钩子"""
    print(f"👋 Child worker {worker.pid} exited")

def pre_exec(server):
    """执行前的钩子"""
    server.log.info("Forked child, re-executing.")

def post_fork(server, worker):
    """fork后的钩子"""
    server.log.info(f"Worker spawned (pid: {worker.pid})")

def post_worker_init(worker):
    """工作进程初始化后的钩子"""
    pass

def worker_exit(server, worker):
    """工作进程退出时的钩子"""
    server.log.info(f"Worker {worker.pid} exited")