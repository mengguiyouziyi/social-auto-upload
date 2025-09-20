"""
Pytest配置文件
"""

import os
import sys
import pytest
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

@pytest.fixture(scope='session')
def app():
    """创建测试应用实例"""
    from sau_backend.app import create_app
    app = create_app(config_name='testing', overrides={'SECRET_KEY': 'test-secret-key'})
    return app

@pytest.fixture(scope='session')
def client(app):
    """创建测试客户端"""
    return app.test_client()

@pytest.fixture(scope='session')
def runner(app):
    """创建测试运行器"""
    return app.test_cli_runner()

@pytest.fixture(autouse=True)
def setup_test_environment():
    """设置测试环境"""
    # 设置测试环境变量
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['DATABASE_URL'] = 'sqlite:///test_social_upload.db'
    os.environ['LOG_LEVEL'] = 'DEBUG'

    yield

    # 清理测试环境
    test_db_path = Path('test_social_upload.db')
    if test_db_path.exists():
        test_db_path.unlink()

@pytest.fixture
def test_user_data():
    """测试用户数据"""
    return {
        'username': 'test_user',
        'password': 'TestPassword123!',
        'email': 'test@example.com'
    }

@pytest.fixture
def existing_user_data():
    """已存在用户数据"""
    return {
        'username': 'existing_user',
        'password': 'ExistingPassword123!',
        'email': 'existing@example.com'
    }

@pytest.fixture
def sample_user_data():
    """示例用户数据"""
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123',
        'platform': 'douyin',
        'account_type': 'personal'
    }

@pytest.fixture
def sample_video_data():
    """示例视频数据"""
    return {
        'title': 'Test Video',
        'description': 'This is a test video',
        'tags': ['test', 'video'],
        'platform': 'douyin'
    }