"""
内容发布路由模块
提供内容发布、管理、状态查询等API端点
"""

from flask import Blueprint, request, jsonify, g, Response
from datetime import datetime
import sys
import os
import json
import asyncio
import threading
from typing import Dict, Any, List
from pathlib import Path
from werkzeug.utils import secure_filename

# 添加sau_backend到路径
sys.path.append("/Users/sunyouyou/Desktop/projects/bzhi/social-auto-upload/sau_backend")

from security import security_manager, require_auth
from models import db_manager
from platforms.douyin_platform import douyin_platform

# 创建内容发布蓝图
content_bp = Blueprint("content", __name__, url_prefix="/api/content")


def run_async_in_thread(coro):
    """在新线程中运行异步函数"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@content_bp.route("/publish/video", methods=["POST"])
@require_auth
def publish_video():
    """发布视频到多个平台"""
    try:
        user_id = g.user_id

        # 检查是否有文件上传
        if 'video' not in request.files:
            return jsonify({"error": "没有找到视频文件"}), 400

        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({"error": "没有选择视频文件"}), 400

        # 获取发布参数
        title = request.form.get("title", "").strip()
        description = request.form.get("description", "").strip()
        tags = request.form.get("tags", "").strip().split() if request.form.get("tags") else []
        platforms = request.form.get("platforms", "").strip().split(",") if request.form.get("platforms") else []
        account_ids = request.form.get("account_ids", "").strip().split(",") if request.form.get("account_ids") else []

        if not title:
            return jsonify({"error": "标题不能为空"}), 400

        if not platforms and not account_ids:
            return jsonify({"error": "请选择要发布的目标平台或账号"}), 400

        # 保存上传的视频文件
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)

        filename = secure_filename(video_file.filename)
        timestamp = int(datetime.utcnow().timestamp())
        video_path = os.path.join(upload_dir, f"{timestamp}_{filename}")

        video_file.save(video_path)

        # 获取用户账号
        user_accounts = db_manager.get_social_accounts_by_user(user_id)

        # 确定目标账号
        target_accounts = []
        if account_ids:
            # 使用指定的账号ID
            for account_id in account_ids:
                account_id = int(account_id.strip())
                account = next((acc for acc in user_accounts if acc.id == account_id), None)
                if account:
                    target_accounts.append(account)
        else:
            # 使用指定平台的所有账号
            for platform in platforms:
                platform_accounts = [acc for acc in user_accounts if acc.platform == platform.strip()]
                target_accounts.extend(platform_accounts)

        if not target_accounts:
            # 删除临时文件
            os.remove(video_path)
            return jsonify({"error": "没有找到可用的发布账号"}), 400

        # 执行发布任务
        results = []
        for account in target_accounts:
            try:
                if account.platform == "douyin":
                    result = run_async_in_thread(
                        douyin_platform.upload_video(
                            account.id, video_path, title, description, tags
                        )
                    )
                    results.append({
                        "platform": account.platform,
                        "account_id": account.id,
                        "account_name": account.account_name,
                        "success": result["success"],
                        "message": result["message"]
                    })
                else:
                    results.append({
                        "platform": account.platform,
                        "account_id": account.id,
                        "account_name": account.account_name,
                        "success": False,
                        "message": f"暂不支持 {account.platform} 平台的视频发布"
                    })
            except Exception as e:
                results.append({
                    "platform": account.platform,
                    "account_id": account.id,
                    "account_name": account.account_name,
                    "success": False,
                    "message": f"发布失败: {str(e)}"
                })

        # 删除临时文件
        try:
            os.remove(video_path)
        except:
            pass

        # 统计结果
        success_count = sum(1 for r in results if r["success"])
        total_count = len(results)

        return jsonify({
            "message": f"发布完成，成功: {success_count}/{total_count}",
            "title": title,
            "results": results,
            "success_count": success_count,
            "total_count": total_count
        }), 200

    except Exception as e:
        return jsonify({"error": f"发布视频失败: {str(e)}"}), 500


@content_bp.route("/publish/text", methods=["POST"])
@require_auth
def publish_text():
    """发布文本内容到多个平台"""
    try:
        user_id = g.user_id
        data = request.get_json()

        if not data:
            return jsonify({"error": "缺少发布数据"}), 400

        content = data.get("content", "").strip()
        platforms = data.get("platforms", [])
        account_ids = data.get("account_ids", [])

        if not content:
            return jsonify({"error": "内容不能为空"}), 400

        if not platforms and not account_ids:
            return jsonify({"error": "请选择要发布的目标平台或账号"}), 400

        # 获取用户账号
        user_accounts = db_manager.get_social_accounts_by_user(user_id)

        # 确定目标账号
        target_accounts = []
        if account_ids:
            for account_id in account_ids:
                account = next((acc for acc in user_accounts if acc.id == account_id), None)
                if account:
                    target_accounts.append(account)
        else:
            for platform in platforms:
                platform_accounts = [acc for acc in user_accounts if acc.platform == platform]
                target_accounts.extend(platform_accounts)

        if not target_accounts:
            return jsonify({"error": "没有找到可用的发布账号"}), 400

        # 执行发布任务
        results = []
        for account in target_accounts:
            try:
                if account.platform == "douyin":
                    results.append({
                        "platform": account.platform,
                        "account_id": account.id,
                        "account_name": account.account_name,
                        "success": False,
                        "message": "抖音平台暂不支持纯文本发布"
                    })
                else:
                    results.append({
                        "platform": account.platform,
                        "account_id": account.id,
                        "account_name": account.account_name,
                        "success": False,
                        "message": f"暂不支持 {account.platform} 平台的文本发布"
                    })
            except Exception as e:
                results.append({
                    "platform": account.platform,
                    "account_id": account.id,
                    "account_name": account.account_name,
                    "success": False,
                    "message": f"发布失败: {str(e)}"
                })

        return jsonify({
            "message": "文本发布任务已提交",
            "content": content,
            "results": results
        }), 200

    except Exception as e:
        return jsonify({"error": f"发布文本内容失败: {str(e)}"}), 500


@content_bp.route("/publish/image", methods=["POST"])
@require_auth
def publish_image():
    """发布图片内容到多个平台"""
    try:
        user_id = g.user_id

        # 检查是否有图片文件上传
        if 'images' not in request.files:
            return jsonify({"error": "没有找到图片文件"}), 400

        image_files = request.files.getlist('images')
        if not image_files or all(f.filename == '' for f in image_files):
            return jsonify({"error": "没有选择图片文件"}), 400

        # 获取发布参数
        title = request.form.get("title", "").strip()
        description = request.form.get("description", "").strip()
        platforms = request.form.get("platforms", "").strip().split(",") if request.form.get("platforms") else []
        account_ids = request.form.get("account_ids", "").strip().split(",") if request.form.get("account_ids") else []

        if not title:
            return jsonify({"error": "标题不能为空"}), 400

        if not platforms and not account_ids:
            return jsonify({"error": "请选择要发布的目标平台或账号"}), 400

        # 保存上传的图片文件
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)

        image_paths = []
        timestamp = int(datetime.utcnow().timestamp())

        for image_file in image_files:
            if image_file.filename:
                filename = secure_filename(image_file.filename)
                image_path = os.path.join(upload_dir, f"{timestamp}_{filename}")
                image_file.save(image_path)
                image_paths.append(image_path)

        if not image_paths:
            return jsonify({"error": "没有有效的图片文件"}), 400

        # 获取用户账号
        user_accounts = db_manager.get_social_accounts_by_user(user_id)

        # 确定目标账号
        target_accounts = []
        if account_ids:
            for account_id in account_ids:
                account_id = int(account_id.strip())
                account = next((acc for acc in user_accounts if acc.id == account_id), None)
                if account:
                    target_accounts.append(account)
        else:
            for platform in platforms:
                platform_accounts = [acc for acc in user_accounts if acc.platform == platform.strip()]
                target_accounts.extend(platform_accounts)

        if not target_accounts:
            # 删除临时文件
            for path in image_paths:
                try:
                    os.remove(path)
                except:
                    pass
            return jsonify({"error": "没有找到可用的发布账号"}), 400

        # 执行发布任务
        results = []
        for account in target_accounts:
            try:
                if account.platform == "douyin":
                    results.append({
                        "platform": account.platform,
                        "account_id": account.id,
                        "account_name": account.account_name,
                        "success": False,
                        "message": "抖音平台暂不支持图片发布"
                    })
                else:
                    results.append({
                        "platform": account.platform,
                        "account_id": account.id,
                        "account_name": account.account_name,
                        "success": False,
                        "message": f"暂不支持 {account.platform} 平台的图片发布"
                    })
            except Exception as e:
                results.append({
                    "platform": account.platform,
                    "account_id": account.id,
                    "account_name": account.account_name,
                    "success": False,
                    "message": f"发布失败: {str(e)}"
                })

        # 删除临时文件
        for path in image_paths:
            try:
                os.remove(path)
            except:
                pass

        return jsonify({
            "message": "图片发布任务已提交",
            "title": title,
            "image_count": len(image_paths),
            "results": results
        }), 200

    except Exception as e:
        return jsonify({"error": f"发布图片内容失败: {str(e)}"}), 500


@content_bp.route("/status/<int:task_id>", methods=["GET"])
@require_auth
def get_publish_status(task_id):
    """获取发布任务状态"""
    try:
        user_id = g.user_id

        # 这里应该从数据库中查询任务状态
        # 目前返回模拟数据
        return jsonify({
            "task_id": task_id,
            "status": "completed",
            "message": "发布任务已完成",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({"error": f"获取发布状态失败: {str(e)}"}), 500


@content_bp.route("/history", methods=["GET"])
@require_auth
def get_publish_history():
    """获取发布历史"""
    try:
        user_id = g.user_id
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        platform = request.args.get("platform", "").strip()

        # 这里应该从数据库中查询发布历史
        # 目前返回模拟数据
        mock_history = [
            {
                "id": 1,
                "title": "测试视频发布",
                "type": "video",
                "platform": "douyin",
                "status": "success",
                "created_at": datetime.utcnow().isoformat(),
                "account_name": "我的抖音账号"
            },
            {
                "id": 2,
                "title": "测试文本发布",
                "type": "text",
                "platform": "wechat",
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
                "account_name": "我的微信账号"
            }
        ]

        # 过滤平台
        if platform:
            mock_history = [item for item in mock_history if item["platform"] == platform]

        # 分页
        start = (page - 1) * limit
        end = start + limit
        paginated_history = mock_history[start:end]

        return jsonify({
            "history": paginated_history,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": len(mock_history),
                "pages": (len(mock_history) + limit - 1) // limit
            }
        }), 200

    except Exception as e:
        return jsonify({"error": f"获取发布历史失败: {str(e)}"}), 500


@content_bp.route("/templates", methods=["GET"])
@require_auth
def get_content_templates():
    """获取内容模板"""
    try:
        user_id = g.user_id

        # 返回预定义的内容模板
        templates = [
            {
                "id": 1,
                "name": "产品推广模板",
                "type": "video",
                "description": "适用于产品推广的视频模板",
                "structure": {
                    "title": "产品名称 + 核心卖点",
                    "description": "产品介绍 + 使用场景 + 购买链接",
                    "tags": ["产品", "推广", "优惠"]
                }
            },
            {
                "id": 2,
                "name": "生活记录模板",
                "type": "video",
                "description": "记录日常生活的视频模板",
                "structure": {
                    "title": "生活场景 + 心情描述",
                    "description": "详细记录 + 个人感受",
                    "tags": ["生活", "日常", "分享"]
                }
            },
            {
                "id": 3,
                "name": "知识分享模板",
                "type": "video",
                "description": "分享专业知识的视频模板",
                "structure": {
                    "title": "知识点 + 价值描述",
                    "description": "详细解释 + 实例说明",
                    "tags": ["知识", "学习", "教程"]
                }
            }
        ]

        return jsonify({
            "templates": templates,
            "count": len(templates)
        }), 200

    except Exception as e:
        return jsonify({"error": f"获取内容模板失败: {str(e)}"}), 500


@content_bp.route("/analytics", methods=["GET"])
@require_auth
def get_content_analytics():
    """获取内容分析数据"""
    try:
        user_id = g.user_id
        period = request.args.get("period", "7d", type=str)  # 7d, 30d, 90d

        # 返回模拟的分析数据
        analytics = {
            "period": period,
            "total_posts": 25,
            "successful_posts": 22,
            "failed_posts": 3,
            "success_rate": 88.0,
            "platform_breakdown": {
                "douyin": {
                    "total": 15,
                    "successful": 14,
                    "failed": 1,
                    "success_rate": 93.3
                },
                "wechat": {
                    "total": 6,
                    "successful": 5,
                    "failed": 1,
                    "success_rate": 83.3
                },
                "weibo": {
                    "total": 4,
                    "successful": 3,
                    "failed": 1,
                    "success_rate": 75.0
                }
            },
            "daily_stats": [
                {"date": "2025-09-12", "posts": 3, "success": 3},
                {"date": "2025-09-13", "posts": 2, "success": 1},
                {"date": "2025-09-14", "posts": 4, "success": 4},
                {"date": "2025-09-15", "posts": 1, "success": 1},
                {"date": "2025-09-16", "posts": 5, "success": 4},
                {"date": "2025-09-17", "posts": 6, "success": 5},
                {"date": "2025-09-18", "posts": 4, "success": 4}
            ]
        }

        return jsonify(analytics), 200

    except Exception as e:
        return jsonify({"error": f"获取内容分析数据失败: {str(e)}"}), 500