import urllib.request
import urllib.parse
import json

def verify_pages():
    with open("data/rfp.json", "r", encoding="utf-8") as f:
        rfp_data = json.load(f)
    rfp_id = rfp_data[0]["id"]
    
    with open("data/professors.json", "r", encoding="utf-8") as f:
        prof_data = json.load(f)
    prof_id = prof_data[0]["id"]
    
    with open("data/students.json", "r", encoding="utf-8") as f:
        student_data = json.load(f)
    student_id = student_data[0]["id"]

    pages = [
        f"http://localhost:3000/rfp/{urllib.parse.quote(rfp_id)}",
        f"http://localhost:3000/professors/{urllib.parse.quote(prof_id)}",
        f"http://localhost:3000/students/{urllib.parse.quote(student_id)}",
        "http://localhost:3000/admin"
    ]
    
    for url in pages:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req) as response:
                status = response.getcode()
                print(f"URL: {url} -> Status: {status} OK")
        except Exception as e:
            print(f"URL: {url} -> FAILED: {e}")

if __name__ == "__main__":
    verify_pages()
