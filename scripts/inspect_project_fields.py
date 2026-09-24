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
    print(f"Total projects: {len(projects)}")
    
    # Analyze project categories and fields
    categories = {}
    sample_covers = []
    
    for p in projects:
        cat = p.get('category', 'UNKNOWN')
        categories[cat] = categories.get(cat, 0) + 1
        cover = p.get('coverImage')
        designers = p.get('designers', [])
        d_names = [d.get('koreanName') or d.get('englishName') for d in designers if isinstance(d, dict)]
        review = p.get('reviewDetails')
        
        sample_covers.append({
            "name": p.get('name'),
            "category": cat,
            "designers": d_names,
            "cover": cover,
            "review": review,
            "slug": p.get('slug', {}).get('current')
        })

    print("Categories distribution:", categories)
    print("\nSample 3 projects:")
    for s in sample_covers[:3]:
        print(json.dumps(s, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
