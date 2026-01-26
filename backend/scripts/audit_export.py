import os
import json
import sys
from sqlmodel import Session, create_engine, select
from datetime import datetime

# Adjust path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import TriageEvent, User

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not set.")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def generate_evidence_packet(event_id: str):
    with Session(engine) as session:
        statement = select(TriageEvent).where(TriageEvent.id == event_id)
        event = session.exec(statement).first()

        if not event:
            print(f"Error: No TriageEvent found with ID {event_id}")
            return

        statement = select(User).where(User.id == event.userId)
        user = session.exec(statement).first()

        packet = {
            "packet_header": {
                "report_type": "Legal Clinical Evidence Packet",
                "generated_at": datetime.utcnow().isoformat(),
                "event_id": event.id,
            },
            "subject_info": {
                "user_id": user.id if user else "Unknown",
                "user_name": user.name if user else "Unknown",
                "consent_status": user.has_consented if user else False,
            },
            "incident_data": {
                "timestamp": event.createdAt.isoformat(),
                "input_symptoms": event.symptoms,
                "action_recommended": event.actionRecommended,
                "urgency_level": event.urgency,
            },
            "clinical_logic_audit": {
                "engine_version": event.engine_version,
                "logic_snapshot": event.logic_snapshot,
                "ai_result_raw": event.aiResult,
            }
        }

        filename = f"audit_packet_{event_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, "w") as f:
            json.dump(packet, f, indent=4)
        
        print(f"Success: Legal Evidence Packet generated: {filename}")
        print("Audit Drill Complete: Full event explanation available.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python audit_export.py <event_id>")
    else:
        generate_evidence_packet(sys.argv[1])
