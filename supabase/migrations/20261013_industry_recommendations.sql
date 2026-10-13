-- Additive migration. Existing IDs and records are retained. No seeds or resets.
BEGIN;

CREATE TABLE IF NOT EXISTS public.mentoring_projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_type text NOT NULL CHECK(source_type IN ('student','company')),
 title text NOT NULL, school text, department text, team_name text, company_name text, summary text, description text NOT NULL,
 project_type text NOT NULL, stage text NOT NULL, progress integer NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
 cooperation text, tech_tags text[] DEFAULT '{}', image_url text, github_url text, service_url text, portfolio_url text,
 start_date date, mentor_field text, problem_definition text, requirements text, support_benefit text,
 contact_person text, contact_email text, contact_phone text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mentor_feedbacks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id text NOT NULL, mentor_id text DEFAULT 'guest-mentor', mentor_name text NOT NULL,
 mentor_role text, mentor_company text, is_verified_mentor boolean DEFAULT false, feedback_type text NOT NULL,
 content text, comment text, student_reply text, is_public boolean DEFAULT true, resolved boolean DEFAULT false,
 created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.mentor_feedbacks ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.mentor_feedbacks ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE public.mentor_feedbacks ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;
ALTER TABLE public.mentoring_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_feedbacks ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO anon,authenticated;
GRANT SELECT ON public.mentoring_projects,public.mentor_feedbacks TO anon,authenticated;
GRANT INSERT ON public.mentoring_projects TO authenticated;
DROP POLICY IF EXISTS industry_base_project_read ON public.mentoring_projects;
CREATE POLICY industry_base_project_read ON public.mentoring_projects FOR SELECT USING(true);
DROP POLICY IF EXISTS industry_base_project_insert ON public.mentoring_projects;
CREATE POLICY industry_base_project_insert ON public.mentoring_projects FOR INSERT TO authenticated WITH CHECK(true);
DROP POLICY IF EXISTS industry_base_feedback_read ON public.mentor_feedbacks;
CREATE POLICY industry_base_feedback_read ON public.mentor_feedbacks FOR SELECT USING(true);

CREATE TABLE IF NOT EXISTS public.platform_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text NOT NULL DEFAULT '',
  requested_role text NOT NULL DEFAULT 'student' CHECK (requested_role IN ('student','mentor','company','professor')),
  expertise text NOT NULL DEFAULT '', affiliation text NOT NULL DEFAULT '', bio text NOT NULL DEFAULT '',
  career_source text NOT NULL DEFAULT '', links jsonb NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.platform_role_grants (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('mentor','company','professor')),
  verified_by uuid NOT NULL REFERENCES auth.users(id), evidence_url text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.platform_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
  SELECT coalesce(auth.jwt()->'app_metadata'->>'platform_role','') = 'admin';
$$;
CREATE OR REPLACE FUNCTION public.platform_has_role(wanted text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM platform_role_grants WHERE user_id=auth.uid() AND role=wanted);
$$;

CREATE TABLE IF NOT EXISTS public.mentor_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL, summary text NOT NULL DEFAULT '', category text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT '입문' CHECK(difficulty IN ('입문','중급','고급')),
  duration text NOT NULL DEFAULT '', image_url text NOT NULL DEFAULT '',
  target_majors text[] NOT NULL DEFAULT '{}', target_roles text[] NOT NULL DEFAULT '{}',
  body jsonb NOT NULL DEFAULT '{}', criteria jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','approved','published','rejected')),
  review_note text, reviewed_by uuid REFERENCES auth.users(id), reviewed_at timestamptz,
  revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.project_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), proposed_by uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL, kind text NOT NULL CHECK(kind IN ('program','model','tool','agent_skill','human_skill','mcp')),
  official_url text NOT NULL CHECK(official_url ~ '^https://'), version text NOT NULL DEFAULT '',
  pricing text NOT NULL DEFAULT '확인 필요', prerequisites text NOT NULL DEFAULT '',
  security_notes text NOT NULL DEFAULT '', verified_date date,
  status text NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed','approved','update_needed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.recommendation_resources (
  recommendation_id uuid NOT NULL REFERENCES mentor_recommendations(id), resource_id uuid NOT NULL REFERENCES project_resources(id),
  reason text NOT NULL DEFAULT '', usage text NOT NULL DEFAULT '', PRIMARY KEY(recommendation_id,resource_id)
);
CREATE TABLE IF NOT EXISTS public.recommendation_steps (
  recommendation_id uuid NOT NULL REFERENCES mentor_recommendations(id), position integer NOT NULL,
  title text NOT NULL, instructions text NOT NULL DEFAULT '', deliverable text NOT NULL DEFAULT '', PRIMARY KEY(recommendation_id,position)
);
CREATE TABLE IF NOT EXISTS public.recommendation_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, recommendation_id uuid NOT NULL REFERENCES mentor_recommendations(id),
  actor_id uuid NOT NULL REFERENCES auth.users(id), action text NOT NULL, snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentoring_projects ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
