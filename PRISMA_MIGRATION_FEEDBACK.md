# Prisma Schema Migration Guide

## New Model: TriageFeedback

Added feedback collection for triage quality assessment.

### Migration Steps

```bash
# 1. Generate Prisma client with new schema
npx prisma generate

# 2. Push schema to database
npx prisma db push

# 3. Verify migration
npx prisma studio
# Check that TriageFeedback table exists
```

### Schema Changes

**Added:**
- `TriageFeedback` model
- Relation: `TriageEvent.feedback` → `TriageFeedback[]`

**Fields:**
- `id`: Primary key
- `triageEventId`: Foreign key to TriageEvent
- `userId`: User who gave feedback
- `rating`: "helpful" or "not_helpful"
- `comment`: Optional text feedback
- `createdAt`: Timestamp

### Usage

**Frontend:**
```tsx
import { FeedbackButtons } from "@/components/triage/feedback-buttons"

<Feedback Buttons triageEventId={eventId} />
```

**Backend:**
```python
# POST /api/feedback
{
  "triage_event_id": "evt_abc123",
  "rating": "helpful",
  "comment": "Very clear explanation"
}
```

**Admin Stats:**
```
GET /api/feedback/stats
```

### Rollback

If needed:
```bash
# Remove TriageFeedback model from schema.prisma
# Then:
npx prisma db push
```
