"""
社交媒体账号路由模块
提供账号添加、管理、状态检查等API端点
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime
import sys
import os
import uuid

# 添加sau_backend到路径
sys.path.append("/Users/sunyouyou/Desktop/projects/bzhi/social-auto-upload/sau_backend")

from security import security_manager, require_auth
from models import db_manager

# 创建社交媒体账号蓝图
social_bp = Blueprint("social", __name__, url_prefix="/api/social")


@social_bp.route("/accounts", methods=["GET"])
@require_auth
def get_accounts():
    """获取用户的所有社交媒体账号"""
    try:
        user_id = g.user_id
        accounts = db_manager.get_social_accounts_by_user(user_id)

        return jsonify({
            "accounts": [
                {
                    "id": account.id,
                    "platform": account.platform,
                    "account_name": account.account_name,
                    "status": account.status,
                    "created_at": account.created_at.isoformat(),
                    "updated_at": account.updated_at.isoformat()
                }
                for account in accounts
            ]
        }), 200

    except Exception as e:
        return jsonify({"error": f"获取账号列表失败: {str(e)}"}), 500


@social_bp.route("/accounts", methods=["POST"])
@require_auth
def add_account():
    """添加新的社交媒体账号"""
    try:
        user_id = g.user_id
        data = request.get_json()

        if not data:
            return jsonify({"error": "缺少必要信息"}), 400

        platform = data.get("platform", "").strip()
        account_name = data.get("account_name", "").strip()
        auth_data = data.get("auth_data", {})

        # 验证输入
        if not platform or not account_name:
            return jsonify({"error": "平台和账号名称不能为空"}), 400

        # 支持的平台
        supported_platforms = ["douyin", "wechat", "weibo", "xiaohongshu"]
        if platform not in supported_platforms:
            return jsonify({"error": f"不支持的平台: {platform}"}), 400

        # 验证认证数据
        if not isinstance(auth_data, dict):
            return jsonify({"error": "认证数据格式错误"}), 400

        # 生成唯一的cookie文件路径
        cookie_path = f"cookies/{platform}_{user_id}_{uuid.uuid4().hex[:8]}.txt"

        # 确保cookies目录存在
        os.makedirs("cookies", exist_ok=True)

        # 创建社交媒体账号
        account = db_manager.create_social_account(
            user_id=user_id,
            platform=platform,
            account_name=account_name,
            cookie_path=cookie_path,
            status=0  # 初始状态：待验证
        )

        if not account:
            return jsonify({"error": "账号创建失败"}), 500

        # 如果是抖音账号，启动登录流程
        if platform == "douyin":
            return jsonify({
                "message": "账号添加成功，请完成抖音登录验证",
                "account": {
                    "id": account.id,
                    "platform": account.platform,
                    "account_name": account.account_name,
                    "status": account.status,
                    "cookie_path": account.cookie_path
                },
                "next_action": "douyin_login_required"
            }), 201

        return jsonify({
            "message": "账号添加成功",
            "account": {
                "id": account.id,
                "platform": account.platform,
                "account_name": account.account_name,
                "status": account.status
            }
        }), 201

    except Exception as e:
        return jsonify({"error": f"添加账号失败: {str(e)}"}), 500


@social_bp.route("/accounts/<int:account_id>", methods=["GET"])
@require_auth
def get_account(account_id):
    """获取特定账号信息"""
    try:
        user_id = g.user_id
        account = db_manager.get_social_account_by_id(account_id)

        if not account:
            return jsonify({"error": "账号不存在"}), 404

        # 验证账号所有权
        if account.user_id != user_id:
            return jsonify({"error": "无权访问此账号"}), 403

        return jsonify({
            "account": {
                "id": account.id,
                "platform": account.platform,
                "account_name": account.account_name,
                "status": account.status,
                "cookie_path": account.cookie_path,
                "created_at": account.created_at.isoformat(),
                "updated_at": account.updated_at.isoformat()
            }
        }), 200

    except Exception as e:
        return jsonify({"error": f"获取账号信息失败: {str(e)}"}), 500


@social_bp.route("/accounts/<int:account_id>", methods=["PUT"])
@require_auth
def update_account(account_id):
    """更新账号信息"""
    try:
        user_id = g.user_id
        data = request.get_json()

        if not data:
            return jsonify({"error": "缺少更新数据"}), 400

        # 验证账号所有权
        account = db_manager.get_social_account_by_id(account_id)
        if not account:
            return jsonify({"error": "账号不存在"}), 404

        if account.user_id != user_id:
            return jsonify({"error": "无权修改此账号"}), 403

        # 允许更新的字段
        updatable_fields = ["account_name", "status"]
        updates = {}

        for field in updatable_fields:
            if field in data:
                updates[field] = data[field]

        if not updates:
            return jsonify({"error": "没有有效的更新字段"}), 400

        # 执行更新
        conn = db_manager.get_connection()
        cursor = conn.cursor()

        set_clause = ", ".join([f"{field} = ?" for field in updates.keys()])
        values = list(updates.values()) + [account_id]

        cursor.execute(
            f"""
            UPDATE social_media_accounts SET {set_clause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            values
        )

        conn.commit()
        conn.close()

        return jsonify({"message": "账号信息更新成功"}), 200

    except Exception as e:
        return jsonify({"error": f"更新账号信息失败: {str(e)}"}), 500


