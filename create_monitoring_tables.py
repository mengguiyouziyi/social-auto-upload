import sqlite3
from pathlib import Path
from conf import BASE_DIR

def create_monitoring_tables():
    """创建监控相关表"""
    try:
        with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
            cursor = conn.cursor()

            # 访问日志表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS access_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    method TEXT NOT NULL,
                    path TEXT NOT NULL,
                    status_code INTEGER NOT NULL,
                    ip TEXT NOT NULL,
                    user_agent TEXT,
                    response_time REAL,
                    request_id TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 上传日志表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS upload_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    file_size INTEGER,
                    upload_time REAL,
                    success BOOLEAN NOT NULL,
                    error_message TEXT,
                    ip TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 错误日志表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS error_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    error_type TEXT NOT NULL,
                    error_message TEXT NOT NULL,
                    traceback TEXT,
                    function_name TEXT,
                    file_name TEXT,
                    line_number INTEGER,
                    request_id TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 缓存表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 请求限制表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ip TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 系统监控表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cpu_percent REAL,
                    memory_percent REAL,
                    disk_percent REAL,
                    network_sent INTEGER,
                    network_recv INTEGER,
                    active_connections INTEGER,
                    uptime INTEGER,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 应用监控表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS application_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    total_requests INTEGER,
                    successful_requests INTEGER,
                    failed_requests INTEGER,
                    average_response_time REAL,
                    active_users INTEGER,
                    database_connections INTEGER,
                    upload_count INTEGER,
                    upload_success_rate REAL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 健康检查表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS health_checks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    component TEXT NOT NULL,
                    status TEXT NOT NULL,
                    message TEXT,
                    response_time REAL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 告警历史表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    message TEXT NOT NULL,
                    component TEXT,
                    resolved BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    resolved_at DATETIME
                )
            ''')

            # 创建索引提高查询性能
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs (timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_access_logs_ip ON access_logs (ip)",
                "CREATE INDEX IF NOT EXISTS idx_upload_logs_timestamp ON upload_logs (timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs (timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_timestamp ON rate_limits (ip, timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics (timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_application_metrics_timestamp ON application_metrics (timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks (timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts (created_at)",
                "CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts (resolved)",
                "CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at)"
            ]

            for index_sql in indexes:
                cursor.execute(index_sql)

            conn.commit()
            print("✅ 监控表创建成功")

    except Exception as e:
        print(f"❌ 监控表创建失败: {e}")

def create_logs_directory():
    """创建日志目录"""
    log_dir = Path(BASE_DIR / "logs")
    log_dir.mkdir(exist_ok=True)

    # 创建不同类型的日志文件
    log_files = [
        'app.log',
        'error.log',
        'access.log',
        'performance.log',
        'security.log'
    ]

    for log_file in log_files:
        log_path = log_dir / log_file
        if not log_path.exists():
            log_path.touch()
            print(f"✅ 创建日志文件: {log_file}")

    print("✅ 日志目录创建成功")

if __name__ == "__main__":
    print("🚀 开始创建监控表...")
    create_monitoring_tables()
    create_logs_directory()
    print("✅ 监控系统初始化完成")