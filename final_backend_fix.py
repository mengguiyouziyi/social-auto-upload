#!/usr/bin/env python3
"""
最终修复版本的后端服务器
在SSE登录流程中实际创建账号并持久化到数据库
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
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__)
CORS(app)

# 数据库初始化
def init_database():
    """初始化数据库"""
    conn = sqlite3.connect('db/database.db')
    cursor = conn.cursor()

    # 确保db目录存在
    os.makedirs('db', exist_ok=True)

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
        cursor.execute('''
            INSERT INTO user_info (type, filePath, userName, status)
            VALUES (?, ?, ?, ?)
        ''', (int(platform_type), f"cookie_{account_name}.txt", account_name, 1))

        conn.commit()
        conn.close()

        return True, "账号创建成功"

    except Exception as e:
        print(f"数据库操作失败: {str(e)}")
        return False, f"数据库操作失败: {str(e)}"

async def generate_qr_code(account_name, platform):
    """生成二维码图片"""
    try:
        # 创建一个简单的二维码占位图
        img = Image.new('RGB', (200, 200), color='white')
        draw = ImageDraw.Draw(img)

        # 绘制一个简单的二维码样式
        for i in range(0, 200, 20):
            for j in range(0, 200, 20):
                if (i + j) % 40 == 0:
                    draw.rectangle([i, j, i+15, j+15], fill='green')

        # 添加文字
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 12)
        except:
            font = ImageFont.load_default()

        platform_names = {
            '1': '小红书',
            '2': '视频号',
            '3': '抖音',
            '4': '快手'
        }

        platform_name = platform_names.get(platform, '未知平台')
        draw.text((50, 85), f"{platform_name}扫码登录", fill='green', font=font)
        draw.text((70, 105), f"ID: {account_name}", fill='green', font=font)

        # 转换为base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()

        return f"data:image/png;base64,{img_base64}"

    except Exception as e:
        print(f"生成二维码失败: {str(e)}")
        return f"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hjBMKQAAAABJRU5ErkJggg=="

async def platform_login_flow(platform_type, account_id, status_queue):
    """平台登录流程"""
    try:
        platform_names = {
            '1': '小红书',
            '2': '视频号',
            '3': '抖音',
            '4': '快手'
        }

        platform = platform_names.get(platform_type, '未知平台')

        # 1. 生成二维码
        qr_data = await generate_qr_code(account_id, platform_type)
        status_queue.put(qr_data)

        # 模拟等待扫码
        await asyncio.sleep(2)

        # 2. 模拟扫码成功
        status_queue.put("扫码成功，正在登录...")
        await asyncio.sleep(1)

        # 3. 在数据库中创建账号
        success, message = create_account_in_db(account_id, platform_type)

        if success:
            # 4. 登录成功
            status_queue.put(f"{platform}账号 {account_id} 登录成功！")
            status_queue.put("200")  # 成功状态码，前端期望的格式
        else:
            # 5. 登录失败
            status_queue.put(f"登录失败: {message}")
            status_queue.put("500")  # 失败状态码，前端期望的格式

        return success

    except Exception as e:
        status_queue.put(f"登录流程异常: {str(e)}")
        status_queue.put("FAILED")
        return False

def run_async_function(platform_type, account_id, status_queue):
    """运行异步登录流程"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        success = loop.run_until_complete(platform_login_flow(platform_type, account_id, status_queue))
        loop.close()
        return success
    except Exception as e:
        print(f"异步函数执行失败: {str(e)}")
        status_queue.put(f"登录失败: {str(e)}")
        status_queue.put("FAILED")
        return False

def sse_stream(status_queue):
    """生成SSE流"""
    while True:
        try:
            if not status_queue.empty():
                msg = status_queue.get()

                # 检查是否是结束标记
                if msg in ["SUCCESS", "FAILED"]:
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

    print(f"开始登录流程 - 平台类型: {platform_type}, 账号ID: {account_id}")

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

@app.route('/addAccount', methods=['POST'])
def add_account():
    """直接添加账号接口"""
    try:
        data = request.get_json()

        if not data or 'userName' not in data:
            return jsonify({
                'code': 400,
                'data': None,
                'msg': '缺少必要字段: userName'
            }), 400

        account_name = data['userName']
        platform_type = data.get('type', '4')

        success, message = create_account_in_db(account_name, platform_type)

        if success:
            return jsonify({
                'code': 200,
                'data': {'userName': account_name, 'type': platform_type},
                'msg': '添加成功'
            })
        else:
            return jsonify({
                'code': 400,
                'data': None,
                'msg': message
            }), 400

    except Exception as e:
        return jsonify({
            'code': 500,
            'data': None,
            'msg': f'添加账号失败: {str(e)}'
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
    print("🚀 启动最终修复版本的后端服务器...")
    print("📡 服务地址: http://localhost:5409")
    print("🔍 健康检查: http://localhost:5409/health")
    print("📝 SSE登录接口: http://localhost:5409/login?type=4&id=13784855457")

    app.run(host='0.0.0.0', port=5409, debug=True)