#!/usr/bin/env python3
"""
Pluto Clinical Reasoning Engine - Stress Test Suite
=====================================================
Tests edge cases from simple to complex, including deceptive patterns.
"""

import requests
import json
from dataclasses import dataclass
from typing import List

API_URL = "http://localhost:8000/triage"

@dataclass
class TestCase:
    name: str
    input: str
    expected_urgency: str  # home_care, monitor_followup, schedule_appointment, urgent, emergency
    category: str
    notes: str = ""

# ============================================================================
# TEST CASES - Comprehensive Edge Case Coverage
# ============================================================================

TEST_CASES: List[TestCase] = [
    # =========================================================================
    # CATEGORY 1: SIMPLE / BENIGN (Should be HOME_CARE or MONITOR)
    # =========================================================================
    TestCase(
        name="Simple headache - minimal info",
        input="I have a headache",
        expected_urgency="monitor_followup",  # Needs more info
        category="simple",
        notes="Vague input should ask follow-ups, not diagnose"
    ),
    TestCase(
        name="Common cold symptoms",
        input="I have a runny nose and sore throat for 2 days",
        expected_urgency="home_care",
        category="simple",
        notes="Classic viral URI pattern"
    ),
    TestCase(
        name="Mild stomach ache after eating",
        input="My stomach hurts a little bit after I ate spicy food",
        expected_urgency="home_care",
        category="simple"
    ),
    TestCase(
        name="Tiredness from poor sleep",
        input="I'm tired because I only slept 4 hours last night",
        expected_urgency="home_care",
        category="simple",
        notes="Clear cause identified"
    ),
    
    # =========================================================================
    # CATEGORY 2: MEDIUM COMPLEXITY (Should be SCHEDULE_APPOINTMENT or URGENT)
    # =========================================================================
    TestCase(
        name="Persistent cough 3 weeks",
        input="I've had a cough for 3 weeks that won't go away",
        expected_urgency="schedule_appointment",
        category="medium",
        notes="Duration > 3 weeks is a red flag pattern"
    ),
    TestCase(
        name="UTI symptoms",
        input="It burns when I pee and I have to go frequently",
        expected_urgency="schedule_appointment",
        category="medium"
    ),
    TestCase(
        name="Back pain with activity",
        input="My back hurts when I lift things, started after moving furniture",
        expected_urgency="home_care",
        category="medium",
        notes="Mechanical pattern with clear cause"
    ),
    TestCase(
        name="Ankle swelling after injury",
        input="I twisted my ankle playing basketball and it's swollen",
        expected_urgency="schedule_appointment",
        category="medium"
    ),
    
    # =========================================================================
    # CATEGORY 3: HARD / COMPLEX (Multiple symptoms, mixed signals)
    # =========================================================================
    TestCase(
        name="Headache with vision changes",
        input="I have a bad headache and I'm seeing spots in my vision",
        expected_urgency="urgent",
        category="complex",
        notes="Vision change with headache needs neuro eval"
    ),
    TestCase(
        name="Fatigue with weight loss",
        input="I've been really tired for a month and lost 15 pounds without trying",
        expected_urgency="urgent",
        category="complex",
        notes="B-symptoms pattern (weight loss + fatigue)"
    ),
    TestCase(
        name="Abdominal pain with timeline",
        input="My stomach started hurting this morning, then I threw up. The pain is around my belly button.",
        expected_urgency="urgent",
        category="complex",
        notes="Pain BEFORE vomiting - Murphy's sequence for appendicitis"
    ),
    
    # =========================================================================
    # CATEGORY 4: DECEPTIVE NORMAL → ACTUALLY CRITICAL
    # =========================================================================
    TestCase(
        name="Just tired - but exertional dyspnea",
        input="I just feel really tired when I climb stairs, which is new for me",
        expected_urgency="urgent",
        category="deceptive_critical",
        notes="Exertional dyspnea can indicate heart failure"
    ),
    TestCase(
        name="Mild leg pain - but DVT risk",
        input="My left calf is a bit swollen and sore, I just got back from a 12 hour flight",
        expected_urgency="urgent",
        category="deceptive_critical",
        notes="Immobility + unilateral swelling = DVT risk"
    ),
    TestCase(
        name="Indigestion - but cardiac pattern",
        input="I have heartburn that gets worse when I walk upstairs",
        expected_urgency="urgent",
        category="deceptive_critical",
        notes="Exertional 'heartburn' is classic angina mimic"
    ),
    TestCase(
        name="Normal headache - but thunderclap",
        input="I got a sudden headache, the worst of my life, it hit instantly",
        expected_urgency="emergency",
        category="deceptive_critical",
        notes="Thunderclap = SAH until proven otherwise"
    ),
    
    # =========================================================================
    # CATEGORY 5: CRITICAL SIGNS → BUT ACTUALLY NOT EMERGENCY
    # =========================================================================
    TestCase(
        name="Chest pain but reproducible",
        input="I have chest pain but only when I press on this one spot on my ribs",
        expected_urgency="home_care",
        category="deceptive_benign",
        notes="Reproducible by palpation = musculoskeletal"
    ),
    TestCase(
        name="Dizziness but orthostatic",
        input="I feel dizzy only when I stand up too fast from bed",
        expected_urgency="home_care",
        category="deceptive_benign",
        notes="Classic orthostatic pattern, benign"
    ),
    TestCase(
        name="Shortness of breath but anxiety",
        input="I can't breathe well, I'm having a panic attack, this happens when I'm stressed",
        expected_urgency="monitor_followup",
        category="deceptive_benign",
        notes="Known panic pattern with clear trigger"
    ),
    TestCase(
        name="Blood in stool - but hemorrhoids",
        input="I see bright red blood when I wipe, I have hemorrhoids",
        expected_urgency="schedule_appointment",
        category="deceptive_benign",
        notes="Bright red + known hemorrhoids = less concerning"
    ),
    
    # =========================================================================
    # CATEGORY 6: TRUE EMERGENCIES
    # =========================================================================
    TestCase(
        name="Classic MI symptoms",
        input="I have crushing chest pain, I'm sweating a lot, and my left arm hurts",
        expected_urgency="emergency",
        category="emergency",
        notes="Classic MI pattern"
    ),
    TestCase(
        name="Stroke symptoms",
        input="My face is drooping on one side and I can't lift my arm",
        expected_urgency="emergency",
        category="emergency"
    ),
    TestCase(
        name="Meningitis pattern",
        input="I have a high fever, the worst headache ever, and my neck is so stiff I can't look down",
        expected_urgency="emergency",
        category="emergency"
    ),
    TestCase(
        name="Anaphylaxis",
        input="I ate peanuts and now my throat is swelling and I can't breathe well",
        expected_urgency="emergency",
        category="emergency"
    ),
    TestCase(
        name="Cauda equina",
        input="My back hurts really bad and I can't control my bladder, my legs are getting weak",
        expected_urgency="emergency",
        category="emergency",
        notes="Bladder/bowel + back pain = surgical emergency"
    ),
]

