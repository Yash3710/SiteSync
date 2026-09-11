from typing import Dict, List, Tuple, Any
from datetime import date
from rapidfuzz import fuzz
from sentence_transformers import SentenceTransformer

_model = None
def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def _semantic_sim(a: str, b: str) -> float:
    if not a or not b: return 0.0
    m = _get_model()
    return max(0.0, min(1.0, m.similarity(m.encode(a, convert_to_tensor=True), m.encode(b, convert_to_tensor=True)).item()))

def _loc_match(ext: str, planned: str) -> float:
    if not ext: return 0.5
    if ext.strip().lower() == planned.strip().lower(): return 1.0
    return fuzz.token_sort_ratio(ext.lower(), planned.lower()) / 100.0

def _date_score(ext_str: str, start_str: str, end_str: str) -> float:
    if not ext_str: return 0.5
    try:
        d, s, e = date.fromisoformat(ext_str), date.fromisoformat(start_str), date.fromisoformat(end_str)
    except ValueError: return 0.5
    if s <= d <= e: return 1.0
    dist = min(abs((s - d).days), abs((d - e).days))
    return 0.75 if dist <= 3 else 0.50 if dist <= 7 else 0.25

def _confidence(ext: Dict, item: Dict) -> Tuple[float, dict]:
    sem = _semantic_sim(ext.get("task") or "", item["task_name"])
    loc = _loc_match(ext.get("location") or "", item["location"])
    dt = _date_score(ext.get("date") or "", item["planned_start"], item["planned_end"])
    total = round(0.50 * sem + 0.25 * loc + 0.25 * dt, 2)
    return total, {"semantic": round(sem, 2), "location": round(loc, 2), "date": round(dt, 2), "total": total}

def match_report(extracted: Dict[str, Any], items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Match extracted report against schedule items. Items should be pre-filtered by project."""
    if not items:
        return {"candidates": [], "best_match": None, "review_status": "no_match"}
    # Pre-filter by location if available
    pool = items
    loc = extracted.get("location")
    if loc:
        filtered = [i for i in items if fuzz.token_sort_ratio(loc.lower(), i["location"].lower()) >= 60]
        if filtered: pool = filtered
    # Score and rank
    scored = sorted([{"schedule_item": i, "confidence": c, "breakdown": b} for i in pool for c, b in [_confidence(extracted, i)]], key=lambda x: x["confidence"], reverse=True)[:3]
    best = scored[0]["confidence"]
    status = "auto_applied" if best >= 0.80 else "needs_review" if best >= 0.50 else "no_match"
    return {"candidates": scored, "best_match": scored[0] if status != "no_match" else None, "review_status": status}
