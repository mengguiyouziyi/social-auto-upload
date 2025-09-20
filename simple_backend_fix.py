#!/usr/bin/env python3
"""
简单的后端服务器修复版本
"""
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import os
from datetime import datetime
import time

app = Flask(__name__)
CORS(app)

# 简单的内存数据存储
accounts = []
tasks = []
files = []

@app.route('/login', methods=['GET'])
def login_sse():
    """SSE登录接口，模拟二维码登录流程并添加账号"""
    type_param = request.args.get('type', '1')
    account_id = request.args.get('id', '')

    # 平台映射
    platform_map = {
        '1': '小红书',
        '2': '视频号',
        '3': '抖音',
        '4': '快手'
    }
    platform = platform_map.get(type_param, '快手')

    def generate_events():
        # 模拟二维码数据（base64编码的图片数据）
        qr_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hjBMKQAAAABJRU5ErkJggg=="

        # 发送二维码数据
        yield f"data: {qr_data}\n\n"

        # 模拟等待时间
        time.sleep(2)

        # 检查账号是否已存在
        account_exists = False
        for account in accounts:
            if account.get('account_name') == account_id:
                account_exists = True
                break

        if not account_exists and account_id:
            # 添加新账号
            new_account = {
                'id': len(accounts) + 1,
                'account_name': account_id,
                'platform': platform,
                'account_type': 'personal',
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            accounts.append(new_account)
            print(f"✅ 通过SSE添加账号: {account_id} ({platform})")

        # 模拟登录成功
        yield "data: 200\n\n"

    return Response(generate_events(), mimetype='text/event-stream')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'code': 200,
        'data': {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'system': {
                'cpu_percent': 25.0,
                'memory_percent': 70.0,
                'disk_percent': 3.7,
                'uptime': 1
            },
            'application': {
                'active_users': 0,
                'total_requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'average_response_time': 0,
                'upload_success_rate': 0
            }
        },
        'msg': '健康检查成功'
    })

@app.route('/system/status', methods=['GET'])
def system_status():
    return jsonify({
        'code': 200,
        'data': {
            'alerts': [],
            'metrics': {
                'application': []
            }
        },
        'msg': '系统状态获取成功'
    })

@app.route('/getValidAccounts', methods=['GET'])
def get_valid_accounts():
    return jsonify({
        'code': 200,
        'data': accounts,
        'msg': '获取账号列表成功'
    })

