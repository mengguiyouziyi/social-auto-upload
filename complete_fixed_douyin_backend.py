#!/usr/bin/env python3
"""
完整修复后的抖音二维码登录后端
严格遵循原始项目架构，修复登录状态检测问题
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

async def check_douyin_login_status(page, account_id, status_queue):
    """检查抖音登录状态"""
    max_wait_time = 180  # 最多等待3分钟
    start_time = time.time()

    status_queue.put("data: 等待扫码...")

    while time.time() - start_time < max_wait_time:
        try:
            # 方法1: 检查URL变化
            if "creator.douyin.com/creator-micro" in page.url or "creator.douyin.com/manage" in page.url:
                status_queue.put("data: 检测到跳转到创作者中心，登录成功！")
                return True

            # 方法2: 检查页面标题
            title = await page.title()
            if "创作者中心" in title or "创作中心" in title:
                status_queue.put("data: 检测到创作者中心页面，登录成功！")
                return True

            # 方法3: 检查用户信息元素
            user_elements = await page.query_selector_all('.user-avatar, .user-info, .nickname, .semi-avatar')
            if user_elements:
                status_queue.put("data: 检测到用户信息，登录成功！")
                return True

            # 方法4: 检查是否还有登录相关元素
            login_elements = await page.query_selector_all('text="手机号登录", text="扫码登录", text="立即登录"')
            if not login_elements:
                status_queue.put("data: 登录元素消失，可能已登录！")
                return True

            # 方法5: 检查特定登录成功标识
            success_indicators = [
                '.semi-tabs-active',  # 创作者中心标签
                '.creator-nav',      # 创作者导航
                '.workspace-nav',    # 工作空间导航
                '[data-semi-prop*="workspace"]'  # 工作空间相关
            ]

            for indicator in success_indicators:
                elements = await page.query_selector_all(indicator)
                if elements:
                    status_queue.put("data: 检测到创作者中心界面，登录成功！")
                    return True

            # 定期更新等待状态
            elapsed = int(time.time() - start_time)
            if elapsed % 10 == 0 and elapsed > 0:
                status_queue.put(f"data: 已等待 {elapsed} 秒，请尽快扫码...")

            await page.wait_for_timeout(1000)

        except Exception as e:
            print(f"检查登录状态时出错: {str(e)}")
            await page.wait_for_timeout(1000)

    return False

async def real_douyin_qr_login(account_id, status_queue):
    """真实的抖音二维码登录流程"""
    browser = None
    context = None

    try:
        print(f"开始真实的抖音二维码登录流程 for {account_id}")

        # 1. 启动浏览器
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

            # 设置超时
            page.set_default_timeout(30000)

            # 2. 访问抖音创作者中心
            status_queue.put("data: 正在访问抖音创作者中心...")
            await page.goto("https://creator.douyin.com/", wait_until="networkidle")
            await page.wait_for_timeout(3000)

            # 3. 等待二维码出现
            status_queue.put("data: 等待二维码加载...")

            # 尝试多种二维码选择器
            qr_selectors = [
                'img[src*="qrcode"]',
                '.qr-code img',
                '[class*="qrcode"] img',
                '.login-qr-code img',
                '.qrcode-img',
                'img[alt*="二维码"]',
                '.semi-qrcode img',
                '.login-container img',
                '.login-qr-code img'
            ]

            qr_element = None
            for selector in qr_selectors:
                try:
                    qr_element = await page.wait_for_selector(selector, timeout=3000)
                    if qr_element and await qr_element.is_visible():
                        print(f"找到二维码元素: {selector}")
                        break
                except:
                    continue

            if not qr_element:
                # 如果没有找到二维码，检查是否已经登录
                if await page.query_selector('text="手机号登录"') or await page.query_selector('text="扫码登录"'):
                    status_queue.put("data: 未找到二维码，页面可能需要手动操作")
                    status_queue.put("500")
                    return False
                else:
                    status_queue.put("data: 可能已经登录，正在检查...")
                    # 检查是否已经登录成功
                    if "creator.douyin.com/creator-micro" in page.url:
                        status_queue.put("data: 检测到已登录状态")
                        # 直接保存cookie并创建账号
                        cookie_file = f"cookies/douyin_uploader/cookie_{account_id}.json"
                        os.makedirs(os.path.dirname(cookie_file), exist_ok=True)

                        try:
                            await context.storage_state(path=cookie_file)
                            print(f"Cookie已保存到: {cookie_file}")
                        except Exception as e:
                            print(f"保存Cookie失败: {str(e)}")

                        success, message = create_account_in_db(account_id, 3)
                        if success:
                            status_queue.put(f"data: 抖音账号 {account_id} 添加成功！")
                            status_queue.put("200")
                            return True
                        else:
                            status_queue.put(f"data: 添加失败: {message}")
                            status_queue.put("500")
                            return False
                    else:
                        status_queue.put("data: 页面状态异常，请刷新重试")
                        status_queue.put("500")
                        return False

            # 4. 截取二维码图片
            status_queue.put("data: 正在获取二维码...")

            try:
                qr_image = await qr_element.screenshot()
                buffered = BytesIO(qr_image)
                img_base64 = base64.b64encode(buffered.getvalue()).decode()

                # 发送二维码给前端
                status_queue.put(f"data: data:image/png;base64,{img_base64}")
                status_queue.put("data: 请使用抖音APP扫描二维码登录")

                print(f"成功获取二维码，大小: {len(img_base64)} 字节")

            except Exception as e:
                print(f"截取二维码失败: {str(e)}")
                status_queue.put("data: 二维码获取失败，请刷新重试")
                status_queue.put("500")
                return False

            # 5. 等待用户扫码登录
            status_queue.put("data: 等待扫码...")

            # 使用专门的登录状态检查函数
            login_success = await check_douyin_login_status(page, account_id, status_queue)

            if login_success:
                status_queue.put("data: 登录验证成功，正在保存账号信息...")
            else:
                status_queue.put("data: 登录超时，请刷新重试")
                status_queue.put("500")
                return False

            # 6. 保存Cookie
            status_queue.put("data: 正在保存登录状态...")

            cookie_file = f"cookies/douyin_uploader/cookie_{account_id}.json"
            os.makedirs(os.path.dirname(cookie_file), exist_ok=True)

            try:
                await context.storage_state(path=cookie_file)
                print(f"Cookie已保存到: {cookie_file}")
            except Exception as e:
                print(f"保存Cookie失败: {str(e)}")
                status_queue.put("data: 保存登录状态失败")
                status_queue.put("500")
                return False

            # 7. 创建数据库记录
            success, message = create_account_in_db(account_id, 3)  # 3 = 抖音

            if success:
                status_queue.put(f"data: 抖音账号 {account_id} 添加成功！")
                status_queue.put("200")
                print(f"账号 {account_id} 添加成功")
                return True
            else:
                status_queue.put(f"data: 添加失败: {message}")
                status_queue.put("500")
                print(f"账号 {account_id} 添加失败: {message}")
                return False

    except Exception as e:
        error_msg = f"登录流程异常: {str(e)}"
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
            success = loop.run_until_complete(real_douyin_qr_login(account_id, status_queue))
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

    print(f"开始完整修复的抖音二维码登录流程 - 平台类型: {platform_type}, 账号ID: {account_id}")

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
            'mode': 'fixed_douyin_qr_login'
        },
        'msg': '健康检查成功'
    })

if __name__ == '__main__':
    print("🚀 启动完整修复后的抖音二维码登录后端服务器...")
    print("📡 服务地址: http://localhost:5409")
    print("🔍 健康检查: http://localhost:5409/health")
    print("📝 完整修复的抖音二维码登录: http://localhost:5409/login?type=3&id=你的账号")
    print("✨ 修复内容:")
    print("   - 改进登录状态检测机制")
    print("   - 增强二维码识别算法")
    print("   - 优化页面加载策略")
    print("   - 修复SSE消息格式")
    print("   - 改进错误处理流程")
    print("⚠️  注意: 需要真实的抖音APP扫码登录")
    print("🔧 使用原生stealth.js反检测机制")

    app.run(host='0.0.0.0', port=5409, debug=True)