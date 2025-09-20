#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库初始化脚本
用于创建数据库表和初始化基础数据
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sau_backend.models import db, User, Account, Content, Task, Template
from sau_backend.app import create_app
from werkzeug.security import generate_password_hash
import uuid


def init_database():
    """初始化数据库"""
    print("🚀 开始初始化数据库...")

    # 创建应用实例
    app = create_app()

    with app.app_context():
        # 创建所有表
        print("📊 创建数据库表...")
        db.create_all()
        print("✅ 数据库表创建完成")

        # 检查是否已存在管理员用户
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            # 创建默认管理员用户
            admin_user = User(
                id=str(uuid.uuid4()),
                username='admin',
                email='admin@example.com',
                password_hash=generate_password_hash('admin123'),
                role='admin',
                is_active=True
            )
            db.session.add(admin_user)
            print("👤 创建默认管理员用户: admin / admin123")

        # 检查是否已存在测试用户
        test_user = User.query.filter_by(username='test').first()
        if not test_user:
            # 创建测试用户
            test_user = User(
                id=str(uuid.uuid4()),
                username='test',
                email='test@example.com',
                password_hash=generate_password_hash('test123'),
                role='user',
                is_active=True
            )
            db.session.add(test_user)
            print("👤 创建测试用户: test / test123")

        # 创建示例内容模板
        if Template.query.count() == 0:
            templates = [
                {
                    'name': '产品推广模板',
                    'description': '适用于产品推广的通用模板',
                    'category': '推广',
                    'template_data': {
                        'title': '产品标题',
                        'description': '产品描述',
                        'tags': ['产品', '推广'],
                        'call_to_action': '立即购买'
                    }
                },
                {
                    'name': '节日祝福模板',
                    'description': '适用于节日祝福的内容模板',
                    'category': '祝福',
                    'template_data': {
                        'title': '节日快乐',
                        'description': '节日祝福语',
                        'tags': ['节日', '祝福'],
                        'call_to_action': '祝福大家'
                    }
                },
                {
                    'name': '知识分享模板',
                    'description': '适用于知识分享的内容模板',
                    'category': '教育',
                    'template_data': {
                        'title': '知识分享标题',
                        'description': '知识点介绍',
                        'tags': ['知识', '分享'],
                        'call_to_action': '学习更多'
                    }
                }
            ]

            for template_data in templates:
                template = Template(
                    id=str(uuid.uuid4()),
                    name=template_data['name'],
                    description=template_data['description'],
                    category=template_data['category'],
                    template_data=template_data['template_data'],
                    is_active=True
                )
                db.session.add(template)

            print("📝 创建示例内容模板")

        # 提交所有更改
        db.session.commit()
        print("✅ 数据库初始化完成")

        # 打印数据库信息
        print("\n📊 数据库统计:")
        print(f"   用户数量: {User.query.count()}")
        print(f"   账户数量: {Account.query.count()}")
        print(f"   内容数量: {Content.query.count()}")
        print(f"   任务数量: {Task.query.count()}")
        print(f"   模板数量: {Template.query.count()}")


def create_directories():
    """创建必要的目录"""
    print("📁 创建必要的目录...")

    directories = [
        'db',
        'logs',
        'uploads',
        'uploads/videos',
        'uploads/images',
        'uploads/temp',
        'cookies',
        'static',
        'static/css',
        'static/js',
        'static/images'
    ]

    for directory in directories:
        dir_path = project_root / directory
        dir_path.mkdir(exist_ok=True)
        print(f"   ✅ {directory}")


def main():
    """主函数"""
    try:
        # 创建必要目录
        create_directories()

        # 初始化数据库
        init_database()

        print("\n🎉 系统初始化完成！")
        print("\n📋 使用说明:")
        print("1. 复制 .env.example 为 .env 并配置相应参数")
        print("2. 使用默认管理员账户登录: admin / admin123")
        print("3. 访问 http://localhost:5409 启动应用")
        print("4. 前端开发服务器: npm run dev (端口 5173)")

    except Exception as e:
        print(f"❌ 初始化失败: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()