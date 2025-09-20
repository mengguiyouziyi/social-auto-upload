# -*- coding: utf-8 -*-
import requests
import os
from typing import List, Dict, Any, Optional
from .base import BaseProvider, normalize_messages

class QwenDashScope(BaseProvider):
    """阿里通义千问模型提供商（OpenAI兼容接口）"""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        super().__init__(
            api_key=api_key or os.getenv("DASHSCOPE_API_KEY"),
            base_url=base_url or "https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY is required")

    def chat(self,
             messages: List[Dict[str, str]],
             model: Optional[str] = None,
             temperature: float = 0.7,
             **kwargs) -> str:
        """
        通义千问聊天接口（OpenAI兼容）

        Args:
            messages: 消息列表
            model: 模型名称，默认 qwen-turbo
            temperature: 温度参数
            **kwargs: 其他参数

        Returns:
            响应文本
        """
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": model or "qwen-turbo",
            "messages": normalize_messages(messages),
            "temperature": temperature
        }

        # 添加额外参数
        if "max_tokens" in kwargs:
            data["max_tokens"] = kwargs["max_tokens"]
        if "top_p" in kwargs:
            data["top_p"] = kwargs["top_p"]

        try:
            response = requests.post(url, json=data, headers=headers, timeout=60)
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except requests.RequestException as e:
            raise Exception(f"QwenDashScope API error: {e}")

    def get_available_models(self) -> List[str]:
        """获取可用模型列表"""
        return [
            "qwen-turbo",
            "qwen-turbo-latest",
            "qwen-plus",
            "qwen-plus-latest",
            "qwen-max",
            "qwen-max-latest",
            "qwen2.5-7b-instruct",
            "qwen2.5-14b-instruct",
            "qwen2.5-32b-instruct",
            "qwen2.5-72b-instruct"
        ]

    def __str__(self):
        return f"QwenDashScope(base_url={self.base_url})"