from backend.matching import match_report

extracted = {'task': 'Complete foundation work', 'location': 'Zone A', 'date': '2026-09-12'}
dummy = [{"id": 1, "task_name": "Foundation pour Zone A", "discipline": "Civil", "location": "Zone A", "planned_start": "2026-09-01", "planned_end": "2026-09-05"}]

res = match_report(extracted, dummy)
print(res)

extracted2 = {'task': 'Foundation construction', 'location': 'Zone A', 'date': '2026-09-12'}
res2 = match_report(extracted2, dummy)
print(res2)
