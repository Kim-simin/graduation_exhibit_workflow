import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseExternalSource } from '@/lib/industry/external';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer '))
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key)
        return NextResponse.json({ error: '계정 서비스가 연결되지 않았습니다.' }, { status: 503 });
    const db = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await db.auth.getUser(authorization.slice(7));
    if (authError || !user)
        return NextResponse.json({ error: '로그인 상태를 확인해 주세요.' }, { status: 401 });
    try {
        const text = await request.text();
        if (text.length > 10000)
            return NextResponse.json({ error: '입력 내용이 너무 큽니다.' }, { status: 413 });
        const input = JSON.parse(text);
        const source = parseExternalSource(String(input.url || ''));
        let details: Record<string, unknown> = { title: String(input.title || '').slice(0, 200), description: String(input.description || '').slice(0, 4000) };
        if (source.provider === 'github') {
            const response = await fetch('https://api.github.com/repos/' + encodeURIComponent(source.owner) + '/' + encodeURIComponent(source.repo), { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' }, redirect: 'error', signal: AbortSignal.timeout(8000), next: { revalidate: 300 } });
            if (!response.ok)
                return NextResponse.json({ error: response.status === 403 || response.status === 429 ? 'GitHub 조회 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.' : '공개 GitHub 저장소를 확인할 수 없습니다.' }, { status: response.status === 404 ? 404 : 502 });
            const repo = await response.json();
            if (repo.private)
                return NextResponse.json({ error: '공개 저장소만 연결할 수 있습니다.' }, { status: 400 });
            details = { title: repo.name, description: repo.description || '', language: repo.language, updated_at: repo.updated_at, source_owner: repo.owner?.login, license: repo.license?.spdx_id || null };
        }
        else if (source.provider === 'behance')
            details.embed = source.embed;
        if (!String(details.title).trim())
            return NextResponse.json({ error: '프로젝트 제목을 입력해 주세요.' }, { status: 400 });
        const { data, error } = await db.rpc('sync_external_project', { provider_name: source.provider, source_link: source.url, details });
        if (error)
            return NextResponse.json({ error: ['PGRST202', '42P01'].includes(error.code) ? 'DB 업데이트 적용 후 연결할 수 있습니다.' : '프로젝트를 저장하지 못했습니다.' }, { status: 503 });
        return NextResponse.json({ projectId: data, provider: source.provider });
    }
    catch (error) {
        return NextResponse.json({ error: error instanceof Error && /URL|HTTPS|GitHub|Behance/.test(error.message) ? error.message : '원본 정보를 확인하지 못했습니다. 연결 상태와 URL을 확인해 주세요.' }, { status: 400 });
    }
}
