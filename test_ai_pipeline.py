import asyncio
from backend.extraction import extract_from_text
from backend.matching import match_report

test_phrases = [
    "ज़ोन ए का फाउंडेशन पोर", 
    "आज हमने ज़ोन ए में फाउंडेशन का काम पूरा कर लिया है।"
]

# Dummy schedule items
dummy_schedule = [
    {"id": 1, "task_name": "Foundation pour", "discipline": "Civil", "location": "Zone A", "planned_start": "2026-09-01", "planned_end": "2026-09-30"}
]

for phrase in test_phrases:
    print(f"\n--- Testing: {phrase} ---")
    extracted = extract_from_text(phrase)
    print(f"Extracted JSON: {extracted}")
    
    match_result = match_report(extracted, dummy_schedule)
    print(f"Match Result: Score={match_result.get('best_match', {}).get('confidence')}, Status={match_result.get('review_status')}")

