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
    html = fetch("https://dju26-design.co.kr/designer")
    
    # Next.js App Router pushes
    matches = re.findall(r'self\.__next_f\.push\(\[1,"(.*)"\]\)', html)
    print(f"Total pushes: {len(matches)}")
    
    combined = "".join(matches).replace('\\"', '"').replace('\\\\', '\\')
    
    # search for "designers":[
    idx = combined.find('"designers":[')
    if idx != -1:
        sub = combined[idx + len('"designers":'):]
        depth = 0
        in_string = False
        escape = False
        end_idx = -1
        for i, char in enumerate(sub):
            if escape:
                escape = False
                continue
            if char == '\\':
                escape = True
                continue
            if char == '"':
                in_string = not in_string
                continue
            if not in_string:
                if char == '[':
                    depth += 1
                elif char == ']':
                    depth -= 1
                    if depth == 0:
                        end_idx = i
                        break
        if end_idx != -1:
            try:
                designers = json.loads(sub[:end_idx + 1])
                print(f"Successfully parsed {len(designers)} designers!")
                with open("scripts/designers_list.json", "w", encoding="utf-8") as f:
                    json.dump(designers, f, ensure_ascii=False, indent=2)
                for d in designers[:5]:
                    print("Designer:", d.get('koreanName'), d.get('englishName'), d.get('email'), d.get('instagram'))
            except Exception as e:
                print("JSON decode error:", e)
        else:
            print("Could not match brackets for designers array")
    else:
        print("Could not find '\"designers\":['")

if __name__ == "__main__":
    main()
