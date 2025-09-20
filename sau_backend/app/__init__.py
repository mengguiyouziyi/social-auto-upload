"""Flask application factory and bootstrap utilities."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

from flask import Flask
from flask_cors import CORS

from .config import ConfigResolver
from .bootstrap import ensure_runtime_directories, configure_logging


def create_app(config_name: Optional[str] = None, overrides: Optional[Dict[str, Any]] = None) -> Flask:
    """Create a configured Flask application instance.

    Args:
        config_name: Optional configuration profile name (e.g. "development", "testing").
        overrides: Optional dictionary used to override loaded configuration values.

    Returns:
        Configured :class:`~flask.Flask` application instance.
    """
    app = Flask(__name__, instance_relative_config=True)

    config = ConfigResolver().load(config_name=config_name)
    if overrides:
        config.update(overrides)
    app.config.update(config)

    CORS(app, resources={r"/*": {"origins": app.config.get("CORS_ALLOW_ORIGINS", "*")}})

    ensure_runtime_directories(
        base_dir=Path(app.config.get("BASE_DIR", Path.cwd())),
        required_dirs=app.config.get("RUNTIME_DIRECTORIES", []),
    )
    configure_logging(app)

    from sau_backend.api import register_blueprints  # lazy import to avoid circular deps

    register_blueprints(app)

    return app


__all__ = ["create_app"]
