"""
FastAPI Application Entry Point for MedSafe AI Backend.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import router as api_router
from app.scripts.seed_demo_data import seed_all_demo_data
from app.services.retrieval_service import initialize_retrieval_engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("medsafe.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App initialization & shutdown lifecycle handler."""
    logger.info("Starting MedSafe AI Backend Service...")
    # Seed demo DDI rules & source label chunks into local store
    seed_all_demo_data()
    # Initialize TF-IDF retrieval index
    initialize_retrieval_engine()
    yield
    logger.info("Shutting down MedSafe AI Backend Service.")


app = FastAPI(
    title="MedSafe AI Backend API",
    description="Educational Medicine-Combination Risk Analysis API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
if "*" in origins or not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
