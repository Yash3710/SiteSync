import sqlite3

def run():
    conn = sqlite3.connect("backend/sih.db")
    try:
        conn.execute("ALTER TABLE reports ADD COLUMN translated_text TEXT")
        print("Column translated_text added.")
    except sqlite3.OperationalError as e:
        print(f"Error (maybe column exists?): {e}")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    run()
