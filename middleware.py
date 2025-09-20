import json
import time
import sqlite3
from datetime import datetime
from pathlib import Path
from flask import request, g, jsonify
from functools import wraps
from typing import Dict, Any, Optional, Callable
from conf import BASE_DIR
from error_handler import logger, APIError, security_event, sanitize_input, validate_input

class RequestMonitor:
    """请求监控中间件"""

    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)

    def init_app(self, app):
        """初始化应用"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        app.teardown_request(self.teardown_request)
        app.errorhandler(APIError)(self.handle_api_error)
        app.errorhandler(404)(self.handle_404)
        app.errorhandler(500)(self.handle_500)
        app.errorhandler(413)(self.handle_413)

    def before_request(self):
        """请求前处理"""
        g.start_time = time.time()
        g.request_id = f"req_{int(time.time() * 1000)}"

        # 记录请求开始
        logger.info(f"请求开始: {request.method} {request.path}",
                   request_id=g.request_id,
                   method=request.method,
                   path=request.path,
                   ip=request.remote_addr,
                   user_agent=request.headers.get('User-Agent', ''),
                   headers=dict(request.headers))

        # 安全检查
        self._security_check()

        # 请求限制检查
        self._rate_limit_check()

    def after_request(self, response):
        """请求后处理"""
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time

            # 记录请求完成
            logger.info(f"请求完成: {request.method} {request.path}",
                       request_id=g.request_id,
                       status_code=response.status_code,
                       duration=duration,
                       response_size=len(response.data) if response.data else 0)

            # 记录访问日志
            logger.access(
                method=request.method,
                path=request.path,
                status_code=response.status_code,
                ip=request.remote_addr,
                user_agent=request.headers.get('User-Agent', ''),
                response_time=duration,
                request_id=g.request_id
            )

            # 记录性能日志
            logger.performance(
                operation=f"{request.method} {request.path}",
                duration=duration,
                success=response.status_code < 400
            )

            # 添加响应头
            response.headers['X-Request-ID'] = g.request_id
            response.headers['X-Response-Time'] = f"{duration:.3f}s"

        return response

    def teardown_request(self, exception):
        """请求清理"""
        if exception:
            logger.error(f"请求异常: {str(exception)}", error=exception,
                       request_id=getattr(g, 'request_id', 'unknown'),
                       path=request.path if request else 'unknown')

    def _security_check(self):
        """安全检查"""
        # 检查路径遍历攻击
        if '..' in request.path or '//' in request.path:
            security_event("POTENTIAL_PATH_TRAVERSAL",
                           path=request.path,
                           ip=request.remote_addr)
            raise APIError("无效的请求路径", status_code=400, error_code="INVALID_PATH")

        # 检查SQL注入（更智能的检查）
        sql_keywords = ['union', 'select', 'insert', 'update', 'drop', 'exec']
        path_lower = request.path.lower()
        query_string = request.query_string.decode('utf-8', errors='ignore').lower()

        for keyword in sql_keywords:
            # 跳过合法的API路径中的关键词
            if keyword in path_lower and path_lower.startswith(f'/{keyword}'):
                continue

            # 检查查询字符串中的可疑模式
            if keyword in query_string:
                # 检查是否是SQL操作的一部分（如后面跟着空格或其他SQL关键词）
                query_parts = query_string.split('&')
                for part in query_parts:
                    if keyword in part and (
                        ' ' in part or
                        part.startswith(keyword) and (len(part) > len(keyword) and part[len(keyword)] in [' ', '=', ';'])
                    ):
                        security_event("POTENTIAL_SQL_INJECTION",
                                       path=request.path,
                                       query_string=request.query_string,
                                       ip=request.remote_addr)
                        raise APIError("无效的请求参数", status_code=400, error_code="INVALID_INPUT")

        # 检查请求大小
        if request.content_length and request.content_length > 100 * 1024 * 1024:  # 100MB
            security_event("LARGE_REQUEST",
                           content_length=request.content_length,
                           ip=request.remote_addr)
            raise APIError("请求过大", status_code=413, error_code="REQUEST_TOO_LARGE")

    def _rate_limit_check(self):
        """请求频率限制检查"""
        # 简单的IP限制
        ip = request.remote_addr
        current_time = int(time.time())

        try:
            with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
                cursor = conn.cursor()

                # 检查请求频率
                cursor.execute("""
                    SELECT COUNT(*) FROM rate_limits
                    WHERE ip = ? AND timestamp > ?
                """, (ip, current_time - 60))  # 1分钟内

                count = cursor.fetchone()[0]

                if count > 100:  # 每分钟最多100次请求
                    security_event("RATE_LIMIT_EXCEEDED",
                                   ip=ip,
                                   count=count)
                    raise APIError("请求频率超限", status_code=429, error_code="RATE_LIMIT_EXCEEDED")

                # 记录请求
                cursor.execute("""
                    INSERT INTO rate_limits (ip, timestamp)
                    VALUES (?, ?)
                """, (ip, current_time))

                # 清理旧记录
                cursor.execute("""
                    DELETE FROM rate_limits
                    WHERE timestamp < ?
                """, (current_time - 3600,))  # 清理1小时前的记录

                conn.commit()

        except Exception as e:
            logger.error(f"频率限制检查失败: {str(e)}", error=e)

    def handle_api_error(self, error):
        """处理API错误"""
        response = {
            "code": error.status_code,
            "msg": error.message,
            "data": None,
            "error_code": error.error_code,
            "details": error.details,
            "request_id": getattr(g, 'request_id', 'unknown')
        }

        logger.error(f"API错误: {error.message}",
                    error_code=error.error_code,
                    status_code=error.status_code,
                    details=error.details,
                    request_id=getattr(g, 'request_id', 'unknown'))

        return jsonify(response), error.status_code

    def handle_404(self, error):
        """处理404错误"""
        response = {
            "code": 404,
            "msg": "接口不存在",
            "data": None,
            "error_code": "ENDPOINT_NOT_FOUND",
            "request_id": getattr(g, 'request_id', 'unknown')
        }

        logger.warning(f"404错误: {request.path}",
                      request_id=getattr(g, 'request_id', 'unknown'))

        return jsonify(response), 404

    def handle_500(self, error):
        """处理500错误"""
        response = {
            "code": 500,
            "msg": "内部服务器错误",
            "data": None,
            "error_code": "INTERNAL_SERVER_ERROR",
            "request_id": getattr(g, 'request_id', 'unknown')
        }

        logger.error(f"500错误: {str(error)}",
                    error=error,
                    request_id=getattr(g, 'request_id', 'unknown'))

        return jsonify(response), 500

    def handle_413(self, error):
        """处理413错误"""
        response = {
            "code": 413,
            "msg": "文件过大",
            "data": None,
            "error_code": "FILE_TOO_LARGE",
            "request_id": getattr(g, 'request_id', 'unknown')
        }

        logger.warning(f"413错误: 文件过大",
                      request_id=getattr(g, 'request_id', 'unknown'))

        return jsonify(response), 413

def create_rate_limit_table():
    """创建请求限制表"""
    try:
        with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ip TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 创建索引提高查询性能
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_timestamp
                ON rate_limits (ip, timestamp)
            ''')

            conn.commit()
            print("✅ 请求限制表创建成功")
    except Exception as e:
        print(f"❌ 请求限制表创建失败: {e}")

def validate_json_fields(required_fields: list):
    """JSON字段验证装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                data = request.get_json()
                if not data:
                    raise APIError("无效的JSON数据", status_code=400, error_code="INVALID_JSON")

                # 验证必填字段
                for field in required_fields:
                    if field not in data:
                        raise APIError(f"缺少必填字段: {field}", status_code=400, error_code="MISSING_FIELD")

                # 消毒输入
                sanitized_data = sanitize_input(data)
                request._cached_json = (sanitized_data, request._cached_json[1])

                return f(*args, **kwargs)

            except APIError:
                raise
            except Exception as e:
                logger.error(f"JSON验证失败: {str(e)}", error=e)
                raise APIError("数据验证失败", status_code=400, error_code="VALIDATION_ERROR")

        return decorated_function
    return decorator

