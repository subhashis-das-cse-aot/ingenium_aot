import {
  blankHomeData,
  type CmsArticle,
  type CmsSection,
  type HomeData,
  type YearSectionKey,
} from "@/lib/cms";
import { ensureCmsSchema, pool } from "@/lib/db";

export type SectionSetting = {
  year: number;
  sectionKey: YearSectionKey;
  displayName: string;
  isHidden: boolean;
};

type DbArticleRow = {
  id: string;
  year: number;
  section: CmsSection;
  title: string;
  excerpt: string;
  date: string;
  read_time: string;
  author_name: string;
  author_role: string;
  paragraphs: string[];
  images: Array<{ id: string; caption?: string; position: number }>;
};

type DbSectionSettingRow = {
  year: number;
  section_key: YearSectionKey;
  display_name: string;
  is_hidden: boolean;
};

type DbGalleryRow = {
  id: string;
  year: number;
  kind: "photograph" | "drawing";
  title: string;
  description: string;
  image_id: string;
  photographer_name: string;
  photographer_dept: string;
  photographer_year: string;
  rank: string;
  folder_context: string;
};

type DbProjectRow = {
  id: string;
  year: number;
  title: string;
  excerpt: string;
  category: string;
  team_name: string;
  pdf_link: string;
  problem_statement: Record<string, unknown>;
  files: Record<string, unknown>;
  tech_stack: string[];
  created_at_text: string;
  has_uploaded_pdf: boolean;
};

type DbEditorialRow = {
  title: string;
  author_name: string;
  author_role: string;
  date_text: string;
  content_paragraphs: string[];
  quote_text: string;
  quote_author: string;
};

type DbTeamMemberRow = {
  year: number;
  id: string;
  name: string;
  role: string;
  department: string;
  year_label: string;
  image_id: string;
  linkedin_url: string;
  github_url: string;
};

export type CmsGalleryItem = {
  id: string;
  year: number;
  kind: "photograph" | "drawing";
  title: string;
  description: string;
  imageId: string;
  photographer: {
    name: string;
    dept: string;
    year: string;
  };
  rank: string;
  folderContext: string;
};

export type CmsProject = {
  id: string;
  year: number;
  title: string;
  excerpt: string;
  category: string;
  department: "projects";
  team: { name: string };
  pdfLink: string;
  problemStatement?: Record<string, unknown>;
  files: Record<string, unknown>;
  techStack: string[];
  createdAt: string;
  hasUploadedPdf: boolean;
};

export type CmsEditorialContent = {
  title: string;
  author: {
    name: string;
    role: string;
  };
  date: string;
  content: string[];
  quote: {
    text: string;
    author: string;
  };
};

export type CmsTeamMember = {
  id: string;
  year: number;
  name: string;
  role: string;
  department: string;
  yearLabel: string;
  imageId: string;
  linkedin: string;
  github: string;
};

function mapDbArticle(row: DbArticleRow): CmsArticle {
  return {
    id: row.id,
    year: row.year,
    section: row.section,
    title: row.title,
    excerpt: row.excerpt,
    department: row.section,
    date: row.date,
    readTime: row.read_time,
    author: {
      name: row.author_name,
      role: row.author_role,
    },
    paragraphs: row.paragraphs ?? [],
    images: row.images ?? [],
  };
}

function mapSectionSetting(row: DbSectionSettingRow): SectionSetting {
  return {
    year: row.year,
    sectionKey: row.section_key,
    displayName: row.display_name,
    isHidden: row.is_hidden,
  };
}

function mapGalleryRow(row: DbGalleryRow): CmsGalleryItem {
  return {
    id: row.id,
    year: row.year,
    kind: row.kind,
    title: row.title,
    description: row.description,
    imageId: row.image_id,
    photographer: {
      name: row.photographer_name,
      dept: row.photographer_dept,
      year: row.photographer_year,
    },
    rank: row.rank,
    folderContext: row.folder_context,
  };
}

function mapProjectRow(row: DbProjectRow): CmsProject {
  return {
    id: row.id,
    year: row.year,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    department: "projects",
    team: { name: row.team_name },
    pdfLink: row.pdf_link ?? "",
    problemStatement:
      row.problem_statement && Object.keys(row.problem_statement).length > 0
        ? row.problem_statement
        : undefined,
    files: row.files ?? {},
    techStack: row.tech_stack ?? [],
    createdAt: row.created_at_text,
    hasUploadedPdf: row.has_uploaded_pdf ?? false,
  };
}

