import requests

# 1. Login as worker
res = requests.post("http://127.0.0.1:8000/auth/worker", json={"join_code": "SIH2026"})
token = res.json().get("access_token")
print("Token:", token)

# 2. Submit report
res2 = requests.post(
    "http://127.0.0.1:8000/submit",
    json={"text": "Finished pouring concrete in zone C"},
    headers={"Authorization": f"Bearer {token}"}
)
print("Submit Status:", res2.status_code)
print("Submit Response:", res2.text)
