"""
配置管理模块 - 统一的配置管理
"""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path

@dataclass
class DatabaseConfig:
    """数据库配置"""
    type: str = 'sqlite'
    path: str = 'social_upload.db'
    host: str = 'localhost'
    port: int = 5432
    name: str = 'social_upload'
    user: str = ''
    password: str = ''
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30

@dataclass
class SecurityConfig:
    """安全配置"""
    secret_key: str = ''
    token_expiry: int = 86400  # 24小时
    password_min_length: int = 8
    max_login_attempts: int = 5
    login_lockout_time: int = 300  # 5分钟
    allowed_file_types: list = None
    max_file_size: int = 500 * 1024 * 1024  # 500MB
    rate_limit_requests: int = 100
    rate_limit_window: int = 60

    def __post_init__(self):
        if self.allowed_file_types is None:
            self.allowed_file_types = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']

@dataclass
class CacheConfig:
    """缓存配置"""
    type: str = 'memory'
    max_size: int = 1000
    default_ttl: int = 3600
    redis_host: str = 'localhost'
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str = ''

@dataclass
class MediaConfig:
    """媒体处理配置"""
    ffmpeg_path: str = 'ffmpeg'
    temp_dir: str = 'temp'
    output_dir: str = 'output'
    max_concurrent_processes: int = 3
    default_video_quality: str = 'medium'
    supported_formats: list = None

    def __post_init__(self):
        if self.supported_formats is None:
            self.supported_formats = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']

@dataclass
class AIConfig:
    """AI模型配置"""
    providers: Dict[str, Dict[str, Any]] = None
    default_provider: str = 'zhipu'
    timeout: int = 60
    max_retries: int = 3
    cache_ttl: int = 1800  # 30分钟

    def __post_init__(self):
        if self.providers is None:
            self.providers = {
                'zhipu': {
                    'api_key': os.getenv('ZHIPU_API_KEY', ''),
                    'base_url': 'https://open.bigmodel.cn/api/paas/v4',
                    'model': 'glm-4-flash'
                },
                'qwen': {
                    'api_key': os.getenv('QWEN_API_KEY', ''),
                    'base_url': 'https://dashscope.aliyuncs.com/api/v1',
                    'model': 'qwen-turbo'
                }
            }

@dataclass
class ServerConfig:
    """服务器配置"""
    host: str = '0.0.0.0'
    port: int = 5409
    debug: bool = False
    cors_origins: list = None
    max_content_length: int = 500 * 1024 * 1024  # 500MB
    upload_timeout: int = 300  # 5分钟

    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = ['http://localhost:5173', 'http://localhost:3000']

@dataclass
class LoggingConfig:
    """日志配置"""
    level: str = 'INFO'
    format: str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    file_path: str = 'logs/app.log'
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    backup_count: int = 5
    log_to_console: bool = True

@dataclass
class MonitoringConfig:
    """监控配置"""
    enabled: bool = True
    metrics_port: int = 8080
    health_check_interval: int = 30
    slow_query_threshold: float = 1.0
    error_rate_threshold: float = 0.05

