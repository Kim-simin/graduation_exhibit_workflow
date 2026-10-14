import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
files=0
for base in ['data','admin/data','web/data','my-exhibit-platform/data']:
    for file in (ROOT/base).rglob('*.json'):
        if file.name not in {'students.json','projects.json','university_queue.json','exhibitions.json','exhibitions_all.json'}: continue
        value=json.loads(file.read_text(encoding='utf-8-sig')); files+=1
        if file.name=='students.json': assert value==[], str(file)
        if file.name=='projects.json': assert not any(x.get('origin','student')=='student' for x in value),str(file)
        def check(obj):
            if isinstance(obj,dict):
                for key,child in obj.items():
                    if key in {'artworks','works','works_sample','students','student_works'} and isinstance(child,list): assert not child,str(file)
                    check(child)
            elif isinstance(obj,list):
                for child in obj: check(child)
        check(value)
published=json.loads((ROOT/'web/data/published/exhibitions.json').read_text(encoding='utf-8'))
valid=sum(str(x.get('targetUrl','')).startswith(('https://','http://')) for x in published)
poster=(ROOT/'web/components/archive/PosterCard.tsx').read_text(encoding='utf-8')
assert 'href={exhibitionLink(item.targetUrl)}' in poster
assert "href={'/exhibit/'" not in poster
backups=sorted((ROOT/'.private-removal-backups').glob('*/report.json'))
assert not backups, 'Removal backups must remain purged'
print(json.dumps({'validated_json_files':files,'exhibitions':len(published),'external_links':valid,'missing_links':len(published)-valid,'private_backups':0}))
