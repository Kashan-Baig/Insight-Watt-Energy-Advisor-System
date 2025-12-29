# backend/main.py
"""
Insight-Watt Backend API
------------------------
FastAPI application for energy analysis workflow.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from backend.routes.energy import router as energy_router

# ==============================
# App Configuration
# ==============================
app = FastAPI(
    title="Insight-Watt API",
    description="Energy consumption analysis and 7-day optimization planning API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ==============================
# CORS Configuration
# ==============================
# Allow React/Vite frontend (typically localhost:5173 in dev)
origins = [
    "http://localhost:5173",      # Vite default
    "http://localhost:3000",      # Create React App default
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://localhost:8080",      # Alternative
    "http://localhost:8081",      # Alternative
    "http://localhost:8082",      # Alternative
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],         # Allow all HTTP methods
    allow_headers=["*"],         # Allow all headers
)

# ==============================
# Register Routers
# ==============================
app.include_router(energy_router)


# ==============================
# Root Endpoint
# ==============================
@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "message": "Welcome to Insight-Watt API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "upload": "POST /api/v1/upload",
            "analyze": "POST /api/v1/analyze",
            "results": "GET /api/v1/results/{analysis_id}"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# ==============================
# Run with Uvicorn
# ==============================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Enable auto-reload for development
    )
