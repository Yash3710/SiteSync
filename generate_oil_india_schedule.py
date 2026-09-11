import pandas as pd
from datetime import date, timedelta

# Create realistic Oil India tasks
data = {
    "Task ID": ["OIL-001", "OIL-002", "OIL-003", "OIL-004", "OIL-005", "OIL-006", "OIL-007", "OIL-008", "OIL-009", "OIL-010"],
    "Task Name": [
        "Site Survey & Clearance", 
        "Rig Mobilization & Assembly", 
        "Drilling Surface Hole", 
        "Casing & Cementing", 
        "Pipeline Trenching", 
        "Pipe Laying and Welding", 
        "NDT & X-Ray Inspection", 
        "Hydrotesting", 
        "Backfilling and Restoration", 
        "Well Commissioning"
    ],
    "Location": [
        "Block Baghjan", 
        "Well Pad 5", 
        "Well Pad 5", 
        "Well Pad 5", 
        "Sector 4 (Pipeline)", 
        "Sector 4 (Pipeline)", 
        "Sector 4 (Pipeline)", 
        "Sector 4 (Pipeline)", 
        "Sector 4 (Pipeline)", 
        "Facility B"
    ],
    "Discipline": [
        "Civil", 
        "Logistics", 
        "Drilling", 
        "Drilling", 
        "Civil", 
        "Mechanical", 
        "QA/QC", 
        "QA/QC", 
        "Civil", 
        "Operations"
    ],
    "Planned Start": [
        "2026-09-01", 
        "2026-09-06", 
        "2026-09-12", 
        "2026-09-16", 
        "2026-09-18", 
        "2026-09-22", 
        "2026-10-01", 
        "2026-10-04", 
        "2026-10-08", 
        "2026-10-12"
    ],
    "Planned Finish": [
        "2026-09-05", 
        "2026-09-11", 
        "2026-09-15", 
        "2026-09-17", 
        "2026-09-21", 
        "2026-09-30", 
        "2026-10-03", 
        "2026-10-07", 
        "2026-10-11", 
        "2026-10-15"
    ]
}

df = pd.DataFrame(data)
filename = "Oil_India_Master_Schedule.xlsx"
df.to_excel(filename, index=False)
print(f"Successfully generated {filename}")