ALTER TABLE public.mentoring_projects ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
ALTER TABLE public.mentoring_projects ADD COLUMN IF NOT EXISTS project_origin text NOT NULL DEFAULT 'original';
ALTER TABLE public.mentoring_projects ADD COLUMN IF NOT EXISTS recommendation_id uuid REFERENCES mentor_recommendations(id);
ALTER TABLE public.mentoring_projects ADD COLUMN IF NOT EXISTS source_snapshot jsonb NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX IF NOT EXISTS one_recommendation_per_student ON mentoring_projects(owner_id,recommendation_id) WHERE recommendation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.project_workspaces (
  project_id uuid PRIMARY KEY REFERENCES mentoring_projects(id), current_step integer NOT NULL DEFAULT 0 CHECK(current_step>=0),
  tools text NOT NULL DEFAULT '', process text NOT NULL DEFAULT '', problem_solving text NOT NULL DEFAULT '',
  result text NOT NULL DEFAULT '', validation text NOT NULL DEFAULT '', contribution text NOT NULL DEFAULT '', ai_usage text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.portfolio_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES mentoring_projects(id),
  title text NOT NULL, url text NOT NULL CHECK(url ~ '^https://'), notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.project_external_sources (
  project_id uuid PRIMARY KEY REFERENCES mentoring_projects(id), owner_id uuid NOT NULL REFERENCES auth.users(id),
  provider text NOT NULL CHECK(provider IN ('github','behance','personal')), source_url text NOT NULL CHECK(source_url ~ '^https://'),
  metadata jsonb NOT NULL DEFAULT '{}', synced_at timestamptz NOT NULL DEFAULT now(), UNIQUE(owner_id,source_url)
);
CREATE TABLE IF NOT EXISTS public.industry_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL UNIQUE REFERENCES mentoring_projects(id),
  student_id uuid NOT NULL REFERENCES auth.users(id), reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  question text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','reviewed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.industry_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL UNIQUE REFERENCES industry_review_requests(id),
  project_id uuid NOT NULL REFERENCES mentoring_projects(id), reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  criteria text NOT NULL, evidence_basis text NOT NULL, comment text NOT NULL,
  is_public boolean NOT NULL DEFAULT false, reviewed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mentor_feedbacks ADD COLUMN IF NOT EXISTS reviewer_user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.industry_reviews ADD COLUMN IF NOT EXISTS reviewer_snapshot jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.mentor_feedbacks ADD COLUMN IF NOT EXISTS industry_review_id uuid REFERENCES industry_reviews(id);

CREATE OR REPLACE FUNCTION public.platform_can_read_project(project uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM mentoring_projects p WHERE p.id=project AND
 (p.visibility='public' OR p.owner_id=auth.uid() OR platform_is_admin() OR EXISTS
 (SELECT 1 FROM industry_review_requests r WHERE r.project_id=p.id AND r.reviewer_id=auth.uid() AND platform_has_role('mentor'))));
$$;
CREATE OR REPLACE FUNCTION public.platform_owns_project(project uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM mentoring_projects WHERE id=project AND owner_id=auth.uid());
$$;

ALTER TABLE platform_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_role_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_external_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_read ON platform_profiles;
CREATE POLICY profile_read ON platform_profiles FOR SELECT USING(is_public OR user_id=auth.uid() OR platform_is_admin());
DROP POLICY IF EXISTS grant_read ON platform_role_grants;
CREATE POLICY grant_read ON platform_role_grants FOR SELECT USING(user_id=auth.uid() OR platform_is_admin());
DROP POLICY IF EXISTS recommendation_read ON mentor_recommendations;
CREATE POLICY recommendation_read ON mentor_recommendations FOR SELECT USING(status='published' OR author_id=auth.uid() OR platform_is_admin());
DROP POLICY IF EXISTS resource_read ON project_resources;
CREATE POLICY resource_read ON project_resources FOR SELECT USING(status IN ('approved','update_needed') OR proposed_by=auth.uid() OR platform_is_admin());
DROP POLICY IF EXISTS mapping_read ON recommendation_resources;
CREATE POLICY mapping_read ON recommendation_resources FOR SELECT USING(EXISTS(SELECT 1 FROM mentor_recommendations r WHERE r.id=recommendation_id));
DROP POLICY IF EXISTS step_read ON recommendation_steps;
CREATE POLICY step_read ON recommendation_steps FOR SELECT USING(EXISTS(SELECT 1 FROM mentor_recommendations r WHERE r.id=recommendation_id));
DROP POLICY IF EXISTS revision_read ON recommendation_revisions;
CREATE POLICY revision_read ON recommendation_revisions FOR SELECT USING(platform_is_admin() OR EXISTS(SELECT 1 FROM mentor_recommendations r WHERE r.id=recommendation_id AND r.author_id=auth.uid()));
DROP POLICY IF EXISTS workspace_read ON project_workspaces;
CREATE POLICY workspace_read ON project_workspaces FOR SELECT USING(platform_can_read_project(project_id));
DROP POLICY IF EXISTS evidence_read ON portfolio_evidence;
CREATE POLICY evidence_read ON portfolio_evidence FOR SELECT USING(platform_can_read_project(project_id));
DROP POLICY IF EXISTS external_read ON project_external_sources;
CREATE POLICY external_read ON project_external_sources FOR SELECT USING(platform_can_read_project(project_id));
DROP POLICY IF EXISTS request_read ON industry_review_requests;
CREATE POLICY request_read ON industry_review_requests FOR SELECT USING(student_id=auth.uid() OR (reviewer_id=auth.uid() AND platform_has_role('mentor')) OR platform_is_admin());
DROP POLICY IF EXISTS review_read ON industry_reviews;
CREATE POLICY review_read ON industry_reviews FOR SELECT USING((is_public AND EXISTS(SELECT 1 FROM mentoring_projects p WHERE p.id=project_id AND p.visibility='public')) OR platform_owns_project(project_id) OR reviewer_id=auth.uid() OR platform_is_admin());

-- Restrictive policies also constrain pre-existing permissive policies.
DROP POLICY IF EXISTS industry_project_read_guard ON mentoring_projects;
CREATE POLICY industry_project_read_guard ON mentoring_projects AS RESTRICTIVE FOR SELECT USING(platform_can_read_project(id));
DROP POLICY IF EXISTS industry_project_insert_guard ON mentoring_projects;
CREATE POLICY industry_project_insert_guard ON mentoring_projects AS RESTRICTIVE FOR INSERT WITH CHECK(auth.uid() IS NOT NULL AND owner_id=auth.uid() AND recommendation_id IS NULL AND project_origin='original' AND source_snapshot='{}'::jsonb);
DROP POLICY IF EXISTS industry_project_update_guard ON mentoring_projects;
CREATE POLICY industry_project_update_guard ON mentoring_projects AS RESTRICTIVE FOR UPDATE USING(false);
DROP POLICY IF EXISTS industry_project_delete_guard ON mentoring_projects;
CREATE POLICY industry_project_delete_guard ON mentoring_projects AS RESTRICTIVE FOR DELETE USING(false);
DROP POLICY IF EXISTS industry_feedback_read_guard ON mentor_feedbacks;
CREATE POLICY industry_feedback_read_guard ON mentor_feedbacks AS RESTRICTIVE FOR SELECT USING(
 (industry_review_id IS NULL AND is_public) OR EXISTS(SELECT 1 FROM industry_reviews r WHERE r.id=industry_review_id));
DROP POLICY IF EXISTS industry_feedback_insert_guard ON mentor_feedbacks;
CREATE POLICY industry_feedback_insert_guard ON mentor_feedbacks AS RESTRICTIVE FOR INSERT WITH CHECK(false);
DROP POLICY IF EXISTS industry_feedback_update_guard ON mentor_feedbacks;
CREATE POLICY industry_feedback_update_guard ON mentor_feedbacks AS RESTRICTIVE FOR UPDATE USING(false);
DROP POLICY IF EXISTS industry_feedback_delete_guard ON mentor_feedbacks;
CREATE POLICY industry_feedback_delete_guard ON mentor_feedbacks AS RESTRICTIVE FOR DELETE USING(false);

GRANT SELECT ON platform_profiles,platform_role_grants,mentor_recommendations,project_resources,recommendation_resources,recommendation_steps,recommendation_revisions,project_workspaces,portfolio_evidence,project_external_sources,industry_review_requests,industry_reviews TO anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON platform_profiles,platform_role_grants,mentor_recommendations,project_resources,recommendation_resources,recommendation_steps,recommendation_revisions,project_workspaces,portfolio_evidence,project_external_sources,industry_review_requests,industry_reviews FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.save_industry_profile(payload jsonb) RETURNS public.platform_profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE profile platform_profiles; link text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
 IF length(coalesce(payload->>'display_name','')) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Display name required'; END IF;
 FOR link IN SELECT value FROM jsonb_each_text(coalesce(payload->'links','{}')) LOOP
  IF link<>'' AND link !~ '^https://' THEN RAISE EXCEPTION 'HTTPS links required'; END IF;
 END LOOP;
 INSERT INTO platform_profiles(user_id,display_name,requested_role,expertise,affiliation,bio,career_source,links,is_public)
 VALUES(auth.uid(),payload->>'display_name',coalesce(payload->>'requested_role','student'),coalesce(payload->>'expertise',''),coalesce(payload->>'affiliation',''),coalesce(payload->>'bio',''),coalesce(payload->>'career_source',''),coalesce(payload->'links','{}'),coalesce((payload->>'is_public')::boolean,false))
 ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,requested_role=excluded.requested_role,expertise=excluded.expertise,affiliation=excluded.affiliation,bio=excluded.bio,career_source=excluded.career_source,links=excluded.links,is_public=excluded.is_public,updated_at=now() RETURNING * INTO profile;
 RETURN profile;
END; $$;

CREATE OR REPLACE FUNCTION public.verify_industry_role(target_user uuid,wanted_role text,evidence_url text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT platform_is_admin() OR auth.uid() IS NULL THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF evidence_url !~ '^https://' THEN RAISE EXCEPTION 'Verification evidence required'; END IF;
 INSERT INTO platform_role_grants(user_id,role,verified_by,evidence_url) VALUES(target_user,wanted_role,auth.uid(),evidence_url)
 ON CONFLICT(user_id) DO UPDATE SET role=excluded.role,verified_by=auth.uid(),evidence_url=excluded.evidence_url,verified_at=now();
END; $$;

CREATE OR REPLACE FUNCTION public.save_mentor_recommendation(payload jsonb,submit_for_review boolean DEFAULT false) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE rec_id uuid; old mentor_recommendations; resource jsonb; resource_id uuid; step jsonb; pos integer:=0;
BEGIN
 IF NOT platform_has_role('mentor') THEN RAISE EXCEPTION 'Verified mentor required'; END IF;
 IF length(coalesce(payload->>'title','')) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Title required'; END IF;
 IF jsonb_array_length(coalesce(payload->'steps','[]'))>30 OR jsonb_array_length(coalesce(payload->'resources','[]'))>30 THEN RAISE EXCEPTION 'Too many items'; END IF;
 IF submit_for_review AND (length(coalesce(payload->'body'->>'problem',''))<5 OR jsonb_array_length(coalesce(payload->'steps','[]'))=0) THEN RAISE EXCEPTION 'Problem and steps required'; END IF;
 rec_id:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());
 SELECT * INTO old FROM mentor_recommendations WHERE id=rec_id FOR UPDATE;
 IF FOUND AND old.author_id<>auth.uid() THEN RAISE EXCEPTION 'Not the author'; END IF;
 IF old.id IS NOT NULL THEN INSERT INTO recommendation_revisions(recommendation_id,actor_id,action,snapshot) VALUES(rec_id,auth.uid(),'before_edit',to_jsonb(old)); END IF;
 INSERT INTO mentor_recommendations(id,author_id,title,summary,category,difficulty,duration,image_url,target_majors,target_roles,body,criteria,status)
 VALUES(rec_id,auth.uid(),payload->>'title',coalesce(payload->>'summary',''),coalesce(payload->>'category',''),coalesce(payload->>'difficulty','입문'),coalesce(payload->>'duration',''),coalesce(payload->>'image_url',''),ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'target_majors','[]'))),ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'target_roles','[]'))),payload,coalesce(payload->'criteria','[]'),CASE WHEN submit_for_review THEN 'pending' ELSE 'draft' END)
 ON CONFLICT(id) DO UPDATE SET title=excluded.title,summary=excluded.summary,category=excluded.category,difficulty=excluded.difficulty,duration=excluded.duration,image_url=excluded.image_url,target_majors=excluded.target_majors,target_roles=excluded.target_roles,body=excluded.body,criteria=excluded.criteria,status=excluded.status,reviewed_at=NULL,reviewed_by=NULL,review_note=NULL,revision=mentor_recommendations.revision+1,updated_at=now();
 DELETE FROM recommendation_resources WHERE recommendation_id=rec_id;
 DELETE FROM recommendation_steps WHERE recommendation_id=rec_id;
 FOR resource IN SELECT value FROM jsonb_array_elements(coalesce(payload->'resources','[]')) LOOP
  IF length(trim(coalesce(resource->>'name','')))=0 OR coalesce(resource->>'official_url','') !~ '^https://' THEN
   IF submit_for_review THEN RAISE EXCEPTION 'Resource name and HTTPS official URL required'; END IF;
   CONTINUE;
  END IF;
  IF nullif(resource->>'id','') IS NOT NULL THEN
   SELECT id INTO resource_id FROM project_resources WHERE id=(resource->>'id')::uuid AND (status IN ('approved','update_needed') OR proposed_by=auth.uid());
   IF NOT FOUND THEN RAISE EXCEPTION 'Resource unavailable'; END IF;
  ELSE
   INSERT INTO project_resources(proposed_by,name,kind,official_url,version,pricing,prerequisites,security_notes,verified_date)
   VALUES(auth.uid(),resource->>'name',resource->>'kind',resource->>'official_url',coalesce(resource->>'version',''),coalesce(resource->>'pricing','확인 필요'),coalesce(resource->>'prerequisites',''),coalesce(resource->>'security_notes',''),nullif(resource->>'verified_date','')::date) RETURNING id INTO resource_id;
  END IF;
  INSERT INTO recommendation_resources VALUES(rec_id,resource_id,coalesce(resource->>'reason',''),coalesce(resource->>'usage','')) ON CONFLICT DO NOTHING;
 END LOOP;
 FOR step IN SELECT value FROM jsonb_array_elements(coalesce(payload->'steps','[]')) LOOP
  IF submit_for_review AND length(trim(coalesce(step->>'title','')))=0 THEN RAISE EXCEPTION 'Step title required'; END IF;
  INSERT INTO recommendation_steps VALUES(rec_id,pos,step->>'title',coalesce(step->>'instructions',''),coalesce(step->>'deliverable',''));pos:=pos+1;
 END LOOP;
 RETURN rec_id;
