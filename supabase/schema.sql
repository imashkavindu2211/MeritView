CREATE TABLE public.students_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nic text UNIQUE NOT NULL,
  name text NOT NULL,
  province text NOT NULL,
  district text NOT NULL,
  category text NOT NULL, -- Open or Limited
  iq_marks integer NOT NULL,
  gk_marks integer NOT NULL,
  total_marks integer NOT NULL,
  created_at timestamp DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: In a production environment, you should enable Row Level Security (RLS)
-- and configure proper policies for access.
-- ALTER TABLE public.students_results ENABLE ROW LEVEL SECURITY;
-- For this simple application, we will rely on application-level security.

-- Indexes
CREATE INDEX IF NOT EXISTS students_results_total_marks_idx ON public.students_results (total_marks DESC);
CREATE INDEX IF NOT EXISTS students_results_province_idx ON public.students_results (province);
CREATE INDEX IF NOT EXISTS students_results_district_idx ON public.students_results (district);
CREATE INDEX IF NOT EXISTS students_results_category_idx ON public.students_results (category);
-- Config table for feature toggles
CREATE TABLE IF NOT EXISTS public.system_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed defaults
INSERT INTO public.system_config (key, value) VALUES 
('marks_entry_enabled', 'true'),
('view_rankings_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
