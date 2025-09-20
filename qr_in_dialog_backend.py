#!/usr/bin/env python3
"""
支持在对话框内显示二维码的后端服务器
生成二维码图片并通过SSE发送给前端显示
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
import qrcode

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

def generate_platform_qr_code(platform_name, account_id):
    """生成平台特定的二维码图片"""
    try:
        # 创建QR码
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )

        # 添加数据
        qr_data = f"{platform_name}_LOGIN_{account_id}_{int(time.time())}"
        qr.add_data(qr_data)
        qr.make(fit=True)

        # 创建图片
        img = qr.make_image(fill_color="black", back_color="white")

        # 转换为更大的图片以便添加文字
        img = img.resize((300, 300), Image.Resampling.LANCZOS)

        # 创建绘图对象
        draw = ImageDraw.Draw(img)

        # 尝试加载字体
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 16)
            small_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 12)
        except:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()

        # 添加平台名称
        platform_text = f"{platform_name}扫码登录"
        text_width = draw.textlength(platform_text, font=font)
        text_position = ((300 - text_width) // 2, 320)
        draw.text(text_position, platform_text, fill='black', font=font)

        # 添加账号ID
        id_text = f"账号: {account_id}"
        id_width = draw.textlength(id_text, font=small_font)
        id_position = ((300 - id_width) // 2, 340)
        draw.text(id_position, id_text, fill='gray', font=small_font)

        # 添加时间戳
        time_text = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        time_width = draw.textlength(time_text, font=small_font)
        time_position = ((300 - time_width) // 2, 355)
        draw.text(time_position, time_text, fill='blue', font=small_font)

        # 转换为base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()

        return f"data:image/png;base64,{img_base64}"

    except Exception as e:
        print(f"生成二维码失败: {str(e)}")
        # 返回一个简单的占位图
        return create_placeholder_qr(platform_name, account_id)

def create_placeholder_qr(platform_name, account_id):
    """创建占位二维码"""
    try:
        img = Image.new('RGB', (300, 300), color='white')
        draw = ImageDraw.Draw(img)

        # 绘制简单的二维码样式
        for i in range(0, 300, 30):
            for j in range(0, 300, 30):
                if (i + j) % 60 == 0:
                    draw.rectangle([i, j, i+25, j+25], fill='black')

        # 添加文字
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 20)
            small_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 14)
        except:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()

        # 平台名称
        platform_text = f"{platform_name}"
        text_width = draw.textlength(platform_text, font=font)
        text_position = ((300 - text_width) // 2, 120)
        draw.text(text_position, platform_text, fill='black', font=font)

        # 提示文字
        hint_text = "扫码登录"
        hint_width = draw.textlength(hint_text, font=small_font)
        hint_position = ((300 - hint_width) // 2, 150)
        draw.text(hint_position, hint_text, fill='blue', font=small_font)

        # 账号ID
        id_text = f"ID: {account_id}"
        id_width = draw.textlength(id_text, font=small_font)
        id_position = ((300 - id_width) // 2, 180)
        draw.text(id_position, id_text, fill='gray', font=small_font)

        # 转换为base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()

        return f"data:image/png;base64,{img_base64}"

    except Exception as e:
        print(f"创建占位图失败: {str(e)}")
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hjBMKQAAAABJRU5ErkJggg=="

async def simulate_qr_login_flow(platform_type, account_id, status_queue):
    """模拟二维码登录流程（在对话框内显示）"""
    try:
        platform_names = {
            '1': '小红书',
            '2': '视频号',
            '3': '抖音',
            '4': '快手'
        }

        platform = platform_names.get(platform_type, '未知平台')

        # 1. 生成二维码
        print(f"生成{platform}二维码 for {account_id}")
        qr_data = generate_platform_qr_code(platform, account_id)
        status_queue.put(f"data: {qr_data}")
        await asyncio.sleep(1)

        # 2. 发送提示信息
        status_queue.put(f"data: 请使用{platform}APP扫描二维码登录")
        await asyncio.sleep(2)

        # 3. 模拟等待扫码过程
        status_queue.put(f"data: 等待扫码...")
        await asyncio.sleep(3)

        # 4. 模拟扫码成功
        status_queue.put(f"data: 检测到扫码，正在验证...")
        await asyncio.sleep(2)

        # 5. 模拟登录成功
        status_queue.put(f"data: 登录验证成功，正在保存账号信息...")
        await asyncio.sleep(1)

        # 6. 在数据库中创建账号
        success, message = create_account_in_db(account_id, platform_type)

        if success:
            # 7. 登录成功
            status_queue.put(f"data: {platform}账号 {account_id} 添加成功！")
            status_queue.put("200")  # 成功状态码
            print(f"账号 {account_id} 添加成功")
        else:
            # 8. 登录失败
            status_queue.put(f"data: 添加失败: {message}")
            status_queue.put("500")  # 失败状态码
            print(f"账号 {account_id} 添加失败: {message}")

        return success

    except Exception as e:
        error_msg = f"登录流程异常: {str(e)}"
        print(error_msg)
        status_queue.put(f"data: {error_msg}")
        status_queue.put("500")
        return False

def run_async_function(platform_type, account_id, status_queue):
    """运行异步登录流程"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        success = loop.run_until_complete(simulate_qr_login_flow(platform_type, account_id, status_queue))
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

    print(f"开始对话框内二维码登录流程 - 平台类型: {platform_type}, 账号ID: {account_id}")

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
            'mode': 'dialog_qr_code'
        },
        'msg': '健康检查成功'
    })

if __name__ == '__main__':
    print("🚀 启动对话框内二维码显示后端服务器...")
    print("📡 服务地址: http://localhost:5409")
    print("🔍 健康检查: http://localhost:5409/health")
    print("📝 对话框内二维码登录: http://localhost:5409/login?type=3&id=你的账号")
    print("✨ 特点: 二维码直接在添加账号对话框内显示，无需新开浏览器窗口")
    print("⚠️  注意: 这是模拟登录流程，实际使用时需要集成真实的扫码验证")

    app.run(host='0.0.0.0', port=5409, debug=True)