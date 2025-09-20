"""
文件管理路由模块
提供文件上传、管理、预览等API端点
"""

from flask import Blueprint, request, jsonify, g, Response, send_file
from datetime import datetime
import sys
import os
import json
import uuid
from pathlib import Path
from werkzeug.utils import secure_filename
from typing import Dict, Any, List

# 添加sau_backend到路径
sys.path.append("/Users/sunyouyou/Desktop/projects/bzhi/social-auto-upload/sau_backend")

from security import security_manager, require_auth
from models import db_manager

# 创建文件管理蓝图
file_bp = Blueprint("file", __name__, url_prefix="/api/file")

# 支持的文件类型
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'}
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'wav', 'flac', 'aac', 'ogg'}
ALLOWED_DOCUMENT_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'rtf'}

# 文件大小限制（字节）
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB


def allowed_file(filename: str, allowed_extensions: set) -> bool:
    """检查文件扩展名是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def get_file_type(filename: str) -> str:
    """根据文件扩展名获取文件类型"""
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

    if ext in ALLOWED_VIDEO_EXTENSIONS:
        return 'video'
    elif ext in ALLOWED_IMAGE_EXTENSIONS:
        return 'image'
    elif ext in ALLOWED_AUDIO_EXTENSIONS:
        return 'audio'
    elif ext in ALLOWED_DOCUMENT_EXTENSIONS:
        return 'document'
    else:
        return 'unknown'


def get_file_size_human(size_bytes: int) -> str:
    """将文件大小转换为人类可读格式"""
    if size_bytes == 0:
        return "0 B"

    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1

    return f"{size_bytes:.1f} {size_names[i]}"


@file_bp.route("/upload", methods=["POST"])
@require_auth
def upload_file():
    """通用文件上传接口"""
    try:
        user_id = g.user_id

        # 检查是否有文件上传
        if 'file' not in request.files:
            return jsonify({"error": "没有找到文件"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "没有选择文件"}), 400

        # 获取文件信息
        filename = secure_filename(file.filename)
        file_type = get_file_type(filename)
        file_size = len(file.read())
        file.seek(0)  # 重置文件指针

        # 检查文件大小
        if file_type == 'video' and file_size > MAX_VIDEO_SIZE:
            return jsonify({"error": f"视频文件过大，最大支持 {get_file_size_human(MAX_VIDEO_SIZE)}"}), 400
        elif file_size > MAX_FILE_SIZE:
            return jsonify({"error": f"文件过大，最大支持 {get_file_size_human(MAX_FILE_SIZE)}"}), 400

        # 检查文件类型
        if file_type == 'unknown':
            return jsonify({"error": "不支持的文件类型"}), 400

        # 创建用户专属的上传目录
        upload_dir = Path("uploads") / str(user_id) / file_type
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 生成唯一文件名
        file_uuid = str(uuid.uuid4())
        file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        unique_filename = f"{file_uuid}.{file_ext}"
        file_path = upload_dir / unique_filename

        # 保存文件
        file.save(str(file_path))

        # 获取可选参数
        description = request.form.get("description", "").strip()
        tags = request.form.get("tags", "").strip().split(",") if request.form.get("tags") else []

        # 返回文件信息
        file_info = {
            "id": file_uuid,
            "filename": filename,
            "original_name": filename,
            "file_type": file_type,
            "file_size": file_size,
            "file_size_human": get_file_size_human(file_size),
            "file_path": str(file_path),
            "url": f"/api/file/download/{file_uuid}",
            "description": description,
            "tags": tags,
            "created_at": datetime.utcnow().isoformat(),
            "created_by": user_id
        }

        return jsonify({
            "message": "文件上传成功",
            "file": file_info
        }), 200

    except Exception as e:
        return jsonify({"error": f"文件上传失败: {str(e)}"}), 500


@file_bp.route("/upload/video", methods=["POST"])
@require_auth
def upload_video():
    """视频文件上传接口"""
    try:
        user_id = g.user_id

        # 检查是否有文件上传
        if 'video' not in request.files:
            return jsonify({"error": "没有找到视频文件"}), 400

        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({"error": "没有选择视频文件"}), 400

        filename = secure_filename(video_file.filename)

        # 检查文件类型
        if not allowed_file(filename, ALLOWED_VIDEO_EXTENSIONS):
            return jsonify({"error": "不支持的视频格式"}), 400

        # 检查文件大小
        video_file.seek(0, 2)  # 移动到文件末尾
        file_size = video_file.tell()
        video_file.seek(0)  # 重置文件指针

        if file_size > MAX_VIDEO_SIZE:
            return jsonify({"error": f"视频文件过大，最大支持 {get_file_size_human(MAX_VIDEO_SIZE)}"}), 400

        # 创建用户视频目录
        video_dir = Path("uploads") / str(user_id) / "videos"
        video_dir.mkdir(parents=True, exist_ok=True)

        # 生成唯一文件名
        file_uuid = str(uuid.uuid4())
        file_ext = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{file_uuid}.{file_ext}"
        video_path = video_dir / unique_filename

        # 保存视频文件
        video_file.save(str(video_path))

        # 获取视频信息（可选，可以使用ffprobe获取详细视频信息）
        video_info = {
            "id": file_uuid,
            "filename": filename,
            "file_type": "video",
            "file_size": file_size,
            "file_size_human": get_file_size_human(file_size),
            "file_path": str(video_path),
            "url": f"/api/file/download/{file_uuid}",
            "created_at": datetime.utcnow().isoformat(),
            "created_by": user_id,
            "duration": None,  # 可以通过ffprobe获取
            "resolution": None,  # 可以通过ffprobe获取
            "format": file_ext.upper()
        }

        return jsonify({
            "message": "视频上传成功",
            "video": video_info
        }), 200

    except Exception as e:
        return jsonify({"error": f"视频上传失败: {str(e)}"}), 500


@file_bp.route("/upload/image", methods=["POST"])
@require_auth
def upload_image():
    """图片文件上传接口"""
    try:
        user_id = g.user_id

        # 检查是否有文件上传
        if 'image' not in request.files:
            return jsonify({"error": "没有找到图片文件"}), 400

        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({"error": "没有选择图片文件"}), 400

        filename = secure_filename(image_file.filename)

        # 检查文件类型
        if not allowed_file(filename, ALLOWED_IMAGE_EXTENSIONS):
            return jsonify({"error": "不支持的图片格式"}), 400

        # 检查文件大小
        image_file.seek(0, 2)
        file_size = image_file.tell()
        image_file.seek(0)

        if file_size > MAX_FILE_SIZE:
            return jsonify({"error": f"图片文件过大，最大支持 {get_file_size_human(MAX_FILE_SIZE)}"}), 400

        # 创建用户图片目录
        image_dir = Path("uploads") / str(user_id) / "images"
        image_dir.mkdir(parents=True, exist_ok=True)

        # 生成唯一文件名
        file_uuid = str(uuid.uuid4())
        file_ext = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{file_uuid}.{file_ext}"
        image_path = image_dir / unique_filename

        # 保存图片文件
        image_file.save(str(image_path))

        # 获取图片信息
        image_info = {
            "id": file_uuid,
            "filename": filename,
            "file_type": "image",
            "file_size": file_size,
            "file_size_human": get_file_size_human(file_size),
            "file_path": str(image_path),
            "url": f"/api/file/download/{file_uuid}",
            "created_at": datetime.utcnow().isoformat(),
            "created_by": user_id,
            "format": file_ext.upper()
        }

        return jsonify({
            "message": "图片上传成功",
            "image": image_info
        }), 200

    except Exception as e:
        return jsonify({"error": f"图片上传失败: {str(e)}"}), 500


@file_bp.route("/upload/multiple", methods=["POST"])
@require_auth
def upload_multiple_files():
    """多文件上传接口"""
    try:
        user_id = g.user_id

        # 检查是否有文件上传
        if 'files' not in request.files:
            return jsonify({"error": "没有找到文件"}), 400

        files = request.files.getlist('files')
        if not files or all(f.filename == '' for f in files):
            return jsonify({"error": "没有选择文件"}), 400

        uploaded_files = []
        failed_files = []

        for file in files:
            try:
                filename = secure_filename(file.filename)
                file_type = get_file_type(filename)

                # 检查文件大小
                file.seek(0, 2)
                file_size = file.tell()
                file.seek(0)

                if file_type == 'video' and file_size > MAX_VIDEO_SIZE:
                    failed_files.append({
                        "filename": filename,
                        "error": f"视频文件过大，最大支持 {get_file_size_human(MAX_VIDEO_SIZE)}"
                    })
                    continue

                if file_size > MAX_FILE_SIZE:
                    failed_files.append({
                        "filename": filename,
                        "error": f"文件过大，最大支持 {get_file_size_human(MAX_FILE_SIZE)}"
                    })
                    continue

                if file_type == 'unknown':
                    failed_files.append({
                        "filename": filename,
                        "error": "不支持的文件类型"
                    })
                    continue

                # 创建目录
                upload_dir = Path("uploads") / str(user_id) / file_type
                upload_dir.mkdir(parents=True, exist_ok=True)

                # 生成唯一文件名
                file_uuid = str(uuid.uuid4())
                file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
                unique_filename = f"{file_uuid}.{file_ext}"
                file_path = upload_dir / unique_filename

                # 保存文件
                file.save(str(file_path))

                file_info = {
                    "id": file_uuid,
                    "filename": filename,
                    "file_type": file_type,
                    "file_size": file_size,
                    "file_size_human": get_file_size_human(file_size),
                    "file_path": str(file_path),
                    "url": f"/api/file/download/{file_uuid}",
                    "created_at": datetime.utcnow().isoformat(),
                    "created_by": user_id
                }
                uploaded_files.append(file_info)

            except Exception as e:
                failed_files.append({
                    "filename": file.filename,
                    "error": str(e)
                })

        return jsonify({
            "message": f"批量上传完成，成功: {len(uploaded_files)}, 失败: {len(failed_files)}",
            "uploaded_files": uploaded_files,
            "failed_files": failed_files
        }), 200

    except Exception as e:
        return jsonify({"error": f"批量上传失败: {str(e)}"}), 500


@file_bp.route("/download/<file_id>", methods=["GET"])
@require_auth
def download_file(file_id):
    """下载文件"""
    try:
        user_id = g.user_id

        # 在用户目录中查找文件
        user_upload_dir = Path("uploads") / str(user_id)
        if not user_upload_dir.exists():
            return jsonify({"error": "文件不存在"}), 404

        # 搜索文件
        file_path = None
        for file_type_dir in user_upload_dir.iterdir():
            if file_type_dir.is_dir():
                for file in file_type_dir.iterdir():
                    if file.stem == file_id:
                        file_path = file
                        break
                if file_path:
                    break

        if not file_path or not file_path.exists():
            return jsonify({"error": "文件不存在"}), 404

        # 获取文件名
        original_filename = file_path.name.replace(f"{file_id}.", "")

        return send_file(
            str(file_path),
            as_attachment=True,
            download_name=original_filename
        )

    except Exception as e:
        return jsonify({"error": f"文件下载失败: {str(e)}"}), 500


@file_bp.route("/preview/<file_id>", methods=["GET"])
@require_auth
def preview_file(file_id):
    """预览文件（仅支持图片）"""
    try:
        user_id = g.user_id

        # 在用户目录中查找文件
        user_upload_dir = Path("uploads") / str(user_id) / "images"
        if not user_upload_dir.exists():
            return jsonify({"error": "文件不存在"}), 404

        # 搜索图片文件
        file_path = None
        for file in user_upload_dir.iterdir():
            if file.stem == file_id:
                file_path = file
                break

        if not file_path or not file_path.exists():
            return jsonify({"error": "图片文件不存在"}), 404

        return send_file(str(file_path))

    except Exception as e:
        return jsonify({"error": f"文件预览失败: {str(e)}"}), 500


@file_bp.route("/list", methods=["GET"])
@require_auth
def list_files():
    """列出用户文件"""
    try:
        user_id = g.user_id
        file_type = request.args.get("type", "").strip()
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 20, type=int)

        user_upload_dir = Path("uploads") / str(user_id)
        if not user_upload_dir.exists():
            return jsonify({
                "files": [],
                "total": 0,
                "page": page,
                "limit": limit
            }), 200

        files = []
        for file_type_dir in user_upload_dir.iterdir():
            if file_type_dir.is_dir():
                # 过滤文件类型
                if file_type and file_type_dir.name != file_type:
                    continue

                for file in file_type_dir.iterdir():
                    if file.is_file():
                        file_stat = file.stat()
                        files.append({
                            "id": file.stem,
                            "filename": file.name,
                            "file_type": file_type_dir.name,
                            "file_size": file_stat.st_size,
                            "file_size_human": get_file_size_human(file_stat.st_size),
                            "created_at": datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                            "url": f"/api/file/download/{file.stem}"
                        })

        # 按创建时间排序
        files.sort(key=lambda x: x["created_at"], reverse=True)

        # 分页
        start = (page - 1) * limit
        end = start + limit
        paginated_files = files[start:end]

        return jsonify({
            "files": paginated_files,
            "total": len(files),
            "page": page,
            "limit": limit,
            "pages": (len(files) + limit - 1) // limit
        }), 200

    except Exception as e:
        return jsonify({"error": f"获取文件列表失败: {str(e)}"}), 500


@file_bp.route("/delete/<file_id>", methods=["DELETE"])
@require_auth
def delete_file(file_id):
    """删除文件"""
    try:
        user_id = g.user_id

        # 在用户目录中查找文件
        user_upload_dir = Path("uploads") / str(user_id)
        if not user_upload_dir.exists():
            return jsonify({"error": "文件不存在"}), 404

        # 搜索文件
        file_path = None
        for file_type_dir in user_upload_dir.iterdir():
            if file_type_dir.is_dir():
                for file in file_type_dir.iterdir():
                    if file.stem == file_id:
                        file_path = file
                        break
                if file_path:
                    break

        if not file_path or not file_path.exists():
            return jsonify({"error": "文件不存在"}), 404

        # 删除文件
        file_path.unlink()

        return jsonify({"message": "文件删除成功"}), 200

    except Exception as e:
        return jsonify({"error": f"文件删除失败: {str(e)}"}), 500


@file_bp.route("/quota", methods=["GET"])
@require_auth
def get_quota():
    """获取用户存储配额信息"""
    try:
        user_id = g.user_id

        user_upload_dir = Path("uploads") / str(user_id)
        total_size = 0
        file_count = 0

        if user_upload_dir.exists():
            for file_type_dir in user_upload_dir.iterdir():
                if file_type_dir.is_dir():
                    for file in file_type_dir.iterdir():
                        if file.is_file():
                            file_count += 1
                            total_size += file.stat().st_size

        # 设置配额（示例：1GB）
        quota_limit = 1 * 1024 * 1024 * 1024  # 1GB
        quota_used = total_size
        quota_available = quota_limit - quota_used
        quota_percentage = (quota_used / quota_limit) * 100 if quota_limit > 0 else 0

        return jsonify({
            "quota_limit": quota_limit,
            "quota_limit_human": get_file_size_human(quota_limit),
            "quota_used": quota_used,
            "quota_used_human": get_file_size_human(quota_used),
            "quota_available": quota_available,
            "quota_available_human": get_file_size_human(quota_available),
            "quota_percentage": round(quota_percentage, 2),
            "file_count": file_count
        }), 200

    except Exception as e:
        return jsonify({"error": f"获取配额信息失败: {str(e)}"}), 500