def validate_query_params(required_params: list):
    """查询参数验证装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                for param in required_params:
                    if param not in request.args:
                        raise APIError(f"缺少查询参数: {param}", status_code=400, error_code="MISSING_PARAM")

                return f(*args, **kwargs)

            except APIError:
                raise
            except Exception as e:
                logger.error(f"查询参数验证失败: {str(e)}", error=e)
                raise APIError("参数验证失败", status_code=400, error_code="VALIDATION_ERROR")

        return decorated_function
    return decorator

def require_auth(f):
    """认证要求装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 这里可以添加具体的认证逻辑
        # 例如检查token、session等
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            security_event("MISSING_AUTH_TOKEN",
                          path=request.path,
                          ip=request.remote_addr)
            raise APIError("缺少认证信息", status_code=401, error_code="MISSING_AUTH")

        # 简单的token验证（实际应用中应该更复杂）
        if not auth_header.startswith('Bearer '):
            security_event("INVALID_AUTH_TOKEN",
                          path=request.path,
                          ip=request.remote_addr)
            raise APIError("无效的认证信息", status_code=401, error_code="INVALID_AUTH")

        return f(*args, **kwargs)

    return decorated_function

def cache_response(timeout: int = 300):
    """响应缓存装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            cache_key = f"{request.path}_{request.query_string.decode('utf-8')}"

            # 检查缓存
            cached_response = get_cache(cache_key)
            if cached_response:
                logger.info(f"缓存命中: {cache_key}")
                return cached_response

            # 执行函数
            response = f(*args, **kwargs)

            # 设置缓存
            set_cache(cache_key, response, timeout)

            return response

        return decorated_function
    return decorator

def get_cache(key: str) -> Optional[Any]:
    """获取缓存"""
    try:
        with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT data FROM cache
                WHERE key = ? AND expires_at > datetime('now')
            """, (key,))

            result = cursor.fetchone()
            if result:
                return json.loads(result[0])
    except Exception as e:
        logger.error(f"缓存获取失败: {str(e)}", error=e)

    return None

def set_cache(key: str, value: Any, timeout: int):
    """设置缓存"""
    try:
        with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO cache (key, data, expires_at)
                VALUES (?, ?, datetime('now', '+{} seconds'))
            """.format(timeout), (key, json.dumps(value, ensure_ascii=False)))
            conn.commit()
    except Exception as e:
        logger.error(f"缓存设置失败: {str(e)}", error=e)

def create_cache_table():
    """创建缓存表"""
    try:
        with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 清理过期缓存
            cursor.execute("""
                DELETE FROM cache
                WHERE expires_at <= datetime('now')
            """)

            conn.commit()
            print("✅ 缓存表创建成功")
    except Exception as e:
        print(f"❌ 缓存表创建失败: {e}")

# 监控中间件实例
request_monitor = RequestMonitor()