END; $$;

CREATE OR REPLACE FUNCTION public.review_mentor_recommendation(rec_id uuid,approve boolean,note text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE rec mentor_recommendations;
BEGIN
 IF NOT platform_is_admin() OR auth.uid() IS NULL THEN RAISE EXCEPTION 'Admin required'; END IF;
 SELECT * INTO rec FROM mentor_recommendations WHERE id=rec_id FOR UPDATE;
 IF NOT FOUND OR rec.status<>'pending' THEN RAISE EXCEPTION 'Pending recommendation required'; END IF;
 IF rec.author_id=auth.uid() THEN RAISE EXCEPTION 'Independent review required'; END IF;
 IF length(trim(coalesce(note,'')))<5 THEN RAISE EXCEPTION 'Review evidence required'; END IF;
 IF approve THEN UPDATE project_resources SET status='approved' WHERE id IN(SELECT resource_id FROM recommendation_resources WHERE recommendation_id=rec_id) AND status='proposed'; END IF;
 INSERT INTO recommendation_revisions(recommendation_id,actor_id,action,snapshot) VALUES(rec_id,auth.uid(),CASE WHEN approve THEN 'approved' ELSE 'rejected' END,to_jsonb(rec)||jsonb_build_object('review_note',note));
 UPDATE mentor_recommendations SET status=CASE WHEN approve THEN 'approved' ELSE 'rejected' END,review_note=note,reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() WHERE id=rec_id;
END; $$;
CREATE OR REPLACE FUNCTION public.publish_mentor_recommendation(rec_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE rec mentor_recommendations;
BEGIN
 IF NOT platform_has_role('mentor') THEN RAISE EXCEPTION 'Verified mentor required'; END IF;
 SELECT * INTO rec FROM mentor_recommendations WHERE id=rec_id FOR UPDATE;
 IF NOT FOUND OR rec.author_id<>auth.uid() OR rec.status<>'approved' THEN RAISE EXCEPTION 'Author and approved content required'; END IF;
 UPDATE mentor_recommendations SET status='published',updated_at=now() WHERE id=rec_id;
 INSERT INTO recommendation_revisions(recommendation_id,actor_id,action,snapshot) VALUES(rec_id,auth.uid(),'published',to_jsonb(rec));
END; $$;

CREATE OR REPLACE FUNCTION public.start_recommended_project(rec_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE rec mentor_recommendations; project_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM platform_profiles WHERE user_id=auth.uid() AND requested_role='student') THEN RAISE EXCEPTION 'Student profile required'; END IF;
 SELECT * INTO rec FROM mentor_recommendations WHERE id=rec_id AND status='published' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Published recommendation required'; END IF;
 INSERT INTO mentoring_projects(owner_id,source_type,title,summary,description,project_type,stage,progress,visibility,project_origin,recommendation_id,source_snapshot,mentor_field,image_url)
 VALUES(auth.uid(),'student',rec.title,rec.summary,coalesce(rec.body->'body'->>'problem',rec.summary),'개인 프로젝트','problem_definition',0,'private','recommended',rec.id,to_jsonb(rec)||jsonb_build_object('steps',(SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY position),'[]') FROM recommendation_steps s WHERE s.recommendation_id=rec.id),'resources',(SELECT coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('usage',m.usage,'reason',m.reason)),'[]') FROM project_resources r JOIN recommendation_resources m ON m.resource_id=r.id WHERE m.recommendation_id=rec.id)),rec.category,rec.image_url)
 ON CONFLICT(owner_id,recommendation_id) WHERE recommendation_id IS NOT NULL DO NOTHING RETURNING id INTO project_id;
 IF project_id IS NULL THEN SELECT id INTO project_id FROM mentoring_projects WHERE owner_id=auth.uid() AND recommendation_id=rec_id; END IF;
 INSERT INTO project_workspaces(project_id) VALUES(project_id) ON CONFLICT DO NOTHING;
 RETURN project_id;
