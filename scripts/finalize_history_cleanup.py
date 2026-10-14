"""Reconcile the local files removed by the reviewed history rewrite."""
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[1]
def git(*args):return subprocess.check_output(['git','-c',f'safe.directory={ROOT.as_posix()}',*args],cwd=ROOT)
deleted=0
for name in git('ls-files','--others','--exclude-standard','-z').split(b'\0'):
    if not name:continue
    rel=name.decode('utf8')
    if not any(rel.startswith(p+'/public/') for p in ['web','admin','my-exhibit-platform']):continue
    target=(ROOT/rel).resolve()
    if not target.is_relative_to(ROOT) or not target.is_file():raise RuntimeError('Invalid cleanup target')
    target.unlink();deleted+=1
for name in git('diff','--name-only','-z').split(b'\0'):
    if not name:continue
    rel=name.decode('utf8')
    if '/data/' not in '/'+rel:continue
    (ROOT/rel).write_bytes(git('show','HEAD:'+rel))
print(f'Removed {deleted} additional historical media files from working folders.')
