ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal_calories integer DEFAULT 2200,
  ADD COLUMN IF NOT EXISTS goal_protein integer DEFAULT 160,
  ADD COLUMN IF NOT EXISTS goal_workouts_per_week integer DEFAULT 4;