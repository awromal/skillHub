ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS user_id uuid;

DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;

CREATE POLICY "Users view own applications" ON public.applications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);