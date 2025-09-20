"""High level orchestration helpers for AI content generation."""
from __future__ import annotations

from typing import Dict, Optional, Sequence

from sau_backend.ai.model_manager import model_manager


def list_available_providers() -> Dict[str, Sequence[str]]:
    """Return mapping of provider name to supported models."""
    return model_manager.get_available_providers()


def generate_text(prompt: str, *, provider: Optional[str] = None, model: Optional[str] = None,
                  temperature: float = 0.7, **kwargs) -> str:
    """Generate text using the configured model manager."""
    return model_manager.chat(
        messages=prompt,
        provider=provider,
        model=model,
        temperature=temperature,
        **kwargs,
    )


def generate_shotlist(prompt: str, *, provider: Optional[str] = None, model: Optional[str] = None,
                       temperature: float = 0.3, **kwargs) -> str:
    """Generate a structured shot list using AI."""
    return model_manager.chat(
        messages=prompt,
        provider=provider,
        model=model,
        temperature=temperature,
        **kwargs,
    )


__all__ = ["list_available_providers", "generate_text", "generate_shotlist"]
