"""Bootstrap helpers for runtime environment."""
from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Iterable

from flask import Flask


def ensure_runtime_directories(base_dir: Path, required_dirs: Iterable[str]) -> None:
    for rel_path in required_dirs:
        target = Path(rel_path)
        if not target.is_absolute():
            target = base_dir / rel_path
        target.mkdir(parents=True, exist_ok=True)


def configure_logging(app: Flask) -> None:
    if app.config.get("TESTING"):
        return

    logs_dir = Path(app.config.get("BASE_DIR", Path.cwd())) / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    log_path = logs_dir / "backend.log"
    handler = RotatingFileHandler(log_path, maxBytes=10 * 1024 * 1024, backupCount=5)
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )
    handler.setFormatter(formatter)
    handler.setLevel(logging.INFO)

    root_logger = logging.getLogger()
    if not any(isinstance(h, RotatingFileHandler) and h.baseFilename == str(log_path) for h in root_logger.handlers):
        root_logger.addHandler(handler)


__all__ = ["ensure_runtime_directories", "configure_logging"]
