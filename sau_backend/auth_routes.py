"""
认证路由模块
提供用户注册、登录、登出等API端点
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
import sys
import os

# 添加sau_backend到路径
sys.path.append("/Users/sunyouyou/Desktop/projects/bzhi/social-auto-upload/sau_backend")

from security import security_manager, require_auth
from models import db_manager

# 创建认证蓝图
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    """用户注册"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "缺少必要信息"}), 400

        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        # 验证输入
        if not username or not email or not password:
            return jsonify({"error": "用户名、邮箱和密码不能为空"}), 400

        if not security_manager.validate_email(email):
            return jsonify({"error": "邮箱格式无效"}), 400

        if not security_manager.validate_password(password):
            return jsonify({"error": "密码强度不足，至少8位，包含大小写字母、数字和特殊字符"}), 400

        # 检查用户是否已存在
        if db_manager.get_user_by_username(username):
            return jsonify({"error": "用户名已存在"}), 409

        if db_manager.get_user_by_email(email):
            return jsonify({"error": "邮箱已被注册"}), 409

        # 哈希密码
        password_hash = security_manager.hash_password(password)

        # 创建用户
        user = db_manager.create_user(username, email, password_hash)

        if not user:
            return jsonify({"error": "用户创建失败"}), 500

        return (
            jsonify(
                {
                    "message": "用户注册成功",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                    },
                }
            ),
            201,
        )

    except Exception as e:
        return jsonify({"error": f"注册失败: {str(e)}"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """用户登录"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "用户名和密码不能为空"}), 400

        username = data.get("username", "").strip()
        password = data.get("password", "").strip()

        if not username or not password:
            return jsonify({"error": "用户名和密码不能为空"}), 400

        # 获取用户
        user = db_manager.get_user_by_username(username)
        if not user:
            return jsonify({"error": "用户名或密码错误"}), 401

        # 验证密码
        if not security_manager.verify_password(user.password_hash, password):
            return jsonify({"error": "用户名或密码错误"}), 401

        # 检查用户是否激活
        if not user.is_active:
            return jsonify({"error": "账户已被禁用"}), 401

        # 生成令牌
        access_token = security_manager.generate_token(
            user.id,
            additional_claims={
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
        )

        refresh_token = security_manager.generate_refresh_token(user.id)

        # 更新最后登录时间
        db_manager.update_user_last_login(user.id)

        return (
            jsonify(
                {
                    "message": "登录成功",
                    "token": access_token,
                    "refresh_token": refresh_token,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": f"登录失败: {str(e)}"}), 500


@auth_bp.route("/logout", methods=["POST"])
@require_auth
def logout():
    """用户登出"""
    try:
        user_id = g.user_id
        token = request.headers.get("Authorization", "").replace("Bearer ", "")

        # 撤销会话
        db_manager.revoke_session(user_id, token)

        return jsonify({"message": "登出成功"}), 200

    except Exception as e:
        return jsonify({"error": f"登出失败: {str(e)}"}), 500


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """刷新令牌"""
    try:
        data = request.get_json()
        if not data or "refresh_token" not in data:
            return jsonify({"error": "缺少刷新令牌"}), 400

        refresh_token = data["refresh_token"]
        payload = security_manager.verify_token(refresh_token)

        if not payload or payload.get("type") != "refresh":
            return jsonify({"error": "无效的刷新令牌"}), 401

        user_id = payload.get("user_id")
        user = db_manager.get_user_by_id(user_id)

        if not user or not user.is_active:
            return jsonify({"error": "用户不存在或已被禁用"}), 401

        # 生成新的访问令牌
        access_token = security_manager.generate_token(
            user.id,
            additional_claims={
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
        )

        return jsonify({"token": access_token, "refresh_token": refresh_token}), 200

    except Exception as e:
        return jsonify({"error": f"令牌刷新失败: {str(e)}"}), 500


@auth_bp.route("/profile", methods=["GET"])
@require_auth
def get_profile():
    """获取用户信息"""
    try:
        user_id = g.user_id
        user = db_manager.get_user_by_id(user_id)

        if not user:
            return jsonify({"error": "用户不存在"}), 404

        return (
            jsonify(
                {
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                        "created_at": user.created_at.isoformat(),
                        "updated_at": user.updated_at.isoformat(),
                        "is_active": user.is_active,
                    }
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": f"获取用户信息失败: {str(e)}"}), 500


@auth_bp.route("/profile", methods=["PUT"])
@require_auth
def update_profile():
    """更新用户信息"""
    try:
        user_id = g.user_id
        data = request.get_json()

        if not data:
            return jsonify({"error": "缺少更新数据"}), 400

        # 检查用户是否存在
        user = db_manager.get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "用户不存在"}), 404

        # 允许更新的字段
        updatable_fields = ["email"]
        updates = {}

        for field in updatable_fields:
            if field in data:
                value = data[field].strip()
                if field == "email" and not security_manager.validate_email(value):
                    return jsonify({"error": "邮箱格式无效"}), 400

                # 检查邮箱是否已被其他用户使用
                if field == "email":
                    existing_user = db_manager.get_user_by_email(value)
                    if existing_user and existing_user.id != user_id:
                        return jsonify({"error": "邮箱已被其他用户使用"}), 409

                updates[field] = value

        if not updates:
            return jsonify({"error": "没有有效的更新字段"}), 400

        # 执行更新
        conn = db_manager.get_connection()
        cursor = conn.cursor()

        set_clause = ", ".join([f"{field} = ?" for field in updates.keys()])
        values = list(updates.values()) + [user_id]

        cursor.execute(
            f"""
            UPDATE users SET {set_clause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """,
            values,
        )

        conn.commit()
        conn.close()

        return jsonify({"message": "用户信息更新成功"}), 200

    except Exception as e:
        return jsonify({"error": f"更新用户信息失败: {str(e)}"}), 500


@auth_bp.route("/change-password", methods=["POST"])
@require_auth
def change_password():
    """修改密码"""
    try:
        user_id = g.user_id
        data = request.get_json()

        if not data:
            return jsonify({"error": "缺少必要信息"}), 400

        current_password = data.get("current_password", "").strip()
        new_password = data.get("new_password", "").strip()
        confirm_password = data.get("confirm_password", "").strip()

        if not current_password or not new_password or not confirm_password:
            return jsonify({"error": "当前密码、新密码和确认密码不能为空"}), 400

        if new_password != confirm_password:
            return jsonify({"error": "新密码和确认密码不匹配"}), 400

        if not security_manager.validate_password(new_password):
            return jsonify({"error": "新密码强度不足，至少8位，包含大小写字母、数字和特殊字符"}), 400

        # 获取用户信息
        user = db_manager.get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "用户不存在"}), 404

        # 验证当前密码
        if not security_manager.verify_password(user.password_hash, current_password):
            return jsonify({"error": "当前密码错误"}), 401

        # 更新密码
        new_password_hash = security_manager.hash_password(new_password)

        conn = db_manager.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """,
            (new_password_hash, user_id),
        )

        conn.commit()
        conn.close()

        # 撤销所有会话
        db_manager.revoke_all_sessions(user_id)

        return jsonify({"message": "密码修改成功"}), 200

    except Exception as e:
        return jsonify({"error": f"修改密码失败: {str(e)}"}), 500
