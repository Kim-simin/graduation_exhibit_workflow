'use client';
import { useEffect, useState } from 'react';
import { industryClient, readableError } from '@/lib/industry/client';
import { adaptSupabaseProject } from '@/lib/project';
import { ArchiveProject } from '@/lib/archive-projects';
export function useOwnedProjects(id?: string) {
    const [projects, setProjects] = useState<ArchiveProject[]>([]), [error, setError] = useState('');
    useEffect(() => { let active = true; if (!id) {
        setProjects([]);
        return;
    } industryClient().from('mentoring_projects').select('*').eq('owner_id', id).order('updated_at', { ascending: false }).then(({ data, error }) => { if (!active)
        return; if (error)
        setError(readableError(error));
    else {
        setProjects((data || []).map(r => ({ ...adaptSupabaseProject(r), thumbnail: r.image_url || '', ownerId: r.owner_id, visibility: r.visibility, projectOrigin: r.project_origin })));
        setError('');
    } }); return () => { active = false; }; }, [id]);
    return { projects, error };
}
