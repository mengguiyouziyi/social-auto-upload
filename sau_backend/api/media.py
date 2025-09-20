# -*- coding: utf-8 -*-
from flask import Blueprint, request, jsonify
import os
from ..media.ffmpeg_ops import (
    img_kenburns_to_video, concat_videos, add_watermark, add_subtitle,
    trim_video, resize_video, get_video_info
)

bp = Blueprint("media", __name__, url_prefix="/media")

@bp.route("/img2video", methods=["POST"])
def img_to_video():
    """
    图片转视频接口

    入参: {
        "images": ["path1.jpg", "path2.jpg", ...],
        "duration_per_img": 3,
        "size": "1080x1920",
        "kenburns": true,
        "bgm": "background_music.mp3"  # 可选
    }
    """
    try:
        data = request.json or {}

        images = data.get("images", [])
        if not images:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "Images are required"
            }), 400

        # 验证图片文件是否存在
        for img in images:
            if not os.path.exists(img):
                return jsonify({
                    "code": 400,
                    "data": None,
                    "msg": f"Image not found: {img}"
                }), 400

        duration = data.get("duration_per_img", 3)
        size = data.get("size", "1080x1920")
        kenburns = data.get("kenburns", True)
        bgm = data.get("bgm")

        # 验证背景音乐文件
        if bgm and not os.path.exists(bgm):
            return jsonify({
                "code": 400,
                "data": None,
                "msg": f"Background music not found: {bgm}"
            }), 400

        # 生成视频
        output_path = img_kenburns_to_video(
            images=images,
            duration=duration,
            size=size,
            kenburns=kenburns,
            bgm=bgm
        )

        # 获取视频信息
        video_info = get_video_info(output_path)

        return jsonify({
            "code": 200,
            "data": {
                "video_path": output_path,
                "video_info": video_info,
                "params": {
                    "images_count": len(images),
                    "duration_per_img": duration,
                    "size": size,
                    "kenburns": kenburns,
                    "with_bgm": bgm is not None
                }
            },
            "msg": "Video created successfully"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"Failed to create video: {str(e)}"
        }), 500

@bp.route("/concat", methods=["POST"])
def concat_videos_api():
    """
    视频拼接接口

    入参: {
        "videos": ["video1.mp4", "video2.mp4", ...],
        "output_size": "1080x1920",  # 可选
        "transition": "fade"  # 可选
    }
    """
    try:
        data = request.json or {}

        videos = data.get("videos", [])
        if not videos:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "Videos are required"
            }), 400

        # 验证视频文件
        for video in videos:
            if not os.path.exists(video):
                return jsonify({
                    "code": 400,
                    "data": None,
                    "msg": f"Video not found: {video}"
                }), 400

        output_size = data.get("output_size")
        transition = data.get("transition")

        # 拼接视频
        output_path = concat_videos(
            videos=videos,
            output_size=output_size,
            transition=transition
        )

        # 获取视频信息
        video_info = get_video_info(output_path)

        return jsonify({
            "code": 200,
            "data": {
                "video_path": output_path,
                "video_info": video_info,
                "params": {
                    "videos_count": len(videos),
                    "output_size": output_size,
                    "transition": transition
                }
            },
            "msg": "Videos concatenated successfully"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"Failed to concatenate videos: {str(e)}"
        }), 500

@bp.route("/watermark", methods=["POST"])
def add_watermark_api():
    """
    添加水印接口

    入参: {
        "video": "input.mp4",
        "text": "水印文字",
        "position": "bottom-right",  # top-left, top-right, bottom-left, bottom-right, center
        "font_size": 36,
        "font_color": "white"
    }
    """
    try:
        data = request.json or {}

        video = data.get("video")
        text = data.get("text", "")

        if not video or not text:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "Video and text are required"
            }), 400

        if not os.path.exists(video):
            return jsonify({
                "code": 400,
                "data": None,
                "msg": f"Video not found: {video}"
            }), 400

        position = data.get("position", "bottom-right")
        font_size = data.get("font_size", 36)
        font_color = data.get("font_color", "white")

        # 添加水印
        output_path = add_watermark(
            video=video,
            text=text,
            position=position,
            font_size=font_size,
            font_color=font_color
        )

        # 获取视频信息
        video_info = get_video_info(output_path)

        return jsonify({
            "code": 200,
            "data": {
                "video_path": output_path,
                "video_info": video_info,
                "params": {
                    "text": text,
                    "position": position,
                    "font_size": font_size,
                    "font_color": font_color
                }
            },
            "msg": "Watermark added successfully"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"Failed to add watermark: {str(e)}"
        }), 500

@bp.route("/subtitle", methods=["POST"])
def add_subtitle_api():
    """
    添加字幕接口

    入参: {
        "video": "input.mp4",
        "text": "字幕文字",
        "position": "bottom",  # top, center, bottom
        "font_size": 28
    }
    """
    try:
        data = request.json or {}

        video = data.get("video")
        text = data.get("text", "")

        if not video or not text:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "Video and text are required"
            }), 400

        if not os.path.exists(video):
            return jsonify({
                "code": 400,
                "data": None,
                "msg": f"Video not found: {video}"
            }), 400

        position = data.get("position", "bottom")
        font_size = data.get("font_size", 28)

        # 添加字幕
        output_path = add_subtitle(
            video=video,
            subtitle_text=text,
            position=position,
            font_size=font_size
        )

        # 获取视频信息
        video_info = get_video_info(output_path)

        return jsonify({
            "code": 200,
            "data": {
                "video_path": output_path,
                "video_info": video_info,
                "params": {
                    "text": text,
                    "position": position,
                    "font_size": font_size
                }
            },
            "msg": "Subtitle added successfully"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"Failed to add subtitle: {str(e)}"
        }), 500

@bp.route("/trim", methods=["POST"])
def trim_video_api():
    """
    视频截取接口

    入参: {
        "video": "input.mp4",
        "start_time": "00:00:10",  # 或 10（秒数）
        "duration": 30,  # 可选，截取时长
        "end_time": "00:00:40"  # 可选，结束时间
    }
    """
    try:
        data = request.json or {}

        video = data.get("video")
        start_time = data.get("start_time")

        if not video or not start_time:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "Video and start_time are required"
            }), 400

        if not os.path.exists(video):
            return jsonify({
                "code": 400,
                "data": None,
                "msg": f"Video not found: {video}"
            }), 400

        duration = data.get("duration")
        end_time = data.get("end_time")

        # 截取视频
        output_path = trim_video(
            video=video,
            start_time=start_time,
            duration=duration,
            end_time=end_time
        )

        # 获取视频信息
        video_info = get_video_info(output_path)

        return jsonify({
            "code": 200,
            "data": {
                "video_path": output_path,
                "video_info": video_info,
                "params": {
                    "start_time": start_time,
                    "duration": duration,
                    "end_time": end_time
                }
            },
            "msg": "Video trimmed successfully"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"Failed to trim video: {str(e)}"
        }), 500

@bp.route("/resize", methods=["POST"])
def resize_video_api():
    """
    调整视频尺寸接口

    入参: {
        "video": "input.mp4",
        "size": "1080x1920",
        "maintain_aspect": true
    }
    """
    try:
        data = request.json or {}

        video = data.get("video")
        size = data.get("size")

        if not video or not size:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "Video and size are required"
            }), 400

        if not os.path.exists(video):
            return jsonify({
                "code": 400,
                "data": None,
                "msg": f"Video not found: {video}"
            }), 400

        maintain_aspect = data.get("maintain_aspect", True)

        # 调整尺寸
        output_path = resize_video(
            video=video,
            size=size,
            maintain_aspect=maintain_aspect
        )

        # 获取视频信息
        video_info = get_video_info(output_path)

        return jsonify({
            "code": 200,
            "data": {
                "video_path": output_path,
                "video_info": video_info,
                "params": {
                    "size": size,
                    "maintain_aspect": maintain_aspect
                }
            },
            "msg": "Video resized successfully"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"Failed to resize video: {str(e)}"
        }), 500

@bp.route("/info", methods=["GET"])
def get_video_info_api():
    """
    获取视频信息接口

    参数: ?video_path=/path/to/video.mp4
    """
    try:
        video_path = request.args.get("video_path")
        if not video_path:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "video_path parameter is required"
            }), 400

        if not os.path.exists(video_path):
            return jsonify({
                "code": 404,
                "data": None,
                "msg": f"Video not found: {video_path}"
            }), 404

        # 获取视频信息
        video_info = get_video_info(video_path)

        return jsonify({
            "code": 200,
            "data": {
                "video_path": video_path,
                "info": video_info
            },
            "msg": "Video info retrieved successfully"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"Failed to get video info: {str(e)}"
        }), 500