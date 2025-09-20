#!/usr/bin/env python3
"""
原生抖音二维码登录后端
直接复制并适配原生 working 的 douyin_uploader 代码
"""
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import os
import time
import threading
import asyncio
import sqlite3
from datetime import datetime
from queue import Queue
import base64
from io import BytesIO
from pathlib import Path

# 导入Playwright和原生工具
from playwright.async_api import async_playwright, Page
import sys

# 添加sau_backend到路径
sys.path.append('/Users/sunyouyou/Desktop/projects/bzhi/social-auto-upload/sau_backend')
from utils.base_social_media import set_init_script
from models import db_manager
from auth_routes import auth_bp
from social_routes import social_bp
from douyin_routes import douyin_bp
from content_routes import content_bp
from file_routes import file_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production-2025'
CORS(app)

# 注册认证蓝图
app.register_blueprint(auth_bp)
# 注册社交媒体账号管理蓝图
app.register_blueprint(social_bp)
# 注册抖音平台专用蓝图
app.register_blueprint(douyin_bp)
# 注册内容发布蓝图
app.register_blueprint(content_bp)
# 注册文件管理蓝图
app.register_blueprint(file_bp)

# 数据库初始化
def init_database():
    """初始化数据库"""
    os.makedirs('db', exist_ok=True)
    os.makedirs('cookies', exist_ok=True)
    os.makedirs('cookies/douyin_uploader', exist_ok=True)

    # 初始化新的数据库模型
    db_manager.init_database()

    # 创建用户信息表（使用原生表结构）
    conn = sqlite3.connect('db/database.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type INTEGER NOT NULL,
            filePath TEXT NOT NULL,
            userName TEXT NOT NULL,
            status INTEGER DEFAULT 0
        )
    ''')

    conn.commit()
    conn.close()

# 初始化数据库
init_database()

# 活跃的SSE队列
active_queues = {}

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect('db/database.db')
    conn.row_factory = sqlite3.Row
    return conn

def create_account_in_db(account_name, platform_type):
    """在数据库中创建账号"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 检查账号是否已存在
        cursor.execute('SELECT * FROM user_info WHERE userName = ?', (account_name,))
        existing = cursor.fetchone()

        if existing:
            conn.close()
            return False, "账号已存在"

        # 创建新账号（使用原生表结构）
        cookie_file = f"cookies/douyin_uploader/cookie_{account_name}.json"
        cursor.execute('''
            INSERT INTO user_info (type, filePath, userName, status)
            VALUES (?, ?, ?, ?)
        ''', (int(platform_type), cookie_file, account_name, 1))

        conn.commit()
        conn.close()

        return True, "账号创建成功"

    except Exception as e:
        print(f"数据库操作失败: {str(e)}")
        return False, f"数据库操作失败: {str(e)}"

async def cookie_auth(cookie_path: str, page: Page, status_queue):
    """
    验证cookie是否有效，直接复制原生代码
    """
    try:
        if not os.path.exists(cookie_path):
            return False

        # 加载cookie
        with open(cookie_path, 'r', encoding='utf-8') as f:
            cookies = json.load(f)

        # 添加cookie到页面
        for cookie in cookies:
            await page.context.add_cookies([cookie])

        status_queue.put("data: 正在验证现有cookie...")

        # 访问抖音创作者中心验证cookie
        await page.goto("https://creator.douyin.com/creator-micro/content/upload", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        # 检查是否登录成功
        if "creator.douyin.com/creator-micro" in page.url:
            status_queue.put("data: 现有cookie有效，验证成功！")
            return True
        else:
            status_queue.put("data: 现有cookie已失效，需要重新登录")
            return False

    except Exception as e:
        print(f"Cookie验证失败: {str(e)}")
        status_queue.put("data: Cookie验证失败，需要重新登录")
        return False

async def douyin_cookie_gen(account_id: str, page: Page, status_queue):
    """
    生成抖音cookie，直接复制原生代码的核心逻辑
    """
    try:
        status_queue.put("data: 正在生成新的抖音cookie...")

        # 访问抖音登录页面
        await page.goto("https://creator.douyin.com/", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        status_queue.put("data: 请使用抖音APP扫描二维码登录")
        status_queue.put("data: 登录完成后，页面会自动跳转")

        # 使用原生方法的暂停等待
        await page.pause()

        # 验证是否登录成功
        if "creator.douyin.com/creator-micro" in page.url:
            status_queue.put("data: 登录成功！正在保存cookie...")
            return True
        else:
            status_queue.put("data: 登录未完成，请重试")
            return False

    except Exception as e:
        error_msg = f"Cookie生成失败: {str(e)}"
        print(error_msg)
        status_queue.put(f"data: {error_msg}")
        return False

async def douyin_setup(account_id: str, status_queue):
    """
    抖音设置流程，直接复制原生代码的编排逻辑
    """
    browser = None
    context = None

    try:
        status_queue.put("data: 开始抖音账号设置流程...")

        # 启动浏览器
        async with async_playwright() as playwright:
            options = {
                'headless': False,
                'args': [
                    '--lang=zh-CN',
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            }

            browser = await playwright.chromium.launch(**options)
            context = await browser.new_context()

            # 应用反检测脚本
            context = await set_init_script(context)

            # 创建页面
            page = await context.new_page()
            page.set_default_timeout(30000)

            # 定义cookie路径
            cookie_path = f"cookies/douyin_uploader/cookie_{account_id}.json"
            os.makedirs(os.path.dirname(cookie_path), exist_ok=True)

            # 先尝试验证现有cookie
            auth_success = await cookie_auth(cookie_path, page, status_queue)

            if auth_success:
                status_queue.put("data: 使用现有cookie登录成功")
            else:
                # 如果现有cookie无效，生成新的cookie
                gen_success = await douyin_cookie_gen(account_id, page, status_queue)

                if not gen_success:
                    status_queue.put("data: 登录失败，请重试")
                    status_queue.put("500")
                    return False

                # 保存新的cookie
                try:
                    await context.storage_state(path=cookie_path)
                    status_queue.put("data: Cookie保存成功")
                    print(f"Cookie已保存到: {cookie_path}")
                except Exception as e:
                    print(f"保存Cookie失败: {str(e)}")
                    status_queue.put("data: 保存Cookie失败")
                    status_queue.put("500")
                    return False

            # 最终验证 - 访问上传页面确认登录状态
            await page.goto("https://creator.douyin.com/creator-micro/content/upload", wait_until="networkidle")
            await page.wait_for_timeout(2000)

            if "creator.douyin.com/creator-micro" in page.url:
                status_queue.put("data: 最终验证成功！")
                status_queue.put("data: 抖音账号设置完成")

                # 创建数据库记录
                success, message = create_account_in_db(account_id, 3)  # 3 = 抖音

                if success:
                    status_queue.put(f"data: 抖音账号 {account_id} 添加成功！")
                    status_queue.put("200")
                    return True
                else:
                    status_queue.put(f"data: 数据库保存失败: {message}")
                    status_queue.put("500")
                    return False
            else:
                status_queue.put("data: 最终验证失败")
                status_queue.put("500")
                return False

    except Exception as e:
        error_msg = f"抖音设置流程异常: {str(e)}"
        print(error_msg)
        status_queue.put(f"data: {error_msg}")
        status_queue.put("500")
        return False

    finally:
        # 清理资源
        try:
            if context:
                await context.close()
            if browser:
                await browser.close()
        except:
            pass

def run_async_function(platform_type, account_id, status_queue):
    """运行异步登录流程"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        if platform_type == '3':  # 抖音
            success = loop.run_until_complete(douyin_setup(account_id, status_queue))
        else:
            status_queue.put("data: 暂不支持该平台")
            status_queue.put("500")
            success = False

        loop.close()
        return success
    except Exception as e:
        print(f"异步函数执行失败: {str(e)}")
        status_queue.put(f"data: 登录失败: {str(e)}")
        status_queue.put("500")
        return False

def sse_stream(status_queue):
    """生成SSE流"""
    while True:
        try:
            if not status_queue.empty():
                msg = status_queue.get()

                # 检查是否是结束标记
                if msg in ["200", "500"]:
                    # 发送状态码后结束流
                    yield f"data: {msg}\n\n"
                    break

                # 发送消息
                if msg.startswith("data:"):
                    yield f"{msg}\n\n"
                else:
                    yield f"data: {msg}\n\n"

            else:
                time.sleep(0.1)

        except Exception as e:
            yield f"data: 流错误: {str(e)}\n\n"
            break

@app.route('/login', methods=['GET'])
def login_sse():
    """SSE登录接口"""
    platform_type = request.args.get('type', '1')
    account_id = request.args.get('id', '')

    if not account_id:
        return jsonify({
            'code': 400,
            'data': None,
            'msg': '缺少必要参数: id'
        }), 400

    print(f"开始原生抖音二维码登录流程 - 平台类型: {platform_type}, 账号ID: {account_id}")

    # 创建状态队列
    status_queue = Queue()
    active_queues[account_id] = status_queue

    # 启动登录线程
    thread = threading.Thread(
        target=run_async_function,
        args=(platform_type, account_id, status_queue),
        daemon=True
    )
    thread.start()

    # 返回SSE响应
    response = Response(sse_stream(status_queue), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Connection'] = 'keep-alive'
    response.headers['X-Accel-Buffering'] = 'no'

    return response

@app.route('/getValidAccounts', methods=['GET'])
def get_valid_accounts():
    """获取有效账号列表"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, type, filePath, userName, status
            FROM user_info
            ORDER BY id DESC
        ''')
        accounts = cursor.fetchall()

        account_list = []
        for account in accounts:
            account_list.append({
                'id': account['id'],
                'type': account['type'],
                'filePath': account['filePath'],
                'userName': account['userName'],
                'status': account['status']
            })

        conn.close()

        return jsonify({
            'code': 200,
            'data': account_list,
            'msg': '获取成功'
        })

    except Exception as e:
        return jsonify({
            'code': 500,
            'data': None,
            'msg': f'获取账号列表失败: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'code': 200,
        'data': {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'mode': 'native_douyin_qr_login'
        },
        'msg': '健康检查成功'
    })

if __name__ == '__main__':
    print("🚀 启动原生抖音二维码登录后端服务器...")
    print("📡 服务地址: http://localhost:5409")
    print("🔍 健康检查: http://localhost:5409/health")
    print("📝 原生抖音二维码登录: http://localhost:5409/login?type=3&id=你的账号")
    print("✨ 特点: 直接复制原生 working 代码，使用 await page.pause() 方法")
    print("⚠️  注意: 需要真实的抖音APP扫码登录")
    print("🔧 使用原生stealth.js反检测机制")
    print("🎯 核心改进: 使用原生 cookie_auth() + douyin_cookie_gen() 流程")

    app.run(host='0.0.0.0', port=5409, debug=True)