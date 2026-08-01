import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri: str = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback"
    )
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./focusmail.db")
    ai_service_url: str = os.getenv("AI_SERVICE_URL", "http://localhost:8001")
    session_secret: str = os.getenv("SESSION_SECRET", "dev-secret-change-me")


settings = Settings()
