
CREATE TABLE public.body_weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weight_kg numeric NOT NULL,
  logged_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.body_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight logs" ON public.body_weight_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs" ON public.body_weight_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs" ON public.body_weight_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs" ON public.body_weight_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
