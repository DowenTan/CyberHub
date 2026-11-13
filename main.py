"""
Root ASGI entrypoint for CyberHub Vite backend.
Enables running `uvicorn main:app --reload` directly from the project root directory
as well as from inside the backend directory.
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Import FastAPI app from backend/main.py
from backend.main import app  # noqa: E402

__all__ = ["app"]
