import urllib.request
import json

base_url = "http://localhost:3000"

# 1. Test /api/exhibitions
try:
    with urllib.request.urlopen(f"{base_url}/api/exhibitions") as resp:
        print(f"/api/exhibitions status: {resp.status}")
        data = json.loads(resp.read().decode("utf-8"))
        exhibitions = data.get("exhibitions", [])
        print(f"Total exhibitions: {len(exhibitions)}")
        if exhibitions:
            first_id = exhibitions[0]["id"]
            print(f"First exhibit id: {first_id}")
            import urllib.parse
            encoded_id = urllib.parse.quote(first_id)
            exhibit_url = f"{base_url}/exhibit/{encoded_id}"
            with urllib.request.urlopen(exhibit_url) as ex_resp:
                print(f"/exhibit/[id] status: {ex_resp.status}")
                content = ex_resp.read().decode("utf-8")
                print(f"Page response length: {len(content)} bytes")
                if "고화질" in content:
                    print("Found '고화질' in response HTML!")

except Exception as e:
    print(f"Error: {e}")
