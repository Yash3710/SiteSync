from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from typing import Dict, Any
from database import get_db, init_db
from seed_data import seed_if_empty
from extraction import extract_from_text
from matching import match_report
from auth import create_access_token, get_current_user
from datetime import datetime

def log_task_history(db: sqlite3.Connection, schedule_id: int, project_id: int):
    c = db.cursor()
    c.execute("SELECT discipline, planned_start, planned_end FROM schedule_items WHERE id = ?", (schedule_id,))
    row = c.fetchone()
    if not row or not row["planned_start"] or not row["planned_end"]: return
    try:
        fmt = "%Y-%m-%d"
        p_start = datetime.strptime(row["planned_start"], fmt)
        p_end = datetime.strptime(row["planned_end"], fmt)
        today = datetime.now()
        planned_days = max(1, (p_end - p_start).days + 1)
        actual_days = max(1, (today - p_start).days + 1)
        delay = actual_days - planned_days
        reason = "Finished late" if delay > 0 else None
        c.execute("""
            INSERT INTO task_history (project_id, task_type, planned_duration_days, actual_duration_days, delay_reason)
            VALUES (?, ?, ?, ?, ?)
        """, (project_id, row["discipline"] or "general", planned_days, actual_days, reason))
    except Exception as e:
        print("Error logging task history:", e)

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
    worker_name = payload.get("worker_name", "Unknown Worker")
    cursor = db.cursor()
    cursor.execute("SELECT id, name FROM projects WHERE join_code = ?", (code,))
    project = cursor.fetchone()
    if not project: raise HTTPException(404, "Invalid project code")
    return {"access_token": create_access_token({"role": "worker", "project_id": project["id"], "worker_name": worker_name}), "role": "worker", "project_name": project["name"]}

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
        worker_name = user.get("worker_name", "Unknown Worker")
        cursor.execute("INSERT INTO reports (project_id,worker_name,raw_text,translated_text,extracted_task,extracted_quantity,extracted_location,extracted_date,matched_schedule_id,confidence_score,review_status) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (pid, worker_name, raw, extracted.get("translated_text"), extracted.get("task"), extracted.get("quantity"), extracted.get("location"), extracted.get("date"), mid, conf, review_status))
        rid = cursor.lastrowid
        if review_status == "auto_applied" and mid:
            cursor.execute("UPDATE schedule_items SET status = 'done' WHERE id = ?", (mid,))
            log_task_history(db, mid, pid)
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
        log_task_history(db, row["matched_schedule_id"], user["project_id"])
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

@app.delete("/schedule/{item_id}")
def delete_schedule_item(item_id: int, db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    if user["role"] != "manager":
        raise HTTPException(403, "Not authorized")
    c = db.cursor()
    c.execute("DELETE FROM schedule_items WHERE id = ? AND project_id = ?", (item_id, user["project_id"]))
    db.commit()
    return {"status": "deleted"}

from fastapi import UploadFile, File
import pandas as pd
from io import BytesIO

@app.post("/upload-schedule")
async def upload_schedule(file: UploadFile = File(...), db: sqlite3.Connection = Depends(get_db), user: dict = Depends(get_current_user)):
    if user["role"] != "manager":
        raise HTTPException(403, "Not authorized")
    
    contents = await file.read()
    filename = (file.filename or "").lower()
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(contents))
        else:
            # Default to Excel if .xlsx, .xls, or if the mobile upload drops the extension
            try:
                df = pd.read_excel(BytesIO(contents))
            except Exception:
                raise HTTPException(400, "Could not parse file as Excel or CSV.")
            
        df.columns = [str(c).strip().lower() for c in df.columns]
        
        col_map = {
            'task': 'task_name', 'name': 'task_name', 'task name': 'task_name', 'activity': 'task_name',
            'disc': 'discipline', 'department': 'discipline',
            'loc': 'location', 'zone': 'location',
            'start': 'planned_start', 'planned start': 'planned_start', 'start date': 'planned_start',
            'end': 'planned_end', 'planned end': 'planned_end', 'end date': 'planned_end', 'finish': 'planned_end', 'planned finish': 'planned_end'
        }
        df.rename(columns=col_map, inplace=True)
        
        required = ['task_name', 'planned_start', 'planned_end']
        for req in required:
            if req not in df.columns:
                raise HTTPException(400, f"Missing required column: '{req}'. Found headers: {list(df.columns)}")
                
        c = db.cursor()
        count = 0
        for _, row in df.iterrows():
            task = str(row['task_name'])
            disc = str(row.get('discipline', 'General'))
            loc = str(row.get('location', ''))
            start = str(row['planned_start'])[:10]
            end = str(row['planned_end'])[:10]
            if pd.isna(row['task_name']): continue
            
            c.execute("""
                INSERT INTO schedule_items (project_id, task_name, discipline, location, planned_start, planned_end, status)
                VALUES (?, ?, ?, ?, ?, ?, 'pending')
            """, (user["project_id"], task, disc, loc, start, end))
            count += 1
            
        db.commit()
        return {"status": "success", "inserted": count}
    except Exception as e:
        raise HTTPException(400, f"Error processing file: {str(e)}")
