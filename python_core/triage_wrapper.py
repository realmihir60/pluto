"""
Enhanced triage.py wrapper with rate limiting, logging, and error handling
This wraps the existing triage logic with production-grade safety features
"""
from fastapi import Request, HTTPException
from python_core.rate_limiter import get_rate_limiter
from python_core.logger import get_logger, LogLevel
import time
from typing import Optional, Dict, Any

async def handle_triage_request(request: Request, user: Optional[Any], db: Any, 
                                triage_handler_func) -> Dict[str, Any]:
    """
    Wrapper that adds rate limiting, error handling, and logging to triage requests
    
    Args:
        request: FastAPI request object
        user: Authenticated user (or None)
        db: Database session
        triage_handler_func: The actual triage logic function
    
    Returns:
        Triage result with all safety features applied
    """
    rate_limiter = get_rate_limiter()
    logger = get_logger()
    start_time = time.time()
    
    # Get identifier for rate limiting and logging
    identifier = user.id if user else (request.client.host if request.client else "unknown")
    ip_address = request.client.host if request.client else "unknown"
    
    try:
        # STEP 1: Rate Limiting
        try:
            rate_limiter.check_limit(identifier, is_authenticated=bool(user))
        except HTTPException as rate_error:
            logger.log_error(
                "rate_limit_exceeded",
                f"Rate limit hit for {identifier}",
                {
                    "user_id": user.id if user else None,
                    "ip": ip_address,
                    "is_authenticated": bool(user)
                }
            )
            # Return user-friendly error
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Too many requests",
                    "message": "You've reached your hourly limit. Please try again later.",
                    "user_message": "For urgent medical concerns, please call your doctor or 911.",
                    "retry_after_minutes": 60
                }
            )
        
        # STEP 2: Log access
        logger.log_access(
            endpoint="/api/triage",
            method="POST",
            user_id=user.id if user else None,
            ip_address=ip_address,
            user_agent=request.headers.get("user-agent") if hasattr(request, 'headers') else None
        )
        
        # STEP 3: Call actual triage logic (with comprehensive error handling)
        try:
            result = await triage_handler_func(request, user, db)
            
            # STEP 4: Log successful triage
            duration_ms = (time.time() - start_time) * 1000
            logger.log_triage(
                user_id=user.id if user else None,
                input_text=str(result.get("message", ""))[:100],  # First 100 chars
                result=result,
                duration_ms=duration_ms
            )
            
            # Add rate limit info to response
            remaining = rate_limiter.get_remaining(identifier, bool(user))
            result["rate_limit"] = {
                "remaining": remaining,
                "limit": 50 if user else 10,
                "window": "1 hour"
            }
            
            return result
            
        except HTTPException:
            # Re-raise HTTP exceptions (like rate limits)
            raise
            
        except Exception as triage_error:
            # Handle triage-specific errors
            duration_ms = (time.time() - start_time) * 1000
            
            logger.log_error(
                "triage_execution_error",
                str(triage_error),
                {
                    "user_id": user.id if user else None,
                    "duration_ms": duration_ms,
                    "error_type": type(triage_error).__name__
                },
                level=LogLevel.ERROR
            )
            
            # Determine error type and return appropriate message
            error_message = {
                "error": "Triage processing failed",
                "message": "We encountered an issue processing your request.",
                "user_message": get_user_friendly_error_message(triage_error),
                "fallback_guidance": "For urgent concerns, please call your doctor or 911.",
                "support": "If this persists, contact support@plutohealth.ai"
            }
            
            raise HTTPException(status_code=500, detail=error_message)
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as outer_error:
        # Catch-all for unexpected errors
        logger.log_error(
            "unexpected_error",
            str(outer_error),
            {
                "user_id": user.id if user else None,
                "ip": ip_address,
                "error_type": type(outer_error).__name__
            },
            level=LogLevel.CRITICAL
        )
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": "An unexpected error occurred",
                "user_message": "We're sorry, something went wrong. Please try again in a few minutes.",
                "fallback_guidance": "For urgent medical concerns, call 911 or your doctor.",
                "support": "Contact support@plutohealth.ai if this continues"
            }
        )


def get_user_friendly_error_message(error: Exception) -> str:
    """
    Convert technical errors into user-friendly messages
    """
    error_str = str(error).lower()
    
    # LLM/API errors
    if "groq" in error_str or "api" in error_str or "timeout" in error_str:
        return "Our AI analysis service is temporarily unavailable. We've fallen back to our rule-based system for now."
    
    # Database errors
    if "database" in error_str or "connection" in error_str or "postgres" in error_str:
        return "We're having trouble saving your information right now. Please try again in a moment."
    
    # Input validation errors
    if "invalid" in error_str or "validation" in error_str:
        return "Please check your input and try again. Make sure you've described your symptoms clearly."
    
    # Default
    return "Something unexpected happened. Please try again, and contact support if this continues."
