# -*- coding: utf-8 -*-
"""
Pytest 配置和共享固件
"""

import os
import sys
import pytest
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sau_backend.app import create_app
from sau_backend.models import db, User, Account, Content, Task
from sau_backend.config.security import JWTManager


@pytest.fixture(scope="session")
def app():
    """创建测试应用实例"""
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'JWT_SECRET_KEY': 'test-secret-key',
        'WTF_CSRF_ENABLED': False,
    })

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture(scope="session")
def client(app):
    """创建测试客户端"""
    return app.test_client()


@pytest.fixture(scope="function")
def session(app):
    """创建数据库会话"""
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()

        # 绑定会话到连接
        session = db.session
        session.bind = connection

        yield session

        # 清理会话
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def test_user(session):
    """创建测试用户"""
    from werkzeug.security import generate_password_hash

    user = User(
        id='test-user-id',
        username='testuser',
        email='test@example.com',
        password_hash=generate_password_hash('testpass123'),
        role='user',
        is_active=True
    )
    session.add(user)
    session.commit()
    return user


@pytest.fixture
def admin_user(session):
    """创建管理员用户"""
    from werkzeug.security import generate_password_hash

    user = User(
        id='admin-user-id',
        username='admin',
        email='admin@example.com',
        password_hash=generate_password_hash('admin123'),
        role='admin',
        is_active=True
    )
    session.add(user)
    session.commit()
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """获取认证头部"""
    with client.application.app_context():
        token = JWTManager().generate_access_token(test_user.id, test_user.role)
        return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def admin_auth_headers(client, admin_user):
    """获取管理员认证头部"""
    with client.application.app_context():
        token = JWTManager().generate_access_token(admin_user.id, admin_user.role)
        return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def test_account(session, test_user):
    """创建测试账户"""
    account = Account(
        id='test-account-id',
        user_id=test_user.id,
        platform='douyin',
        username='test_douyin',
        platform_user_id='douyin_123',
        is_active=True,
        config={'cookie': 'test_cookie'}
    )
    session.add(account)
    session.commit()
    return account


@pytest.fixture
def test_content(session, test_user):
    """创建测试内容"""
    content = Content(
        id='test-content-id',
        user_id=test_user.id,
        title='Test Content',
        description='Test Description',
        content_type='video',
        file_path='/path/to/test.mp4',
        status='draft',
        platforms=['douyin', 'xhs'],
        metadata={'duration': 60, 'size': 1024000}
    )
    session.add(content)
    session.commit()
    return content


@pytest.fixture
def test_task(session, test_user, test_content):
    """创建测试任务"""
    task = Task(
        id='test-task-id',
        user_id=test_user.id,
        content_id=test_content.id,
        task_type='publish',
        status='pending',
        scheduled_time='2024-01-01T00:00:00',
        platforms=['douyin'],
        config={'immediate': True}
    )
    session.add(task)
    session.commit()
    return task


# 环境变量设置
@pytest.fixture(autouse=True)
def set_test_environment():
    """设置测试环境变量"""
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['DEBUG'] = 'False'
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    os.environ['JWT_SECRET_KEY'] = 'test-secret-key'

    yield

    # 清理环境变量
    for key in ['FLASK_ENV', 'DEBUG', 'DATABASE_URL', 'JWT_SECRET_KEY']:
        os.environ.pop(key, None)


# 模拟外部服务
@pytest.fixture
def mock_ai_service(monkeypatch):
    """模拟AI服务"""
    class MockAIService:
        @staticmethod
        def generate_text(prompt, **kwargs):
            return f"Generated text for: {prompt}"

        @staticmethod
        def generate_shotlist(script, **kwargs):
            return {
                "shots": [
                    {
                        "duration": 30,
                        "scene": "Test scene",
                        "voiceover": "Test voiceover",
                        "onscreen_text": "Test text",
                        "transition": "fade"
                    }
                ]
            }

    monkeypatch.setattr(
        'sau_backend.services.ai_service.generate_text',
        MockAIService.generate_text
    )
    monkeypatch.setattr(
        'sau_backend.services.ai_service.generate_shotlist',
        MockAIService.generate_shotlist
    )


@pytest.fixture
def mock_platform_service(monkeypatch):
    """模拟平台服务"""
    class MockPlatformService:
        @staticmethod
        def upload_video(platform, file_path, config):
            return {"success": True, "video_id": "test_video_id"}

        @staticmethod
        def check_login_status(platform, config):
            return {"logged_in": True, "username": "test_user"}

    # 模拟各个平台服务
    for platform in ['douyin', 'xhs', 'bilibili']:
        monkeypatch.setattr(
            f'sau_backend.platforms.{platform}_platform.upload_video',
            MockPlatformService.upload_video
        )
        monkeypatch.setattr(
            f'sau_backend.platforms.{platform}_platform.check_login_status',
            MockPlatformService.check_login_status
        )


# 性能测试标记
def pytest_configure(config):
    """配置pytest标记"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "e2e: marks tests as end-to-end tests"
    )


# 跳过慢测试的选项
def pytest_addoption(parser):
    """添加pytest选项"""
    parser.addoption(
        "--runslow", action="store_true", default=False,
        help="run slow tests"
    )
    parser.addoption(
        "--integration", action="store_true", default=False,
        help="run integration tests"
    )
    parser.addoption(
        "--e2e", action="store_true", default=False,
        help="run end-to-end tests"
    )


def pytest_collection_modifyitems(config, items):
    """修改测试收集"""
    if config.getoption("--runslow"):
        # --runslow given in cli: do not skip slow tests
        return

    skip_slow = pytest.mark.skip(reason="need --runslow option to run")
    for item in items:
        if "slow" in item.keywords:
            item.add_marker(skip_slow)

    if not config.getoption("--integration"):
        skip_integration = pytest.mark.skip(reason="need --integration option to run")
        for item in items:
            if "integration" in item.keywords:
                item.add_marker(skip_integration)

    if not config.getoption("--e2e"):
        skip_e2e = pytest.mark.skip(reason="need --e2e option to run")
        for item in items:
            if "e2e" in item.keywords:
                item.add_marker(skip_e2e)