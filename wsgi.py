#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WSGI entry point for production deployment
"""

import os
from pathlib import Path

# 获取项目根目录
project_root = Path(__file__).parent.resolve()

# 添加项目根目录到 Python 路径
import sys
sys.path.insert(0, str(project_root))

# 设置环境变量
os.environ.setdefault('FLASK_APP', 'run_backend.py')
os.environ.setdefault('FLASK_ENV', 'production')

# 导入应用
from sau_backend.app import create_app

# 创建应用实例
app = create_app()

if __name__ == "__main__":
    # 开发环境运行
    app.run(
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 5409)),
        debug=os.environ.get('DEBUG', 'False').lower() == 'true'
    )