class Config:
    """主配置类"""

    def __init__(self):
        self.database = DatabaseConfig()
        self.security = SecurityConfig()
        self.cache = CacheConfig()
        self.media = MediaConfig()
        self.ai = AIConfig()
        self.server = ServerConfig()
        self.logging = LoggingConfig()
        self.monitoring = MonitoringConfig()

        # 从环境变量加载配置
        self._load_from_env()

    def _load_from_env(self):
        """从环境变量加载配置"""
        # 安全配置
        self.security.secret_key = os.getenv('SECRET_KEY', os.urandom(32).hex())
        self.security.token_expiry = int(os.getenv('TOKEN_EXPIRY', 86400))

        # 数据库配置
        self.database.path = os.getenv('DATABASE_PATH', 'social_upload.db')
        self.database.host = os.getenv('DB_HOST', 'localhost')
        self.database.port = int(os.getenv('DB_PORT', 5432))
        self.database.name = os.getenv('DB_NAME', 'social_upload')
        self.database.user = os.getenv('DB_USER', '')
        self.database.password = os.getenv('DB_PASSWORD', '')

        # 服务器配置
        self.server.host = os.getenv('SERVER_HOST', '0.0.0.0')
        self.server.port = int(os.getenv('SERVER_PORT', 5409))
        self.server.debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

        # 日志配置
        self.logging.level = os.getenv('LOG_LEVEL', 'INFO')
        self.logging.file_path = os.getenv('LOG_FILE_PATH', 'logs/app.log')

        # 监控配置
        self.monitoring.enabled = os.getenv('MONITORING_ENABLED', 'True').lower() == 'true'

    def get_database_url(self) -> str:
        """获取数据库连接URL"""
        if self.database.type == 'sqlite':
            return f"sqlite:///{self.database.path}"
        elif self.database.type == 'postgresql':
            return f"postgresql://{self.database.user}:{self.database.password}@{self.database.host}:{self.database.port}/{self.database.name}"
        else:
            raise ValueError(f"Unsupported database type: {self.database.type}")

    def get_ai_provider_config(self, provider: str) -> Optional[Dict[str, Any]]:
        """获取AI提供商配置"""
        return self.ai.providers.get(provider)

    def validate_config(self) -> bool:
        """验证配置有效性"""
        errors = []

        # 检查必要的配置
        if not self.security.secret_key:
            errors.append("SECRET_KEY is required")

        if not self.database.path:
            errors.append("Database path is required")

        if self.server.port <= 0 or self.server.port > 65535:
            errors.append("Server port must be between 1 and 65535")

        if errors:
            raise ValueError(f"Configuration validation failed: {'; '.join(errors)}")

        return True

    def get_dict(self) -> Dict[str, Any]:
        """获取配置字典"""
        return {
            'database': self.database.__dict__,
            'security': self.security.__dict__,
            'cache': self.cache.__dict__,
            'media': self.media.__dict__,
            'ai': self.ai.__dict__,
            'server': self.server.__dict__,
            'logging': self.logging.__dict__,
            'monitoring': self.monitoring.__dict__
        }

    def update_from_dict(self, config_dict: Dict[str, Any]):
        """从字典更新配置"""
        for section, values in config_dict.items():
            if hasattr(self, section):
                section_config = getattr(self, section)
                for key, value in values.items():
                    if hasattr(section_config, key):
                        setattr(section_config, key, value)

    def ensure_directories(self):
        """确保必要的目录存在"""
        directories = [
            Path(self.logging.file_path).parent,
            Path(self.media.temp_dir),
            Path(self.media.output_dir),
            Path('logs'),
            Path('uploads'),
            Path('temp')
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

# 全局配置实例
config = Config()

def get_config() -> Config:
    """获取配置实例"""
    return config

def load_config_from_file(file_path: str):
    """从文件加载配置"""
    import json
    if Path(file_path).exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
            config.update_from_dict(config_data)

def save_config_to_file(file_path: str):
    """保存配置到文件"""
    import json
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(config.get_dict(), f, indent=2, ensure_ascii=False)

# 环境特定的配置
def get_env_config():
    """获取环境特定配置"""
    env = os.getenv('FLASK_ENV', 'development')

    if env == 'production':
        return {
            'server': {'debug': False},
            'logging': {'level': 'WARNING'},
            'monitoring': {'enabled': True}
        }
    elif env == 'testing':
        return {
            'server': {'debug': True, 'port': 5410},
            'database': {'path': 'test_social_upload.db'},
            'logging': {'level': 'DEBUG'}
        }
    else:  # development
        return {
            'server': {'debug': True},
            'logging': {'level': 'DEBUG'},
            'monitoring': {'enabled': True}
        }

# 应用配置到全局配置
def apply_env_config():
    """应用环境特定配置"""
    env_config = get_env_config()
    config.update_from_dict(env_config)
    config.ensure_directories()