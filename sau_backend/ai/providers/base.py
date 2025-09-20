# -*- coding: utf-8 -*-
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseProvider(ABC):
    """AI模型提供商基类"""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key
        self.base_url = base_url

    @abstractmethod
    def chat(self,
             messages: List[Dict[str, str]],
             model: Optional[str] = None,
             temperature: float = 0.7,
             **kwargs) -> str:
        """
        聊天对话接口

        Args:
            messages: 消息列表，格式 [{"role": "user", "content": "..."}]
            model: 模型名称
            temperature: 温度参数
            **kwargs: 其他参数

        Returns:
            响应文本
        """
        ...

    @abstractmethod
    def get_available_models(self) -> List[str]:
        """获取可用模型列表"""
        ...

def normalize_messages(prompt_or_messages):
    """标准化消息格式"""
    if isinstance(prompt_or_messages, str):
        return [{"role": "user", "content": prompt_or_messages}]
    return prompt_or_messages