"""
Simple in-memory rate limiter for Pluto Health API endpoints
Protects against abuse and cost overruns
"""
import time
from typing import Dict, List
from collections import defaultdict
from fastapi import HTTPException

class RateLimiter:
    """
    In-memory rate limiter with per-user and per-IP tracking
    Suitable for beta deployment without external dependencies
    """
    
    def __init__(self):
        # Track requests: {identifier: [timestamp1, timestamp2, ...]}
        self.requests: Dict[str, List[float]] = defaultdict(list)
        
        # Limits (requests per hour)
        self.AUTHENTICATED_LIMIT = 100  # Logged-in users: 100/hour
        self.ANONYMOUS_LIMIT = 10       # Anonymous users: 10/hour (production)
        self.WINDOW = 3600              # 1 hour in seconds
        
        # Cleanup interval (remove old data)
        self.last_cleanup = time.time()
        self.CLEANUP_INTERVAL = 600  # 10 minutes
    
    def check_limit(self, identifier: str, is_authenticated: bool = False) -> None:
        """
        Check if request is within rate limit
        
        Args:
            identifier: User ID (if authenticated) or IP address (if anonymous)
            is_authenticated: Whether this is a logged-in user
        
        Raises:
            HTTPException(429): If rate limit exceeded
        """
        now = time.time()
        
        # Periodic cleanup of old data
        if now - self.last_cleanup > self.CLEANUP_INTERVAL:
            self._cleanup_old_requests(now)
        
        # Get limit for this user type
        limit = self.AUTHENTICATED_LIMIT if is_authenticated else self.ANONYMOUS_LIMIT
        
        # Get request history for this identifier
        request_times = self.requests[identifier]
        
        # Remove requests outside the time window
        request_times = [t for t in request_times if now - t < self.WINDOW]
        self.requests[identifier] = request_times
        
        # Check if limit exceeded
        if len(request_times) >= limit:
            wait_time = int(self.WINDOW - (now - request_times[0]))
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Please try again in {wait_time // 60} minutes.",
                    "limit": limit,
                    "window": "1 hour",
                    "retry_after": wait_time
                }
            )
        
        # Add this request to history
        request_times.append(now)
    
    def _cleanup_old_requests(self, now: float) -> None:
        """Remove expired request records to prevent memory bloat"""
        for identifier in list(self.requests.keys()):
            self.requests[identifier] = [
                t for t in self.requests[identifier] 
                if now - t < self.WINDOW
            ]
            # Remove empty records
            if not self.requests[identifier]:
                del self.requests[identifier]
        
        self.last_cleanup = now
    
    def get_remaining(self, identifier: str, is_authenticated: bool = False) -> int:
        """Get remaining requests for this identifier"""
        limit = self.AUTHENTICATED_LIMIT if is_authenticated else self.ANONYMOUS_LIMIT
        now = time.time()
        request_times = [t for t in self.requests.get(identifier, []) if now - t < self.WINDOW]
        return max(0, limit - len(request_times))
    
    def reset(self, identifier: str) -> None:
        """Reset rate limit for a specific identifier (admin use)"""
        if identifier in self.requests:
            del self.requests[identifier]


# Global instance
_rate_limiter = RateLimiter()

def get_rate_limiter() -> RateLimiter:
    """Get global rate limiter instance"""
    return _rate_limiter
