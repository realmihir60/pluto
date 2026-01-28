"""
Triage Feedback API - Collect user feedback on triage quality
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from python_core.auth import get_current_user_optional
from python_core.models import User
from sqlmodel import Session, select
from python_core.database import get_db
import uuid
from datetime import datetime

router = APIRouter()

class FeedbackRequest(BaseModel):
    triage_event_id: str
    rating: str  # "helpful" or "not_helpful"
    comment: str = ""

@router.post("")
@router.post("/")
async def submit_feedback(
    feedback: FeedbackRequest,
    user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Store user feedback on triage quality
    """
    # Create feedback record
    # Note: Using raw SQL since TriageFeedback model needs to be added to Prisma
    
    feedback_id = f"fb_{uuid.uuid4().hex[:8]}"
    user_id = user.id if user else "anonymous"
    
    # Store in database (will work once Prisma schema is migrated)
    query = """
    INSERT INTO "TriageFeedback" (id, "triageEventId", "userId", rating, comment, "createdAt")
    VALUES (:id, :triage_event_id, :user_id, :rating, :comment, :created_at)
    """
    
    try:
        db.execute(
            query,
            {
                "id": feedback_id,
                "triage_event_id": feedback.triage_event_id,
                "user_id": user_id,
                "rating": feedback.rating,
                "comment": feedback.comment,
                "created_at": datetime.utcnow()
            }
        )
        db.commit()
        
        return {
            "success": True,
            "message": "Thank you for your feedback!",
            "feedback_id": feedback_id
        }
    except Exception as e:
        # Graceful fallback if table doesn't exist yet
        print(f"Feedback storage failed (table may not exist): {e}")
        return {
            "success": False,
            "message": "Feedback received but not stored. Thank you!",
            "error": "Database schema pending migration"
        }

@router.get("/stats")
async def get_feedback_stats(user: User = Depends(get_current_user_optional)):
    """
    Get feedback statistics (admin only for now)
    """
    if not user or not user.isAdmin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Return mock stats for now (implement after migration)
    return {
        "total_feedback": 0,
        "helpful": 0,
        "not_helpful": 0,
        "satisfaction_rate": 0.0,
        "recent_comments": []
    }