function mapEditorialRow(row: DbEditorialRow): CmsEditorialContent {
  return {
    title: row.title,
    author: {
      name: row.author_name,
      role: row.author_role,
    },
    date: row.date_text,
    content: row.content_paragraphs ?? [],
    quote: {
      text: row.quote_text,
      author: row.quote_author,
    },
  };
}

function mapTeamMemberRow(row: DbTeamMemberRow): CmsTeamMember {
  return {
    id: row.id,
    year: row.year,
    name: row.name,
    role: row.role,
    department: row.department,
    yearLabel: row.year_label,
    imageId: row.image_id,
    linkedin: row.linkedin_url,
    github: row.github_url,
  };
}

async function ensureYearSectionSettings(year: number) {
  await pool.query(
    `
      INSERT INTO cms_section_settings (year, section_key, display_name, is_hidden)
      SELECT $1, s.section_key, INITCAP(s.section_key), FALSE
      FROM (
        VALUES ('utkarshi'), ('abohoman'), ('prayukti'), ('sarvagya'), ('gallery'), ('projects')
      ) AS s(section_key)
      ON CONFLICT (year, section_key) DO NOTHING;
    `,
    [year],
  );
}

export async function getCurrentYearNumber() {
  await ensureCmsSchema();
  const { rows } = await pool.query<{ year: number }>(
    "SELECT year FROM cms_years WHERE status='current' ORDER BY year DESC LIMIT 1",
  );
  return rows[0]?.year ?? new Date().getFullYear();
}

export async function getAllYears() {
  await ensureCmsSchema();
  const { rows } = await pool.query<{
    year: number;
    status: "current" | "archived";
    archived_at: string | null;
  }>(
    "SELECT year, status, archived_at FROM cms_years ORDER BY year DESC",
  );
  return rows;
}

export async function getPublicYears() {
  const [years, currentYear] = await Promise.all([getAllYears(), getCurrentYearNumber()]);
  return years.filter((entry) => entry.year <= currentYear);
}

export async function getYearData(year: number): Promise<HomeData> {
  await ensureCmsSchema();
  await ensureYearSectionSettings(year);
  const sectionSettings = await getSectionSettings(year);
  const hiddenSections = new Set(
    sectionSettings.filter((setting) => setting.isHidden).map((setting) => setting.sectionKey),
  );

  const { rows } = await pool.query<DbArticleRow>(
    `
      SELECT
        id,
        year,
        section,
        title,
        excerpt,
        date,
        read_time,
        author_name,
        author_role,
        paragraphs,
        images
      FROM cms_articles
      WHERE year = $1
      ORDER BY created_at DESC
    `,
    [year],
  );

  const data = blankHomeData();
  for (const row of rows) {
    if (hiddenSections.has(row.section)) {
      continue;
    }
    const article = mapDbArticle(row);
    data[article.section].push(article);
  }

  return data;
}

export async function getCurrentYearData() {
  const currentYear = await getCurrentYearNumber();
  const data = await getYearData(currentYear);
  return { currentYear, data };
}

export async function getEditorialContent() {
  await ensureCmsSchema();
  const { rows } = await pool.query<DbEditorialRow>(
    `
      SELECT title, author_name, author_role, date_text, content_paragraphs, quote_text, quote_author
      FROM cms_editorial_content
      WHERE id = 1
      LIMIT 1
    `,
  );

  if (!rows[0]) {
    return {
      title: "From the Editor's Desk",
      author: { name: "", role: "" },
      date: "",
      content: [],
      quote: { text: "", author: "" },
    } satisfies CmsEditorialContent;
  }

  return mapEditorialRow(rows[0]);
}

type UpsertEditorialInput = {
  title?: string;
  author?: {
    name?: string;
    role?: string;
  };
  date?: string;
  content?: string[];
  quote?: {
    text?: string;
    author?: string;
  };
};

