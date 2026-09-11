import sqlite3

DB_FILE = "sih.db"

def get_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, join_code TEXT UNIQUE NOT NULL)')
    c.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password TEXT, role TEXT NOT NULL, project_id INTEGER REFERENCES projects(id))')
    c.execute('CREATE TABLE IF NOT EXISTS schedule_items (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id), task_name TEXT NOT NULL, discipline TEXT, location TEXT, planned_start TEXT, planned_end TEXT, status TEXT DEFAULT "pending")')
    c.execute('CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id), raw_text TEXT NOT NULL, translated_text TEXT, extracted_task TEXT, extracted_quantity TEXT, extracted_location TEXT, extracted_date TEXT, matched_schedule_id INTEGER REFERENCES schedule_items(id), confidence_score REAL, review_status TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
    c.execute('CREATE TABLE IF NOT EXISTS task_history (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id), task_type TEXT, planned_duration_days INTEGER, actual_duration_days INTEGER, delay_reason TEXT)')
    # Indexes for query performance
    c.execute('CREATE INDEX IF NOT EXISTS idx_schedule_project_status ON schedule_items(project_id, status)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_reports_project_status ON reports(project_id, review_status)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC)')
    conn.commit()
    conn.close()
