/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const ROOT = process.cwd();
const SQL_PATH = path.join(ROOT, "data_to_load", "prev ingenium", "u935184548_ingenium2023.sql");
const LEGACY_ROOT = path.join(ROOT, "data_to_load", "prev ingenium");
const IMPORT_YEAR = 2023;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const SECTION_TABLES = [
  { table: "abohoman", section: "abohoman" },
  { table: "prayukti", section: "prayukti" },
];

const GALLERY_TABLE = "gallery";

function decodeSqlString(raw) {
  if (raw === "NULL") return "";
  if (!(raw.startsWith("'") && raw.endsWith("'"))) {
    return raw;
  }
  const inner = raw.slice(1, -1);
  return inner
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/''/g, "'");
}

function isEscapedAt(source, index) {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && source[i] === "\\"; i -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function parseValueTuple(tupleRaw) {
  const values = [];
  let cur = "";
  let inQuote = false;

  for (let i = 0; i < tupleRaw.length; i += 1) {
    const ch = tupleRaw[i];
    const next = tupleRaw[i + 1];
    if (ch === "'" && !isEscapedAt(tupleRaw, i)) {
      if (inQuote && next === "'") {
        cur += "''";
        i += 1;
        continue;
      }
      inQuote = !inQuote;
      cur += ch;
      continue;
    }
    if (ch === "," && !inQuote) {
      values.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }

  if (cur.length > 0) {
    values.push(cur.trim());
  }
  return values.map(decodeSqlString);
}

function parseInsertTuples(valuesChunk) {
  const tuples = [];
  let depth = 0;
  let inQuote = false;
  let cur = "";

  for (let i = 0; i < valuesChunk.length; i += 1) {
    const ch = valuesChunk[i];
    const next = valuesChunk[i + 1];
    if (ch === "'" && !isEscapedAt(valuesChunk, i)) {
      if (inQuote && next === "'") {
        cur += "''";
        i += 1;
        continue;
      }
      inQuote = !inQuote;
      cur += ch;
      continue;
    }

    if (!inQuote && ch === "(") {
      depth += 1;
      if (depth === 1) {
        cur = "";
        continue;
      }
    }

    if (!inQuote && ch === ")") {
      depth -= 1;
      if (depth === 0) {
        tuples.push(parseValueTuple(cur));
        cur = "";
        continue;
      }
    }

    if (depth >= 1) {
      cur += ch;
    }
  }
  return tuples;
}

function getInsertRows(sqlText, tableName) {
  const rows = [];
  const marker = `INSERT INTO \`${tableName}\``;
  let cursor = 0;

  while (true) {
    const insertAt = sqlText.indexOf(marker, cursor);
    if (insertAt === -1) break;

    const valuesAt = sqlText.indexOf("VALUES", insertAt);
    if (valuesAt === -1) break;

    let endAt = -1;
    let inQuote = false;
    for (let i = valuesAt; i < sqlText.length; i += 1) {
      const ch = sqlText[i];
      const next = sqlText[i + 1];
      if (ch === "'" && !isEscapedAt(sqlText, i)) {
        if (inQuote && next === "'") {
          i += 1;
          continue;
        }
        inQuote = !inQuote;
        continue;
      }
      if (ch === ";" && !inQuote) {
        endAt = i;
        break;
      }
    }
    if (endAt === -1) break;

    const statement = sqlText.slice(insertAt, endAt + 1);
    const columnsStart = statement.indexOf("(");
    const columnsEnd = statement.indexOf(")", columnsStart);
    const valuesText = statement.slice(statement.indexOf("VALUES", columnsEnd) + "VALUES".length, -1).trim();

    const columns = statement
      .slice(columnsStart + 1, columnsEnd)
      .split(",")
      .map((c) => c.trim().replace(/`/g, ""));

    const tuples = parseInsertTuples(valuesText);
    for (const tuple of tuples) {
      const obj = {};
      for (let i = 0; i < columns.length; i += 1) {
        obj[columns[i]] = tuple[i] ?? "";
      }
      rows.push(obj);
    }
    cursor = endAt + 1;
  }
  return rows;
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToParagraphs(html) {
  const chunks = String(html || "")
    .split(/<\/p>/i)
    .map((part) =>
      part
        .replace(/<p[^>]*>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .trim(),
    )
    .filter(Boolean);
  if (chunks.length > 0) return chunks;
  const plain = stripHtml(html);
  return plain ? [plain] : [];
}

function extractFirstInlineImage(html) {
  const match = String(html || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1]?.trim() || "";
}

function ensureUploadsIndex(rootDir) {
  const files = new Map();
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (![".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"].includes(ext)) {
        continue;
      }
      files.set(entry.name.toLowerCase(), full);
    }
  };
  walk(rootDir);
  return files;
}

function mimeByExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".bmp") return "image/bmp";
  if (ext === ".svg") return "image/svg+xml";
  return "image/jpeg";
}

function asDataUrl(filePath) {
  const mime = mimeByExt(filePath);
  const raw = fs.readFileSync(filePath);
  return `data:${mime};base64,${raw.toString("base64")}`;
}

function resolveLegacyImageRef(ref, uploadsByName, cache) {
  const value = String(ref || "").trim();
  if (!value) return "";
  if (value.startsWith("data:image/") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  const fileName = path.basename(value).toLowerCase();
  const filePath = uploadsByName.get(fileName);
  if (!filePath) return "";
  if (cache.has(filePath)) return cache.get(filePath);
  const dataUrl = asDataUrl(filePath);
  cache.set(filePath, dataUrl);
  return dataUrl;
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
  const sqlText = fs.readFileSync(SQL_PATH, "utf8");
  const uploadsByName = ensureUploadsIndex(LEGACY_ROOT);
  const imageCache = new Map();

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await ensureYear(client, IMPORT_YEAR);

    await client.query("DELETE FROM cms_articles WHERE year IN (2022, 2023)");
    await client.query("DELETE FROM cms_gallery_items WHERE year IN (2022, 2023)");
    await client.query("DELETE FROM cms_projects WHERE year IN (2022, 2023)");

    let articleCount = 0;
    for (const cfg of SECTION_TABLES) {
      const rows = getInsertRows(sqlText, cfg.table);
      for (const row of rows) {
        const inlineImage = extractFirstInlineImage(row.content);
        const imageFromPath = resolveLegacyImageRef(row.image_path, uploadsByName, imageCache);
        const image = inlineImage || imageFromPath;
        const title = String(row.title || "").trim();
        const excerpt = stripHtml(row.truncated) || stripHtml(row.content).slice(0, 220);
        const authorName = String(row.author || "").trim();
        const date = String(row.datetime || "").trim();

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
            `prev-2023-${cfg.section}-${row.id}`,
            IMPORT_YEAR,
            cfg.section,
            title,
            excerpt,
            date,
            "",
            authorName,
            "",
            JSON.stringify(htmlToParagraphs(row.content)),
            JSON.stringify(image ? [{ id: image, position: 1 }] : []),
          ],
        );
        articleCount += 1;
      }
    }

    const galleryRows = getInsertRows(sqlText, GALLERY_TABLE);
    let galleryCount = 0;
    for (const row of galleryRows) {
      const category = String(row.category || "").toLowerCase();
      const kind = category.includes("photo") ? "photograph" : "drawing";
      const imageId = resolveLegacyImageRef(row.image, uploadsByName, imageCache);
      if (!imageId) continue;
      await client.query(
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
          `prev-2023-gallery-${row.id}`,
          IMPORT_YEAR,
          kind,
          stripHtml(row.truncated) || (kind === "photograph" ? "Photograph" : "Artwork"),
          stripHtml(row.description),
          imageId,
          String(row.author || "").trim(),
          "",
          "",
          "",
          kind === "photograph" ? "" : "Drawings",
        ],
      );
      galleryCount += 1;
    }

    await client.query("COMMIT");
    console.log(`Import complete. Articles: ${articleCount}, Gallery: ${galleryCount}`);
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