export async function upsertEditorialContent(input: UpsertEditorialInput) {
  await ensureCmsSchema();
  await pool.query(
    `
      INSERT INTO cms_editorial_content (
        id, title, author_name, author_role, date_text, content_paragraphs, quote_text, quote_author, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        title = EXCLUDED.title,
        author_name = EXCLUDED.author_name,
        author_role = EXCLUDED.author_role,
        date_text = EXCLUDED.date_text,
        content_paragraphs = EXCLUDED.content_paragraphs,
        quote_text = EXCLUDED.quote_text,
        quote_author = EXCLUDED.quote_author,
        updated_at = NOW()
    `,
    [
      1,
      input.title ?? "From the Editor's Desk",
      input.author?.name ?? "",
      input.author?.role ?? "",
      input.date ?? "",
      JSON.stringify(input.content ?? []),
      input.quote?.text ?? "",
      input.quote?.author ?? "",
    ],
  );
}

export async function listTeamMembers(year: number) {
  await ensureCmsSchema();
  const { rows } = await pool.query<DbTeamMemberRow>(
    `
      SELECT year, id, name, role, department, year_label, image_id, linkedin_url, github_url
      FROM cms_team_members
      WHERE year = $1
      ORDER BY updated_at DESC
    `,
    [year],
  );
  return rows.map(mapTeamMemberRow);
}

type UpsertTeamMemberInput = {
  year: number;
  id: string;
  name: string;
  role?: string;
  department?: string;
  yearLabel?: string;
  imageId?: string;
  linkedin?: string;
  github?: string;
};

export async function upsertTeamMember(input: UpsertTeamMemberInput) {
  await ensureCmsSchema();

  await pool.query(
    `
      INSERT INTO cms_years (year, status)
      VALUES ($1, 'archived')
      ON CONFLICT (year) DO NOTHING
    `,
    [input.year],
  );
  await ensureYearSectionSettings(input.year);

  const existing = await pool.query<{ id: string }>(
    "SELECT id FROM cms_team_members WHERE year = $1 AND id = $2 LIMIT 1",
    [input.year, input.id],
  );

  if (!existing.rows[0]) {
    const countResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM cms_team_members WHERE year = $1",
      [input.year],
    );
    const total = Number(countResult.rows[0]?.count ?? "0");
    if (total >= 10) {
      throw new Error("Maximum 10 team members are allowed per year.");
    }
  }

  await pool.query(
    `
      INSERT INTO cms_team_members (
        year, id, name, role, department, year_label, image_id, linkedin_url, github_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (year, id)
      DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        year_label = EXCLUDED.year_label,
        image_id = EXCLUDED.image_id,
        linkedin_url = EXCLUDED.linkedin_url,
        github_url = EXCLUDED.github_url,
        updated_at = NOW()
    `,
    [
      input.year,
      input.id,
      input.name,
      input.role ?? "",
      input.department ?? "",
      input.yearLabel ?? "",
      input.imageId ?? "",
      input.linkedin ?? "",
      input.github ?? "",
    ],
  );
}

export async function deleteTeamMember(year: number, id: string) {
  await ensureCmsSchema();
  await pool.query("DELETE FROM cms_team_members WHERE year = $1 AND id = $2", [year, id]);
}

export async function getSectionSettings(year: number) {
  await ensureCmsSchema();
  await ensureYearSectionSettings(year);

  const { rows } = await pool.query<DbSectionSettingRow>(
    `
      SELECT year, section_key, display_name, is_hidden
      FROM cms_section_settings
      WHERE year = $1
      ORDER BY section_key ASC
    `,
    [year],
  );

  return rows.map(mapSectionSetting);
}

export async function upsertSectionSetting(
  year: number,
  sectionKey: YearSectionKey,
  displayName: string,
  isHidden: boolean,
) {
  await ensureCmsSchema();

  await pool.query(
    `
      INSERT INTO cms_years (year, status)
      VALUES ($1, 'archived')
      ON CONFLICT (year) DO NOTHING
    `,
    [year],
  );
  await ensureYearSectionSettings(year);

  await pool.query(
    `
      INSERT INTO cms_section_settings (year, section_key, display_name, is_hidden)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (year, section_key)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        is_hidden = EXCLUDED.is_hidden,
        updated_at = NOW()
    `,
    [year, sectionKey, displayName, isHidden],
  );
}

