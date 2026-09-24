import json
import re
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    with open("scripts/unescaped_projects.txt", "r", encoding="utf-8") as f:
        content = f.read()

    idx = content.find('"projects":[')
    print(f"Index: {idx}")
    sub = content[idx + len('"projects":'):]
    
    # We want to extract the JSON array starting with '['
    # Count braces / brackets to find end of array
    start_char = sub[0]
    if start_char != '[':
        print("Does not start with [")
        return

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
        json_str = sub[:end_idx + 1]
        print(f"Extracted json string of length {len(json_str)}")
        try:
            projects = json.loads(json_str)
            print(f"Successfully parsed {len(projects)} projects!")
            for i, p in enumerate(projects[:10]):
                name = p.get('name')
                slug = p.get('slug', {}).get('current')
                author = p.get('author') or p.get('designer') or p.get('student')
                print(f"[{i+1}] Name: {name}, Slug: {slug}")
                print("    Keys:", list(p.keys()))
                if 'designer' in p:
                    print("    Designer:", p['designer'])
                if 'designers' in p:
                    print("    Designers:", p['designers'])
                if 'category' in p:
                    print("    Category:", p['category'])
                if 'thumbnail' in p:
                    print("    Thumbnail:", p['thumbnail'])
                if 'mainImage' in p:
                    print("    MainImage:", p['mainImage'])
                if 'poster' in p:
                    print("    Poster:", p['poster'])
                if 'description' in p:
                    print("    Description:", str(p['description'])[:100])
        except Exception as e:
            print("JSON parse error:", e)
            with open("scripts/failed_projects_json.txt", "w", encoding="utf-8") as f:
                f.write(json_str)
    else:
        print("Could not balance brackets")

if __name__ == "__main__":
    main()
