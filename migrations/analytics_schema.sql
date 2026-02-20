// Analytics Tracking Schema for Balboa Media OS
// Run this SQL in Supabase SQL Editor

-- ============================================
-- KPI METRICS TABLES
-- ============================================

-- Weekly keyword rankings tracking
CREATE TABLE IF NOT EXISTS keyword_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  article_url TEXT,
  target_page VARCHAR(50) NOT NULL,
  position INTEGER,
  previous_position INTEGER,
  change INTEGER GENERATED ALWAYS AS (position - previous_position) STORED,
  search_volume INTEGER,
  checked_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly traffic & subscriber metrics
CREATE TABLE IF NOT EXISTS newsletter_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  publication_id VARCHAR(50) NOT NULL REFERENCES publications(id),
  publication_name VARCHAR(100) NOT NULL,
  organic_traffic_7d INTEGER DEFAULT 0,
  new_subscribers INTEGER DEFAULT 0,
  total_subscribers INTEGER DEFAULT 0,
  traffic_source_organic INTEGER DEFAULT 0,
  traffic_source_social INTEGER DEFAULT 0,
  traffic_source_direct INTEGER DEFAULT 0,
  traffic_source_referral INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly backlink & authority tracking
CREATE TABLE IF NOT EXISTS seo_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  referring_domains INTEGER DEFAULT 0,
  domain_authority DECIMAL(5,2),
  pages_10plus_rd INTEGER DEFAULT 0,
  dfy_campaigns_run INTEGER DEFAULT 0,
  total_backlinks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue tracking (manual entry for now)
CREATE TABLE IF NOT EXISTS revenue_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  sponsor_revenue DECIMAL(10,2) DEFAULT 0,
  affiliate_revenue DECIMAL(10,2) DEFAULT 0,
  other_revenue DECIMAL(10,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) GENERATED ALWAYS AS (sponsor_revenue + affiliate_revenue + other_revenue) STORED,
  sponsor_placements INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article performance tracking
CREATE TABLE IF NOT EXISTS article_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_url TEXT NOT NULL,
  title VARCHAR(255),
  publication_id VARCHAR(50) REFERENCES publications(id),
  keywords TEXT[],
  word_count INTEGER,
  published_at DATE,
  organic_traffic_30d INTEGER DEFAULT 0,
  avg_position DECIMAL(5,2),
  backlinks INTEGER DEFAULT 0,
  referring_domains INTEGER DEFAULT 0,
  last_checked DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_keyword_rankings_checked_at ON keyword_rankings(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_keyword ON keyword_rankings(keyword);
CREATE INDEX IF NOT EXISTS idx_newsletter_metrics_date ON newsletter_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_metrics_pub ON newsletter_metrics(publication_id);
CREATE INDEX IF NOT EXISTS idx_seo_health_month ON seo_health(month DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_month ON revenue_tracking(month DESC);
CREATE INDEX IF NOT EXISTS idx_article_performance_url ON article_performance(article_url);

-- ============================================
-- BUSINESS GOAL TRACKING (Single row table)
-- ============================================

CREATE TABLE IF NOT EXISTS business_goals (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  target_monthly_revenue DECIMAL(10,2) DEFAULT 10000.00,
  target_subscribers INTEGER DEFAULT 10000,
  current_monthly_revenue DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO business_goals (id, target_monthly_revenue, target_subscribers)
VALUES (1, 10000.00, 10000)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_goals ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (authenticated users)
CREATE POLICY "Allow all" ON keyword_rankings FOR ALL USING (true);
CREATE POLICY "Allow all" ON newsletter_metrics FOR ALL USING (true);
CREATE POLICY "Allow all" ON seo_health FOR ALL USING (true);
CREATE POLICY "Allow all" ON revenue_tracking FOR ALL USING (true);
CREATE POLICY "Allow all" ON article_performance FOR ALL USING (true);
CREATE POLICY "Allow all" ON business_goals FOR ALL USING (true);