END; $$;

CREATE OR REPLACE FUNCTION public.sync_external_project(provider_name text,source_link text,details jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE project_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
 IF source_link !~ '^https://' OR length(coalesce(details->>'title','')) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'HTTPS source and title required'; END IF;
 IF provider_name NOT IN ('github','behance','personal') THEN RAISE EXCEPTION 'Invalid provider'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text||source_link));
 SELECT e.project_id INTO project_id FROM project_external_sources e WHERE e.owner_id=auth.uid() AND e.source_url=source_link;
 IF project_id IS NULL THEN
  INSERT INTO mentoring_projects(owner_id,source_type,title,summary,description,project_type,stage,progress,visibility,project_origin,portfolio_url,github_url,image_url)
  VALUES(auth.uid(),'student',details->>'title',coalesce(details->>'description',''),coalesce(details->>'description',''),'개인 프로젝트','production',0,'private','external',source_link,CASE WHEN provider_name='github' THEN source_link ELSE NULL END,coalesce(details->>'image_url','')) RETURNING id INTO project_id;
  INSERT INTO project_workspaces(project_id) VALUES(project_id);
 ELSE
  UPDATE mentoring_projects SET title=details->>'title',summary=coalesce(details->>'description',''),updated_at=now() WHERE id=project_id AND owner_id=auth.uid();
 END IF;
 INSERT INTO project_external_sources(project_id,owner_id,provider,source_url,metadata) VALUES(project_id,auth.uid(),provider_name,source_link,details)
 ON CONFLICT ON CONSTRAINT project_external_sources_pkey DO UPDATE SET metadata=excluded.metadata,synced_at=now();
 RETURN project_id;
