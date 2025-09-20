"""
数据模型模块
定义用户、账号等数据模型
"""

import sqlite3
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from pathlib import Path
import hashlib


@dataclass
class User:
    """用户模型"""

    id: int
    username: str
    email: str
    password_hash: str
    role: str = "user"
    created_at: datetime = None
    updated_at: datetime = None
    is_active: bool = True

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()


@dataclass
class SocialMediaAccount:
    """社交媒体账号模型"""

    id: int
    user_id: int
    platform: str
    account_name: str
    status: int = 0
    cookie_path: str = None
    created_at: datetime = None
    updated_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()


class DatabaseManager:
    """数据库管理器"""

    def __init__(self, db_path: str = "db/database.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """初始化数据库"""
        # 创建数据库目录
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 创建用户表
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        """
        )

        # 创建社交媒体账号表
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS social_media_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                platform TEXT NOT NULL,
                account_name TEXT NOT NULL,
                status INTEGER DEFAULT 0,
                cookie_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """
        )

        # 创建会话表
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """
        )

        # 创建索引
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)"
        )
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_media_accounts(user_id)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash)"
        )

        conn.commit()
        conn.close()

    def get_connection(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def create_user(
        self, username: str, email: str, password_hash: str, role: str = "user"
    ) -> Optional[User]:
        """创建用户"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute(
                """
                INSERT INTO users (username, email, password_hash, role)
                VALUES (?, ?, ?, ?)
            """,
                (username, email, password_hash, role),
            )

            user_id = cursor.lastrowid
            conn.commit()
            conn.close()

            return self.get_user_by_id(user_id)

        except sqlite3.IntegrityError:
            return None

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """根据ID获取用户"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return User(
                id=row["id"],
                username=row["username"],
                email=row["email"],
                password_hash=row["password_hash"],
                role=row["role"],
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"]),
                is_active=bool(row["is_active"]),
            )
        return None

    def get_user_by_username(self, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return User(
                id=row["id"],
                username=row["username"],
                email=row["email"],
                password_hash=row["password_hash"],
                role=row["role"],
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"]),
                is_active=bool(row["is_active"]),
            )
        return None

    def get_user_by_email(self, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return User(
                id=row["id"],
                username=row["username"],
                email=row["email"],
                password_hash=row["password_hash"],
                role=row["role"],
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"]),
                is_active=bool(row["is_active"]),
            )
        return None

    def update_user_last_login(self, user_id: int):
        """更新用户最后登录时间"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE users SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """,
            (user_id,),
        )

        conn.commit()
        conn.close()

    def create_social_account(
        self,
        user_id: int,
        platform: str,
        account_name: str,
        cookie_path: str = None,
        status: int = 0,
    ) -> Optional[SocialMediaAccount]:
        """创建社交媒体账号"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute(
                """
                INSERT INTO social_media_accounts (user_id, platform, account_name, cookie_path, status)
                VALUES (?, ?, ?, ?, ?)
            """,
                (user_id, platform, account_name, cookie_path, status),
            )

            account_id = cursor.lastrowid
            conn.commit()
            conn.close()

            return self.get_social_account_by_id(account_id)

        except sqlite3.IntegrityError:
            return None

    def get_social_account_by_id(self, account_id: int) -> Optional[SocialMediaAccount]:
        """根据ID获取社交媒体账号"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM social_media_accounts WHERE id = ?", (account_id,)
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            return SocialMediaAccount(
                id=row["id"],
                user_id=row["user_id"],
                platform=row["platform"],
                account_name=row["account_name"],
                status=row["status"],
                cookie_path=row["cookie_path"],
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"]),
            )
        return None

    def get_social_accounts_by_user(self, user_id: int) -> List[SocialMediaAccount]:
        """获取用户的所有社交媒体账号"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM social_media_accounts WHERE user_id = ?", (user_id,)
        )
        rows = cursor.fetchall()
        conn.close()

        accounts = []
        for row in rows:
            accounts.append(
                SocialMediaAccount(
                    id=row["id"],
                    user_id=row["user_id"],
                    platform=row["platform"],
                    account_name=row["account_name"],
                    status=row["status"],
                    cookie_path=row["cookie_path"],
                    created_at=datetime.fromisoformat(row["created_at"]),
                    updated_at=datetime.fromisoformat(row["updated_at"]),
                )
            )

        return accounts

    def update_social_account_status(self, account_id: int, status: int):
        """更新社交媒体账号状态"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE social_media_accounts SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """,
            (status, account_id),
        )

        conn.commit()
        conn.close()

    def create_session(self, user_id: int, token: str, expires_at: datetime):
        """创建会话"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO sessions (user_id, token_hash, expires_at)
            VALUES (?, ?, ?)
        """,
            (user_id, token_hash, expires_at),
        )

        conn.commit()
        conn.close()

    def validate_session(self, user_id: int, token: str) -> bool:
        """验证会话"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT 1 FROM sessions
            WHERE user_id = ? AND token_hash = ? AND expires_at > CURRENT_TIMESTAMP
        """,
            (user_id, token_hash),
        )

        valid = cursor.fetchone() is not None
        conn.close()

        return valid

    def revoke_session(self, user_id: int, token: str):
        """撤销会话"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM sessions WHERE user_id = ? AND token_hash = ?",
            (user_id, token_hash),
        )
        conn.commit()
        conn.close()

    def revoke_all_sessions(self, user_id: int):
        """撤销用户所有会话"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()


# 创建全局数据库管理器实例
db_manager = DatabaseManager()
