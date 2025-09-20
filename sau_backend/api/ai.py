# -*- coding: utf-8 -*-
from flask import Blueprint, request, jsonify
from ..services.ai_service import (
    list_available_providers,
    generate_text as ai_generate_text,
    generate_shotlist as ai_generate_shotlist,
)

bp = Blueprint("ai", __name__, url_prefix="/ai")

@bp.route("/providers", methods=["GET"])
def get_providers():
    """获取可用的AI模型提供商"""
    try:
        providers = list_available_providers()
        return jsonify({
            "code": 200,
            "data": providers,
            "msg": "Success"
        })
    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"Failed to get providers: {str(e)}"
        }), 500

@bp.route("/generate", methods=["POST"])
def ai_generate():
    """AI 文本生成接口"""
    try:
        data = request.json or {}
        prompt = data.get("prompt", "")
        if not prompt.strip():
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "Prompt is required"
            }), 400

        enhanced_prompt = _build_enhanced_prompt(
            base_prompt=prompt,
            industry=data.get("industry"),
            scene=data.get("scene"),
            platform=data.get("platform"),
            locale=data.get("locale", "zh-CN")
        )

        text_result = ai_generate_text(
            enhanced_prompt,
            provider=data.get("provider"),
            model=data.get("model"),
            temperature=data.get("temperature", 0.7),
            max_tokens=data.get("max_tokens", 1000)
        )

        return jsonify({
            "code": 200,
            "data": {
                "text": text_result,
                "provider_used": data.get("provider") or "auto",
                "model_used": data.get("model") or "auto"
            },
            "msg": "Success"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"AI generation failed: {str(e)}"
        }), 500

@bp.route("/generate_shotlist", methods=["POST"])
def generate_shotlist():
    """AI 镜头脚本生成接口"""
    try:
        data = request.json or {}
        script = data.get("script", "")
        if not script.strip():
            return jsonify({
                "code": 400,
                "data": None,
                "msg": "Script is required"
            }), 400

        duration = data.get("duration", 30)
        style = data.get("style", "快节奏")

        prompt = f"""
请将以下文案转换为视频镜头脚本：

文案：{script}

要求：
1. 总时长：{duration}秒
2. 风格：{style}
3. 输出JSON格式，包含以下字段：
   - shots: 镜头列表
   - 每个镜头包含：duration（时长）、scene（场景描述）、voiceover（旁白）、onscreen_text（屏幕文字）、transition（转场）

请直接返回JSON，不要添加其他说明。
"""

        result = ai_generate_shotlist(
            prompt,
            provider=data.get("provider"),
            model=data.get("model"),
            temperature=data.get("temperature", 0.3)
        )

        shotlist = _parse_shotlist_response(result, fallback_duration=duration, fallback_script=script)

        return jsonify({
            "code": 200,
            "data": shotlist,
            "msg": "Success"
        })

    except Exception as e:
        return jsonify({
            "code": 500,
            "data": None,
            "msg": f"Shotlist generation failed: {str(e)}"
        }), 500

def _build_enhanced_prompt(base_prompt, industry=None, scene=None, platform=None, locale="zh-CN"):
    """构建增强的提示词"""
    enhanced_parts = [base_prompt]

    # 添加行业指导
    if industry:
        industry_guidance = {
            "餐饮": "请突出菜品特色、优惠活动、到店体验，使用诱人语言",
            "母婴": "请强调产品安全性、育儿知识、温馨家庭氛围",
            "农特产": "请突出产地优势、新鲜度、传统工艺、健康价值",
            "服饰": "请突出时尚感、面料品质、搭配建议、性价比"
        }
        guidance = industry_guidance.get(industry, "")
        if guidance:
            enhanced_parts.append(f"\n\n行业指导：{guidance}")

    # 添加场景指导
    if scene:
        scene_guidance = {
            "团购": "请突出限时优惠、团购价、原价对比",
            "上新": "请突出新品特点、上市时间、首发优惠",
            "节气": "请结合节气特点、传统元素、应季推荐",
            "集市日": "请突出集市氛围、本地特色、赶集时间地点"
        }
        guidance = scene_guidance.get(scene, "")
        if guidance:
            enhanced_parts.append(f"\n\n场景指导：{guidance}")

    # 添加平台指导
    if platform:
        platform_guidance = {
            "douyin": "请使用15-60秒短视频语言，节奏明快，多用感叹号和表情符号",
            "xhs": "请使用小红书风格，注重分享和体验，适合图文并茂",
            "ks": "请使用快手风格，接地气，贴近生活",
            "bili": "请使用B站风格，可以稍微详细一些，适合中长视频"
        }
        guidance = platform_guidance.get(platform, "")
        if guidance:
            enhanced_parts.append(f"\n\n平台指导：{guidance}")

    return "\n".join(enhanced_parts)
def _parse_shotlist_response(raw: str, *, fallback_duration: int, fallback_script: str):
    """Normalize raw model output into shotlist structure."""
    import json
    import re

    if not raw:
        return {"shots": [_fallback_shot(fallback_duration, fallback_script)]}

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

    return {"shots": [_fallback_shot(fallback_duration, fallback_script)]}


def _fallback_shot(duration: int, script: str):
    return {
        "duration": duration,
        "scene": "主镜头",
        "voiceover": script,
        "onscreen_text": "",
        "transition": "淡入淡出"
    }