export async function listGalleryItems(year: number) {
  await ensureCmsSchema();
  const { rows } = await pool.query<DbGalleryRow>(
    `
      SELECT id, year, kind, title, description, image_id, photographer_name, photographer_dept, photographer_year, rank, folder_context
      FROM cms_gallery_items
      WHERE year = $1
      ORDER BY updated_at DESC
    `,
    [year],
  );
  return rows.map(mapGalleryRow);
}

type UpsertGalleryItemInput = {
  id: string;
  year: number;
  kind: "photograph" | "drawing";
  title: string;
  description?: string;
  imageId: string;
  photographer?: {
    name?: string;
    dept?: string;
    year?: string;
  };
  rank?: string;
  folderContext?: string;
};

export async function upsertGalleryItem(input: UpsertGalleryItemInput) {
  await ensureCmsSchema();
  await pool.query(
    `
      INSERT INTO cms_years (year, status)
      VALUES ($1, 'archived')
      ON CONFLICT (year) DO NOTHING
    `,
    [input.year],
  );
  await ensureYearSectionSettings(input.year);

  await pool.query(
    `
      INSERT INTO cms_gallery_items (
        id, year, kind, title, description, image_id, photographer_name, photographer_dept, photographer_year, rank, folder_context
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (id)
      DO UPDATE SET
        year = EXCLUDED.year,
        kind = EXCLUDED.kind,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        image_id = EXCLUDED.image_id,
        photographer_name = EXCLUDED.photographer_name,
        photographer_dept = EXCLUDED.photographer_dept,
        photographer_year = EXCLUDED.photographer_year,
        rank = EXCLUDED.rank,
        folder_context = EXCLUDED.folder_context,
        updated_at = NOW()
    `,
    [
      input.id,
      input.year,
      input.kind,
      input.title,
      input.description ?? "",
      input.imageId,
      input.photographer?.name ?? "",
      input.photographer?.dept ?? "",
      input.photographer?.year ?? "",
      input.rank ?? "",
      input.folderContext ?? "",
    ],
  );
}

export async function deleteGalleryItem(id: string) {
  await ensureCmsSchema();
  await pool.query("DELETE FROM cms_gallery_items WHERE id = $1", [id]);
}

export async function listProjects(year: number) {
  await ensureCmsSchema();
  const { rows } = await pool.query<DbProjectRow>(
    `
      SELECT id, year, title, excerpt, category, team_name, problem_statement, files, tech_stack, created_at_text
      , pdf_link
      , EXISTS (SELECT 1 FROM cms_project_pdfs p WHERE p.project_id = cms_projects.id) AS has_uploaded_pdf
      FROM cms_projects
      WHERE year = $1
      ORDER BY updated_at DESC
    `,
    [year],
  );
  return rows.map(mapProjectRow);
}

export async function getProjectById(year: number, id: string) {
  await ensureCmsSchema();
  const { rows } = await pool.query<DbProjectRow>(
    `
      SELECT id, year, title, excerpt, category, team_name, problem_statement, files, tech_stack, created_at_text
      , pdf_link
      , EXISTS (SELECT 1 FROM cms_project_pdfs p WHERE p.project_id = cms_projects.id) AS has_uploaded_pdf
      FROM cms_projects
      WHERE year = $1 AND id = $2
      LIMIT 1
    `,
    [year, id],
  );
  return rows[0] ? mapProjectRow(rows[0]) : null;
}

type UpsertProjectInput = {
  id: string;
  year: number;
  title: string;
  excerpt?: string;
  category?: string;
  teamName?: string;
  pdfLink?: string;
  problemStatement?: Record<string, unknown>;
  files?: Record<string, unknown>;
  techStack?: string[];
  createdAt?: string;
  uploadedPdf?: {
    dataUrl: string;
    fileName?: string;
  };
};

function parsePdfDataUrl(dataUrl: string) {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match?.[1] || !match[2]) {
    throw new Error("Invalid PDF upload format.");
  }
  const mimeType = match[1].trim().toLowerCase();
  if (mimeType !== "application/pdf") {
    throw new Error("Only PDF files are supported.");
  }
  const fileBytes = Buffer.from(match[2], "base64");
  if (fileBytes.length === 0) {
    throw new Error("Uploaded PDF is empty.");
  }
  return { mimeType, fileBytes };
}

