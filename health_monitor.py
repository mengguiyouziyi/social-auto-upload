import psutil
import sqlite3
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from conf import BASE_DIR
from error_handler import logger, security_event

@dataclass
class SystemMetrics:
    """系统指标"""
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    network_sent: int
    network_recv: int
    active_connections: int
    uptime: int
    timestamp: datetime

@dataclass
class ApplicationMetrics:
    """应用指标"""
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time: float
    active_users: int
    database_connections: int
    upload_count: int
    upload_success_rate: float
    timestamp: datetime

class HealthMonitor:
    """健康监控器"""

    def __init__(self):
        self.metrics_lock = threading.Lock()
        self.running = False
        self.start_time = datetime.now()
        self.last_network_stats = psutil.net_io_counters()
        self.metrics_history = []
        self.max_history_size = 1000

        # 创建必要的表
        self.create_tables()

    def create_tables(self):
        """创建监控相关表"""
        try:
            with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
                cursor = conn.cursor()

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

                conn.commit()
                print("✅ 监控表创建成功")
        except Exception as e:
            logger.error(f"监控表创建失败: {str(e)}", error=e)

    def start_monitoring(self):
        """开始监控"""
        if self.running:
            return

        self.running = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()

        logger.info("健康监控已启动")

    def stop_monitoring(self):
        """停止监控"""
        self.running = False
        logger.info("健康监控已停止")

    def _monitor_loop(self):
        """监控循环"""
        while self.running:
            try:
                # 收集系统指标
                system_metrics = self.collect_system_metrics()
                self.save_system_metrics(system_metrics)

                # 收集应用指标
                app_metrics = self.collect_application_metrics()
                self.save_application_metrics(app_metrics)

                # 保存到历史
                with self.metrics_lock:
                    self.metrics_history.append({
                        'system': system_metrics,
                        'application': app_metrics
                    })

                    # 限制历史大小
                    if len(self.metrics_history) > self.max_history_size:
                        self.metrics_history = self.metrics_history[-self.max_history_size:]

                # 健康检查
                self.perform_health_checks()

                # 告警检查
                self.check_alerts(system_metrics, app_metrics)

                # 清理旧数据
                self.cleanup_old_data()

                time.sleep(60)  # 每分钟检查一次

            except Exception as e:
                logger.error(f"监控循环错误: {str(e)}", error=e)
                time.sleep(30)  # 出错后等待30秒再继续

    def collect_system_metrics(self) -> SystemMetrics:
        """收集系统指标"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            network = psutil.net_io_counters()

            # 计算网络流量变化
            network_sent = network.bytes_sent - self.last_network_stats.bytes_sent
            network_recv = network.bytes_recv - self.last_network_stats.bytes_recv

            self.last_network_stats = network

            uptime = int((datetime.now() - self.start_time).total_seconds())

            # 安全获取活动连接数
            try:
                active_connections = len(psutil.net_connections())
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                active_connections = 0

            return SystemMetrics(
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                disk_percent=disk.percent,
                network_sent=network_sent,
                network_recv=network_recv,
                active_connections=active_connections,
                uptime=uptime,
                timestamp=datetime.now()
            )
        except Exception as e:
            logger.error(f"系统指标收集失败: {str(e)}", error=e)
            return SystemMetrics(0, 0, 0, 0, 0, 0, 0, datetime.now())

    def collect_application_metrics(self) -> ApplicationMetrics:
        """收集应用指标"""
        try:
            with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
                cursor = conn.cursor()

                # 获取请求统计
                cursor.execute("""
                    SELECT COUNT(*) as total_requests,
                           SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) as successful_requests,
                           SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as failed_requests,
                           AVG(response_time) as avg_response_time
                    FROM access_logs
                    WHERE timestamp > datetime('now', '-1 hour')
                """)
                request_stats = cursor.fetchone()

                # 获取上传统计
                cursor.execute("""
                    SELECT COUNT(*) as total_uploads,
                           SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_uploads
                    FROM upload_logs
                    WHERE timestamp > datetime('now', '-1 hour')
                """)
                upload_stats = cursor.fetchone()

                # 获取活跃用户数
                cursor.execute("""
                    SELECT COUNT(DISTINCT ip) as active_users
                    FROM access_logs
                    WHERE timestamp > datetime('now', '-1 hour')
                """)
                active_users = cursor.fetchone()[0]

                total_requests = request_stats[0] or 0
                successful_requests = request_stats[1] or 0
                failed_requests = request_stats[2] or 0
                avg_response_time = request_stats[3] or 0

                total_uploads = upload_stats[0] or 0
                successful_uploads = upload_stats[1] or 0
                upload_success_rate = (successful_uploads / total_uploads) if total_uploads > 0 else 0

                return ApplicationMetrics(
                    total_requests=total_requests,
                    successful_requests=successful_requests,
                    failed_requests=failed_requests,
                    average_response_time=avg_response_time,
                    active_users=active_users,
                    database_connections=1,  # 简化处理
                    upload_count=total_uploads,
                    upload_success_rate=upload_success_rate,
                    timestamp=datetime.now()
                )
        except Exception as e:
            logger.error(f"应用指标收集失败: {str(e)}", error=e)
            return ApplicationMetrics(0, 0, 0, 0, 0, 0, 0, 0, datetime.now())

    def save_system_metrics(self, metrics: SystemMetrics):
        """保存系统指标"""
        try:
            with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO system_metrics (
                        cpu_percent, memory_percent, disk_percent,
                        network_sent, network_recv, active_connections, uptime
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    metrics.cpu_percent, metrics.memory_percent, metrics.disk_percent,
                    metrics.network_sent, metrics.network_recv, metrics.active_connections, metrics.uptime
                ))
                conn.commit()
        except Exception as e:
            logger.error(f"系统指标保存失败: {str(e)}", error=e)

    def save_application_metrics(self, metrics: ApplicationMetrics):
        """保存应用指标"""
        try:
            with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO application_metrics (
                        total_requests, successful_requests, failed_requests,
                        average_response_time, active_users, database_connections,
                        upload_count, upload_success_rate
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    metrics.total_requests, metrics.successful_requests, metrics.failed_requests,
                    metrics.average_response_time, metrics.active_users, metrics.database_connections,
                    metrics.upload_count, metrics.upload_success_rate
                ))
                conn.commit()
        except Exception as e:
            logger.error(f"应用指标保存失败: {str(e)}", error=e)

    def perform_health_checks(self):
        """执行健康检查"""
        components = ['database', 'file_system', 'network', 'disk_space']

        for component in components:
            start_time = time.time()
            try:
                if component == 'database':
                    self._check_database()
                elif component == 'file_system':
                    self._check_file_system()
                elif component == 'network':
                    self._check_network()
                elif component == 'disk_space':
                    self._check_disk_space()

                response_time = time.time() - start_time
                self._save_health_check(component, 'healthy', f"{component} 正常", response_time)

            except Exception as e:
                response_time = time.time() - start_time
                error_msg = f"{component} 检查失败: {str(e)}"
                self._save_health_check(component, 'unhealthy', error_msg, response_time)

                # 创建告警
                self.create_alert(
                    alert_type='HEALTH_CHECK_FAILED',
                    severity='high',
                    message=error_msg,
                    component=component
                )

    def _check_database(self):
        """检查数据库连接"""
        with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()

    def _check_file_system(self):
        """检查文件系统"""
        test_file = Path(BASE_DIR / "test.tmp")
        test_file.write_text("test")
        test_file.unlink()

    def _check_network(self):
        """检查网络连接"""
        import socket
        socket.gethostbyname('localhost')

    def _check_disk_space(self):
        """检查磁盘空间"""
        disk = psutil.disk_usage('/')
        if disk.percent > 90:
            raise Exception(f"磁盘空间不足: {disk.percent}%")

    def _save_health_check(self, component: str, status: str, message: str, response_time: float):
        """保存健康检查结果"""
        try:
            with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO health_checks (component, status, message, response_time)
                    VALUES (?, ?, ?, ?)
                ''', (component, status, message, response_time))
                conn.commit()
        except Exception as e:
            logger.error(f"健康检查保存失败: {str(e)}", error=e)

    def check_alerts(self, system_metrics: SystemMetrics, app_metrics: ApplicationMetrics):
        """检查告警条件"""
        alerts = []

        # CPU使用率过高
        if system_metrics.cpu_percent > 80:
            alerts.append({
                'type': 'HIGH_CPU_USAGE',
                'severity': 'high',
                'message': f'CPU使用率过高: {system_metrics.cpu_percent}%',
                'component': 'cpu'
            })

        # 内存使用率过高
        if system_metrics.memory_percent > 85:
            alerts.append({
                'type': 'HIGH_MEMORY_USAGE',
                'severity': 'high',
                'message': f'内存使用率过高: {system_metrics.memory_percent}%',
                'component': 'memory'
            })

        # 磁盘使用率过高
        if system_metrics.disk_percent > 90:
            alerts.append({
                'type': 'HIGH_DISK_USAGE',
                'severity': 'critical',
                'message': f'磁盘使用率过高: {system_metrics.disk_percent}%',
                'component': 'disk'
            })

        # 错误率过高
        if app_metrics.total_requests > 0:
            error_rate = app_metrics.failed_requests / app_metrics.total_requests
            if error_rate > 0.1:  # 10%错误率
                alerts.append({
                    'type': 'HIGH_ERROR_RATE',
                    'severity': 'high',
                    'message': f'错误率过高: {error_rate:.2%}',
                    'component': 'application'
                })

        # 上传成功率过低
        if app_metrics.upload_count > 0 and app_metrics.upload_success_rate < 0.8:  # 80%成功率
            alerts.append({
                'type': 'LOW_UPLOAD_SUCCESS_RATE',
                'severity': 'medium',
                'message': f'上传成功率过低: {app_metrics.upload_success_rate:.2%}',
                'component': 'upload'
            })

        # 创建告警
        for alert in alerts:
            self.create_alert(
                alert_type=alert['type'],
                severity=alert['severity'],
                message=alert['message'],
                component=alert['component']
            )

    def create_alert(self, alert_type: str, severity: str, message: str, component: str = None):
        """创建告警"""
        try:
            with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO alerts (alert_type, severity, message, component)
                    VALUES (?, ?, ?, ?)
                ''', (alert_type, severity, message, component))
                conn.commit()

            # 记录安全事件
            security_event("ALERT_CREATED",
                          alert_type=alert_type,
                          severity=severity,
                          message=message,
                          component=component)

            logger.warning(f"告警创建: {alert_type} - {message}")

        except Exception as e:
            logger.error(f"告警创建失败: {str(e)}", error=e)

    def cleanup_old_data(self):
        """清理旧数据"""
        try:
            with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
                cursor = conn.cursor()

                # 清理7天前的系统指标
                cursor.execute("""
                    DELETE FROM system_metrics
                    WHERE timestamp < datetime('now', '-7 days')
                """)

                # 清理7天前的应用指标
                cursor.execute("""
                    DELETE FROM application_metrics
                    WHERE timestamp < datetime('now', '-7 days')
                """)

                # 清理30天前的健康检查
                cursor.execute("""
                    DELETE FROM health_checks
                    WHERE timestamp < datetime('now', '-30 days')
                """)

                # 清理90天前的告警
                cursor.execute("""
                    DELETE FROM alerts
                    WHERE created_at < datetime('now', '-90 days')
                """)

                conn.commit()

        except Exception as e:
            logger.error(f"数据清理失败: {str(e)}", error=e)

    def get_system_status(self) -> Dict[str, Any]:
        """获取系统状态"""
        try:
            with self.metrics_lock:
                if not self.metrics_history:
                    return {"status": "unknown", "message": "暂无监控数据"}

                latest = self.metrics_history[-1]
                system = latest['system']
                app = latest['application']

                return {
                    "status": "healthy",
                    "system": {
                        "cpu_percent": system.cpu_percent,
                        "memory_percent": system.memory_percent,
                        "disk_percent": system.disk_percent,
                        "uptime": system.uptime
                    },
                    "application": {
                        "total_requests": app.total_requests,
                        "success_rate": (app.successful_requests / app.total_requests) if app.total_requests > 0 else 0,
                        "average_response_time": app.average_response_time,
                        "active_users": app.active_users,
                        "upload_success_rate": app.upload_success_rate
                    },
                    "timestamp": system.timestamp.isoformat()
                }
        except Exception as e:
            logger.error(f"获取系统状态失败: {str(e)}", error=e)
            return {"status": "error", "message": str(e)}

    def get_metrics_history(self, hours: int = 24) -> Dict[str, List[Dict[str, Any]]]:
        """获取历史指标"""
        try:
            with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
                cursor = conn.cursor()

                # 获取系统指标历史
                cursor.execute("""
                    SELECT * FROM system_metrics
                    WHERE timestamp > datetime('now', '-{} hours')
                    ORDER BY timestamp DESC
                """.format(hours))

                system_history = []
                for row in cursor.fetchall():
                    system_history.append({
                        "timestamp": row[8],
                        "cpu_percent": row[1],
                        "memory_percent": row[2],
                        "disk_percent": row[3],
                        "network_sent": row[4],
                        "network_recv": row[5],
                        "active_connections": row[6],
                        "uptime": row[7]
                    })

                # 获取应用指标历史
                cursor.execute("""
                    SELECT * FROM application_metrics
                    WHERE timestamp > datetime('now', '-{} hours')
                    ORDER BY timestamp DESC
                """.format(hours))

                app_history = []
                for row in cursor.fetchall():
                    app_history.append({
                        "timestamp": row[9],
                        "total_requests": row[1],
                        "successful_requests": row[2],
                        "failed_requests": row[3],
                        "average_response_time": row[4],
                        "active_users": row[5],
                        "database_connections": row[6],
                        "upload_count": row[7],
                        "upload_success_rate": row[8]
                    })

                return {
                    "system": system_history,
                    "application": app_history
                }
        except Exception as e:
            logger.error(f"获取历史指标失败: {str(e)}", error=e)
            return {"system": [], "application": []}

    def get_alerts(self, resolved: bool = None, limit: int = 50) -> List[Dict[str, Any]]:
        """获取告警列表"""
        try:
            with sqlite3.connect(Path(BASE_DIR / "db" / "database.db")) as conn:
                cursor = conn.cursor()

                query = "SELECT * FROM alerts"
                params = []

                if resolved is not None:
                    query += " WHERE resolved = ?"
                    params.append(resolved)

                query += " ORDER BY created_at DESC LIMIT ?"
                params.append(limit)

                cursor.execute(query, params)

                alerts = []
                for row in cursor.fetchall():
                    alerts.append({
                        "id": row[0],
                        "alert_type": row[1],
                        "severity": row[2],
                        "message": row[3],
                        "component": row[4],
                        "resolved": bool(row[5]),
                        "created_at": row[6],
                        "resolved_at": row[7]
                    })

                return alerts
        except Exception as e:
            logger.error(f"获取告警列表失败: {str(e)}", error=e)
            return []

# 全局健康监控实例
health_monitor = HealthMonitor()