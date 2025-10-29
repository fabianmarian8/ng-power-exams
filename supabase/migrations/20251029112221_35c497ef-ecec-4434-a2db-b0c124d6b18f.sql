-- Create power_outages table
CREATE TABLE IF NOT EXISTS public.power_outages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disco_id TEXT NOT NULL,
  affected_area TEXT NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  estimated_restore_time TIMESTAMPTZ,
  restored_time TIMESTAMPTZ,
  source TEXT NOT NULL,
  source_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create news_items table
CREATE TABLE IF NOT EXISTS public.news_items (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  source TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exam_guides table
CREATE TABLE IF NOT EXISTS public.exam_guides (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  acronym TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  last_checked TIMESTAMPTZ NOT NULL,
  portal_url TEXT,
  quick_links JSONB,
  steps JSONB,
  common_issues JSONB,
  sms_guide JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_power_outages_disco ON public.power_outages(disco_id);
CREATE INDEX IF NOT EXISTS idx_power_outages_start_time ON public.power_outages(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news_items(category);
CREATE INDEX IF NOT EXISTS idx_news_timestamp ON public.news_items(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_exam_guides_status ON public.exam_guides(status);

-- Enable Row Level Security
ALTER TABLE public.power_outages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_guides ENABLE ROW LEVEL SECURITY;

-- Create public read policies (no authentication needed for reading)
CREATE POLICY "Allow public read power_outages" ON public.power_outages FOR SELECT USING (true);
CREATE POLICY "Allow public read news_items" ON public.news_items FOR SELECT USING (true);
CREATE POLICY "Allow public read exam_guides" ON public.exam_guides FOR SELECT USING (true);

-- Enable Realtime for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.power_outages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_guides;