@social_bp.route("/accounts/<int:account_id>", methods=["DELETE"])
@require_auth
def delete_account(account_id):
    """删除账号"""
    try:
        user_id = g.user_id

        # 验证账号所有权
        account = db_manager.get_social_account_by_id(account_id)
        if not account:
            return jsonify({"error": "账号不存在"}), 404

        if account.user_id != user_id:
            return jsonify({"error": "无权删除此账号"}), 403

        # 删除cookie文件
        if account.cookie_path and os.path.exists(account.cookie_path):
            os.remove(account.cookie_path)

        # 从数据库删除账号
        conn = db_manager.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM social_media_accounts WHERE id = ?",
            (account_id,)
        )

        conn.commit()
        conn.close()

        return jsonify({"message": "账号删除成功"}), 200

    except Exception as e:
        return jsonify({"error": f"删除账号失败: {str(e)}"}), 500


@social_bp.route("/accounts/<int:account_id>/status", methods=["POST"])
@require_auth
def check_account_status(account_id):
    """检查账号状态"""
    try:
        user_id = g.user_id

        # 验证账号所有权
        account = db_manager.get_social_account_by_id(account_id)
        if not account:
            return jsonify({"error": "账号不存在"}), 404

        if account.user_id != user_id:
            return jsonify({"error": "无权访问此账号"}), 403

        # 这里可以添加具体的平台状态检查逻辑
        # 例如检查cookie是否有效，账号是否正常等

        status_info = {
            "platform": account.platform,
            "account_name": account.account_name,
            "status": account.status,
            "last_check": datetime.utcnow().isoformat()
        }

        # 如果是抖音账号，添加额外状态信息
        if account.platform == "douyin":
            status_info["douyin_status"] = "connected" if account.status == 1 else "disconnected"

        return jsonify({
            "status": status_info,
            "message": "状态检查完成"
        }), 200

    except Exception as e:
        return jsonify({"error": f"检查账号状态失败: {str(e)}"}), 500


@social_bp.route("/platforms", methods=["GET"])
@require_auth
def get_supported_platforms():
    """获取支持的社交媒体平台"""
    try:
        platforms = [
            {
                "name": "douyin",
                "display_name": "抖音",
                "description": "抖音短视频平台",
                "features": ["video_upload", "live_streaming", "comment_management"]
            },
            {
                "name": "wechat",
                "display_name": "微信",
                "description": "微信社交平台",
                "features": ["article_publish", "moment_share", "mini_program"]
            },
            {
                "name": "weibo",
                "display_name": "微博",
                "description": "微博社交平台",
                "features": ["post_publish", "image_upload", "video_upload"]
            },
            {
                "name": "xiaohongshu",
                "display_name": "小红书",
                "description": "小红书内容平台",
                "features": ["note_publish", "product_share", "video_upload"]
            }
        ]

        return jsonify({
            "platforms": platforms,
            "count": len(platforms)
        }), 200

    except Exception as e:
        return jsonify({"error": f"获取平台信息失败: {str(e)}"}), 500