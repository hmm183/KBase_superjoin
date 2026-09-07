from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from backend.app.config import settings
from backend.app.api.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multimodal Temporal Evidence Intelligence Graph & Evidence Galaxy API"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev and demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount preview images directory
preview_dir = settings.DATA_DIR / "page_previews"
preview_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/static/pages", StaticFiles(directory=str(preview_dir)), name="page_previews")

# Include API Router
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ONLINE",
        "docs_url": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
