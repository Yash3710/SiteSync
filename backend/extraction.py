import json, httpx, os
from datetime import date
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY_HERE")

SYSTEM_PROMPT = """You are an AI assistant for a construction project management tool.
Extract structured information from the supervisor's daily report text.
The input may be in various regional languages or English. Always translate to English.
Return ONLY valid JSON with no explanations or markdown.
If the date is missing, use today's date. If location is ambiguous, set null. If quantity is missing, set null.
Output: {"task": "...", "quantity": "... or null", "location": "... or null", "date": "YYYY-MM-DD"}"""

def _fallback(text):
    return {"task": text.strip()[:100], "quantity": None, "location": None, "date": date.today().isoformat(), "raw_text": text}

def extract_from_text(raw_text):
    today = date.today().isoformat()
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_API_KEY_HERE":
        return _fallback(raw_text)
    try:
        prompt = f"{SYSTEM_PROMPT}\n\nToday: {today}\nReport: {raw_text}\nJSON:"
        with httpx.Client(timeout=15.0) as client:
            r = client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}",
                json={"contents": [{"parts": [{"text": prompt}]}]}
            )
            r.raise_for_status()
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Strip markdown fences if present
            for prefix in ["```json", "```"]:
                if text.startswith(prefix): text = text[len(prefix):]
            if text.endswith("```"): text = text[:-3]
            d = json.loads(text.strip())
            return {"task": d.get("task"), "quantity": d.get("quantity"), "location": d.get("location"), "date": d.get("date", today), "raw_text": raw_text}
    except Exception as e:
        print(f"Extraction failed: {e}")
        return _fallback(raw_text)
