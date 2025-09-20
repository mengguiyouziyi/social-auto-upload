import logging
import json
import traceback
import sqlite3
from datetime import datetime
from functools import wraps
from typing import Any, Dict, Optional, Tuple
from pathlib import Path
from conf import BASE_DIR

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if hasattr(obj, '__dict__'):
            return obj.__dict__
        return str(obj)

class LoggingConfig:
    def __init__(self):
        self.log_dir = Path(BASE_DIR / "logs")
        self.log_dir.mkdir(exist_ok=True)

        # 创建不同级别的日志文件
        self.log_files = {
            'info': self.log_dir / 'app.log',
            'error': self.log_dir / 'error.log',
            'access': self.log_dir / 'access.log',
            'performance': self.log_dir / 'performance.log',
            'security': self.log_dir / 'security.log'
        }

        # 配置日志格式
        self.formatters = {
            'standard': logging.Formatter(
                '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
            ),
            'detailed': logging.Formatter(
                '%(asctime)s [%(levelname)s] %(name)s:%(lineno)d: %(message)s'
            ),
            'json': logging.Formatter(
                '%(asctime)s %(name)s %(levelname)s %(message)s'
            )
        }

class Logger:
    def __init__(self, name: str = 'sau_backend'):
        self.name = name
        self.config = LoggingConfig()
        self.loggers = {}
        self._setup_loggers()

    def _setup_loggers(self):
        """设置不同类型的日志记录器"""

        # 主应用日志
        self.loggers['app'] = logging.getLogger(f'{self.name}.app')
        self.loggers['app'].setLevel(logging.INFO)

        # 错误日志
        self.loggers['error'] = logging.getLogger(f'{self.name}.error')
        self.loggers['error'].setLevel(logging.ERROR)

        # 访问日志
        self.loggers['access'] = logging.getLogger(f'{self.name}.access')
        self.loggers['access'].setLevel(logging.INFO)

        # 性能日志
        self.loggers['performance'] = logging.getLogger(f'{self.name}.performance')
        self.loggers['performance'].setLevel(logging.INFO)

        # 安全日志
        self.loggers['security'] = logging.getLogger(f'{self.name}.security')
        self.loggers['security'].setLevel(logging.INFO)

        # 配置文件处理器
        for logger_type, logger in self.loggers.items():
            if logger_type in self.config.log_files:
                handler = logging.FileHandler(
                    self.config.log_files[logger_type],
                    encoding='utf-8'
                )

                # 根据日志类型选择格式化器
                if logger_type == 'access':
                    formatter = self.config.formatters['json']
                else:
                    formatter = self.config.formatters['detailed']

                handler.setFormatter(formatter)
                logger.addHandler(handler)

                # 避免重复日志
                logger.propagate = False

    def info(self, message: str, **kwargs):
        """记录信息日志"""
        self._log_with_context('app', logging.INFO, message, **kwargs)

    def error(self, message: str, error: Optional[Exception] = None, **kwargs):
        """记录错误日志"""
        context = kwargs.copy()
        if error:
            context['error_type'] = type(error).__name__
            context['error_message'] = str(error)
            context['traceback'] = traceback.format_exc()

        self._log_with_context('error', logging.ERROR, message, **context)

    def warning(self, message: str, **kwargs):
        """记录警告日志"""
        self._log_with_context('app', logging.WARNING, message, **kwargs)

    def debug(self, message: str, **kwargs):
        """记录调试日志"""
        self._log_with_context('app', logging.DEBUG, message, **kwargs)

    def access(self, method: str, path: str, status_code: int,
               ip: str, user_agent: str, response_time: float, **kwargs):
        """记录访问日志"""
        context = {
            'method': method,
            'path': path,
            'status_code': status_code,
            'ip': ip,
            'user_agent': user_agent,
            'response_time': response_time,
            **kwargs
        }
        self._log_with_context('access', logging.INFO, f"{method} {path}", **context)

    def performance(self, operation: str, duration: float, **kwargs):
        """记录性能日志"""
        context = {
            'operation': operation,
            'duration': duration,
            **kwargs
        }
        self._log_with_context('performance', logging.INFO,
                              f"Performance: {operation} took {duration:.2f}s", **context)

    def security_event(self, event: str, **kwargs):
        """记录安全日志"""
        context = {
            'event': event,
            **kwargs
        }
        self._log_with_context('security', logging.INFO, f"Security Event: {event}", **context)

    def _log_with_context(self, logger_type: str, level: int, message: str, **kwargs):
        """带上下文的日志记录"""
        if kwargs:
            context_str = json.dumps(kwargs, cls=CustomJSONEncoder, ensure_ascii=False)
            full_message = f"{message} | Context: {context_str}"
        else:
            full_message = message

        logger = self.loggers.get(logger_type, self.loggers['app'])
        logger.log(level, full_message)

# 全局日志实例
logger = Logger()

