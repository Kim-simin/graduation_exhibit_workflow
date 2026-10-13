import { supabase } from '@/lib/supabase/client';
import type { IndustryProfile, IndustryReview, Recommendation } from './types';
export const SCHEMA_MESSAGE = '새 계정·도전 기능은 DB 업데이트 적용 후 이용할 수 있습니다.';
export function industryClient() { if (!supabase)
    throw new Error('계정 서비스가 연결되지 않았습니다.'); return supabase; }
export function readableError(error: unknown) {
    const value = error as {
        code?: string;
        message?: string;
    };
    if (['PGRST202', 'PGRST205', '42P01', '42703'].includes(value?.code || ''))
        return SCHEMA_MESSAGE;
    const message = value?.message || '';
    if (/Verified mentor|Admin required|Not the author|owner required|Assigned review|required role|permission denied/i.test(message))
        return '이 작업을 수행할 권한이 없습니다. 계정과 검증 상태를 확인해 주세요.';
    if (/Login required/.test(message))
        return '로그인이 필요합니다.';
    if (/Student profile/.test(message))
        return '내정보에서 학생 프로필을 먼저 저장해 주세요.';
    if (/Evidence required|Result and evidence/.test(message))
        return '결과물과 검증 자료를 먼저 등록해 주세요.';
    if (/Pending recommendation|Author and approved/.test(message))
        return '검토 상태가 변경되었습니다. 화면을 새로고침해 주세요.';
    return '처리하지 못했습니다. 입력 내용과 연결 상태를 확인한 뒤 다시 시도해 주세요.';
}
export async function industryReady() { const { data, error } = await industryClient().rpc('industry_api_version'); return !error && data === 1; }
export async function callIndustry<T = unknown>(name: string, params: Record<string, unknown>) { const { data, error } = await industryClient().rpc(name, params); if (error)
    throw error; return data as T; }
export async function getIndustryProfile(userId: string) {
    const [{ data, error }, { data: role, error: roleError }] = await Promise.all([industryClient().from('platform_profiles').select('*').eq('user_id', userId).maybeSingle(), industryClient().from('platform_role_grants').select('role,verified_at').eq('user_id', userId).maybeSingle()]);
    if (error)
        throw error;
    if (roleError)
        throw roleError;
    return { profile: data as IndustryProfile | null, role: role?.role as string | undefined };
}
export async function getRecommendations(ownId?: string) {
    let query = industryClient().from('mentor_recommendations').select('*').order('updated_at', { ascending: false }).limit(100);
    query = ownId ? query.eq('author_id', ownId) : query.eq('status', 'published');
    const { data, error } = await query;
    if (error)
        throw error;
    const list = (data || []) as Recommendation[];
    const ids = Array.from(new Set(list.map(r => r.author_id)));
    if (ids.length) {
        const { data: profiles } = await industryClient().from('platform_profiles').select('*').in('user_id', ids);
        list.forEach(r => r.profile = profiles?.find(p => p.user_id === r.author_id));
    }
    return list;
}
export async function getRecommendation(id: string) {
    const { data, error } = await industryClient().from('mentor_recommendations').select('*').eq('id', id).maybeSingle();
    if (error)
        throw error;
    if (!data)
        return null;
    const rec = data as Recommendation;
    const [steps, resources, profile] = await Promise.all([industryClient().from('recommendation_steps').select('*').eq('recommendation_id', id).order('position'), industryClient().from('recommendation_resources').select('reason,usage,project_resources(*)').eq('recommendation_id', id), industryClient().from('platform_profiles').select('*').eq('user_id', rec.author_id).maybeSingle()]);
    if (steps.error)
        throw steps.error;
    if (resources.error)
        throw resources.error;
    rec.steps = steps.data || [];
    rec.profile = profile.data || undefined;
    rec.resources = (resources.data || []).map(row => ({ ...row.project_resources as unknown as import('./types').ProjectResource, reason: row.reason, usage: row.usage }));
    return rec;
}
export async function getPublicReviews() {
    const { data, error } = await industryClient().from('industry_reviews').select('*').eq('is_public', true).order('reviewed_at', { ascending: false }).limit(8);
    if (error)
        throw error;
    const list = (data || []) as IndustryReview[];
    if (list.length) {
        const [{ data: profiles }, { data: projects }] = await Promise.all([industryClient().from('platform_profiles').select('*').in('user_id', Array.from(new Set(list.map(r => r.reviewer_id)))), industryClient().from('mentoring_projects').select('id,title').in('id', list.map(r => r.project_id))]);
        list.forEach(r => { r.profile = profiles?.find(p => p.user_id === r.reviewer_id); r.project_title = projects?.find(p => p.id === r.project_id)?.title; });
    }
    return list;
}
