-- Create enums
CREATE TYPE issue_status AS ENUM ('draft', 'in_progress', 'ready', 'sent');
CREATE TYPE slot_status AS ENUM ('missing', 'draft', 'published');

-- Create publications table
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  send_day_of_week INT NOT NULL,
  send_time_local TIME NOT NULL,
  articles_required_per_issue INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create issues table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL,
  send_datetime_local TIMESTAMPTZ NOT NULL,
  status issue_status DEFAULT 'draft',
  risk_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(publication_id, issue_date)
);

-- Create issue_article_slots table
CREATE TABLE issue_article_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  slot_index INT NOT NULL,
  article_title TEXT,
  article_url TEXT,
  status slot_status DEFAULT 'missing',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create issue_checklists table
CREATE TABLE issue_checklists (
  issue_id UUID PRIMARY KEY REFERENCES issues(id) ON DELETE CASCADE,
  articles_complete BOOLEAN DEFAULT false,
  seo_verified BOOLEAN DEFAULT false,
  internal_links_verified BOOLEAN DEFAULT false,
  formatted BOOLEAN DEFAULT false,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_issues_publication_id ON issues(publication_id);
CREATE INDEX idx_issues_send_datetime ON issues(send_datetime_local);
CREATE INDEX idx_article_slots_issue_id ON issue_article_slots(issue_id);

-- Seed publications
INSERT INTO publications (name, send_day_of_week, send_time_local, articles_required_per_issue, is_active) VALUES
('Zootown Lowdown', 3, '16:00'::TIME, 3, true),
('Missoula Eats & Treats', 5, '10:00'::TIME, 2, true),
('SaveOurDoggy', 2, '10:00'::TIME, 1, true),
('Missoula Business Hub', 4, '10:00'::TIME, 1, true);
