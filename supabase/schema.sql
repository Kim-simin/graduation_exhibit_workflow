-- ==========================================================
-- Supabase Schema: Minimal Privilege (최소 권한 원칙)
-- ==========================================================

-- 1. 테이블 생성 (존재하지 않을 경우)
CREATE TABLE IF NOT EXISTS public.mentor_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    mentor_id TEXT DEFAULT 'guest-mentor',
    mentor_name TEXT NOT NULL,
    mentor_role TEXT,
    mentor_company TEXT,
    is_verified_mentor BOOLEAN DEFAULT true,
    feedback_type TEXT NOT NULL,
    content TEXT,
    comment TEXT,
    student_reply TEXT,
    is_public BOOLEAN DEFAULT true,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_project_id TEXT NOT NULL,
    target_project_id TEXT NOT NULL,
    proposer_type TEXT NOT NULL,
    proposer_name TEXT NOT NULL,
    proposer_email TEXT,
    message TEXT,
    status TEXT DEFAULT '대기 중',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mentoring_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (source_type IN ('student', 'company')),
    title TEXT NOT NULL,
    school TEXT,
    department TEXT,
    team_name TEXT,
    company_name TEXT,
    summary TEXT,
    description TEXT NOT NULL,
    project_type TEXT NOT NULL,
    stage TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    cooperation TEXT,
    tech_tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    github_url TEXT,
    service_url TEXT,
    portfolio_url TEXT,
    start_date DATE,
    mentor_field TEXT,
    problem_definition TEXT,
    requirements TEXT,
    support_benefit TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 컬럼 보완
ALTER TABLE public.mentor_feedbacks ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.mentor_feedbacks ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.mentor_feedbacks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.project_connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. 최소 권한 부여 (SELECT, INSERT만 허용 / UPDATE, DELETE 엄격 금지)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 기존 과도한 권한이 있다면 회수
REVOKE UPDATE, DELETE ON TABLE public.mentor_feedbacks FROM anon;
REVOKE UPDATE, DELETE ON TABLE public.project_connections FROM anon;
REVOKE UPDATE, DELETE ON TABLE public.mentoring_projects FROM anon;

-- 오직 SELECT 와 INSERT 만 허용
GRANT SELECT, INSERT
ON TABLE public.mentor_feedbacks
TO anon, authenticated;

GRANT SELECT, INSERT
ON TABLE public.project_connections
TO anon, authenticated;

GRANT SELECT, INSERT
ON TABLE public.mentoring_projects
TO anon, authenticated;

-- 4. Row Level Security (RLS) 활성화 유지
ALTER TABLE public.mentor_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_projects ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책: SELECT 및 INSERT만 허용 (UPDATE/DELETE 정책 없음)
DROP POLICY IF EXISTS "Allow public read on feedbacks" ON public.mentor_feedbacks;
CREATE POLICY "Allow public read on feedbacks" 
    ON public.mentor_feedbacks FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public insert on feedbacks" ON public.mentor_feedbacks;
CREATE POLICY "Allow public insert on feedbacks" 
    ON public.mentor_feedbacks FOR INSERT 
    WITH CHECK (true);

-- UPDATE 정책 제거 (Auth 도입 전까지 비활성화)
DROP POLICY IF EXISTS "Allow public update reply on feedbacks" ON public.mentor_feedbacks;

DROP POLICY IF EXISTS "Allow public read on connections" ON public.project_connections;
CREATE POLICY "Allow public read on connections" 
    ON public.project_connections FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public insert on connections" ON public.project_connections;
CREATE POLICY "Allow public insert on connections" 
    ON public.project_connections FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on connections" ON public.project_connections;

DROP POLICY IF EXISTS "Allow public read on mentoring_projects" ON public.mentoring_projects;
CREATE POLICY "Allow public read on mentoring_projects" 
    ON public.mentoring_projects FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public insert on mentoring_projects" ON public.mentoring_projects;
CREATE POLICY "Allow public insert on mentoring_projects" 
    ON public.mentoring_projects FOR INSERT 
    WITH CHECK (true);

