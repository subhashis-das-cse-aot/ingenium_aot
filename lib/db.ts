import { Pool } from "pg";

function resolveDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  const nonPoolingUrl = process.env.POSTGRES_URL_NON_POOLING;

  // Neon pooled URLs can run with an empty search_path in some setups.
  // Prefer non-pooled URL when pooled endpoint is detected.
  if (databaseUrl?.includes("-pooler.") && nonPoolingUrl) {
    return nonPoolingUrl;
  }

  return (
    databaseUrl ??
    nonPoolingUrl ??
    process.env.POSTGRES_URL
  );
}

let poolInstance: Pool | null = null;

function getPool(): Pool {
  if (poolInstance) {
    return poolInstance;
  }

  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "Database connection URL is missing. Set DATABASE_URL or POSTGRES_URL (Vercel Postgres).",
    );
  }

  poolInstance = new Pool({ connectionString });
  return poolInstance;
}

export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const realPool = getPool();
    const value = Reflect.get(realPool, prop, receiver);
    return typeof value === "function" ? value.bind(realPool) : value;
  },
});

let schemaInitialized = false;

async function hasCoreSchema(client: { query: Pool["query"] }) {
  const { rows } = await client.query<{
    cms_years: string | null;
    cms_articles: string | null;
    cms_projects: string | null;
    cms_section_settings: string | null;
    cms_editorial_content: string | null;
    cms_team_members: string | null;
  }>(
    `
      SELECT
        to_regclass('public.cms_years')::text AS cms_years,
        to_regclass('public.cms_articles')::text AS cms_articles,
        to_regclass('public.cms_projects')::text AS cms_projects,
        to_regclass('public.cms_section_settings')::text AS cms_section_settings,
        to_regclass('public.cms_editorial_content')::text AS cms_editorial_content,
        to_regclass('public.cms_team_members')::text AS cms_team_members
    `,
  );

  const row = rows[0];
  return Boolean(
    row?.cms_years &&
      row?.cms_articles &&
      row?.cms_projects &&
      row?.cms_section_settings &&
      row?.cms_editorial_content &&
      row?.cms_team_members,
  );
}

export async function ensureCmsSchema() {
  const client = await pool.connect();
  try {
    if (schemaInitialized && (await hasCoreSchema(client))) {
      return;
    }

    await client.query("BEGIN");
    // Serialize bootstrap across concurrent workers. Transaction-level lock is safer with pooled connections.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('ingenium_cms_schema_v2'))");

    if (schemaInitialized || (await hasCoreSchema(client))) {
      schemaInitialized = true;
      await client.query("COMMIT");
      return;
    }

    await client.query(`
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
    `);

    await client.query(`
      ALTER TABLE cms_section_settings
      DROP CONSTRAINT IF EXISTS cms_section_settings_section_key_check;

      ALTER TABLE cms_section_settings
      ADD CONSTRAINT cms_section_settings_section_key_check
      CHECK (section_key IN ('utkarshi', 'abohoman', 'prayukti', 'sarvagya', 'gallery', 'projects'));
    `);

    await client.query(`
      ALTER TABLE cms_projects
      ADD COLUMN IF NOT EXISTS pdf_link TEXT NOT NULL DEFAULT '';
    `);

    const nowYear = new Date().getFullYear();
    await client.query(
      `
        INSERT INTO cms_years (year, status)
        SELECT $1, 'current'
        WHERE NOT EXISTS (SELECT 1 FROM cms_years);
      `,
      [nowYear],
    );

    await client.query(
      `
        INSERT INTO cms_section_settings (year, section_key, display_name, is_hidden)
        SELECT y.year, s.section_key, INITCAP(s.section_key), FALSE
        FROM cms_years y
        CROSS JOIN (
          VALUES ('utkarshi'), ('abohoman'), ('prayukti'), ('sarvagya'), ('gallery'), ('projects')
        ) AS s(section_key)
        ON CONFLICT (year, section_key) DO NOTHING;
      `,
    );

    await client.query(
      `
        INSERT INTO cms_editorial_content (
          id,
          title,
          author_name,
          author_role,
          date_text,
          content_paragraphs,
          quote_text,
          quote_author
        )
        VALUES (
          1,
          'From the Editor''s Desk',
          '',
          '',
          '',
          '[]'::jsonb,
          '',
          ''
        )
        ON CONFLICT (id) DO NOTHING;
      `,
    );

    schemaInitialized = true;
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors; original error is more relevant.
    }
    throw error;
  } finally {
    client.release();
  }
}
