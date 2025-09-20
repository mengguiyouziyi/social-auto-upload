"""
安全模块 - 处理认证、授权和安全相关功能
"""

import os
import hashlib
import hmac
import jwt
import secrets
from datetime import datetime, timedelta
from functools import wraps
from typing import Optional, Dict, Any
from flask import request, jsonify, g
import sqlite3
import re

class SecurityManager:
    """安全管理器"""

    def __init__(self, app=None):
        self.app = app
        self.secret_key = None
        self.token_expiry = 24 * 60 * 60  # 24小时
        self.rate_limits = {}
        if app:
            self.init_app(app)

    def init_app(self, app):
        """初始化安全配置"""
        self.secret_key = app.config.get('SECRET_KEY', os.urandom(32))
        app.config['SECRET_KEY'] = self.secret_key

        # 安全HTTP头部
        @app.after_request
        def add_security_headers(response):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response

    def generate_token(self, user_id: str, additional_claims: Optional[Dict] = None) -> str:
        """生成JWT令牌"""
        claims = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(seconds=self.token_expiry),
            'iat': datetime.utcnow()
        }
        if additional_claims:
            claims.update(additional_claims)
        return jwt.encode(claims, self.secret_key, algorithm='HS256')

    def verify_token(self, token: str) -> Optional[Dict]:
        """验证JWT令牌"""
        try:
            return jwt.decode(token, self.secret_key, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def hash_password(self, password: str) -> str:
        """密码哈希"""
        salt = secrets.token_hex(16)
        pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return salt + pwdhash.hex()

    def verify_password(self, stored_password: str, provided_password: str) -> bool:
        """验证密码"""
        salt = stored_password[:32]
        stored_hash = stored_password[32:]
        pwdhash = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return pwdhash.hex() == stored_hash

    def sanitize_input(self, input_string: str) -> str:
        """输入消毒"""
        if not input_string:
            return ""

        # 移除潜在的危险字符
        sanitized = re.sub(r'[<>"\']', '', input_string)
        # 防止SQL注入
        sanitized = re.sub(r'[;\'"]', '', sanitized)
        # 防止命令注入
        sanitized = re.sub(r'[&|;$()]', '', sanitized)

        return sanitized.strip()

    def validate_file_type(self, filename: str, allowed_types: list) -> bool:
        """验证文件类型"""
        file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        return file_extension in allowed_types

    def validate_file_size(self, file_size: int, max_size: int) -> bool:
        """验证文件大小"""
        return file_size <= max_size

    def rate_limit_check(self, key: str, limit: int, window: int) -> bool:
        """速率限制检查"""
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=window)

        if key not in self.rate_limits:
            self.rate_limits[key] = []

        # 清理过期记录
        self.rate_limits[key] = [
            timestamp for timestamp in self.rate_limits[key]
            if timestamp > window_start
        ]

        return len(self.rate_limits[key]) < limit

    def rate_limit_increment(self, key: str):
        """增加速率限制计数"""
        if key not in self.rate_limits:
            self.rate_limits[key] = []
        self.rate_limits[key].append(datetime.utcnow())

def require_auth(f):
    """认证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Missing authentication token'}), 401

        if token.startswith('Bearer '):
            token = token[7:]

        security_manager = SecurityManager()
        payload = security_manager.verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        g.user_id = payload['user_id']
        return f(*args, **kwargs)
    return decorated_function

def require_admin(f):
    """管理员权限装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user_id'):
            return jsonify({'error': 'Authentication required'}), 401

        # 检查用户是否为管理员
        conn = sqlite3.connect('social_upload.db')
        cursor = conn.cursor()
        cursor.execute("SELECT is_admin FROM users WHERE id = ?", (g.user_id,))
        result = cursor.fetchone()
        conn.close()

        if not result or not result[0]:
            return jsonify({'error': 'Admin privileges required'}), 403

        return f(*args, **kwargs)
    return decorated_function

def sanitize_html_content(content: str) -> str:
    """HTML内容消毒"""
    import bleach
    # 允许的基本HTML标签
    allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    allowed_attributes = {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title']
    }

    return bleach.clean(content, tags=allowed_tags, attributes=allowed_attributes)

def log_security_event(event_type: str, details: Dict[str, Any]):
    """记录安全事件"""
    from error_handler import get_error_handler

    handler = get_error_handler()
    handler.security_event(event_type, **details)

def create_csrf_token() -> str:
    """创建CSRF令牌"""
    return secrets.token_urlsafe(32)

def verify_csrf_token(token: str, session_token: str) -> bool:
    """验证CSRF令牌"""
    return hmac.compare_digest(token, session_token)

# 安全配置常量
SECURITY_CONFIG = {
    'PASSWORD_MIN_LENGTH': 8,
    'PASSWORD_MAX_LENGTH': 128,
    'SESSION_TIMEOUT': 3600,  # 1小时
    'MAX_LOGIN_ATTEMPTS': 5,
    'LOGIN_LOCKOUT_TIME': 300,  # 5分钟
    'ALLOWED_FILE_TYPES': ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    'MAX_FILE_SIZE': 500 * 1024 * 1024,  # 500MB
    'RATE_LIMIT_REQUESTS': 100,  # 每分钟请求数
    'RATE_LIMIT_WINDOW': 60,
}