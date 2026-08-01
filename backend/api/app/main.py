from contextlib import asynccontextmanager

from fastapi import FastAPI

from .auth.routes import router as auth_router
from .db import init_db
from .notifications import scheduler
from .routes.analytics import router as analytics_router
from .routes.emails import router as emails_router
from .routes.settings import router as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler.start()
    yield
    scheduler.scheduler.shutdown()


app = FastAPI(title="focusMail API", lifespan=lifespan)
app.include_router(auth_router)
app.include_router(emails_router)
app.include_router(settings_router)
app.include_router(analytics_router)


@app.get("/health")
def health():
    return {"status": "ok"}
