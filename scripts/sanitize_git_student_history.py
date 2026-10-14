"""Rewrite student JSON/media in reachable branch history without saving content backups.
Run --apply only after committing the current reviewed cleanup. Original blobs are
garbage-collected separately after the remote branches have been updated.
"""
import os, json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def git(*args,input=None,env=None):
    p=subprocess.run(['git','-c',f'safe.directory={ROOT.as_posix()}',*args],cwd=ROOT,input=input,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env)
    if p.returncode: raise RuntimeError(p.stderr.decode('utf-8','replace')[:500])
    return p.stdout
names={'students.json','projects.json','university_queue.json','exhibitions.json','exhibitions_all.json'}
refs=git('for-each-ref','--format=%(refname)','refs/heads','refs/remotes/origin').decode().splitlines()
commits=git('rev-list','--reverse','--topo-order',*refs).decode().splitlines()
blobs={}; media=set(); protected=set(); trees={}
def collect(obj,dest):
    if isinstance(obj,dict):
        for key,value in obj.items():
            if isinstance(value,str) and any(x in key.lower() for x in ['image','thumbnail','poster','video']):
                value=value.replace('\\','/').split('?')[0]
                if '://' not in value:
                    for marker in ['uploads/','captures/']:
                        if marker in value:dest.add(value[value.index(marker):])
            elif isinstance(value,(dict,list)):collect(value,dest)
    elif isinstance(obj,list):
        for value in obj:collect(value,dest)
def scrub(obj):
    if isinstance(obj,dict):
        for key,value in obj.items():
            if key in {'artworks','works','works_sample','students','student_works'} and isinstance(value,list):collect(value,media);obj[key]=[]
            else:scrub(value)
    elif isinstance(obj,list):
        for value in obj:scrub(value)
for commit in commits:
    entries=[]
    for line in git('ls-tree','-rz',commit).split(b'\0'):
        if not line:continue
        meta,file=line.split(b'\t',1);mode,kind,oid=meta.decode().split();name=file.decode('utf8');entries.append((mode,oid,name))
        filename=Path(name).name
        if '/data/' not in '/'+name or filename.split('.bak')[0] not in names:continue
        if (oid,filename) in blobs:continue
        try:value=json.loads(git('cat-file','blob',oid).decode('utf-8-sig'))
        except (ValueError,UnicodeError):continue
        if filename.startswith(('students.json','projects.json')) and isinstance(value,list):
            removed=[v for v in value if filename.startswith('students.json') or v.get('origin','student')=='student'];collect(removed,media);value=[v for v in value if v not in removed]
        else:scrub(value);collect(value,protected)
        blobs[(oid,filename)]=(json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
    trees[commit]=entries
remove=media-protected
print(json.dumps({'commits':len(commits),'refs':len(refs),'json_versions':len(blobs),'student_media_paths':len(remove)}))
if '--apply' not in sys.argv:sys.exit(0)
if git('status','--porcelain').strip():raise RuntimeError('Commit current changes before rewriting')
index=ROOT/'.git/student-purge-index'
env=os.environ.copy();env['GIT_INDEX_FILE']=str(index)
mapping={};hashed={}
for commit in commits:
    git('read-tree',commit,env=env)
    changes=[]
    for mode,oid,name in trees[commit]:
        rel=next((name[name.index(x):] for x in ['uploads/','captures/'] if x in name),None)
        if rel in remove:
            changes.append(('0 '+'0'*40+'\t'+name).encode()+b'\0');continue
        key=(oid,Path(name).name)
        if key in blobs:
            if key not in hashed:hashed[key]=git('hash-object','-w','--stdin',input=blobs[key]).decode().strip()
            changes.append((mode+' '+hashed[key]+'\t'+name).encode()+b'\0')
    if changes:git('update-index','-z','--index-info',input=b''.join(changes),env=env)
    tree=git('write-tree',env=env).decode().strip()
    raw=git('cat-file','commit',commit);headers,message=raw.split(b'\n\n',1)
    parents=[];commitEnv=env.copy()
    for line in headers.decode().splitlines():
        if line.startswith('parent '):parents.extend(['-p',mapping[line[7:]]])
        if line.startswith(('author ','committer ')):
            kind,person=line.split(' ',1);identity,date=person.rsplit('> ',1);name,email=identity.rsplit(' <',1)
            prefix='GIT_'+kind.upper();commitEnv[prefix+'_NAME']=name;commitEnv[prefix+'_EMAIL']=email;commitEnv[prefix+'_DATE']=date
    mapping[commit]=git('commit-tree',tree,*parents,input=message,env=commitEnv).decode().strip()
updates=[]
for ref in refs:
    old=git('rev-parse',ref).decode().strip();updates.append(f'update {ref} {mapping[old]} {old}\n')
git('update-ref','--stdin',input=''.join(updates).encode())
git('reset','--mixed','HEAD')
if index.exists():index.unlink()
print('History rewritten. Review working tree before remote push; no backup refs created.')
