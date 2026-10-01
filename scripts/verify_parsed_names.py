import json

with open('all_46_parsed_preview.json', 'r', encoding='utf-8') as f:
    parsed = json.load(f)

with open('swu_tracks_overview.json', 'r', encoding='utf-8') as f:
    overview = json.load(f)

# build map from href to overview card text
overview_map = {}
for track_key, track_data in overview.items():
    for p in track_data['projects']:
        pid = int(p['href'].split('/')[-1])
        overview_map[pid] = p['text']

for item in parsed:
    pid = item['id']
    s_name = item['student_name']
    o_text = overview_map.get(pid, '')
    title = item['title']
    desc = item['desc_preview']
    if not s_name:
        print(f"[MISSING NAME] PID {pid}: Title='{title}' | Overview='{o_text}'")
    else:
        # print first 10
        if pid <= 10 or pid in [31, 41, 46]:
            print(f"PID {pid}: [{item['department']}] '{title}' by '{s_name}'")

print("\nTotal parsed count:", len(parsed))