export async function upsertProject(input: UpsertProjectInput) {
  await ensureCmsSchema();
  const internalPdfUrl = `/api/projects/${input.year}/${input.id}/pdf`;
  const hasUploadedPdfInput = Boolean(input.uploadedPdf?.dataUrl?.trim());
  const pdfLink = hasUploadedPdfInput ? internalPdfUrl : (input.pdfLink ?? "");

  await pool.query(
    `
      INSERT INTO cms_years (year, status)
      VALUES ($1, 'archived')
      ON CONFLICT (year) DO NOTHING
    `,
    [input.year],
  );
  await ensureYearSectionSettings(input.year);

  await pool.query(
    `
      INSERT INTO cms_projects (
        id, year, title, excerpt, category, team_name, pdf_link, problem_statement, files, tech_stack, created_at_text
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11)
      ON CONFLICT (id)
      DO UPDATE SET
        year = EXCLUDED.year,
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        category = EXCLUDED.category,
        team_name = EXCLUDED.team_name,
        pdf_link = EXCLUDED.pdf_link,
        problem_statement = EXCLUDED.problem_statement,
        files = EXCLUDED.files,
        tech_stack = EXCLUDED.tech_stack,
        created_at_text = EXCLUDED.created_at_text,
        updated_at = NOW()
    `,
    [
      input.id,
      input.year,
      input.title,
      input.excerpt ?? "",
      input.category ?? "",
      input.teamName ?? "",
      pdfLink,
      JSON.stringify(input.problemStatement ?? {}),
      JSON.stringify(input.files ?? {}),
      JSON.stringify(input.techStack ?? []),
      input.createdAt ?? "",
    ],
  );

  if (hasUploadedPdfInput && input.uploadedPdf) {
    const { mimeType, fileBytes } = parsePdfDataUrl(input.uploadedPdf.dataUrl);
    await pool.query(
      `
        INSERT INTO cms_project_pdfs (project_id, file_name, mime_type, file_bytes, file_size)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (project_id)
        DO UPDATE SET
          file_name = EXCLUDED.file_name,
          mime_type = EXCLUDED.mime_type,
          file_bytes = EXCLUDED.file_bytes,
          file_size = EXCLUDED.file_size,
          updated_at = NOW()
      `,
      [
        input.id,
        input.uploadedPdf.fileName?.trim() || "project.pdf",
        mimeType,
        fileBytes,
        fileBytes.length,
      ],
    );
    return;
  }

  if (!pdfLink.startsWith(internalPdfUrl)) {
    await pool.query("DELETE FROM cms_project_pdfs WHERE project_id = $1", [input.id]);
  }
}

export async function getProjectPdf(year: number, id: string) {
  await ensureCmsSchema();
  const { rows } = await pool.query<{
    file_name: string;
    mime_type: string;
    file_bytes: Buffer;
  }>(
    `
      SELECT p.file_name, p.mime_type, p.file_bytes
      FROM cms_project_pdfs p
      INNER JOIN cms_projects c ON c.id = p.project_id
      WHERE c.year = $1 AND c.id = $2
      LIMIT 1
    `,
    [year, id],
  );
  return rows[0] ?? null;
}

export async function deleteProject(id: string) {
  await ensureCmsSchema();
  await pool.query("DELETE FROM cms_projects WHERE id = $1", [id]);
}

export async function listSectionArticles(year: number, section: CmsSection) {
  await ensureCmsSchema();
  const { rows } = await pool.query<DbArticleRow>(
    `
      SELECT
        id,
        year,
        section,
        title,
        excerpt,
        date,
        read_time,
        author_name,
        author_role,
        paragraphs,
        images
      FROM cms_articles
      WHERE year = $1 AND section = $2
      ORDER BY updated_at DESC
    `,
    [year, section],
  );
  return rows.map(mapDbArticle);
}

export async function getSectionArticleById(year: number, section: CmsSection, id: string) {
  await ensureCmsSchema();
  const { rows } = await pool.query<DbArticleRow>(
    `
      SELECT
        id,
        year,
        section,
        title,
        excerpt,
        date,
        read_time,
        author_name,
        author_role,
        paragraphs,
        images
      FROM cms_articles
      WHERE year = $1 AND section = $2 AND id = $3
      LIMIT 1
    `,
    [year, section, id],
  );
  return rows[0] ? mapDbArticle(rows[0]) : null;
}

