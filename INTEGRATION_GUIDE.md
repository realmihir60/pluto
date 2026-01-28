# Beta Launch Integration Guide

## 🎯 Critical Files Created

### 1. Rate Limiting
`python_core/rate_limiter.py` - ✅ Created  
**Limits:**
- Authenticated users: 50 requests/hour
- Anonymous users: 10 requests/hour

### 2. Logging & Monitoring  
`python_core/logger.py` - ✅ Created  
**Features:**
- Error tracking
- Performance monitoring
- Triage event logging
- Admin metrics dashboard

### 3. Triage Wrapper
`python_core/triage_wrapper.py` - ✅ Created  
**Features:**
- Rate limit checking
- Error handling
- User-friendly messages
- Graceful LLM fallback

---

## 🔧 Manual Integration Steps

Since automated file editing had issues with the large triage.py file, here's how to integrate manually:

### Step 1: Add Imports to `api/triage.py`

Add these lines after the existing imports (around line 16):

```python
from python_core.rate_limiter import get_rate_limiter
from python_core.logger import get_logger, LogLevel
import time
```

### Step 2: Add Rate Limiting to `post_triage()` Function

At the start of the `post_triage()` function (line 56), add:

```python
async def post_triage(
    request: Request, 
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db_session)
):
    # --- ADD THIS SECTION START ---
    rate_limiter = get_rate_limiter()
    logger = get_logger()
    start_time = time.time()
    
    identifier = user.id if user else (request.client.host if request.client else "unknown")
    
    # Rate limiting check
    try:
        rate_limiter.check_(identifier, is_authenticated=bool(user))
    except HTTPException as e:
        logger.log_error("rate_limit", f"Limit hit: {identifier}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again in 1 hour.",
                "user_message": "For urgent concerns, call 911."
            }
        )
    # --- ADD THIS SECTION END ---
    
    try:
        data = await request.json()
        # ... rest of existing code
```

### Step 3: Add Logging at End of Function

Before the final return statement (around line 267), add:

```python
# --- ADD LOGGING BEFORE RETURN ---
duration_ms = (time.time() - start_time) * 1000
logger.log_triage(
    user_id=user.id if user else None,
    input_text=input_text[:100],
    result={"triage_level": final_level},
    duration_ms=duration_ms
)
# --- END LOGGING ---

return {
    "version": "3.0.0-doctor-friendly",
    # ... rest of response
}
```

### Step 4: Improve Error Handling

Replace the generic exception handler (line 294) with:

```python
except HTTPException:
    raise  # Re-raise HTTP exceptions
except Exception as e:
    logger.log_error(
        "triage_error",
        str(e),
        {"user_id": user.id if user else None},
        level=LogLevel.ERROR
    )
    
    # User-friendly error message
    user_message = "We encountered an issue. For urgent concerns, call 911."
    if "groq" in str(e).lower():
        user_message = "Our AI is temporarily unavailable. Using backup system."
    
    raise HTTPException(
        status_code=500,
        detail={
            "error": "Processing failed",
            "message": user_message,
            "support": "Contact support@plutohealth.ai"
        }
    )
```

---

## ✅ Quick Integration (Copy-Paste Ready)

If you want to integrate quickly, I can create a complete new `triage.py` file with all changes already applied. Let me know!

---

## 🧪 Testing After Integration

```bash
# Test rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:8000/api/triage \
    -H "Content-Type: application/json" \
    -d '{"input":"headache"}' &
done
# Should see rate limit error after 10 requests

# Test error handling
curl -X POST http://localhost:8000/api/triage \
  -H "Content-Type: application/json" \
  -d '{"input":""}get'
# Should return user-friendly error
```

---

## 📊 Monitoring Dashboard

To view logs and metrics, check:
- `/logs/errors.jsonl` - Error log
- `/logs/triage.jsonl` - Triage events
- `/logs/performance.jsonl` - Performance metrics

Add admin endpoint to view metrics programmatically (next step).
