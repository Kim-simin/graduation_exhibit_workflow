import json
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
    sub = content[idx + len('"projects":'):]
    
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

    projects = json.loads(sub[:end_idx + 1])
    p0 = projects[0]
    print("Project 0 keys:", list(p0.keys()))
    print("Name:", p0.get("name"))
    print("Slug:", p0.get("slug"))
    print("Category:", p0.get("category"))
    print("DetailImages count:", len(p0.get("detailImages", [])))
    print("ReviewDetails:", p0.get("reviewDetails"))
    if p0.get("detailImages"):
        print("DetailImage 0:", p0.get("detailImages")[0])

if __name__ == "__main__":
    main()
