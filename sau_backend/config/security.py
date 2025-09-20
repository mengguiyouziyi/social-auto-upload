# -*- coding: utf-8 -*-
"""
安全配置模块
"""

import os
import secrets
import re
from typing import List, Optional, Set
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import hashlib
import ipaddress


class SecurityConfig:
    """安全配置类"""

    # JWT 配置
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', secrets.token_urlsafe(32))
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 86400))  # 24小时
    JWT_REFRESH_TOKEN_EXPIRES = int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', 604800))  # 7天

    # 密码策略
    MIN_PASSWORD_LENGTH = 8
    MAX_PASSWORD_LENGTH = 128
    REQUIRE_SPECIAL_CHARS = True
    REQUIRE_NUMBERS = True
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True

    # 速率限制
    RATE_LIMIT_REQUESTS = 100  # 每分钟请求数
    RATE_LIMIT_WINDOW = 60  # 时间窗口（秒）

    # CORS 配置
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

    # 安全头部
    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }

    # 文件上传安全
    ALLOWED_EXTENSIONS = {
        'jpg', 'jpeg', 'png', 'gif', 'webp',  # 图片
        'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm',  # 视频
        'pdf', 'doc', 'docx', 'txt'  # 文档
    }
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

    # IP 白名单
    ALLOWED_IPS = set()
    BLOCKED_IPS = set()

    # 会话安全
    SESSION_TIMEOUT = 3600  # 1小时
    MAX_CONCURRENT_SESSIONS = 5


class PasswordValidator:
    """密码验证器"""

    @staticmethod
    def validate_password(password: str) -> tuple[bool, str]:
        """
        验证密码强度

        Args:
            password: 要验证的密码

        Returns:
            (is_valid, error_message)
        """
        if not password:
            return False, "密码不能为空"

        # 检查长度
        if len(password) < SecurityConfig.MIN_PASSWORD_LENGTH:
            return False, f"密码长度不能少于 {SecurityConfig.MIN_PASSWORD_LENGTH} 个字符"

        if len(password) > SecurityConfig.MAX_PASSWORD_LENGTH:
            return False, f"密码长度不能超过 {SecurityConfig.MAX_PASSWORD_LENGTH} 个字符"

        # 检查复杂度
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(not c.isalnum() for c in password)

        errors = []

        if SecurityConfig.REQUIRE_UPPERCASE and not has_upper:
            errors.append("必须包含大写字母")

        if SecurityConfig.REQUIRE_LOWERCASE and not has_lower:
            errors.append("必须包含小写字母")

        if SecurityConfig.REQUIRE_NUMBERS and not has_digit:
            errors.append("必须包含数字")

        if SecurityConfig.REQUIRE_SPECIAL_CHARS and not has_special:
            errors.append("必须包含特殊字符")

        # 检查常见弱密码
        common_passwords = [
            '123456', 'password', '12345678', 'qwerty', '123456789',
            '12345', '1234', '111111', '1234567', 'dragon', '123123',
            'baseball', 'abc123', 'football', 'monkey', 'letmein',
            '696969', 'shadow', 'master', '666666', 'qwertyuiop',
            '123321', 'mustang', '1234567890', 'michael', '654321'
        ]

        if password.lower() in common_passwords:
            errors.append("不能使用常见弱密码")

        if errors:
            return False, "、".join(errors)

        return True, "密码强度符合要求"

    @staticmethod
    def hash_password(password: str) -> str:
        """密码哈希"""
        return generate_password_hash(password)

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """验证密码"""
        return check_password_hash(password_hash, password)


