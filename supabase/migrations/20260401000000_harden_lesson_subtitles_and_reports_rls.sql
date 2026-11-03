-- =============================================================================
-- Migration: Harden RLS policies for lesson_subtitles and content_reports
-- Project: Al-Azhar IT Hub
-- Note: Prepared per Section 19 Rule 4 (review before applying to production).
-- =============================================================================

-- 1. Ensure RLS is enabled on lesson_subtitles
ALTER TABLE IF EXISTS public.lesson_subtitles ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive anon/authenticated write policies if present
DROP POLICY IF EXISTS "Allow public insert on lesson_subtitles" ON public.lesson_subtitles;
DROP POLICY IF EXISTS "Allow public update on lesson_subtitles" ON public.lesson_subtitles;
DROP POLICY IF EXISTS "Allow public delete on lesson_subtitles" ON public.lesson_subtitles;

-- Allow anyone to read published subtitles
DROP POLICY IF EXISTS "Allow public read published lesson_subtitles" ON public.lesson_subtitles;
CREATE POLICY "Allow public read published lesson_subtitles"
  ON public.lesson_subtitles
  FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  ));

-- Restrict INSERT / UPDATE / DELETE on lesson_subtitles strictly to verified admins
DROP POLICY IF EXISTS "Allow admin write on lesson_subtitles" ON public.lesson_subtitles;
CREATE POLICY "Allow admin write on lesson_subtitles"
  ON public.lesson_subtitles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
    )
  );
