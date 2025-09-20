# -*- coding: utf-8 -*-
"""
日志配置模块
"""

import logging
import logging.handlers
import os
from pathlib import Path
from typing import Optional


def setup_logging(
    app_name: str = "social-auto-upload",
    log_level: str = "INFO",
    log_file: Optional[str] = None,
    log_format: Optional[str] = None,
    max_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> None:
    """
    设置日志配置

    Args:
        app_name: 应用名称
        log_level: 日志级别
        log_file: 日志文件路径
        log_format: 日志格式
        max_file_size: 单个日志文件最大大小
        backup_count: 保留的日志文件数量
    """
    # 默认日志格式
    if log_format is None:
        log_format = (
            "%(asctime)s - %(name)s - %(levelname)s - "
            "%(filename)s:%(lineno)d - %(message)s"
        )

    # 创建格式化器
    formatter = logging.Formatter(log_format)

    # 设置根日志器
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # 清除已有的处理器
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # 文件处理器
    if log_file:
        # 确保日志目录存在
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        # 使用轮转文件处理器
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_file_size,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(getattr(logging, log_level.upper()))
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    # 设置第三方库日志级别
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("werkzeug").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    获取指定名称的日志器

    Args:
        name: 日志器名称

    Returns:
        Logger 实例
    """
    return logging.getLogger(name)


class RequestLoggingMiddleware:
    """请求日志中间件"""

    def __init__(self, app):
        self.app = app
        self.logger = get_logger("request")

    def __call__(self, environ, start_response):
        """WSGI 应用调用"""
        def new_start_response(status, response_headers, exc_info=None):
            """记录响应状态"""
            self.logger.info(
                f"Request: {environ.get('REQUEST_METHOD')} {environ.get('PATH_INFO')} "
                f"- Status: {status}"
            )
            return start_response(status, response_headers, exc_info)

        return self.app(environ, new_start_response)


def log_function_call(func):
    """函数调用日志装饰器"""
    def wrapper(*args, **kwargs):
        logger = get_logger(func.__module__)
        logger.info(f"Calling function: {func.__name__}")
        try:
            result = func(*args, **kwargs)
            logger.info(f"Function {func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"Function {func.__name__} failed: {str(e)}")
            raise
    return wrapper


def log_performance(func):
    """性能监控装饰器"""
    import time

    def wrapper(*args, **kwargs):
        logger = get_logger("performance")
        start_time = time.time()

        try:
            result = func(*args, **kwargs)
            end_time = time.time()
            execution_time = end_time - start_time

            logger.info(
                f"Function {func.__name__} executed in {execution_time:.3f} seconds"
            )

            # 如果执行时间过长，记录警告
            if execution_time > 5.0:  # 超过5秒
                logger.warning(
                    f"Function {func.__name__} took too long: {execution_time:.3f} seconds"
                )

            return result
        except Exception as e:
            end_time = time.time()
            execution_time = end_time - start_time
            logger.error(
                f"Function {func.__name__} failed after {execution_time:.3f} seconds: {str(e)}"
            )
            raise
    return wrapper


class SecurityLogger:
    """安全日志记录器"""

    def __init__(self):
        self.logger = get_logger("security")

    def log_login_attempt(self, username: str, success: bool, ip: str):
        """记录登录尝试"""
        if success:
            self.logger.info(f"Successful login for user: {username} from IP: {ip}")
        else:
            self.logger.warning(f"Failed login attempt for user: {username} from IP: {ip}")

    def log_permission_denied(self, user: str, action: str, resource: str):
        """记录权限拒绝"""
        self.logger.warning(
            f"Permission denied for user: {user} attempting to {action} on {resource}"
        )

    def log_suspicious_activity(self, user: str, activity: str, details: str):
        """记录可疑活动"""
        self.logger.error(
            f"Suspicious activity by user: {user} - {activity}: {details}"
        )

    def log_api_call(self, endpoint: str, method: str, user: str, status_code: int):
        """记录API调用"""
        self.logger.info(
            f"API call: {method} {endpoint} by user: {user} - Status: {status_code}"
        )