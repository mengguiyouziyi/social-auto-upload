# -*- coding: utf-8 -*-
from flask import Blueprint, request, jsonify
import os
import uuid
import asyncio
import edge_tts
from pathlib import Path

bp = Blueprint("tts", __name__, url_prefix="/tts")

# 音频输出目录
AUDIO_DIR = Path(__file__).parent.parent / "media" / "tts"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# 支持的语音列表
SUPPORTED_VOICES = {
    "zh-CN-XiaoxiaoNeural": "晓晓（女声，标准）",
    "zh-CN-YunxiNeural": "云希（男声，标准）",
    "zh-CN-XiaoyiNeural": "晓伊（女声，温柔）",
    "zh-CN-YunjianNeural": "云健（男声，沉稳）",
    "zh-CN-XiaochenNeural": "晓辰（女声，活泼）",
    "zh-CN-YunhaoNeural": "云浩（男声，阳光）",
    "zh-CN-XiaomengNeural": "晓梦（女声，可爱）",
    "zh-CN-XiaomoNeural": "晓墨（女声，文艺）",
    "zh-CN-XiaoqiuNeural": "晓秋（女声，温暖）",
    "zh-CN-XiaoshuangNeural": "晓爽（女声，清新）",
    "zh-CN-XiaohanNeural": "晓涵（女声，知性）",
    "zh-CN-XiaoruiNeural": "晓瑞（女声，亲切）",
    "zh-CN-XiaoxuanNeural": "晓萱（女声，优雅）",
    "zh-CN-XiaoyanNeural": "晓燕（女声，自然）",
    "zh-CN-XiaoyingNeural": "晓颖（女声，甜美）",
    "zh-CN-YunyangNeural": "云扬（男声，磁性）",
    "zh-CN-YunyeNeural": "云野（男声，自然）",
    "zh-CN-YunzeNeural": "云泽（男声，温暖）",
    "zh-CN-YangyangNeural": "洋洋（男声，童声）"
}

async def _synthesize_edge(text, voice="zh-CN-XiaoxiaoNeural", rate="+0%", volume="+0%"):
    """使用edge-tts合成语音"""
    output_file = AUDIO_DIR / f"{uuid.uuid4().hex}.mp3"

    # 创建Communicate对象
    communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume)

    # 保存音频文件
    await communicate.save(str(output_file))

    return str(output_file)

@bp.route("/voices", methods=["GET"])
def get_voices():
    """获取支持的语音列表"""
    return jsonify({
        "code": 200,
        "data": [
            {
                "id": voice_id,
                "name": name,
                "gender": "女声" if "Xiaoxiao" in voice_id or "Xiaoyi" in voice_id or "Xiaochen" in voice_id else "男声"
            }
            for voice_id, name in SUPPORTED_VOICES.items()
        ],
        "msg": "Success"
    })

@bp.route("/synthesize", methods=["POST"])
def synthesize():
    """
    文字转语音接口

    入参: {
        "text": "要转换的文本",
        "voice": "zh-CN-XiaoxiaoNeural",  # 语音ID
        "rate": "+0%",  # 语速调整
        "volume": "+0%",  # 音量调整
        "engine": "edge"  # 引擎类型
    }
    """
    try:
        data = request.json or {}
        text = data.get("text", "").strip()

        if not text:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "Text is required"
            }), 400

        voice = data.get("voice", "zh-CN-XiaoxiaoNeural")
        if voice not in SUPPORTED_VOICES:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": f"Unsupported voice: {voice}"
            }), 400

        rate = data.get("rate", "+0%")
        volume = data.get("volume", "+0%")
        engine = data.get("engine", "edge")

        if engine == "edge":
            # 使用edge-tts
            try:
                output_path = asyncio.run(_synthesize_edge(text, voice, rate, volume))
            except Exception as e:
                return jsonify({
                    "code": 500,
                    "data": None,
                    "msg": f"Edge TTS synthesis failed: {str(e)}"
                }), 500
        else:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": f"Unsupported engine: {engine}"
            }), 400

        # 返回相对路径（用于前端访问）
        relative_path = str(Path(output_path).relative_to(Path(__file__).parent.parent.parent))

        return jsonify({
            "code": 200,
            "data": {
                "path": relative_path,
                "filename": Path(output_path).name,
                "voice": voice,
                "duration": None  # 可以后续添加音频时长检测
            },
            "msg": "Success"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"TTS synthesis failed: {str(e)}"
        }), 500

@bp.route("/batch_synthesize", methods=["POST"])
def batch_synthesize():
    """
    批量文字转语音接口

    入参: {
        "texts": ["文本1", "文本2", ...],
        "voice": "zh-CN-XiaoxiaoNeural",
        "rate": "+0%",
        "volume": "+0%"
    }
    """
    try:
        data = request.json or {}
        texts = data.get("texts", [])

        if not texts:
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "Texts are required"
            }), 400

        voice = data.get("voice", "zh-CN-XiaoxiaoNeural")
        rate = data.get("rate", "+0%")
        volume = data.get("volume", "+0%")

        results = []
        for i, text in enumerate(texts):
            if text.strip():
                try:
                    output_path = asyncio.run(_synthesize_edge(text, voice, rate, volume))
                    relative_path = str(Path(output_path).relative_to(Path(__file__).parent.parent.parent))
                    results.append({
                        "index": i,
                        "text": text,
                        "path": relative_path,
                        "filename": Path(output_path).name
                    })
                except Exception as e:
                    results.append({
                        "index": i,
                        "text": text,
                        "error": str(e)
                    })

        return jsonify({
            "code": 200,
            "data": {
                "results": results,
                "total": len(texts),
                "success": len([r for r in results if "error" not in r])
            },
            "msg": "Batch synthesis completed"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"Batch TTS synthesis failed: {str(e)}"
        }), 500