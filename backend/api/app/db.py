from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

from . import models  # noqa: F401  Ensures tables are registered before create_all.
from .config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _migrate_email_message_columns()


def _migrate_email_message_columns() -> None:
    """Add fields introduced after the first SQLite prototype."""
    if engine.dialect.name != "sqlite":
        return

    existing = {column["name"] for column in inspect(engine).get_columns("emailmessage")}
    additions = {
        "urgency_score": "INTEGER",
        "attachments_json": "TEXT NOT NULL DEFAULT '[]'",
        "is_read": "BOOLEAN NOT NULL DEFAULT 0",
        "is_archived": "BOOLEAN NOT NULL DEFAULT 0",
        "is_deleted": "BOOLEAN NOT NULL DEFAULT 0",
        "is_replied": "BOOLEAN NOT NULL DEFAULT 0",
    }
    with engine.begin() as connection:
        for name, definition in additions.items():
            if name not in existing:
                connection.execute(
                    text(f"ALTER TABLE emailmessage ADD COLUMN {name} {definition}")
                )


def get_session():
    with Session(engine) as session:
        yield session
