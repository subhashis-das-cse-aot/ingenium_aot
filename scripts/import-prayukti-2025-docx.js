/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { Pool } = require("pg");

const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, "data_to_load", "Prayukti");
const EXTRACT_SCRIPT = path.join(ROOT, "scripts", "extract-docx.ps1");
const IMPORT_YEAR = 2025;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/\.docx$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function computeReadTime(paragraphs) {
  const words = paragraphs.join(" ").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function findMatch(lines, patterns) {
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) return match;
    }
  }
  return null;
}

function parseMetadata(fileName, paragraphs) {
  const lines = (paragraphs || []).map((line) => String(line || "").trim()).filter(Boolean);
  const lowerFile = fileName.toLowerCase();

  const title = lines[0] ? lines[0].replace(/^["“]|["”]$/g, "").trim() : path.basename(fileName, path.extname(fileName));

  const byMatch = findMatch(lines.slice(0, 10), [/^by\s+(.+)$/i, /^author\s*[:\-]\s*(.+)$/i]);
  let authorName = byMatch?.[1]?.trim() || "";

  if (!authorName) {
    const tailName = findMatch(lines.slice(-4), [/^([A-Z][A-Z\s.]+)$/]);
    if (tailName?.[1]) {
      authorName = toTitleCase(tailName[1].replace(/\s+/g, " ").trim());
    }
  }

  if (!authorName) {
    const fileNameName = fileName.match(/^([A-Za-z ]+)[_-]/);
    if (fileNameName?.[1]) authorName = fileNameName[1].trim();
  }

  if (!authorName) {
    authorName = "Unknown Author";
  }

  const deptMatch =
    findMatch(lines.slice(0, 20), [
      /department\s+of\s+([^,]+)/i,
      /\bdept\.?\s*[:\-]\s*([^,]+)/i,
      /\b(cse\s*\(ai-ml\)|cse|ece|ee|me|ce|it|mca)\b/i,
    ]) || lowerFile.match(/\[(cse\(ai-ml\)|cse|ece|ee|me|ce|it|mca)\]/i);

  const rollMatch =
    findMatch(lines.slice(0, 20), [
      /roll\s*(?:no\.?|number)?\s*[:\-]?\s*([A-Za-z0-9()\-]+)/i,
      /\broll\s*no-?\s*([A-Za-z0-9()\-]+)/i,
    ]) || lowerFile.match(/roll\s*no-?\s*([a-z0-9()\-]+)/i);

  const yearMatch = findMatch(lines.slice(0, 20), [/\b([1-4](?:st|nd|rd|th)\s+year)\b/i]);

  const roleParts = [];
  if (yearMatch?.[1]) roleParts.push(yearMatch[1]);
  if (deptMatch?.[1]) roleParts.push(String(deptMatch[1]).toUpperCase());
  if (rollMatch?.[1]) roleParts.push(`Roll ${rollMatch[1]}`);

  const authorRole = roleParts.join(", ");

  const contentLines = lines.filter((line, idx) => {
    if (idx === 0) return false;
    if (/^by\s+/i.test(line)) return false;
    if (/^author\s*[:\-]/i.test(line)) return false;
    return true;
  });

  const excerptBase = contentLines[0] || lines[1] || "";
  const excerpt = excerptBase.length > 240 ? `${excerptBase.slice(0, 237)}...` : excerptBase;

  return { title, authorName, authorRole, paragraphs: contentLines.length ? contentLines : lines, excerpt };
}

function extractDocx(docxPath) {
  const result = spawnSync(
    "powershell",
    ["-ExecutionPolicy", "Bypass", "-File", EXTRACT_SCRIPT, "-docx", docxPath],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );

  if (result.status !== 0) {
    throw new Error(`Failed to extract ${path.basename(docxPath)}: ${result.stderr || result.stdout}`);
  }

  const stdout = (result.stdout || "").trim();
  if (!stdout) {
    throw new Error(`No extractor output for ${path.basename(docxPath)}`);
  }
  return JSON.parse(stdout);
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

async function run() {
  const docs = fs
    .readdirSync(INPUT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".docx"))
    .map((entry) => path.join(INPUT_DIR, entry.name));

  if (docs.length === 0) {
    console.log("No DOCX files found in data_to_load/Prayukti");
    return;
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await ensureYear(client, IMPORT_YEAR);

    let imported = 0;
    for (const docPath of docs) {
      const fileName = path.basename(docPath);
      const extracted = extractDocx(docPath);
      const meta = parseMetadata(fileName, extracted.paragraphs || []);
      const images = (extracted.images || []).map((src, i) => ({ id: src, position: i + 1 }));
      const id = `prayukti-2025-${slugify(fileName)}`;
      const date = `${IMPORT_YEAR}-01-01`;

      await client.query(
        `
          INSERT INTO cms_articles (
            id, year, section, title, excerpt, date, read_time, author_name, author_role, paragraphs, images
          )
          VALUES ($1,$2,'prayukti',$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb)
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
          IMPORT_YEAR,
          meta.title,
          meta.excerpt,
          date,
          computeReadTime(meta.paragraphs),
          meta.authorName,
          meta.authorRole,
          JSON.stringify(meta.paragraphs),
          JSON.stringify(images),
        ],
      );
      imported += 1;
      console.log(`Imported ${fileName} -> ${id} (images: ${images.length})`);
    }

    await client.query("COMMIT");
    console.log(`Done. Imported ${imported} Prayukti articles for ${IMPORT_YEAR}.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
