import urllib.request
import re
import json
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode('utf-8', errors='replace')

def main():
    html = fetch("https://dju26-design.co.kr/project")
    
    # Find the big script that contains {"projects":
    matches = re.findall(r'self\.__next_f\.push\(\[1,"(.*)"\]\)', html)
    print(f"Total pushes: {len(matches)}")
    
    target_push = None
    for m in matches:
        if '{"projects":' in m or '\\"projects\\":' in m or 'projects":[' in m:
            target_push = m
            break
            
    if not target_push:
        print("Could not find push with projects directly. Let's inspect scripts with 'projects'")
        for i, m in enumerate(matches):
            if "projects" in m:
                print(f"Push {i} len {len(m)} has 'projects'")
                target_push = m
                break

    if target_push:
        print(f"Found target push! Length: {len(target_push)}")
        # Next.js escapes quotes: \"
        # Unescape target_push string
        # In json: it was self.__next_f.push([1,"..."])
        # We can unescape the JSON string literal
        try:
            # decode json string literal: wrap in quotes and json.loads
            unescaped = json.loads(f'"{target_push}"')
        except Exception as e:
            print(f"json.loads failed: {e}, falling back to manual unescape")
            unescaped = target_push.replace('\\"', '"').replace('\\\\', '\\')
            
        print(f"Unescaped len: {len(unescaped)}")
        print("Preview:", unescaped[:300])
        
        # Look for the JSON substring starting with {"projects": or {"name":
        # Let's find "projects":[
        proj_idx = unescaped.find('"projects":[')
        if proj_idx != -1:
            print(f"Found '\"projects\":[' at index {proj_idx}")
            # Let's write the unescaped content to a file to examine
            with open("scripts/unescaped_projects.txt", "w", encoding="utf-8") as f:
                f.write(unescaped)
            print("Written unescaped_projects.txt")
        else:
            print("Could not find '\"projects\":[' substring")
            with open("scripts/unescaped_push.txt", "w", encoding="utf-8") as f:
                f.write(unescaped)

if __name__ == "__main__":
    main()
