"""
安全管理模块
提供JWT认证、密码哈希、输入消毒等安全功能
"""

import jwt
import bcrypt
import hashlib
import re
import secrets
import time
from datetime import datetime, timedelta
from functools import wraps
from typing import Optional, Dict, Any, List
from flask import request, jsonify, g


class SecurityManager:
    """安全管理器"""

    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or "default-secret-key-change-in-production"
        self.rate_limits = {}  # 简单的内存速率限制

    def generate_token(
        self, user_id: str, additional_claims: Dict[str, Any] = None
    ) -> str:
        """生成JWT令牌"""
        payload = {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow(),
            "type": "access",
        }

        if additional_claims:
            payload.update(additional_claims)

        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def generate_refresh_token(self, user_id: str) -> str:
        """生成刷新令牌"""
        payload = {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(days=30),
            "iat": datetime.utcnow(),
            "type": "refresh",
        }

        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """验证JWT令牌"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def hash_password(self, password: str) -> str:
        """哈希密码"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def verify_password(self, hashed_password: str, password: str) -> bool:
        """验证密码"""
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))

    def sanitize_input(self, input_data: str) -> str:
        """消毒输入数据"""
        if not input_data:
            return ""

        # 移除HTML标签
        sanitized = re.sub(r"<[^>]*>", "", input_data)

        # 移除SQL关键字
        sql_keywords = [
            "SELECT",
            "INSERT",
            "UPDATE",
            "DELETE",
            "DROP",
            "CREATE",
            "ALTER",
        ]
        for keyword in sql_keywords:
            sanitized = re.sub(keyword, "", sanitized, flags=re.IGNORECASE)

        # 移除危险字符
        dangerous_chars = [
            ";",
            "'",
            '"',
            "\\",
            "|",
            "&",
            "$",
            "(",
            ")",
            "{",
            "}",
            "[",
            "]",
            "<",
            ">",
        ]
        for char in dangerous_chars:
            sanitized = sanitized.replace(char, "")

        return sanitized.strip()

    def validate_email(self, email: str) -> bool:
        """验证邮箱格式"""
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return re.match(pattern, email) is not None

    def validate_password(self, password: str) -> bool:
        """验证密码强度"""
        if len(password) < 8:
            return False

        # 检查是否包含大小写字母、数字和特殊字符
        has_upper = re.search(r"[A-Z]", password) is not None
        has_lower = re.search(r"[a-z]", password) is not None
        has_digit = re.search(r"\d", password) is not None
        has_special = re.search(r'[!@#$%^&*(),.?":{}|<>]', password) is not None

        return has_upper and has_lower and has_digit and has_special

    def rate_limit_check(self, key: str, limit: int, window: int) -> bool:
        """检查速率限制"""
        current_time = time.time()

        if key not in self.rate_limits:
            self.rate_limits[key] = []

        # 清理过期的记录
        self.rate_limits[key] = [
            timestamp
            for timestamp in self.rate_limits[key]
            if current_time - timestamp < window
        ]

        return len(self.rate_limits[key]) < limit

    def rate_limit_increment(self, key: str):
        """增加速率限制计数"""
        current_time = time.time()
        if key not in self.rate_limits:
            self.rate_limits[key] = []
        self.rate_limits[key].append(current_time)

    def validate_file_type(self, filename: str, allowed_types: List[str]) -> bool:
        """验证文件类型"""
        file_ext = filename.split(".")[-1].lower() if "." in filename else ""
        return file_ext in allowed_types

    def validate_file_size(self, file_size: int, max_size: int) -> bool:
        """验证文件大小"""
        return file_size <= max_size


# 创建全局安全管理器实例
security_manager = SecurityManager("your-secret-key-change-in-production-2025")


def require_auth(f):
    """认证装饰器"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "缺少认证令牌"}), 401

        # 移除Bearer前缀
        if token.startswith("Bearer "):
            token = token[7:]

        payload = security_manager.verify_token(token)
        if not payload:
            return jsonify({"error": "无效的认证令牌"}), 401

        # 检查令牌类型
        if payload.get("type") != "access":
            return jsonify({"error": "无效的令牌类型"}), 401

        # 将用户信息存储到g对象中
        g.user_id = payload.get("user_id")
        g.user_payload = payload

        return f(*args, **kwargs)

    return decorated_function


def require_admin(f):
    """管理员权限装饰器"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, "user_payload") or g.user_payload.get("role") != "admin":
            return jsonify({"error": "需要管理员权限"}), 403

        return f(*args, **kwargs)

    return decorated_function


def sanitize_html_content(content: str) -> str:
    """消毒HTML内容"""
    if not content:
        return ""

    # 移除危险的HTML标签和属性
    dangerous_tags = ["script", "iframe", "object", "embed", "style", "link"]
    for tag in dangerous_tags:
        content = re.sub(
            f"<{tag}[^>]*>.*?</{tag}>", "", content, flags=re.IGNORECASE | re.DOTALL
        )

    # 移除危险属性
    dangerous_attrs = ["onclick", "onload", "onerror", "onmouseover", "javascript:"]
    for attr in dangerous_attrs:
        content = re.sub(f"{attr}=['\"][^'\"]*['\"]", "", content, flags=re.IGNORECASE)

    return content


def create_csrf_token() -> str:
    """创建CSRF令牌"""
    return secrets.token_hex(32)


def verify_csrf_token(token: str, session_token: str) -> bool:
    """验证CSRF令牌"""
    return token == session_token
