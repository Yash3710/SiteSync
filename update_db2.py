import sqlite3

def run():
    conn = sqlite3.connect("backend/sih.db")
    try:
        conn.execute("ALTER TABLE users ADD COLUMN password TEXT")
        print("Column password added.")
    except sqlite3.OperationalError as e:
        print(f"Error (maybe column exists?): {e}")
    
    # Set default password for manager
    conn.execute("UPDATE users SET password = 'password123' WHERE email = 'manager@site.com'")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    run()
