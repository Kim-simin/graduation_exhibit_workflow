"""Remove student publications from active JSON stores; quarantine copies outside public roots."""
import json
import os
import shutil
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
BACKUP = ROOT / '.private-removal-backups' / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
NAMES = {'students.json', 'projects.json', 'university_queue.json', 'exhibitions.json', 'exhibitions_all.json'}
assets = set()
posters = set()
report = []

def media(value, dest):
    if isinstance(value, dict):
        for key, child in value.items():
            if isinstance(child, str) and any(t in key.lower() for t in ['image', 'thumbnail', 'poster', 'video']):
                dest.add(child)
            elif isinstance(child, (dict, list)):
                media(child, dest)
    elif isinstance(value, list):
        for child in value: media(child, dest)

def scrub(value):
    count = 0
    if isinstance(value, dict):
        for key in list(value):
            if key in {'artworks', 'works', 'works_sample', 'students', 'student_works'} and isinstance(value[key], list):
                count += len(value[key]); media(value[key], assets); value[key] = []
            else: count += scrub(value[key])
    elif isinstance(value, list):
        for item in value: count += scrub(item)
    return count

for base in [ROOT / 'data', ROOT / 'admin/data', ROOT / 'web/data', ROOT / 'my-exhibit-platform/data']:
    if not base.exists(): continue
    for file in base.rglob('*.json'):
        if file.name not in NAMES: continue
        raw = file.read_bytes()
        value = json.loads(raw.decode('utf-8-sig'))
        if file.name in {'students.json', 'projects.json'}:
            if not isinstance(value, list): raise ValueError(str(file))
            removed = [x for x in value if file.name == 'students.json' or x.get('origin', 'student') == 'student']
            media(removed, assets)
            clean = [x for x in value if x not in removed]
            count = len(removed)
        else:
            clean = value
            count = scrub(clean)
            media(clean, posters)
        if not count: continue
        backup = BACKUP / file.relative_to(ROOT)
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, backup)
        if file.read_bytes() != raw: raise RuntimeError('Concurrent modification: ' + str(file))
        temp = file.with_suffix('.removal.tmp')
        temp.write_text(json.dumps(clean, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        json.loads(temp.read_text(encoding='utf-8'))
        os.replace(temp, file)
        report.append({'file': str(file.relative_to(ROOT)), 'removed': count})

def relative_asset(value):
    value = value.replace('\\', '/').lstrip('/')
    if value.startswith('public/'): value = value[7:]
    if '://' in value or '..' in value.split('/'): return None
    return value

protected = {relative_asset(x) for x in posters}
for public in [ROOT/'web/public', ROOT/'admin/public', ROOT/'public', ROOT/'my-exhibit-platform/public']:
    for asset in assets:
        rel = relative_asset(asset)
        if not rel or rel in protected: continue
        file = (public / rel).resolve()
        if not file.is_relative_to(public.resolve()) or not file.is_file(): continue
        backup = BACKUP / file.relative_to(ROOT)
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(file), str(backup))
        report.append({'media_removed': str(file.relative_to(ROOT))})
BACKUP.mkdir(parents=True, exist_ok=True)
(BACKUP/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'data_files':sum('file' in r for r in report),'media_files':sum('media_removed' in r for r in report),'report':str(BACKUP/'report.json')}))