@app.route('/addAccount', methods=['POST'])
def add_account():
    try:
        data = request.get_json()

        # 验证必要字段
        if not data or 'account_name' not in data:
            return jsonify({
                'code': 400,
                'data': None,
                'error_code': 'MISSING_REQUIRED_FIELD',
                'msg': '缺少必要字段: account_name'
            }), 400

        account_name = data['account_name']
        platform = data.get('platform', 'douyin')
        account_type = data.get('account_type', 'personal')

        # 检查账号是否已存在
        for account in accounts:
            if account.get('account_name') == account_name:
                return jsonify({
                    'code': 400,
                    'data': None,
                    'error_code': 'ACCOUNT_EXISTS',
                    'msg': '账号已存在'
                }), 400

        # 创建新账号
        new_account = {
            'id': len(accounts) + 1,
            'account_name': account_name,
            'platform': platform,
            'account_type': account_type,
            'status': 'active',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

        accounts.append(new_account)

        return jsonify({
            'code': 200,
            'data': new_account,
            'msg': '账号添加成功'
        })

    except Exception as e:
        return jsonify({
            'code': 500,
            'data': None,
            'error_code': 'INTERNAL_ERROR',
            'msg': f'服务器内部错误: {str(e)}'
        }), 500

@app.route('/updateAccount', methods=['PUT'])
def update_account():
    try:
        data = request.get_json()

        if not data or 'id' not in data:
            return jsonify({
                'code': 400,
                'data': None,
                'error_code': 'MISSING_REQUIRED_FIELD',
                'msg': '缺少必要字段: id'
            }), 400

        account_id = data['id']

        # 查找账号
        for account in accounts:
            if account.get('id') == account_id:
                # 更新账号信息
                account.update({
                    'account_name': data.get('account_name', account['account_name']),
                    'platform': data.get('platform', account['platform']),
                    'account_type': data.get('account_type', account['account_type']),
                    'status': data.get('status', account['status']),
                    'updated_at': datetime.now().isoformat()
                })

                return jsonify({
                    'code': 200,
                    'data': account,
                    'msg': '账号更新成功'
                })

        return jsonify({
            'code': 404,
            'data': None,
            'error_code': 'ACCOUNT_NOT_FOUND',
            'msg': '账号不存在'
        }), 404

    except Exception as e:
        return jsonify({
            'code': 500,
            'data': None,
            'error_code': 'INTERNAL_ERROR',
            'msg': f'服务器内部错误: {str(e)}'
        }), 500

@app.route('/deleteAccount', methods=['DELETE'])
def delete_account():
    try:
        data = request.get_json()

        if not data or 'id' not in data:
            return jsonify({
                'code': 400,
                'data': None,
                'error_code': 'MISSING_REQUIRED_FIELD',
                'msg': '缺少必要字段: id'
            }), 400

        account_id = data['id']

        # 查找并删除账号
        for i, account in enumerate(accounts):
            if account.get('id') == account_id:
                accounts.pop(i)
                return jsonify({
                    'code': 200,
                    'data': None,
                    'msg': '账号删除成功'
                })

        return jsonify({
            'code': 404,
            'data': None,
            'error_code': 'ACCOUNT_NOT_FOUND',
            'msg': '账号不存在'
        }), 404

    except Exception as e:
        return jsonify({
            'code': 500,
            'data': None,
            'error_code': 'INTERNAL_ERROR',
            'msg': f'服务器内部错误: {str(e)}'
        }), 500

@app.route('/getAccount', methods=['GET'])
def get_account():
    try:
        account_id = request.args.get('id')

        if not account_id:
            return jsonify({
                'code': 400,
                'data': None,
                'error_code': 'MISSING_REQUIRED_FIELD',
                'msg': '缺少必要参数: id'
            }), 400

        # 查找账号
        for account in accounts:
            if account.get('id') == int(account_id):
                return jsonify({
                    'code': 200,
                    'data': account,
                    'msg': '获取账号成功'
                })

        return jsonify({
            'code': 404,
            'data': None,
            'error_code': 'ACCOUNT_NOT_FOUND',
            'msg': '账号不存在'
        }), 404

    except Exception as e:
        return jsonify({
            'code': 500,
            'data': None,
            'error_code': 'INTERNAL_ERROR',
            'msg': f'服务器内部错误: {str(e)}'
        }), 500

@app.route('/getTasks', methods=['GET'])
def get_tasks():
    return jsonify({
        'code': 200,
        'data': tasks,
        'msg': '获取任务列表成功'
    })

@app.route('/getFiles', methods=['GET'])
def get_files():
    return jsonify({
        'code': 200,
        'data': files,
        'msg': '获取文件列表成功'
    })

# AI相关API
@app.route('/ai/providers', methods=['GET'])
def ai_providers():
    return jsonify({
        'code': 200,
        'data': ['openai', 'claude', 'gemini'],
        'msg': '获取AI提供商成功'
    })

@app.route('/ai/generate', methods=['POST'])
def ai_generate():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        provider = data.get('provider', 'openai')

        # 简单的模拟响应
        return jsonify({
            'code': 200,
            'data': {
                'response': f'AI响应 ({provider}): {prompt}',
                'timestamp': datetime.now().isoformat()
            },
            'msg': 'AI生成成功'
        })
    except Exception as e:
        return jsonify({
            'code': 500,
            'data': None,
            'error_code': 'INTERNAL_ERROR',
            'msg': f'服务器内部错误: {str(e)}'
        }), 500

@app.route('/tts/voices', methods=['GET'])
def tts_voices():
    return jsonify({
        'code': 200,
        'data': [
            {'id': 'female1', 'name': '女声1', 'language': 'zh-CN'},
            {'id': 'male1', 'name': '男声1', 'language': 'zh-CN'}
        ],
        'msg': '获取TTS声音列表成功'
    })

@app.route('/ai/recommendations', methods=['GET'])
def ai_recommendations():
    return jsonify({
        'code': 200,
        'data': [
            {'type': 'content', 'title': '内容优化建议', 'description': '优化您的内容以获得更好的曝光'},
            {'type': 'timing', 'title': '发布时间建议', 'description': '建议在晚上8-10点发布'}
        ],
        'msg': '获取AI建议成功'
    })

@app.route('/ai/analysis', methods=['POST'])
def ai_analysis():
    try:
        data = request.get_json()
        content = data.get('content', '')

        # 简单的分析结果
        return jsonify({
            'code': 200,
            'data': {
                'sentiment': 'positive',
                'engagement_score': 85,
                'suggestions': ['内容质量很好', '建议增加互动元素']
            },
            'msg': 'AI分析成功'
        })
    except Exception as e:
        return jsonify({
            'code': 500,
            'data': None,
            'error_code': 'INTERNAL_ERROR',
            'msg': f'服务器内部错误: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("🚀 启动简单的后端服务器...")
    print("📡 服务地址: http://localhost:5409")
    print("🔍 健康检查: http://localhost:5409/health")

    # 添加一些示例数据
    accounts.extend([
        {'id': 1, 'account_name': '示例账号1', 'platform': 'douyin', 'account_type': 'personal', 'status': 'active', 'created_at': '2025-09-17T10:00:00', 'updated_at': '2025-09-17T10:00:00'},
        {'id': 2, 'account_name': '示例账号2', 'platform': 'kuaishou', 'account_type': 'business', 'status': 'active', 'created_at': '2025-09-17T10:00:00', 'updated_at': '2025-09-17T10:00:00'}
    ])

    app.run(host='0.0.0.0', port=5409, debug=True)