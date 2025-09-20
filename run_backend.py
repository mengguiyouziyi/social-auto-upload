"""WSGI entrypoint for the social-auto-upload backend."""
from sau_backend.app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5409, debug=app.config.get("DEBUG", False))
