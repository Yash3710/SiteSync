import sqlite3
from backend.matching import match_report
from backend.extraction import extract_from_text

# Simulate the Hindi text
raw = "आज हमने ज़ोन ए में फाउंडेशन का काम पूरा कर लिया है।"

# Run extraction (Ollama)
extracted = extract_from_text(raw)
print("EXTRACTED:", extracted)

# Run matching
conn = sqlite3.connect("backend/sih.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
cursor.execute("SELECT * FROM schedule_items WHERE status != 'done'")
items = [dict(r) for r in cursor.fetchall()]

result = match_report(extracted, items)
print("MATCH RESULT:", result)
