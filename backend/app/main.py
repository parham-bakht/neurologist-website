import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.routers import admin, articles, auth, contacts, patients, taxonomies, uploads, visits
from app.services.publication_scheduler import run_publication_scheduler
from app.services.bootstrap import ensure_main_manager


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await ensure_main_manager()
    stop = asyncio.Event()
    scheduler = asyncio.create_task(run_publication_scheduler(stop))
    try:
        yield
    finally:
        stop.set()
        await scheduler


production = settings.environment.lower() == "production"
app = FastAPI(
    title="Pediatric Neurologist API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if production else "/docs",
    redoc_url=None if production else "/redoc",
    openapi_url=None if production else "/openapi.json",
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(articles.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(taxonomies.router, prefix="/api/v1")
app.include_router(contacts.router, prefix="/api/v1")
app.include_router(patients.router, prefix="/api/v1")
app.include_router(visits.router, prefix="/api/v1")
uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.middleware("http")
async def prevent_api_indexing(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/") or request.url.path == "/health":
        response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    return response

@app.get("/health")
async def health():
    return {"status": "ok"}
