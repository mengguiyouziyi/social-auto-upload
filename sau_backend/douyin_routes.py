"""
抖音平台专用路由模块
提供抖音账号登录、视频上传等API端点
"""

from flask import Blueprint, request, jsonify, g, Response
from datetime import datetime
import sys
import os
import json
import asyncio
import threading
import base64
from pathlib import Path

# 添加sau_backend到路径
sys.path.append("/Users/sunyouyou/Desktop/projects/bzhi/social-auto-upload/sau_backend")

from security import security_manager, require_auth
from models import db_manager
from platforms.douyin_platform import douyin_platform

# 创建抖音平台蓝图
douyin_bp = Blueprint("douyin", __name__, url_prefix="/api/douyin")


def run_async_in_thread(coro):
    """在新线程中运行异步函数"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@douyin_bp.route("/login/qr/<int:account_id>", methods=["POST"])
@require_auth
def generate_qr_code(account_id):
    """生成抖音登录二维码"""
    try:
        user_id = g.user_id

        # 验证账号所有权
        account = db_manager.get_social_account_by_id(account_id)
        if not account:
            return jsonify({"error": "账号不存在"}), 404

        if account.user_id != user_id:
            return jsonify({"error": "无权访问此账号"}), 403

        if account.platform != "douyin":
            return jsonify({"error": "不是抖音账号"}), 400

        # 生成二维码
        result = run_async_in_thread(
            douyin_platform.login_with_qr(account_id, account.cookie_path)
        )

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify({"error": result["message"]}), 500

    except Exception as e:
        return jsonify({"error": f"生成二维码失败: {str(e)}"}), 500


@douyin_bp.route("/login/wait/<int:account_id>", methods=["POST"])
@require_auth
def wait_for_login(account_id):
    """等待抖音登录完成"""
    try:
        user_id = g.user_id

        # 验证账号所有权
        account = db_manager.get_social_account_by_id(account_id)
        if not account:
            return jsonify({"error": "账号不存在"}), 404

        if account.user_id != user_id:
            return jsonify({"error": "无权访问此账号"}), 403

        if account.platform != "douyin":
            return jsonify({"error": "不是抖音账号"}), 400

        # 等待登录
        result = run_async_in_thread(
            douyin_platform.wait_for_login(account_id, account.cookie_path)
        )

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify({"error": result["message"]}), 500

    except Exception as e:
        return jsonify({"error": f"等待登录失败: {str(e)}"}), 500


@douyin_bp.route("/status/<int:account_id>", methods=["GET"])
@require_auth
def check_login_status(account_id):
    """检查抖音登录状态"""
    try:
        user_id = g.user_id

        # 验证账号所有权
        account = db_manager.get_social_account_by_id(account_id)
        if not account:
            return jsonify({"error": "账号不存在"}), 404

        if account.user_id != user_id:
            return jsonify({"error": "无权访问此账号"}), 403

        if account.platform != "douyin":
            return jsonify({"error": "不是抖音账号"}), 400

        # 检查登录状态
        result = run_async_in_thread(
            douyin_platform.check_login_status(account_id, account.cookie_path)
        )

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": f"检查登录状态失败: {str(e)}"}), 500


@douyin_bp.route("/upload/video/<int:account_id>", methods=["POST"])
@require_auth
def upload_video(account_id):
    """上传视频到抖音"""
    try:
        user_id = g.user_id

        # 验证账号所有权
        account = db_manager.get_social_account_by_id(account_id)
        if not account:
            return jsonify({"error": "账号不存在"}), 404

        if account.user_id != user_id:
            return jsonify({"error": "无权访问此账号"}), 403

        if account.platform != "douyin":
            return jsonify({"error": "不是抖音账号"}), 400

        # 检查账号状态
        if account.status != 1:
            return jsonify({"error": "账号未登录，请先完成登录"}), 400

        # 获取上传数据
        data = request.form if request.form else request.get_json()
        if not data:
            return jsonify({"error": "缺少上传数据"}), 400

        video_path = data.get("video_path", "").strip()
        title = data.get("title", "").strip()
        description = data.get("description", "").strip()
        tags = data.get("tags", "").strip().split() if data.get("tags") else []

        if not video_path or not title:
            return jsonify({"error": "视频路径和标题不能为空"}), 400

        # 检查视频文件是否存在
        if not os.path.exists(video_path):
            return jsonify({"error": "视频文件不存在"}), 400

        # 上传视频
        result = run_async_in_thread(
            douyin_platform.upload_video(account_id, video_path, title, description, tags)
        )

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify({"error": result["message"]}), 500

    except Exception as e:
        return jsonify({"error": f"上传视频失败: {str(e)}"}), 500


@douyin_bp.route("/upload/file/<int:account_id>", methods=["POST"])
@require_auth
def upload_video_file(account_id):
    """上传视频文件到抖音"""
    try:
        user_id = g.user_id

        # 验证账号所有权
        account = db_manager.get_social_account_by_id(account_id)
        if not account:
            return jsonify({"error": "账号不存在"}), 404

        if account.user_id != user_id:
            return jsonify({"error": "无权访问此账号"}), 403

        if account.platform != "douyin":
            return jsonify({"error": "不是抖音账号"}), 400

        # 检查账号状态
        if account.status != 1:
            return jsonify({"error": "账号未登录，请先完成登录"}), 400

        # 检查是否有文件上传
        if 'video' not in request.files:
            return jsonify({"error": "没有找到视频文件"}), 400

        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({"error": "没有选择视频文件"}), 400

        # 获取其他参数
        title = request.form.get("title", "").strip()
        description = request.form.get("description", "").strip()
        tags = request.form.get("tags", "").strip().split() if request.form.get("tags") else []

        if not title:
            return jsonify({"error": "标题不能为空"}), 400

        # 保存上传的视频文件
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)

        # 生成安全的文件名
        from werkzeug.utils import secure_filename
        filename = secure_filename(video_file.filename)
        timestamp = int(datetime.utcnow().timestamp())
        video_path = os.path.join(upload_dir, f"{timestamp}_{filename}")

        video_file.save(video_path)

        # 上传视频到抖音
        result = run_async_in_thread(
            douyin_platform.upload_video(account_id, video_path, title, description, tags)
        )

        # 删除临时文件
        try:
            os.remove(video_path)
        except:
            pass

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify({"error": result["message"]}), 500

    except Exception as e:
        return jsonify({"error": f"上传视频文件失败: {str(e)}"}), 500


@douyin_bp.route("/qr/image/<int:account_id>", methods=["GET"])
@require_auth
def get_qr_image(account_id):
    """获取抖音登录二维码图片"""
    try:
        user_id = g.user_id

        # 验证账号所有权
        account = db_manager.get_social_account_by_id(account_id)
        if not account:
            return jsonify({"error": "账号不存在"}), 404

        if account.user_id != user_id:
            return jsonify({"error": "无权访问此账号"}), 403

        if account.platform != "douyin":
            return jsonify({"error": "不是抖音账号"}), 400

        # 查找二维码文件
        qr_codes_dir = "qr_codes"
        if not os.path.exists(qr_codes_dir):
            return jsonify({"error": "二维码文件不存在"}), 404

        # 查找最新的二维码文件
        qr_files = [f for f in os.listdir(qr_codes_dir) if f.startswith(f"douyin_qr_{account_id}_")]
        if not qr_files:
            return jsonify({"error": "二维码文件不存在"}), 404

        # 按时间排序，获取最新的
        qr_files.sort(reverse=True)
        latest_qr_file = qr_files[0]
        qr_path = os.path.join(qr_codes_dir, latest_qr_file)

        # 检查文件是否存在
        if not os.path.exists(qr_path):
            return jsonify({"error": "二维码文件不存在"}), 404

        # 返回二维码图片
        with open(qr_path, "rb") as f:
            qr_data = f.read()

        return Response(
            qr_data,
            mimetype="image/png",
            headers={"Content-Disposition": f"attachment; filename={latest_qr_file}"}
        )

    except Exception as e:
        return jsonify({"error": f"获取二维码图片失败: {str(e)}"}), 500


@douyin_bp.route("/accounts/list", methods=["GET"])
@require_auth
def get_douyin_accounts():
    """获取用户的所有抖音账号"""
    try:
        user_id = g.user_id
        accounts = db_manager.get_social_accounts_by_user(user_id)

        # 过滤出抖音账号
        douyin_accounts = [acc for acc in accounts if acc.platform == "douyin"]

        return jsonify({
            "accounts": [
                {
                    "id": account.id,
                    "account_name": account.account_name,
                    "status": account.status,
                    "cookie_path": account.cookie_path,
                    "created_at": account.created_at.isoformat(),
                    "updated_at": account.updated_at.isoformat()
                }
                for account in douyin_accounts
            ]
        }), 200

    except Exception as e:
        return jsonify({"error": f"获取抖音账号列表失败: {str(e)}"}), 500