class JWTManager:
    """JWT 管理器"""

    @staticmethod
    def generate_access_token(user_id: str, user_role: str = 'user') -> str:
        """生成访问令牌"""
        payload = {
            'user_id': user_id,
            'role': user_role,
            'exp': datetime.utcnow() + timedelta(seconds=SecurityConfig.JWT_ACCESS_TOKEN_EXPIRES),
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        return jwt.encode(payload, SecurityConfig.JWT_SECRET_KEY, algorithm='HS256')

    @staticmethod
    def generate_refresh_token(user_id: str) -> str:
        """生成刷新令牌"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(seconds=SecurityConfig.JWT_REFRESH_TOKEN_EXPIRES),
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        return jwt.encode(payload, SecurityConfig.JWT_SECRET_KEY, algorithm='HS256')

    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """验证令牌"""
        try:
            payload = jwt.decode(token, SecurityConfig.JWT_SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None


class FileSecurity:
    """文件安全检查"""

    @staticmethod
    def is_safe_filename(filename: str) -> bool:
        """检查文件名是否安全"""
        if not filename:
            return False

        # 检查文件名长度
        if len(filename) > 255:
            return False

        # 检查危险字符
        dangerous_chars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in dangerous_chars:
            if char in filename:
                return False

        # 检查扩展名
        extension = filename.split('.')[-1].lower()
        return extension in SecurityConfig.ALLOWED_EXTENSIONS

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """清理文件名"""
        # 移除危险字符
        filename = re.sub(r'[<>:"/\\|?*]', '', filename)

        # 替换空格为下划线
        filename = filename.replace(' ', '_')

        # 限制长度
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:255-len(ext)] + ext

        return filename

    @staticmethod
    def calculate_file_hash(file_path: str) -> str:
        """计算文件哈希值"""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()


class InputValidator:
    """输入验证器"""

    @staticmethod
    def sanitize_input(input_str: str) -> str:
        """清理输入字符串"""
        if not input_str:
            return ""

        # 移除潜在的恶意字符
        input_str = re.sub(r'<script[^>]*>.*?</script>', '', input_str, flags=re.IGNORECASE)
        input_str = re.sub(r'javascript:', '', input_str, flags=re.IGNORECASE)
        input_str = re.sub(r'on\w+\s*=', '', input_str, flags=re.IGNORECASE)

        return input_str.strip()

    @staticmethod
    def validate_email(email: str) -> bool:
        """验证邮箱格式"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

    @staticmethod
    def validate_url(url: str) -> bool:
        """验证URL格式"""
        try:
            result = re.match(
                r'^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$',
                url
            )
            return result is not None
        except:
            return False


class RateLimiter:
    """简单的内存速率限制器"""

    def __init__(self):
        self.requests = {}

    def is_allowed(self, key: str, max_requests: int, window: int) -> bool:
        """检查是否允许请求"""
        import time

        current_time = time.time()

        # 清理过期记录
        if key in self.requests:
            self.requests[key] = [req_time for req_time in self.requests[key]
                               if current_time - req_time < window]
        else:
            self.requests[key] = []

        # 检查是否超过限制
        if len(self.requests[key]) >= max_requests:
            return False

        # 记录当前请求
        self.requests[key].append(current_time)
        return True


# 全局实例
password_validator = PasswordValidator()
jwt_manager = JWTManager()
file_security = FileSecurity()
input_validator = InputValidator()
rate_limiter = RateLimiter()


def add_security_headers(response):
    """添加安全头部"""
    for header, value in SecurityConfig.SECURITY_HEADERS.items():
        response.headers[header] = value
    return response


def require_auth(f):
    """认证装饰器"""
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401

        try:
            if token.startswith('Bearer '):
                token = token[7:]

            payload = jwt_manager.verify_token(token)
            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401

            # 将用户信息添加到请求上下文
            request.user_id = payload['user_id']
            request.user_role = payload.get('role', 'user')

        except Exception as e:
            return jsonify({'error': 'Authentication failed'}), 401

        return f(*args, **kwargs)
    return decorated


def require_role(role: str):
    """角色权限装饰器"""
    def decorator(f):
        def decorated(*args, **kwargs):
            if not hasattr(request, 'user_role') or request.user_role != role:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator