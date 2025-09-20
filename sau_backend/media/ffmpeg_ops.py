# -*- coding: utf-8 -*-
"""
FFmpeg原子操作封装
包括：图片转视频（Ken Burns效果）、视频拼接、水印、字幕等
"""
import os
import uuid
import subprocess
import tempfile
import shlex
from pathlib import Path

# 媒体输出目录
MEDIA_OUT = Path(__file__).parent / "out"
MEDIA_OUT.mkdir(parents=True, exist_ok=True)

def run_command(cmd: str):
    """执行FFmpeg命令"""
    try:
        subprocess.run(shlex.split(cmd), check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg command failed: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        raise Exception(f"FFmpeg command failed: {e.stderr}")

def img_kenburns_to_video(images, duration=3, size="1080x1920", kenburns=True, bgm=None):
    """
    将图片转换为视频（带Ken Burns效果）

    Args:
        images: 图片路径列表
        duration: 每张图片显示时长（秒）
        size: 输出视频尺寸，如 "1080x1920"
        kenburns: 是否启用Ken Burns效果
        bgm: 背景音乐文件路径（可选）

    Returns:
        输出视频路径
    """
    if not images:
        raise ValueError("No images provided")

    # 创建临时文件清单
    list_file = tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt", encoding="utf-8")
    try:
        for img in images:
            abs_img_path = os.path.abspath(img)
            if not os.path.exists(abs_img_path):
                raise FileNotFoundError(f"Image not found: {abs_img_path}")
            list_file.write(f"file '{abs_img_path}'\n")
            list_file.write(f"duration {duration}\n")
        list_file.flush()

        # 生成输出文件名
        output_file = MEDIA_OUT / f"{uuid.uuid4().hex}.mp4"

        # 构建FFmpeg命令
        if kenburns:
            # Ken Burns效果 - 使用zoompan滤镜
            vf = (
                f"zoompan=z='min(zoom+0.001,1.2)':"
                f"d=25*{duration}:"
                f"s={size}:"
                "fps=25,"
                "format=yuv420p"
            )
        else:
            # 静态图片 - 使用scale滤镜
            vf = f"scale={size},format=yuv420p"

        # 添加音频输入
        if bgm and os.path.exists(bgm):
            cmd = (
                f"ffmpeg -y -f concat -safe 0 -i {list_file.name} "
                f"-i {bgm} -filter_complex \"{vf}\" "
                f"-shortest -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k "
                f"\"{output_file}\""
            )
        else:
            cmd = (
                f"ffmpeg -y -f concat -safe 0 -i {list_file.name} "
                f"-vf \"{vf}\" -r 25 -c:v libx264 -pix_fmt yuv420p "
                f"\"{output_file}\""
            )

        print(f"Executing: {cmd}")
        run_command(cmd)

        return str(output_file)

    finally:
        # 清理临时文件
        try:
            os.unlink(list_file.name)
        except:
            pass

def concat_videos(videos, output_size=None, transition=None):
    """
    拼接多个视频

    Args:
        videos: 视频文件路径列表
        output_size: 输出尺寸，如 "1080x1920"（可选）
        transition: 转场效果（可选）

    Returns:
        输出视频路径
    """
    if not videos:
        raise ValueError("No videos provided")

    # 创建临时文件清单
    list_file = tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt", encoding="utf-8")
    try:
        for video in videos:
            abs_video_path = os.path.abspath(video)
            if not os.path.exists(abs_video_path):
                raise FileNotFoundError(f"Video not found: {abs_video_path}")
            list_file.write(f"file '{abs_video_path}'\n")
        list_file.flush()

        # 生成输出文件名
        output_file = MEDIA_OUT / f"{uuid.uuid4().hex}.mp4"

        # 构建FFmpeg命令
        vf_parts = []
        if output_size:
            vf_parts.append(f"scale={output_size}")

        if transition:
            # 简单的淡入淡出转场
            vf_parts.append("fade=in:0:30,fade=out:st=2:d=1")

        vf = ",".join(vf_parts) if vf_parts else None

        cmd = f"ffmpeg -y -f concat -safe 0 -i {list_file.name}"
        if vf:
            cmd += f" -vf \"{vf}\""
        cmd += f" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k \"{output_file}\""

        print(f"Executing: {cmd}")
        run_command(cmd)

        return str(output_file)

    finally:
        # 清理临时文件
        try:
            os.unlink(list_file.name)
        except:
            pass

def add_watermark(video, text, position="bottom-right", font_size=36, font_color="white"):
    """
    添加文字水印

    Args:
        video: 输入视频路径
        text: 水印文字
        position: 水印位置
        font_size: 字体大小
        font_color: 字体颜色

    Returns:
        输出视频路径
    """
    if not os.path.exists(video):
        raise FileNotFoundError(f"Video not found: {video}")

    # 计算水印位置
    position_map = {
        "top-left": "(10,10)",
        "top-right": "(w-tw-10,10)",
        "bottom-left": "(10,h-th-10)",
        "bottom-right": "(w-tw-10,h-th-10)",
        "center": "(w/2-tw/2,h/2-th/2)"
    }
    pos = position_map.get(position, position_map["bottom-right"])

    # 生成输出文件名
    output_file = MEDIA_OUT / f"{uuid.uuid4().hex}.mp4"

    # 构建FFmpeg命令
    cmd = (
        f"ffmpeg -y -i \"{video}\" "
        f"-vf \"drawtext="
        f"fontfile=/System/Library/Fonts/Arial.ttf:"  # macOS字体路径
        f"text='{text}':"
        f"x={pos}:"
        f"y=40:"
        f"fontsize={font_size}:"
        f"fontcolor={font_color}:"
        f"box=1:boxcolor=black@0.4:boxborderw=1\" "
        f"-c:a copy \"{output_file}\""
    )

    print(f"Executing: {cmd}")
    run_command(cmd)

    return str(output_file)

def add_subtitle(video, subtitle_text, position="bottom", font_size=28):
    """
    添加字幕

    Args:
        video: 输入视频路径
        subtitle_text: 字幕文字
        position: 字幕位置
        font_size: 字体大小

    Returns:
        输出视频路径
    """
    if not os.path.exists(video):
        raise FileNotFoundError(f"Video not found: {video}")

    # 计算字幕位置
    if position == "top":
        y_pos = "50"
    elif position == "center":
        y_pos = "h/2"
    else:  # bottom
        y_pos = "h-th-50"

    # 生成输出文件名
    output_file = MEDIA_OUT / f"{uuid.uuid4().hex}.mp4"

    # 构建FFmpeg命令
    cmd = (
        f"ffmpeg -y -i \"{video}\" "
        f"-vf \"drawtext="
        f"fontfile=/System/Library/Fonts/Arial.ttf:"
        f"text='{subtitle_text}':"
        f"x=(w-tw)/2:"  # 水平居中
        f"y={y_pos}:"
        f"fontsize={font_size}:"
        f"fontcolor=white:"
        f"box=1:boxcolor=black@0.8:boxborderw=5\" "
        f"-c:a copy \"{output_file}\""
    )

    print(f"Executing: {cmd}")
    run_command(cmd)

    return str(output_file)

def trim_video(video, start_time, duration=None, end_time=None):
    """
    视频截取

    Args:
        video: 输入视频路径
        start_time: 开始时间（格式：00:00:00 或秒数）
        duration: 截取时长（秒）
        end_time: 结束时间（格式：00:00:00 或秒数）

    Returns:
        输出视频路径
    """
    if not os.path.exists(video):
        raise FileNotFoundError(f"Video not found: {video}")

    # 生成输出文件名
    output_file = MEDIA_OUT / f"{uuid.uuid4().hex}.mp4"

    # 构建时间参数
    time_params = f"-ss {start_time}"
    if duration:
        time_params += f" -t {duration}"
    elif end_time:
        time_params += f" -to {end_time}"

    # 构建FFmpeg命令
    cmd = f"ffmpeg -y -i \"{video}\" {time_params} -c:v libx264 -pix_fmt yuv420p -c:a aac \"{output_file}\""

    print(f"Executing: {cmd}")
    run_command(cmd)

    return str(output_file)

def resize_video(video, size="1080x1920", maintain_aspect=True):
    """
    调整视频尺寸

    Args:
        video: 输入视频路径
        size: 目标尺寸，如 "1080x1920"
        maintain_aspect: 是否保持宽高比

    Returns:
        输出视频路径
    """
    if not os.path.exists(video):
        raise FileNotFoundError(f"Video not found: {video}")

    # 生成输出文件名
    output_file = MEDIA_OUT / f"{uuid.uuid4().hex}.mp4"

    # 构建尺寸滤镜
    if maintain_aspect:
        vf = f"scale={size}:force_original_aspect_ratio=decrease,pad={size}:(ow-iw)/2:(oh-ih)/2"
    else:
        vf = f"scale={size}"

    # 构建FFmpeg命令
    cmd = f"ffmpeg -y -i \"{video}\" -vf \"{vf}\" -c:v libx264 -pix_fmt yuv420p -c:a aac \"{output_file}\""

    print(f"Executing: {cmd}")
    run_command(cmd)

    return str(output_file)

def get_video_info(video_path):
    """
    获取视频信息

    Args:
        video_path: 视频文件路径

    Returns:
        视频信息字典
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")

    cmd = f"ffprobe -v quiet -print_format json -show_format -show_streams \"{video_path}\""
    result = subprocess.run(shlex.split(cmd), capture_output=True, text=True)

    if result.returncode != 0:
        raise Exception(f"Failed to get video info: {result.stderr}")

    import json
    probe_data = json.loads(result.stdout)

    # 提取关键信息
    video_stream = None
    audio_stream = None

    for stream in probe_data.get("streams", []):
        if stream.get("codec_type") == "video":
            video_stream = stream
        elif stream.get("codec_type") == "audio":
            audio_stream = stream

    info = {
        "duration": float(probe_data.get("format", {}).get("duration", 0)),
        "size": os.path.getsize(video_path),
        "width": video_stream.get("width") if video_stream else None,
        "height": video_stream.get("height") if video_stream else None,
        "fps": eval(video_stream.get("r_frame_rate", "0/1")) if video_stream else None,
        "has_audio": audio_stream is not None,
        "format": probe_data.get("format", {}).get("format_name", "unknown")
    }

    return info