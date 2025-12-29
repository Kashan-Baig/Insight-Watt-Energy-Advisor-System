"""
Health check endpoint for monitoring and status verification.
"""

from fastapi import APIRouter
from datetime import datetime
from app import __version__

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        dict: API status, version, and timestamp
    """
    return {
        "status": "healthy",
        "version": __version__,
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Insight Watt Backend API"
    }


@router.get("/")
async def health_root():
    """
    Alternative health check at root of /api/v1/health.
    
    Returns:
        dict: Simple status message
    """
    return {"status": "ok"}