class APIError(Exception):
    """自定义API错误类"""
    def __init__(self, message: str, status_code: int = 500,
                 error_code: str = None, details: Dict[str, Any] = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or 'INTERNAL_ERROR'
        self.details = details or {}
        super().__init__(self.message)

def handle_database_errors(func):
    """数据库错误处理装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except sqlite3.Error as e:
            logger.error(f"数据库错误: {str(e)}", error=e,
                        function=func.__name__, args=args, kwargs=kwargs)
            raise APIError("数据库操作失败", status_code=500,
                          error_code="DATABASE_ERROR",
                          details={"database_error": str(e)})
        except Exception as e:
            logger.error(f"未知数据库错误: {str(e)}", error=e,
                        function=func.__name__, args=args, kwargs=kwargs)
            raise APIError("数据库操作失败", status_code=500,
                          error_code="UNKNOWN_DATABASE_ERROR")
    return wrapper

def handle_file_errors(func):
    """文件操作错误处理装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except FileNotFoundError as e:
            logger.error(f"文件未找到: {str(e)}", error=e,
                        function=func.__name__, args=args, kwargs=kwargs)
            raise APIError("文件未找到", status_code=404,
                          error_code="FILE_NOT_FOUND")
        except PermissionError as e:
            logger.error(f"文件权限错误: {str(e)}", error=e,
                        function=func.__name__, args=args, kwargs=kwargs)
            raise APIError("文件权限错误", status_code=403,
                          error_code="FILE_PERMISSION_ERROR")
        except OSError as e:
            logger.error(f"文件系统错误: {str(e)}", error=e,
                        function=func.__name__, args=args, kwargs=kwargs)
            raise APIError("文件系统错误", status_code=500,
                          error_code="FILE_SYSTEM_ERROR")
    return wrapper

def handle_upload_errors(func):
    """上传错误处理装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"上传错误: {str(e)}", error=e,
                        function=func.__name__, args=args, kwargs=kwargs)
            raise APIError("文件上传失败", status_code=500,
                          error_code="UPLOAD_ERROR",
                          details={"upload_error": str(e)})
    return wrapper

def handle_auth_errors(func):
    """认证错误处理装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"认证错误: {str(e)}", error=e,
                        function=func.__name__, args=args, kwargs=kwargs)
            raise APIError("认证失败", status_code=401,
                          error_code="AUTH_ERROR",
                          details={"auth_error": str(e)})
    return wrapper

def log_api_call(func):
    """API调用日志装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = datetime.now()
        request = kwargs.get('request') or (args[0] if args and hasattr(args[0], 'method') else None)

        try:
            result = func(*args, **kwargs)
            duration = (datetime.now() - start_time).total_seconds()

            if request:
                logger.access(
                    method=request.method,
                    path=request.path,
                    status_code=200,
                    ip=request.remote_addr,
                    user_agent=request.headers.get('User-Agent', ''),
                    response_time=duration,
                    function=func.__name__
                )

            logger.performance(
                operation=func.__name__,
                duration=duration,
                success=True
            )

            return result

        except APIError as e:
            duration = (datetime.now() - start_time).total_seconds()

            if request:
                logger.access(
                    method=request.method,
                    path=request.path,
                    status_code=e.status_code,
                    ip=request.remote_addr,
                    user_agent=request.headers.get('User-Agent', ''),
                    response_time=duration,
                    function=func.__name__
                )

            logger.performance(
                operation=func.__name__,
                duration=duration,
                success=False,
                error_code=e.error_code
            )

            raise

        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()

            if request:
                logger.access(
                    method=request.method,
                    path=request.path,
                    status_code=500,
                    ip=request.remote_addr,
                    user_agent=request.headers.get('User-Agent', ''),
                    response_time=duration,
                    function=func.__name__
                )

            logger.performance(
                operation=func.__name__,
                duration=duration,
                success=False,
                error_type=type(e).__name__
            )

            logger.error(f"未处理的API错误: {str(e)}", error=e,
                        function=func.__name__, args=args, kwargs=kwargs)

            raise APIError("内部服务器错误", status_code=500,
                          error_code="INTERNAL_SERVER_ERROR")

    return wrapper

def validate_input(data: Dict[str, Any], required_fields: list) -> Tuple[bool, str]:
    """输入验证"""
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            return False, f"缺少必填字段: {field}"

    return True, ""

def sanitize_input(data: Any) -> Any:
    """输入消毒"""
    if isinstance(data, str):
        # 防止XSS攻击
        return data.replace('<', '&lt;').replace('>', '&gt;')
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    else:
        return data

def security_event(event: str, **kwargs):
    """记录安全事件"""
    logger.security(event, **kwargs)

def get_error_response(error: APIError) -> Dict[str, Any]:
    """获取错误响应格式"""
    return {
        "code": error.status_code,
        "msg": error.message,
        "data": None,
        "error_code": error.error_code,
        "details": error.details
    }

def get_success_response(data: Any = None, message: str = "success") -> Dict[str, Any]:
    """获取成功响应格式"""
    return {
        "code": 200,
        "msg": message,
        "data": data
    }

# 错误代码常量
ERROR_CODES = {
    'DATABASE_ERROR': {'code': 500, 'message': '数据库操作失败'},
    'FILE_NOT_FOUND': {'code': 404, 'message': '文件未找到'},
    'FILE_PERMISSION_ERROR': {'code': 403, 'message': '文件权限错误'},
    'FILE_SYSTEM_ERROR': {'code': 500, 'message': '文件系统错误'},
    'UPLOAD_ERROR': {'code': 500, 'message': '文件上传失败'},
    'AUTH_ERROR': {'code': 401, 'message': '认证失败'},
    'VALIDATION_ERROR': {'code': 400, 'message': '输入验证失败'},
    'INTERNAL_SERVER_ERROR': {'code': 500, 'message': '内部服务器错误'},
    'RATE_LIMIT_EXCEEDED': {'code': 429, 'message': '请求频率超限'},
    'INVALID_INPUT': {'code': 400, 'message': '无效输入'},
    'RESOURCE_NOT_FOUND': {'code': 404, 'message': '资源未找到'},
    'CONFLICT': {'code': 409, 'message': '资源冲突'},
    'SERVICE_UNAVAILABLE': {'code': 503, 'message': '服务不可用'}
}