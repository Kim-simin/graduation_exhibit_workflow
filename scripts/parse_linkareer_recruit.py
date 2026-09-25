import json
import re
import sys

def parse_linkareer_file():
    filepath = r"C:\Users\USER\.gemini\antigravity\brain\4ef68056-b3d6-40cd-a517-78ded487fedb\.system_generated\steps\2234\content.md"
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)</script>', html)
    if not match:
        print("No __NEXT_DATA__ found")
        return

    data = json.loads(match.group(1))
    page_props = data.get("props", {}).get("pageProps", {})
    apollo_state = page_props.get("__APOLLO_STATE__") or page_props.get("initialApolloState", {})
    print(f"Total keys in apollo state: {len(apollo_state)}")

    activities = []
    for k, v in apollo_state.items():
        if k.startswith("Activity:") and isinstance(v, dict):
            title = v.get("title", "")
            org = v.get("organizationName", "")
            close_at = v.get("recruitCloseAt")
            act_id = v.get("id")
            activities.append({
                "id": act_id,
                "organization": org,
                "title": title,
                "close_at": close_at,
                "raw": v
            })

    print(f"Found {len(activities)} activities:")
    for a in activities:
        print(f"[{a['organization']}] {a['title']} (ID: {a['id']}, Close: {a['close_at']})")

if __name__ == "__main__":
    parse_linkareer_file()
