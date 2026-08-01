import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri: str = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback"
    )
    app_redirect_uri: str = os.getenv(
        "APP_REDIRECT_URI", "focusmailapp://auth/callback"
    )
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./focusmail.db")
    ai_service_url: str = os.getenv("AI_SERVICE_URL", "http://localhost:8001")
    session_secret: str = os.getenv("SESSION_SECRET", "dev-secret-change-me")
    # Where the browser gets sent after /auth/callback finishes, with the
    # session token attached as a query param. Points at the Expo web dev
    # server by default.
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:8081")
    # Single source of truth for the retention window — used both to filter
    # what gets fetched from Gmail in the first place (gmail/client.py) and
    # to purge anything already stored past this age (notifications/scheduler.py).
    retention_days: int = int(os.getenv("RETENTION_DAYS", "7"))


settings = Settings()
