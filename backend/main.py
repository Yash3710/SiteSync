from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from typing import Dict, Any
from database import get_db, init_db
from seed_data import seed_if_empty
from extraction import extract_from_text
from matching import match_report
from auth import create_access_token, get_current_user

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    init_db()
    with get_db() as conn:
        seed_if_empty(conn)

# --- AUTH ---

@app.post("/auth/worker")
def login_worker(payload: Dict[str, Any] = Body(...), db: sqlite3.Connection = Depends(get_db)):
    code = payload.get("join_code", "")
    cursor = db.cursor()
    cursor.execute("SELECT id, name FROM projects WHERE join_code = ?", (code,))
    project = cursor.fetchone()
    if not project: raise HTTPException(404, "Invalid project code")
    return {"access_token": create_access_token({"role": "worker", "project_id": project["id"]}), "role": "worker", "project_name": project["name"]}

@app.post("/auth/manager")
def login_manager(payload: Dict[str, Any] = Body(...), db: sqlite3.Connection = Depends(get_db)):
    email = payload.get("email", "")
    password = payload.get("password", "")
    cursor = db.cursor()
    cursor.execute("SELECT project_id, password FROM users WHERE email = ? AND role = 'manager'", (email,))
    user = cursor.fetchone()
    if not user: raise HTTPException(404, "Manager account not found")
    if user["password"] and user["password"] != password:
        raise HTTPException(401, "Invalid password")
    return {"access_token": create_access_token({"role": "manager", "project_id": user["project_id"]}), "role": "manager"}

# --- PROTECTED ---

@app.post("/submit")
def submit_report(payload: Dict[str, Any], db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    raw = payload.get("text", "").strip()
    if not raw: raise HTTPException(400, "Text is required")
    pid = user["project_id"]
    
    # Final confirmation step (save to DB)
    if payload.get("confirmed") and payload.get("extracted"):
        extracted = payload["extracted"]
        best = payload.get("match")
        review_status = payload.get("review_status")
        mid = best["schedule_item"]["id"] if best else None
        conf = best["confidence"] if best else None
        
        cursor = db.cursor()
        cursor.execute("INSERT INTO reports (project_id,raw_text,translated_text,extracted_task,extracted_quantity,extracted_location,extracted_date,matched_schedule_id,confidence_score,review_status) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (pid, raw, extracted.get("translated_text"), extracted.get("task"), extracted.get("quantity"), extracted.get("location"), extracted.get("date"), mid, conf, review_status))
        rid = cursor.lastrowid
        if review_status == "auto_applied" and mid:
            cursor.execute("UPDATE schedule_items SET status = 'done' WHERE id = ?", (mid,))
        db.commit()
        return {"report_id": rid, "extracted": extracted, "match": best, "review_status": review_status, "finalized": True}

    # Preview step (AI Extraction & Matching only)
    extracted = extract_from_text(raw)
    cursor = db.cursor()
    cursor.execute("SELECT * FROM schedule_items WHERE project_id = ? AND status != 'done'", (pid,))
    result = match_report(extracted, [dict(r) for r in cursor.fetchall()])
    best = result["best_match"]
    
    return {"is_preview": True, "extracted": extracted, "match": best, "review_status": result["review_status"]}

@app.get("/review-queue")
def get_review_queue(db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    if user["role"] != "manager": raise HTTPException(403, "Not authorized")
    c = db.cursor()
    c.execute("SELECT r.*, s.task_name as planned_task_name, s.location as planned_location FROM reports r LEFT JOIN schedule_items s ON r.matched_schedule_id = s.id WHERE r.project_id = ? AND r.review_status = 'needs_review' ORDER BY r.created_at DESC", (user["project_id"],))
    return [dict(r) for r in c.fetchall()]

@app.post("/confirm-match/{report_id}")
def confirm_match(report_id: int, db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    if user["role"] != "manager": raise HTTPException(403, "Not authorized")
    c = db.cursor()
    c.execute("SELECT matched_schedule_id FROM reports WHERE id = ? AND project_id = ?", (report_id, user["project_id"]))
    row = c.fetchone()
    if not row: raise HTTPException(404, "Report not found")
    c.execute("UPDATE reports SET review_status = 'auto_applied' WHERE id = ?", (report_id,))
    if row["matched_schedule_id"]:
        c.execute("UPDATE schedule_items SET status = 'done' WHERE id = ?", (row["matched_schedule_id"],))
    db.commit()
    return {"status": "success"}

@app.post("/unplanned/{report_id}")
def mark_unplanned(report_id: int, db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    if user["role"] != "manager": raise HTTPException(403, "Not authorized")
    db.cursor().execute("UPDATE reports SET review_status = 'no_match' WHERE id = ? AND project_id = ?", (report_id, user["project_id"]))
    db.commit()
    return {"status": "success"}

@app.get("/audit-trail")
def get_audit_trail(db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    c = db.cursor()
    c.execute("SELECT r.*, s.task_name as planned_task_name FROM reports r LEFT JOIN schedule_items s ON r.matched_schedule_id = s.id WHERE r.project_id = ? ORDER BY r.created_at DESC", (user["project_id"],))
    return [dict(r) for r in c.fetchall()]

@app.get("/dashboard")
def get_dashboard(db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    c, pid = db.cursor(), user["project_id"]
    def cnt(tbl, where): c.execute(f"SELECT COUNT(*) FROM {tbl} WHERE project_id = ? AND {where}", (pid,)); return c.fetchone()[0]
    c.execute("SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC LIMIT 5", (pid,))
    recent = [dict(r) for r in c.fetchall()]
    return {
        "schedule": {"pending": cnt("schedule_items","status='pending'"), "in_progress": cnt("schedule_items","status='in_progress'"), "done": cnt("schedule_items","status='done'"), "flagged": cnt("schedule_items","status='flagged'"), "total": cnt("schedule_items","1=1")},
        "reports": {"auto_applied": cnt("reports","review_status='auto_applied'"), "needs_review": cnt("reports","review_status='needs_review'"), "rejected": cnt("reports","review_status='rejected' OR review_status='no_match'"), "total": cnt("reports","1=1")},
        "recent_reports": recent
    }

@app.get("/institutional-memory")
def get_institutional_memory(db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    c = db.cursor()
    c.execute("SELECT task_type, COUNT(*) as task_count, AVG(planned_duration_days) as avg_planned, AVG(actual_duration_days) as avg_actual FROM task_history WHERE project_id = ? GROUP BY task_type", (user["project_id"],))
    return [{"task_type": r["task_type"], "task_count": r["task_count"], "avg_planned": round(r["avg_planned"], 1), "avg_actual": round(r["avg_actual"], 1), "avg_delay": round(r["avg_actual"] - r["avg_planned"], 1)} for r in c.fetchall()]

@app.get("/activities")
def get_activities(db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    c = db.cursor()
    c.execute("SELECT * FROM schedule_items WHERE project_id = ? ORDER BY planned_start", (user["project_id"],))
    return [dict(r) for r in c.fetchall()]

@app.post("/schedule")
def add_schedule_item(payload: Dict[str, Any], db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    if user["role"] != "manager":
        raise HTTPException(403, "Not authorized")
    c = db.cursor()
    c.execute("""
        INSERT INTO schedule_items (project_id, task_name, discipline, location, planned_start, planned_end, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    """, (
        user["project_id"], 
        payload.get("task_name", "Untitled Task"), 
        payload.get("discipline", "General"), 
        payload.get("location", ""), 
        payload.get("planned_start", ""), 
        payload.get("planned_end", "")
    ))
    db.commit()
    return {"status": "success", "id": c.lastrowid}
