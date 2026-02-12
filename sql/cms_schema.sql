CREATE TABLE IF NOT EXISTS cms_years (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('current', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cms_articles (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL REFERENCES cms_years(year) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('utkarshi', 'abohoman', 'prayukti', 'sarvagya')),
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  read_time TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  author_role TEXT NOT NULL DEFAULT '',
  paragraphs JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_articles_year_section ON cms_articles (year, section);
CREATE INDEX IF NOT EXISTS idx_cms_years_status ON cms_years (status);

CREATE TABLE IF NOT EXISTS cms_section_settings (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL REFERENCES cms_years(year) ON DELETE CASCADE,
  section_key TEXT NOT NULL CHECK (section_key IN ('utkarshi', 'abohoman', 'prayukti', 'sarvagya', 'gallery', 'projects')),
  display_name TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (year, section_key)
);

ALTER TABLE cms_section_settings
DROP CONSTRAINT IF EXISTS cms_section_settings_section_key_check;

ALTER TABLE cms_section_settings
ADD CONSTRAINT cms_section_settings_section_key_check
CHECK (section_key IN ('utkarshi', 'abohoman', 'prayukti', 'sarvagya', 'gallery', 'projects'));

CREATE TABLE IF NOT EXISTS cms_gallery_items (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL REFERENCES cms_years(year) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('photograph', 'drawing')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_id TEXT NOT NULL,
  photographer_name TEXT NOT NULL DEFAULT '',
  photographer_dept TEXT NOT NULL DEFAULT '',
  photographer_year TEXT NOT NULL DEFAULT '',
  rank TEXT NOT NULL DEFAULT '',
  folder_context TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_projects (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL REFERENCES cms_years(year) ON DELETE CASCADE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  team_name TEXT NOT NULL DEFAULT '',
  pdf_link TEXT NOT NULL DEFAULT '',
  problem_statement JSONB NOT NULL DEFAULT '{}'::jsonb,
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_project_pdfs (
  project_id TEXT PRIMARY KEY REFERENCES cms_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL DEFAULT 'project.pdf',
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_bytes BYTEA NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_editorial_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  title TEXT NOT NULL DEFAULT 'From the Editor''s Desk',
  author_name TEXT NOT NULL DEFAULT '',
  author_role TEXT NOT NULL DEFAULT '',
  date_text TEXT NOT NULL DEFAULT '',
  content_paragraphs JSONB NOT NULL DEFAULT '[]'::jsonb,
  quote_text TEXT NOT NULL DEFAULT '',
  quote_author TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_team_members (
  year INTEGER NOT NULL REFERENCES cms_years(year) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  year_label TEXT NOT NULL DEFAULT '',
  image_id TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  github_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (year, id)
);

CREATE INDEX IF NOT EXISTS idx_cms_team_members_year ON cms_team_members (year);

INSERT INTO cms_editorial_content (id, title, author_name, author_role, date_text, content_paragraphs, quote_text, quote_author)
VALUES (1, 'From the Editor''s Desk', '', '', '', '[]'::jsonb, '', '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE cms_projects
ADD COLUMN IF NOT EXISTS pdf_link TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
