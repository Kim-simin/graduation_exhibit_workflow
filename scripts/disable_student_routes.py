from pathlib import Path
import subprocess
ROOT = Path(__file__).resolve().parents[1]
notice = '''export default function Page() {
  return <main className="p-8"><h1>학생 게시물 서비스 중단</h1><p>학생 작품과 게시물의 제공 및 신규 등록을 중단했습니다. 졸업전시는 전시 홈페이지에서 확인해 주세요.</p><a href="/">졸업전시 둘러보기</a></main>;
}
'''
for app in ['web', 'admin']:
    base = ROOT / app
    for name in ['lib/project.ts']:
        file = base / name
        text = file.read_text(encoding='utf-8')
        text = text.replace('const rawList = (projectsData as unknown as MentoringProject[]) || [];', 'const rawList: MentoringProject[] = []; // Student publications disabled.')
        file.write_text(text, encoding='utf-8')
    file = base/'lib/supabase.ts'
    if file.exists():
        text = file.read_text(encoding='utf-8')
        text = text.replace('\n  return []; // Student publications disabled.\n', '\n')
        text = text.replace('.from("mentoring_projects")\n      .select("*")', '.from("mentoring_projects")\n      .select("*")\n      .eq("source_type", "company")')
        text = text.replace('const parsed = JSON.parse(row.message);', 'const parsed = JSON.parse(row.message);\n          if (parsed.source_type !== "company") continue;')
        guard = '  if (projectData.source_type === "student") return {success:false,error:"학생 게시물 등록이 중단되었습니다."};\n'
        text = text.replace(guard, '')
        start = text.index('export async function insertMentoringProject(')
        pos = text.index('  if (!supabase', start)
        text = text[:pos] + guard + text[pos:]
        for line in ['      .eq("source_type", "company")\n', '          if (parsed.source_type !== "company") continue;\n']:
            while line + line in text: text = text.replace(line + line, line)
        file.write_text(text,encoding='utf-8')
    routebase = base/'app' if app=='web' else base/'app/(public)'
    for rel in ['students/page.tsx','students/[id]/page.tsx','mentoring/projects/new/page.tsx']:
        file=routebase/rel
        if file.exists(): file.write_text(notice,encoding='utf-8')
    if app=='web':
        (routebase/'projects/new/page.tsx').write_text(notice,encoding='utf-8')
    # Retain company detail workflows; student loaders above return no student records.
    detail=routebase/'mentoring/projects/[projectId]/page.tsx'
    original=subprocess.run(['git','-c',f'safe.directory={ROOT.as_posix()}','show','HEAD:'+detail.relative_to(ROOT).as_posix()],cwd=ROOT,capture_output=True,check=True).stdout
    detail.write_bytes(original)

# Legacy admin detail links also become external navigation, never artwork views.
(ROOT/'admin/app/(public)/exhibit/[id]/page.tsx').write_text('''import { redirect, notFound } from 'next/navigation';
import { getInitialExhibitions } from '@/lib/get-exhibitions';
export default function Page({params}: {params:{id:string}}) {
  const item=getInitialExhibitions().find(e=>e.id===params.id||e.id===decodeURIComponent(params.id));
  if(!item)notFound();
  if(item.targetUrl && /^https?:\\/\\//i.test(item.targetUrl))redirect(item.targetUrl);
  return <main className="p-8"><h1>{item.title}</h1><p>전시 홈페이지 링크 확인 중입니다.</p></main>;
}
''',encoding='utf-8')
print('Student routes and loaders disabled.')
