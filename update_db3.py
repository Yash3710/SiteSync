import sqlite3

def run():
    conn = sqlite3.connect("backend/sih.db")
    c = conn.cursor()
    try:
        c.execute("ALTER TABLE reports ADD COLUMN worker_name TEXT")
        print("Added worker_name column to reports")
    except sqlite3.OperationalError as e:
        print("Error/Already exists:", e)
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    run()
