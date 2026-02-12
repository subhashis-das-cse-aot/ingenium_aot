/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "sql", "backups");
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const TABLES = [
  {
    name: "cms_years",
    columns: ["id", "year", "status", "created_at", "updated_at", "archived_at"],
    jsonColumns: new Set(),
    orderBy: "year ASC",
  },
  {
    name: "cms_section_settings",
    columns: ["id", "year", "section_key", "display_name", "is_hidden", "created_at", "updated_at"],
    jsonColumns: new Set(),
    orderBy: "year ASC, section_key ASC",
  },
  {
    name: "cms_articles",
    columns: [
      "id",
      "year",
      "section",
      "title",
      "excerpt",
      "date",
      "read_time",
      "author_name",
      "author_role",
      "paragraphs",
      "images",
      "created_at",
      "updated_at",
    ],
    jsonColumns: new Set(["paragraphs", "images"]),
    orderBy: "year ASC, section ASC, id ASC",
  },
  {
    name: "cms_gallery_items",
    columns: [
      "id",
      "year",
      "kind",
      "title",
      "description",
      "image_id",
      "photographer_name",
      "photographer_dept",
      "photographer_year",
      "rank",
      "folder_context",
      "created_at",
      "updated_at",
    ],
    jsonColumns: new Set(),
    orderBy: "year ASC, kind ASC, id ASC",
  },
  {
    name: "cms_projects",
    columns: [
      "id",
      "year",
      "title",
      "excerpt",
      "category",
      "team_name",
      "pdf_link",
      "problem_statement",
      "files",
      "tech_stack",
      "created_at_text",
      "created_at",
      "updated_at",
    ],
    jsonColumns: new Set(["problem_statement", "files", "tech_stack"]),
    orderBy: "year ASC, id ASC",
  },
  {
    name: "admin_users",
    columns: ["id", "email", "password_hash", "created_at", "updated_at"],
    jsonColumns: new Set(),
    orderBy: "id ASC",
  },
  {
    name: "admin_sessions",
    columns: ["token_hash", "user_id", "expires_at", "created_at"],
    jsonColumns: new Set(),
    orderBy: "created_at ASC",
  },
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function nowStamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

function toSqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function toSqlLiteral(value, isJson) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (isJson) return `${toSqlString(JSON.stringify(value))}::jsonb`;
  return toSqlString(value);
}

function schemaSql() {
  return `
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
`;
}

async function run() {
  if (!DATABASE_URL) {
    throw new Error(
      "Database URL is not set. Provide DATABASE_URL or POSTGRES_URL.",
    );
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const filename = `cms_backup_${nowStamp()}.sql`;
  const outPath = path.join(OUT_DIR, filename);

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const lines = [];
    lines.push("-- CMS backup generated by scripts/export-cms-backup.js");
    lines.push(`-- Generated at: ${new Date().toISOString()}`);
    lines.push("");
    lines.push("BEGIN;");
    lines.push("");
    lines.push(schemaSql());
    lines.push("");
    lines.push("TRUNCATE TABLE admin_sessions, admin_users, cms_projects, cms_gallery_items, cms_articles, cms_section_settings, cms_years RESTART IDENTITY CASCADE;");
    lines.push("");

    for (const table of TABLES) {
      const { rows } = await client.query(
        `SELECT ${table.columns.join(", ")} FROM ${table.name} ORDER BY ${table.orderBy}`,
      );
      if (rows.length === 0) {
        lines.push(`-- ${table.name}: 0 rows`);
        lines.push("");
        continue;
      }

      lines.push(`-- ${table.name}: ${rows.length} rows`);
      for (const row of rows) {
        const values = table.columns.map((col) => toSqlLiteral(row[col], table.jsonColumns.has(col)));
        lines.push(`INSERT INTO ${table.name} (${table.columns.join(", ")}) VALUES (${values.join(", ")});`);
      }
      lines.push("");
    }

    lines.push("SELECT setval(pg_get_serial_sequence('cms_years', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM cms_years;");
    lines.push("SELECT setval(pg_get_serial_sequence('cms_section_settings', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM cms_section_settings;");
    lines.push("SELECT setval(pg_get_serial_sequence('admin_users', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM admin_users;");
    lines.push("");
    lines.push("COMMIT;");
    lines.push("");

    fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
    console.log(outPath);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
