"""
Admin Metrics API Endpoint
Exposes in-house monitoring statistics for the admin dashboard
"""
from fastapi import APIRouter, Depends, HTTPException
from python_core.auth import get_current_user_optional
from python_core.models import User
from python_core.logger import get_logger
import os

router = APIRouter()

@router.get("")
@router.get("/")
async def get_metrics(user: User = Depends(get_current_user_optional)):
    """
    Get system metrics for admin dashboard
    Requires admin privileges
    """
    # Check if user is admin
    if not user or not user.isAdmin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    
    logger = get_logger()
    
    # Get metrics from logger
    metrics = logger.get_metrics()
    
    # Get recent errors (last 10)
    recent_errors = logger.get_recent_errors(limit=10)
    
    # Get triage statistics (last 24 hours)
    triage_stats_24h = logger.get_triage_stats(hours=24)
    triage_stats_7d = logger.get_triage_stats(hours=24 * 7)
    
    # Check if log files exist
    log_dir_exists = os.path.exists("logs")
    
    return {
        "status": "healthy",
        "version": "3.0.0-beta",
        "monitoring": {
            "enabled": True,
            "type": "in-house",
            "log_directory": "./logs",
            "log_files_present": log_dir_exists
        },
        "metrics": metrics,
        "recent_errors": recent_errors,
        "triage_stats": {
            "last_24_hours": triage_stats_24h,
            "last_7_days": triage_stats_7d
        },
        "rate_limiting": {
            "enabled": True,
            "limits": {
                "authenticated": "50 requests/hour",
                "anonymous": "10 requests/hour"
            }
        }
    }

@router.get("/health")
async def health_check():
    """
    Public health check endpoint (no auth required)
    """
    logger = get_logger()
    metrics = logger.get_metrics()
    
    return {
        "status": "ok",
        "uptime_hours": round(metrics.get("uptime_hours", 0), 2),
        "total_requests": metrics.get("total_requests", 0),
        "success_rate": round(metrics.get("success_rate", 0) * 100, 1)
    }
