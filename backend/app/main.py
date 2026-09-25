from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import engine, get_db
from app.models import init_db
from app.routers import eval as eval_router
from app.routers import search as search_router
from app.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run DB setup on startup."""
    init_db(engine)
    yield


app = FastAPI(
    title="kavach-search",
    description="Community search API with 3-tier LLM routing and injection defence.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(search_router.router)
app.include_router(eval_router.router)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["infra"])
def health(db: Session = Depends(get_db)):
    """Check service liveness and DB reachability."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"DB unreachable: {exc}")

    return HealthResponse(status="ok", db=db_status)
