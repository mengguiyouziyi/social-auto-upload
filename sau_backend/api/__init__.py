"""Blueprint registrations for the backend API."""
from __future__ import annotations

from flask import Flask


def register_blueprints(app: Flask) -> None:
    """Register all API blueprints on the supplied app."""
    from .ai import bp as ai_bp
    from .media import bp as media_bp
    from .tts import bp as tts_bp

    app.register_blueprint(ai_bp)
    app.register_blueprint(media_bp)
    app.register_blueprint(tts_bp)


__all__ = ["register_blueprints"]