def run_test(test: TestCase) -> dict:
    """Run a single test case and return results."""
    try:
        response = requests.post(API_URL, json={"input": test.input}, timeout=30)
        if response.status_code != 200:
            return {"test": test.name, "status": "ERROR", "error": f"HTTP {response.status_code}"}
        
        data = response.json()
        actual_urgency = data.get("triage_level", "unknown")
        
        # Determine pass/fail with some flexibility
        urgency_order = ["home_care", "monitor_followup", "schedule_appointment", "urgent", "emergency"]
        expected_idx = urgency_order.index(test.expected_urgency) if test.expected_urgency in urgency_order else -1
        actual_idx = urgency_order.index(actual_urgency) if actual_urgency in urgency_order else -1
        
        # Pass if exact match or within 1 level (some flexibility for edge cases)
        passed = abs(actual_idx - expected_idx) <= 1
        
        # But for emergencies, must not under-triage
        if test.expected_urgency == "emergency" and actual_urgency != "emergency":
            passed = False
        
        return {
            "test": test.name,
            "category": test.category,
            "status": "PASS" if passed else "FAIL",
            "expected": test.expected_urgency,
            "actual": actual_urgency,
            "red_flags_found": len(data.get("what_we_know", [])),
            "follow_ups": len(data.get("follow_up_questions", [])),
            "notes": test.notes
        }
    except Exception as e:
        return {"test": test.name, "status": "ERROR", "error": str(e)}

def main():
    print("=" * 70)
    print("PLUTO CLINICAL REASONING ENGINE - STRESS TEST SUITE")
    print("=" * 70)
    print()
    
    results = []
    for test in TEST_CASES:
        result = run_test(test)
        results.append(result)
        
        status_icon = "✅" if result["status"] == "PASS" else "❌" if result["status"] == "FAIL" else "⚠️"
        print(f"{status_icon} [{result.get('category', 'unknown'):^20}] {test.name}")
        if result["status"] == "FAIL":
            print(f"   Expected: {result.get('expected')} | Got: {result.get('actual')}")
        if result["status"] == "ERROR":
            print(f"   Error: {result.get('error')}")
    
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    
    print(f"Total: {len(results)} | ✅ Passed: {passed} | ❌ Failed: {failed} | ⚠️ Errors: {errors}")
    print(f"Pass Rate: {passed/len(results)*100:.1f}%")
    
    # Category breakdown
    print()
    print("BY CATEGORY:")
    categories = set(t.category for t in TEST_CASES)
    for cat in categories:
        cat_results = [r for r in results if r.get("category") == cat]
        cat_passed = sum(1 for r in cat_results if r["status"] == "PASS")
        print(f"  {cat}: {cat_passed}/{len(cat_results)}")
    
    # Critical failures
    critical_fails = [r for r in results if r["status"] == "FAIL" and r.get("category") in ["emergency", "deceptive_critical"]]
    if critical_fails:
        print()
        print("⚠️  CRITICAL FAILURES (under-triage risks):")
        for f in critical_fails:
            print(f"   - {f['test']}: Expected {f['expected']}, Got {f['actual']}")
    
    return results

if __name__ == "__main__":
    main()
