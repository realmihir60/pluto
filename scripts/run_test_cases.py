#!/usr/bin/env python3
"""
Run all 30 test cases from test.md through the triage API
and output results in markdown format.
"""

import requests
import json

API_URL = "http://localhost:8000/triage"

TEST_CASES = [
    {"id": 1, "patient": "23M", "symptoms": "Head hurts a bit. Probably didn't sleep. Feels off though."},
    {"id": 2, "patient": "71F", "symptoms": "I'm just not myself today. Hard to explain."},
    {"id": 3, "patient": "34F", "symptoms": "Heart racing, chest tight, hands numb. Happens when I'm stressed."},
    {"id": 4, "patient": "45M", "symptoms": "Short of breath walking upstairs. Been like that a while."},
    {"id": 5, "patient": "6-year-old boy", "symptoms": "Tummy hurts. Don't wanna eat."},
    {"id": 6, "patient": "29F", "symptoms": "Can't sleep, heart pounding, panicky but exhausted."},
    {"id": 7, "patient": "52M", "symptoms": "Nauseous, sweaty, jaw tight. No chest pain."},
    {"id": 8, "patient": "19F", "symptoms": "Leg hurts. Flew yesterday. Feels like a cramp."},
    {"id": 9, "patient": "60F", "symptoms": "Blurry vision, very thirsty, peeing a lot."},
    {"id": 10, "patient": "40M", "symptoms": "Back pain after lifting. Sharp sometimes. Won't go away."},
    {"id": 11, "patient": "27F", "symptoms": "Bad headache today. Lights bother me."},
    {"id": 12, "patient": "65M", "symptoms": "Just tired. No energy. Everything feels heavy."},
    {"id": 13, "patient": "31M", "symptoms": "Sharp chest pain when I breathe in."},
    {"id": 14, "patient": "4-month-old infant", "symptoms": "Crying more than usual. Eating less."},
    {"id": 15, "patient": "48F", "symptoms": "Heartburn again. Same as usual. Antacids help a bit."},
    {"id": 16, "patient": "70M", "symptoms": "Couldn't speak clearly for a few minutes. Fine now."},
    {"id": 17, "patient": "22M", "symptoms": "Worst headache I've ever had. Came on suddenly."},
    {"id": 18, "patient": "55F", "symptoms": "Joint pain, tired, low fever for weeks."},
    {"id": 19, "patient": "36M", "symptoms": "Heart pounding after partying last night. Sweaty."},
    {"id": 20, "patient": "75F", "symptoms": "Confused, nauseous, legs feel weak."},
    {"id": 21, "patient": "28F", "symptoms": "Dizzy when standing. Been happening for months."},
    {"id": 22, "patient": "63M", "symptoms": "Breathing harder when lying down."},
    {"id": 23, "patient": "18F", "symptoms": "Fever, sore throat, neck feels stiff maybe from sleep."},
    {"id": 24, "patient": "50M", "symptoms": "Shaky, sweaty, anxious since this morning."},
    {"id": 25, "patient": "42F", "symptoms": "Numbness in feet. Hard to focus."},
    {"id": 26, "patient": "58M", "symptoms": "Cough for months. Not worse. Just there."},
    {"id": 27, "patient": "33F", "symptoms": "Feels like something's wrong but tests are normal."},
    {"id": 28, "patient": "67M", "symptoms": "New back pain. Trouble walking."},
    {"id": 29, "patient": "25M", "symptoms": "Chest tightness, but only sometimes."},
    {"id": 30, "patient": "39F", "symptoms": "Short of breath and exhausted weeks after a virus."},
]

def run_test(test):
    try:
        response = requests.post(API_URL, json={"input": test["symptoms"]}, timeout=30)
        if response.status_code != 200:
            return {"error": f"HTTP {response.status_code}"}
        return response.json()
    except Exception as e:
        return {"error": str(e)}

def urgency_emoji(level):
    emojis = {
        "emergency": "🚨",
        "urgent": "⚠️",
        "schedule_appointment": "📅",
        "monitor_followup": "🔍",
        "home_care": "🏠"
    }
    return emojis.get(level, "❓")

def main():
    results = []
    
    for test in TEST_CASES:
        result = run_test(test)
        urgency = result.get("triage_level", "error")
        protocols = result.get("matched_protocols", [])
        what_we_know = result.get("what_we_know", [])
        follow_ups = result.get("follow_up_questions", [])[:2]
        
        results.append({
            "id": test["id"],
            "patient": test["patient"],
            "symptoms": test["symptoms"],
            "urgency": urgency,
            "protocols": protocols,
            "red_flags": [w for w in what_we_know if "🔴" in w],
            "follow_ups": follow_ups
        })
    
    # Print markdown output
    print("# Clinical Reasoning Engine Test Results")
    print(f"\n**Engine Version:** v4.0.0-reasoning-engine")
    print(f"**Total Cases:** {len(results)}")
    print()
    
    # Summary stats
    urgency_counts = {}
    for r in results:
        u = r["urgency"]
        urgency_counts[u] = urgency_counts.get(u, 0) + 1
    
    print("## Summary")
    print("| Urgency Level | Count |")
    print("|---------------|-------|")
    for u, c in sorted(urgency_counts.items()):
        print(f"| {urgency_emoji(u)} {u.upper().replace('_', ' ')} | {c} |")
    print()
    
    # Individual results
    print("## Test Results")
    print()
    
    for r in results:
        print(f"### Case {r['id']}: {r['patient']}")
        print(f"**Input:** \"{r['symptoms']}\"")
        print()
        print(f"**Result:** {urgency_emoji(r['urgency'])} **{r['urgency'].upper().replace('_', ' ')}**")
        print()
        if r['protocols']:
            print(f"**Protocols Matched:** {', '.join(r['protocols'])}")
        if r['red_flags']:
            print(f"**Red Flags Detected:**")
            for rf in r['red_flags'][:3]:
                print(f"- {rf}")
        if r['follow_ups']:
            print(f"**Follow-up Questions:**")
            for q in r['follow_ups']:
                print(f"- {q}")
        print()
        print("---")
        print()

if __name__ == "__main__":
    main()
