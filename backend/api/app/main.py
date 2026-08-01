from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Dev-only: allow the Expo web dev server (and any localhost port) to call
# this API from the browser. Tighten this to specific origins before
# shipping anywhere real.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(emails_router)
app.include_router(settings_router)
app.include_router(analytics_router)


@app.get("/health")
def health():
    return {"status": "ok"}
