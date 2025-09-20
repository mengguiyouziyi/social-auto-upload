"""Application configuration loading utilities."""
from __future__ import annotations

import os
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, Optional


@dataclass
class BaseConfig:
    BASE_DIR: Path = Path(__file__).resolve().parents[2]
    DEBUG: bool = False
    TESTING: bool = False
    SECRET_KEY: str = os.getenv("SAU_SECRET_KEY", "change-me")
    MAX_CONTENT_LENGTH: int = 1024 * 1024 * 1024  # 1GB uploads by default
    CORS_ALLOW_ORIGINS: str = os.getenv("SAU_CORS_ALLOW_ORIGINS", "*")
    RUNTIME_DIRECTORIES = [
        "videoFile",
        "cookiesFile",
        "uploads",
        "sau_backend/media/out",
        "logs",
    ]


@dataclass
class DevelopmentConfig(BaseConfig):
    DEBUG: bool = True


@dataclass
class TestingConfig(BaseConfig):
    TESTING: bool = True
    WTF_CSRF_ENABLED: bool = False


PROFILE_MAP = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": BaseConfig,
    None: BaseConfig,
}


class ConfigResolver:
    """Helper for resolving configuration profiles."""

    def load(self, config_name: Optional[str] = None) -> Dict[str, Any]:
        cls = PROFILE_MAP.get(config_name, BaseConfig)
        instance = cls()
        config_dict = asdict(instance)
        # Normalise Path values to str for Flask compatibility
        for key, value in list(config_dict.items()):
            if isinstance(value, Path):
                config_dict[key] = str(value)
        return config_dict


__all__ = ["ConfigResolver", "BaseConfig", "DevelopmentConfig", "TestingConfig"]
