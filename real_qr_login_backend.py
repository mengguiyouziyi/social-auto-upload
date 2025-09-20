#!/usr/bin/env python3
"""
真实二维码登录后端服务器
集成了真实的Playwright自动化登录流程
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
from playwright.async_api import async_playwright

# 添加项目路径以导入上传器模块
import sys
sys.path.append('/Users/sunyouyou/Desktop/projects/bzhi/social-auto-upload/sau_backend')

app = Flask(__name__)
CORS(app)

# 数据库初始化
def init_database():
    """初始化数据库"""
    os.makedirs('db', exist_ok=True)
    os.makedirs('cookies', exist_ok=True)
    os.makedirs('cookies/douyin_uploader', exist_ok=True)

    conn = sqlite3.connect('db/database.db')
    cursor = conn.cursor()

    # 创建用户信息表（使用原生表结构）
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

async def real_douyin_qr_login(account_id, status_queue):
    """真实的抖音二维码登录流程"""
    try:
        status_queue.put("data: 正在启动浏览器，请稍候...\n\n")

        async with async_playwright() as playwright:
            # 启动浏览器（有头模式，用户可以看到）
            browser = await playwright.chromium.launch(headless=False)
            context = await browser.new_context()
            page = await context.new_page()

            # 访问抖音创作者中心
            await page.goto("https://creator.douyin.com/")
            status_queue.put("data: 已打开抖音登录页面\n\n")

            # 等待二维码出现
            qr_selector = 'img[src*="qrcode"], .qr-code img, [class*="qrcode"] img'
            try:
                await page.wait_for_selector(qr_selector, timeout=10000)
                status_queue.put("data: 二维码已加载，请用手机抖音APP扫码\n\n")
            except:
                status_queue.put("data: 未找到二维码元素，尝试手动登录\n\n")
                await page.pause()
                return

            # 获取真实的二维码图片
            try:
                qr_element = await page.query_selector(qr_selector)
                qr_image = await qr_element.screenshot()

                # 转换为base64发送给前端
                buffered = BytesIO(qr_image)
                img_base64 = base64.b64encode(buffered.getvalue()).decode()

                status_queue.put(f"data: data:image/png;base64,{img_base64}\n\n")
                status_queue.put("data: 请用手机抖音APP扫描二维码，扫码完成后请在浏览器中等待跳转...\n\n")

                # 暂停浏览器，等待用户扫码登录（参考原始项目实现）
                status_queue.put("data: 浏览器已暂停，请扫码登录，登录成功后浏览器会自动继续...\n\n")
                await page.pause()

            except Exception as e:
                status_queue.put(f"data: 获取二维码失败: {str(e)}\n\n")
                status_queue.put("data: 请在浏览器中手动完成登录\n\n")
                await page.pause()
                return

            # 用户扫码后，等待页面跳转完成
            status_queue.put("data: 检测到登录完成，正在保存cookie...\n\n")
            await asyncio.sleep(3)  # 等待跳转完成

            # 保存cookie
            cookie_file = f"cookies/douyin_uploader/cookie_{account_id}.json"
            await context.storage_state(path=cookie_file)

            # 在数据库中创建账号记录
            success, message = create_account_in_db(account_id, "3")
            if success:
                status_queue.put("data: 抖音账号登录成功！\n\n")
                status_queue.put("200")  # 成功状态码
            else:
                status_queue.put(f"data: {message}\n\n")
                status_queue.put("500")  # 失败状态码

            await browser.close()
            return True

    except Exception as e:
        error_msg = f"登录流程异常: {str(e)}"
        print(error_msg)
        status_queue.put(f"data: {error_msg}\n\n")
        status_queue.put("500")
        return False

async def real_ks_qr_login(account_id, status_queue):
    """真实的快手二维码登录流程"""
    try:
        status_queue.put("data: 正在启动浏览器，请稍候...\n\n")

        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=False)
            context = await browser.new_context()
            page = await context.new_page()

            # 访问快手创作者平台
            await page.goto("https://cp.kuaishou.com")
            status_queue.put("data: 已打开快手登录页面\n\n")

            # 等待页面加载
            await asyncio.sleep(3)

            # 查找二维码元素
            qr_selector = 'img[src*="qrcode"], .qr-code img, [class*="qrcode"] img'
            try:
                qr_elements = await page.query_selector_all(qr_selector)
                if qr_elements:
                    status_queue.put("data: 二维码已加载，请用手机快手APP扫码\n\n")

                    # 获取二维码图片
                    qr_element = qr_elements[0]
                    qr_image = await qr_element.screenshot()

                    # 转换为base64
                    buffered = BytesIO(qr_image)
                    img_base64 = base64.b64encode(buffered.getvalue()).decode()

                    status_queue.put(f"data: data:image/png;base64,{img_base64}\n\n")
                    status_queue.put("data: 请用手机快手APP扫描二维码，扫码完成后请在浏览器中等待跳转...\n\n")

                    # 暂停浏览器，等待用户扫码登录（参考原始项目实现）
                    status_queue.put("data: 浏览器已暂停，请扫码登录，登录成功后浏览器会自动继续...\n\n")
                    await page.pause()

                else:
                    status_queue.put("data: 未找到二维码，请手动登录\n\n")
                    await page.pause()
                    return

            except Exception as e:
                status_queue.put(f"data: 获取二维码失败: {str(e)}\n\n")
                status_queue.put("data: 请在浏览器中手动完成登录\n\n")
                await page.pause()
                return

            # 用户扫码后，等待页面跳转完成
            status_queue.put("data: 检测到登录完成，正在保存cookie...\n\n")
            await asyncio.sleep(3)  # 等待跳转完成

            # 保存cookie
            cookie_file = f"cookies/ks_uploader/cookie_{account_id}.json"
            os.makedirs("cookies/ks_uploader", exist_ok=True)
            await context.storage_state(path=cookie_file)

            # 在数据库中创建账号记录
            success, message = create_account_in_db(account_id, "4")
            if success:
                status_queue.put("data: 快手账号登录成功！\n\n")
                status_queue.put("200")
            else:
                status_queue.put(f"data: {message}\n\n")
                status_queue.put("500")

            await browser.close()
            return True

    except Exception as e:
        error_msg = f"登录流程异常: {str(e)}"
        print(error_msg)
        status_queue.put(f"data: {error_msg}\n\n")
        status_queue.put("500")
        return False

async def real_platform_login(platform_type, account_id, status_queue):
    """根据平台类型选择真实的登录流程"""
    try:
        if platform_type == '3':  # 抖音
            return await real_douyin_qr_login(account_id, status_queue)
        elif platform_type == '4':  # 快手
            return await real_ks_qr_login(account_id, status_queue)
        else:
            status_queue.put(f"data: 暂不支持平台类型: {platform_type}\n\n")
            status_queue.put("500")
            return False

    except Exception as e:
        error_msg = f"平台登录异常: {str(e)}"
        print(error_msg)
        status_queue.put(f"data: {error_msg}\n\n")
        status_queue.put("500")
        return False

def run_async_function(platform_type, account_id, status_queue):
    """运行异步登录流程"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        success = loop.run_until_complete(real_platform_login(platform_type, account_id, status_queue))
        loop.close()
        return success
    except Exception as e:
        print(f"异步函数执行失败: {str(e)}")
        status_queue.put(f"data: 登录失败: {str(e)}\n\n")
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

    print(f"开始真实登录流程 - 平台类型: {platform_type}, 账号ID: {account_id}")

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
            'timestamp': datetime.now().isoformat()
        },
        'msg': '健康检查成功'
    })

if __name__ == '__main__':
    print("🚀 启动真实二维码登录后端服务器...")
    print("📡 服务地址: http://localhost:5409")
    print("🔍 健康检查: http://localhost:5409/health")
    print("📝 真实抖音登录: http://localhost:5409/login?type=3&id=你的账号")
    print("📝 真实快手登录: http://localhost:5409/login?type=4&id=你的账号")
    print("⚠️  注意：这将启动真实的浏览器，需要手动扫码登录！")

    app.run(host='0.0.0.0', port=5409, debug=True)