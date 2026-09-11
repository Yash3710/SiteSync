def seed_if_empty(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM projects")
    if cursor.fetchone()[0] > 0:
        return
        
    print("Seeding database with default project and data...")
    
    # Create the default project
    cursor.execute("INSERT INTO projects (name, join_code) VALUES (?, ?)", ("Oil India Pipeline", "SIH2026"))
    project_id = cursor.lastrowid
    
    # Create a default manager
    cursor.execute("INSERT INTO users (email, role, project_id) VALUES (?, ?, ?)", ("manager@site.com", "manager", project_id))
    
    schedule_items = [
        # Piping - Zone A
        (project_id, "Erect Line 24-A1", "piping", "Zone A", "2026-09-01", "2026-09-04"),
        (project_id, "Weld Line 24-A1 joints", "piping", "Zone A", "2026-09-05", "2026-09-07"),
        (project_id, "Hydrotest Line 24-A1", "piping", "Zone A", "2026-09-08", "2026-09-09"),
        
        # Civil - Zone A
        (project_id, "Foundation pour Zone A", "civil", "Zone A", "2026-09-01", "2026-09-05"),
        (project_id, "Curing foundation Zone A", "civil", "Zone A", "2026-09-06", "2026-09-10"),
        
        # Civil - Zone B
        (project_id, "Trench excavation Zone B", "civil", "Zone B", "2026-09-01", "2026-09-03"),
        (project_id, "Backfill trench Zone B", "civil", "Zone B", "2026-09-08", "2026-09-10"),
        (project_id, "Lay geotextile Zone B", "civil", "Zone B", "2026-09-04", "2026-09-05"),
        
        # Electrical - Site C
        (project_id, "Cable tray installation Building 3", "electrical", "Site C", "2026-09-02", "2026-09-05"),
        (project_id, "Pull power cables Building 3", "electrical", "Site C", "2026-09-06", "2026-09-10"),
        (project_id, "Terminations Building 3", "electrical", "Site C", "2026-09-11", "2026-09-14"),
        
        # Piping - Site C
        (project_id, "Valve installation Site C", "piping", "Site C", "2026-09-03", "2026-09-06"),
        (project_id, "Flange tightening Site C", "piping", "Site C", "2026-09-07", "2026-09-08"),
        
        # Electrical - Site D
        (project_id, "Install transformer Site D", "electrical", "Site D", "2026-09-05", "2026-09-07"),
        (project_id, "Grounding grid Site D", "electrical", "Site D", "2026-09-01", "2026-09-04"),
        
        # Piping - Site D
        (project_id, "Pump alignment Site D", "piping", "Site D", "2026-09-08", "2026-09-09"),
        (project_id, "Connect suction lines Site D", "piping", "Site D", "2026-09-10", "2026-09-12"),
        
        # Additional
        (project_id, "Erect scaffolding Zone B", "civil", "Zone B", "2026-09-01", "2026-09-02"),
        (project_id, "Paint structural steel Zone A", "civil", "Zone A", "2026-09-10", "2026-09-14"),
        (project_id, "Install junction boxes Site C", "electrical", "Site C", "2026-09-04", "2026-09-06"),
        (project_id, "Instrument loop check Site C", "electrical", "Site C", "2026-09-12", "2026-09-14"),
        (project_id, "Bolt tensioning Line 24-A1", "piping", "Zone A", "2026-09-08", "2026-09-09"),
        (project_id, "Insulate chilled water pipes Site D", "piping", "Site D", "2026-09-11", "2026-09-14"),
        (project_id, "Pave access road Zone B", "civil", "Zone B", "2026-09-11", "2026-09-14"),
        (project_id, "Erect lighting poles Site D", "electrical", "Site D", "2026-09-09", "2026-09-11")
    ]
    
    cursor.executemany('''
        INSERT INTO schedule_items (project_id, task_name, discipline, location, planned_start, planned_end)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', schedule_items)
    
    task_history = [
        (project_id, "piping", 4, 5, "Material delay at warehouse"),
        (project_id, "civil", 3, 3, None),
        (project_id, "electrical", 5, 7, "Rain delayed cable pulling"),
        (project_id, "piping", 2, 2, None),
        (project_id, "civil", 6, 8, "Design change on foundation"),
        (project_id, "electrical", 3, 3, None)
    ]
    
    cursor.executemany('''
        INSERT INTO task_history (project_id, task_type, planned_duration_days, actual_duration_days, delay_reason)
        VALUES (?, ?, ?, ?, ?)
    ''', task_history)
    
    conn.commit()
