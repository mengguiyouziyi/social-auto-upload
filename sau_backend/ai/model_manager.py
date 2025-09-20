# -*- coding: utf-8 -*-
from typing import Dict, Optional
from .providers.base import BaseProvider
from .providers.zhipu_glm import ZhipuGLM
from .providers.qwen_dashscope import QwenDashScope

class ModelManager:
    """AI模型管理器"""

    def __init__(self):
        self._providers: Dict[str, BaseProvider] = {}
        self._init_providers()

    def _init_providers(self):
        """初始化模型提供商"""
        try:
            # 尝试初始化智谱GLM
            self._providers["zhipu"] = ZhipuGLM()
            print("✅ ZhipuGLM provider initialized")
        except Exception as e:
            print(f"⚠️ ZhipuGLM provider failed: {e}")

        try:
            # 尝试初始化通义千问
            self._providers["qwen"] = QwenDashScope()
            print("✅ QwenDashScope provider initialized")
        except Exception as e:
            print(f"⚠️ QwenDashScope provider failed: {e}")

    def get_provider(self, provider_name: str) -> Optional[BaseProvider]:
        """获取模型提供商实例"""
        return self._providers.get(provider_name)

    def get_default_provider(self) -> Optional[BaseProvider]:
        """获取默认提供商（优先级：qwen > zhipu）"""
        for name in ["qwen", "zhipu"]:
            provider = self.get_provider(name)
            if provider:
                return provider
        return None

    def get_available_providers(self) -> Dict[str, list]:
        """获取可用提供商及其模型列表"""
        result = {}
        for name, provider in self._providers.items():
            try:
                models = provider.get_available_models()
                result[name] = models
            except Exception as e:
                print(f"Failed to get models for {name}: {e}")
        return result

    def chat(self,
             messages,
             provider: Optional[str] = None,
             model: Optional[str] = None,
             temperature: float = 0.7,
             **kwargs) -> str:
        """
        聊天对话接口

        Args:
            messages: 消息列表或文本
            provider: 提供商名称（可选）
            model: 模型名称（可选）
            temperature: 温度参数
            **kwargs: 其他参数

        Returns:
            响应文本
        """
        # 获取提供商
        if provider:
            ai_provider = self.get_provider(provider)
        else:
            ai_provider = self.get_default_provider()

        if not ai_provider:
            raise Exception("No available AI provider")

        # 调用聊天接口
        return ai_provider.chat(messages, model, temperature, **kwargs)

# 全局模型管理器实例
model_manager = ModelManager()