END; $$;

CREATE OR REPLACE FUNCTION public.save_project_workspace(project uuid,payload jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item jsonb; scope text:=coalesce(payload->>'visibility','private');
BEGIN
 IF NOT platform_owns_project(project) THEN RAISE EXCEPTION 'Project owner required'; END IF;
 IF scope NOT IN ('public','private','limited') THEN RAISE EXCEPTION 'Invalid visibility'; END IF;
 INSERT INTO project_workspaces(project_id,current_step,tools,process,problem_solving,result,validation,contribution,ai_usage)
 VALUES(project,coalesce((payload->>'current_step')::int,0),coalesce(payload->>'tools',''),coalesce(payload->>'process',''),coalesce(payload->>'problem_solving',''),coalesce(payload->>'result',''),coalesce(payload->>'validation',''),coalesce(payload->>'contribution',''),coalesce(payload->>'ai_usage',''))
 ON CONFLICT(project_id) DO UPDATE SET current_step=excluded.current_step,tools=excluded.tools,process=excluded.process,problem_solving=excluded.problem_solving,result=excluded.result,validation=excluded.validation,contribution=excluded.contribution,ai_usage=excluded.ai_usage,updated_at=now();
 IF coalesce(payload->>'stage','production') NOT IN ('problem_definition','solution','planning','production','validation','completed') THEN RAISE EXCEPTION 'Invalid stage'; END IF;
 IF payload->>'stage'='completed' AND (length(coalesce(payload->>'result',''))<5 OR jsonb_array_length(coalesce(payload->'evidence','[]'))=0) THEN RAISE EXCEPTION 'Result and evidence required to complete'; END IF;
 UPDATE mentoring_projects SET visibility=scope,stage=coalesce(payload->>'stage','production'),progress=CASE WHEN payload->>'stage'='completed' THEN 100 ELSE least(99,greatest(0,coalesce((payload->>'progress')::int,0))) END,updated_at=now() WHERE id=project;
 DELETE FROM portfolio_evidence WHERE project_id=project;
 FOR item IN SELECT value FROM jsonb_array_elements(coalesce(payload->'evidence','[]')) LOOP
  INSERT INTO portfolio_evidence(project_id,title,url,notes) VALUES(project,item->>'title',item->>'url',coalesce(item->>'notes',''));
 END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.request_industry_review(project uuid,reviewer uuid,question text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE request_id uuid;
BEGIN
 IF NOT platform_owns_project(project) THEN RAISE EXCEPTION 'Project owner required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM platform_role_grants WHERE user_id=reviewer AND role='mentor') THEN RAISE EXCEPTION 'Verified reviewer required'; END IF;
 IF reviewer=auth.uid() THEN RAISE EXCEPTION 'Independent review required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM portfolio_evidence WHERE project_id=project) THEN RAISE EXCEPTION 'Evidence required'; END IF;
 INSERT INTO industry_review_requests(project_id,student_id,reviewer_id,question) VALUES(project,auth.uid(),reviewer,question)
 ON CONFLICT(project_id) DO UPDATE SET reviewer_id=excluded.reviewer_id,question=excluded.question WHERE industry_review_requests.status='requested' RETURNING id INTO request_id;
 IF request_id IS NULL THEN RAISE EXCEPTION 'Already reviewed'; END IF;
 RETURN request_id;
END; $$;

CREATE OR REPLACE FUNCTION public.submit_industry_review(request uuid,criteria_text text,basis text,feedback text,make_public boolean DEFAULT false) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE req industry_review_requests; review_id uuid; profile platform_profiles;
BEGIN
 IF NOT platform_has_role('mentor') THEN RAISE EXCEPTION 'Verified mentor required'; END IF;
 SELECT * INTO req FROM industry_review_requests WHERE id=request FOR UPDATE;
 IF NOT FOUND OR req.reviewer_id<>auth.uid() OR req.status<>'requested' THEN RAISE EXCEPTION 'Assigned review required'; END IF;
 IF length(trim(coalesce(criteria_text,'')))<3 OR length(trim(coalesce(basis,'')))<5 OR length(trim(coalesce(feedback,'')))<5 THEN RAISE EXCEPTION 'Criteria, evidence and feedback required'; END IF;
 SELECT * INTO profile FROM platform_profiles WHERE user_id=auth.uid();
 INSERT INTO industry_reviews(request_id,project_id,reviewer_id,criteria,evidence_basis,comment,is_public,reviewer_snapshot) VALUES(req.id,req.project_id,auth.uid(),criteria_text,basis,feedback,make_public,jsonb_build_object('display_name',coalesce(nullif(profile.display_name,''),'현직자'),'expertise',profile.expertise,'affiliation',profile.affiliation)) RETURNING id INTO review_id;
 INSERT INTO mentor_feedbacks(project_id,mentor_id,mentor_name,mentor_role,mentor_company,is_verified_mentor,feedback_type,content,comment,is_public,reviewer_user_id,industry_review_id)
 VALUES(req.project_id::text,auth.uid()::text,coalesce(nullif(profile.display_name,''),'현직자'),profile.expertise,profile.affiliation,true,'성과물',feedback,feedback,make_public,auth.uid(),review_id);
 UPDATE industry_review_requests SET status='reviewed' WHERE id=request;
 RETURN review_id;
END; $$;

CREATE OR REPLACE FUNCTION public.mark_resource_update_needed(resource uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT platform_is_admin() THEN RAISE EXCEPTION 'Admin required'; END IF;
 UPDATE project_resources SET status='update_needed' WHERE id=resource;
END; $$;
CREATE OR REPLACE FUNCTION public.industry_api_version() RETURNS integer LANGUAGE sql STABLE AS $$ SELECT 1; $$;

REVOKE ALL ON FUNCTION save_industry_profile(jsonb),verify_industry_role(uuid,text,text),save_mentor_recommendation(jsonb,boolean),review_mentor_recommendation(uuid,boolean,text),publish_mentor_recommendation(uuid),start_recommended_project(uuid),sync_external_project(text,text,jsonb),save_project_workspace(uuid,jsonb),request_industry_review(uuid,uuid,text),submit_industry_review(uuid,text,text,text,boolean),mark_resource_update_needed(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION save_industry_profile(jsonb),verify_industry_role(uuid,text,text),save_mentor_recommendation(jsonb,boolean),review_mentor_recommendation(uuid,boolean,text),publish_mentor_recommendation(uuid),start_recommended_project(uuid),sync_external_project(text,text,jsonb),save_project_workspace(uuid,jsonb),request_industry_review(uuid,uuid,text),submit_industry_review(uuid,text,text,text,boolean),mark_resource_update_needed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION industry_api_version(),platform_is_admin(),platform_has_role(text),platform_can_read_project(uuid),platform_owns_project(uuid) TO anon,authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
