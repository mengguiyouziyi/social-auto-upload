# -*- coding: utf-8 -*-
import requests
import os
from typing import List, Dict, Any, Optional
from .base import BaseProvider, normalize_messages

class ZhipuGLM(BaseProvider):
    """智谱GLM模型提供商"""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        super().__init__(
            api_key=api_key or os.getenv("ZHIPU_API_KEY"),
            base_url=base_url or "https://open.bigmodel.cn/api/paas/v4"
        )
        if not self.api_key:
            raise ValueError("ZHIPU_API_KEY is required")

    def chat(self,
             messages: List[Dict[str, str]],
             model: Optional[str] = None,
             temperature: float = 0.7,
             **kwargs) -> str:
        """
        智谱GLM聊天接口

        Args:
            messages: 消息列表
            model: 模型名称，默认 glm-4
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
            "model": model or "glm-4",
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
            raise Exception(f"ZhipuGLM API error: {e}")

    def get_available_models(self) -> List[str]:
        """获取可用模型列表"""
        return [
            "glm-4",
            "glm-4-air",
            "glm-4-airx",
            "glm-4-flash",
            "glm-3-turbo"
        ]

    def __str__(self):
        return f"ZhipuGLM(base_url={self.base_url})"