/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const ROOT = process.cwd();
const OLD_ROOT = path.join(ROOT, "data_to_load", "old_ingenium", "data");
const DEFAULT_GALLERY_YEAR = Number(process.env.OLD_INGENIUM_GALLERY_YEAR || 2026);
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const SECTION_SOURCES = [
  { section: "abohoman", file: "abohoman/blogs.json" },
  { section: "prayukti", file: "prayukti/blogs.json" },
  { section: "sarvagya", file: "sarvagya/blogs.json" },
  { section: "utkarshi", file: "utkarshi/blogs.json" },
  // Old site had an archive section; map into year-wise CMS under abohoman as generic long-form section.
  { section: "abohoman", file: "archive/blogs.json", idPrefix: "old-archive" },
];

const CMS_SECTIONS = new Set(["abohoman", "prayukti", "sarvagya", "utkarshi"]);

function readJson(rel) {
  const full = path.join(OLD_ROOT, rel);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function parseYear(value) {
  if (!value) return null;
  const direct = Number(value);
  if (Number.isInteger(direct) && direct >= 1900 && direct <= 3000) return direct;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.getFullYear();
  const m = String(value).match(/(19|20)\d{2}/);
  if (m) return Number(m[0]);
  return null;
}

function normalizeSection(raw, fallback) {
  const key = String(raw || "").toLowerCase().trim();
  if (CMS_SECTIONS.has(key)) return key;
  return fallback;
}

async function ensureYear(client, year) {
  await client.query(
    `
      INSERT INTO cms_years (year, status)
      VALUES ($1, 'archived')
      ON CONFLICT (year) DO NOTHING
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
}

async function importArticles(client) {
  const counts = new Map();
  for (const source of SECTION_SOURCES) {
    const rows = readJson(source.file);
    for (const row of rows) {
      const year = parseYear(row.date) || 2026;
      await ensureYear(client, year);
      const section = normalizeSection(row.department, source.section);
      const idBase = row.id || `${section}-${Date.now()}`;
      const id = source.idPrefix ? `${source.idPrefix}-${idBase}` : idBase;

      await client.query(
        `
          INSERT INTO cms_articles (
            id, year, section, title, excerpt, date, read_time, author_name, author_role, paragraphs, images
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
          id,
          year,
          section,
          row.title || "",
          row.excerpt || "",
          row.date || "",
          row.readTime || "",
          row.author?.name || "",
          row.author?.role || "",
          JSON.stringify(row.paragraphs || []),
          JSON.stringify(row.images || []),
        ],
      );
      const key = `${year}:${section}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return counts;
}

function normalizePdfLink(files) {
  const driveId = files?.pdf?.driveId;
  if (typeof driveId === "string" && driveId.length > 0) {
    if (driveId.startsWith("d/")) {
      return `https://drive.google.com/file/${driveId}/view`;
    }
    return `https://drive.google.com/file/d/${driveId}/view`;
  }
  return "";
}

async function importProjects(client) {
  const rows = readJson("projects/projects.json");
  let count = 0;
  for (const row of rows) {
    const year = parseYear(row.year) || parseYear(row.createdAt) || 2026;
    await ensureYear(client, year);
    await client.query(
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
        row.id,
        year,
        row.title || "",
        row.excerpt || "",
        row.category || "",
        row.team?.name || "",
        normalizePdfLink(row.files || {}),
        JSON.stringify(row.problemStatement || {}),
        JSON.stringify(row.files || {}),
        JSON.stringify(row.techStack || []),
        row.createdAt || "",
      ],
    );
    count += 1;
  }
  return count;
}

async function importGallery(client) {
  const photos = readJson("photographs/data.json");
  const drawings = readJson("drawings/data.json");
  const year = DEFAULT_GALLERY_YEAR;
  await ensureYear(client, year);

  let count = 0;
  for (const photo of photos) {
    await client.query(
      `
        INSERT INTO cms_gallery_items (
          id, year, kind, title, description, image_id, photographer_name, photographer_dept, photographer_year, rank, folder_context
        )
        VALUES ($1,$2,'photograph',$3,$4,$5,$6,$7,$8,'','')
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
        `old-photo-${photo.id}`,
        year,
        photo.title || "",
        photo.description || "",
        photo.id || "",
        photo.photographer?.name || "",
        photo.photographer?.dept || "",
        photo.photographer?.year || "",
      ],
    );
    count += 1;
  }

  for (const folder of drawings) {
    for (const file of folder.files || []) {
      await client.query(
        `
          INSERT INTO cms_gallery_items (
            id, year, kind, title, description, image_id, photographer_name, photographer_dept, photographer_year, rank, folder_context
          )
          VALUES ($1,$2,'drawing',$3,$4,$5,$6,$7,$8,$9,$10)
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
          `old-drawing-${file.drive_id}`,
          year,
          file.filename || "",
          "",
          `d/${file.drive_id}`,
          file.inferred_details?.participant_name || "",
          file.inferred_details?.department || "",
          file.inferred_details?.year_level || "",
          file.rank || "",
          folder.folder_context || "Drawings",
        ],
      );
      count += 1;
    }
  }
  return { count, year };
}

async function run() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const articleCounts = await importArticles(client);
    const projectCount = await importProjects(client);
    const gallery = await importGallery(client);
    await client.query("COMMIT");

    console.log("Old Ingenium import complete.");
    console.log("Articles imported by year:section");
    for (const [key, val] of [...articleCounts.entries()].sort()) {
      console.log(`  ${key} => ${val}`);
    }
    console.log(`Projects imported: ${projectCount}`);
    console.log(`Gallery items imported: ${gallery.count} (year ${gallery.year})`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