type UpsertArticleInput = {
  id: string;
  year: number;
  section: CmsSection;
  title: string;
  excerpt?: string;
  date?: string;
  readTime?: string;
  author?: {
    name?: string;
    role?: string;
  };
  paragraphs?: string[];
  images?: Array<{ id: string; caption?: string; position: number }>;
};

export async function upsertArticle(input: UpsertArticleInput) {
  await ensureCmsSchema();

  await pool.query(
    `
      INSERT INTO cms_years (year, status)
      VALUES ($1, 'archived')
      ON CONFLICT (year) DO NOTHING
    `,
    [input.year],
  );
  await ensureYearSectionSettings(input.year);

  await pool.query(
    `
      INSERT INTO cms_articles (
        id,
        year,
        section,
        title,
        excerpt,
        date,
        read_time,
        author_name,
        author_role,
        paragraphs,
        images
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        year = EXCLUDED.year,
        section = EXCLUDED.section,
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        date = EXCLUDED.date,
        read_time = EXCLUDED.read_time,
        author_name = EXCLUDED.author_name,
        author_role = EXCLUDED.author_role,
        paragraphs = EXCLUDED.paragraphs,
        images = EXCLUDED.images,
        updated_at = NOW()
    `,
    [
      input.id,
      input.year,
      input.section,
      input.title,
      input.excerpt ?? "",
      input.date ?? "",
      input.readTime ?? "",
      input.author?.name ?? "",
      input.author?.role ?? "",
      JSON.stringify(input.paragraphs ?? []),
      JSON.stringify(input.images ?? []),
    ],
  );
}

export async function deleteArticle(id: string) {
  await ensureCmsSchema();
  await pool.query("DELETE FROM cms_articles WHERE id=$1", [id]);
}

export async function archiveCurrentYearAndCreateNext() {
  await ensureCmsSchema();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const currentResult = await client.query<{ year: number }>(
      "SELECT year FROM cms_years WHERE status='current' ORDER BY year DESC LIMIT 1 FOR UPDATE",
    );

    if (!currentResult.rows[0]) {
      throw new Error("No current year found");
    }

    const currentYear = currentResult.rows[0].year;
    const nextYear = currentYear + 1;

    await client.query(
      "UPDATE cms_years SET status='archived', archived_at=NOW(), updated_at=NOW() WHERE year=$1",
      [currentYear],
    );
    await client.query(
      `
        INSERT INTO cms_years (year, status)
        VALUES ($1, 'current')
        ON CONFLICT (year)
        DO UPDATE SET status='current', updated_at=NOW(), archived_at=NULL
      `,
      [nextYear],
    );
    await client.query(
      `
        INSERT INTO cms_section_settings (year, section_key, display_name, is_hidden)
        SELECT $1, s.section_key, INITCAP(s.section_key), FALSE
        FROM (
          VALUES ('utkarshi'), ('abohoman'), ('prayukti'), ('sarvagya'), ('gallery'), ('projects')
        ) AS s(section_key)
        ON CONFLICT (year, section_key) DO NOTHING
      `,
      [nextYear],
    );
    await client.query(
      "UPDATE cms_years SET status='archived', updated_at=NOW() WHERE year <> $1 AND status='current'",
      [nextYear],
    );

    await client.query("COMMIT");
    return { archivedYear: currentYear, newCurrentYear: nextYear };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setCurrentYear(year: number) {
  await ensureCmsSchema();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO cms_years (year, status)
        VALUES ($1, 'current')
        ON CONFLICT (year)
        DO UPDATE SET status='current', updated_at=NOW(), archived_at=NULL
      `,
      [year],
    );
    await client.query(
      `
        INSERT INTO cms_section_settings (year, section_key, display_name, is_hidden)
        SELECT $1, s.section_key, INITCAP(s.section_key), FALSE
        FROM (
          VALUES ('utkarshi'), ('abohoman'), ('prayukti'), ('sarvagya'), ('gallery'), ('projects')
        ) AS s(section_key)
        ON CONFLICT (year, section_key) DO NOTHING
      `,
      [year],
    );
    await client.query(
      "UPDATE cms_years SET status='archived', updated_at=NOW() WHERE year <> $1 AND status='current'",
      [year],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
