/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, "data_to_load", "test");
const TARGET_YEAR = 2025;
const TARGET_SECTION = "abohoman";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripLatex(line) {
  return (
    String(line || "")
      .replace(/\\textbf\{([^}]*)\}/g, "$1")
      .replace(/\\textit\{([^}]*)\}/g, "$1")
      .replace(/\\textsc\{([^}]*)\}/g, "$1")
      .replace(/\\begin\{hindi\}/g, "")
      .replace(/\\end\{hindi\}/g, "")
      .replace(/\\begin\{bengali\}/g, "")
      .replace(/\\end\{bengali\}/g, "")
      .replace(/\\[a-zA-Z*]+(\[[^\]]*\])?(\{[^}]*\})?/g, " ")
      .replace(/[{}]/g, " ")
      .replace(/\\+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function parseBlocks(tex) {
  const chunks = tex.split(/\\clearpage/g);
  const items = [];

  for (const chunk of chunks) {
    const titleMatch =
      chunk.match(/\\textsc\{([^}]+)\}/) ||
      chunk.match(/\\begin\{hindi\}\s*\\textbf\{([^}]+)\}\s*\\end\{hindi\}/);
    if (!titleMatch) continue;

    const authorMatch =
      chunk.match(/\\textbf\{\\Large\s*---\s*([^}]+)\}/) ||
      chunk.match(/\\Large\s*\\textbf\{([^}]+)\}/);
    if (!authorMatch) continue;

    const subtitleMatch = chunk.match(/\\textit\{\(([^}]+)\)\}/);
    const metaMatch = chunk.match(/Dept:\s*([^|\\]+)\s*\|\s*([^|\\]+)\s*\|\s*Roll:\s*([A-Za-z0-9-]+)/i);
    const imageMatches = [...chunk.matchAll(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g)];
    const imageName = imageMatches.length > 0 ? imageMatches[0][1].trim() : "";

    const bodyStart = chunk.search(/\\begin\{multicols\}|\\begin\{minipage\}\[c\]\{0\.55\\textwidth\}/);
    const bodyEnd = chunk.search(/\\vfill|\\begin\{flushright\}/);
    const bodyRaw =
      bodyStart >= 0
        ? chunk.slice(bodyStart, bodyEnd > bodyStart ? bodyEnd : undefined)
        : chunk;

    const lines = bodyRaw
      .split(/\r?\n|\\\\/g)
      .map((line) => stripLatex(line))
      .filter((line) => line && !/^dept:/i.test(line) && !/^roll:/i.test(line));

    const dedupedLines = [];
    for (const line of lines) {
      if (dedupedLines[dedupedLines.length - 1] !== line) dedupedLines.push(line);
    }

    const authorName = stripLatex(authorMatch[1]).replace(/^---\s*/, "").trim();
    if (!authorName || /font|language|setup/i.test(authorName)) continue;

    items.push({
      title: stripLatex(titleMatch[1]),
      subtitle: subtitleMatch ? stripLatex(subtitleMatch[1]) : "",
      authorName,
      authorRole: metaMatch
        ? `Dept: ${stripLatex(metaMatch[1])} | ${stripLatex(metaMatch[2])} | Roll: ${stripLatex(metaMatch[3])}`
        : "",
      imageName,
      paragraphs: dedupedLines,
    });
  }

  return items;
}

function toDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : ext === ".bmp"
            ? "image/bmp"
            : ext === ".svg"
              ? "image/svg+xml"
              : "image/jpeg";
  const data = fs.readFileSync(filePath).toString("base64");
  return `data:${mime};base64,${data}`;
}

function chooseBestByKey(items) {
  const byKey = new Map();
  for (const item of items) {
    const key = `${slugify(item.title)}::${slugify(item.authorName)}`;
    const score = item.paragraphs.join(" ").length;
    const prev = byKey.get(key);
    if (!prev || score > prev.score) {
      byKey.set(key, { score, item });
    }
  }
  return [...byKey.values()].map((entry) => entry.item);
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

function calcReadTime(paragraphs) {
  const words = paragraphs.join(" ").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

async function run() {
  const preferredFiles = ["name.tex", "Abhohoman.tex"];
  const texItems = [];

  for (const rel of preferredFiles) {
    const filePath = path.join(INPUT_DIR, rel);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = parseBlocks(content);
    console.log(`Parsed ${parsed.length} entries from ${rel}`);
    texItems.push(...parsed);
  }

  if (texItems.length === 0) {
    throw new Error("No Abohoman entries found in data_to_load/test/name.tex or Abhohoman.tex");
  }

  const merged = chooseBestByKey(texItems);
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await ensureYear(client, TARGET_YEAR);

    await client.query(
      "DELETE FROM cms_articles WHERE year = $1 AND section = $2",
      [TARGET_YEAR, TARGET_SECTION],
    );

    let imported = 0;
    for (const item of merged) {
      const id = `abohoman-${TARGET_YEAR}-${slugify(item.title)}-${slugify(item.authorName)}`.slice(0, 120);
      const excerptBase = item.paragraphs[0] || item.subtitle || item.title;
      const excerpt = excerptBase.length > 240 ? `${excerptBase.slice(0, 237)}...` : excerptBase;

      const imagePath = item.imageName ? path.join(INPUT_DIR, item.imageName) : "";
      const imageId =
        imagePath && fs.existsSync(imagePath) ? toDataUrl(imagePath) : "";

      const images = imageId ? [{ id: imageId, position: 1 }] : [];

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
          TARGET_YEAR,
          TARGET_SECTION,
          item.title,
          excerpt,
          `${TARGET_YEAR}-01-01`,
          calcReadTime(item.paragraphs),
          item.authorName,
          item.authorRole,
          JSON.stringify(item.paragraphs),
          JSON.stringify(images),
        ],
      );
      imported += 1;
      console.log(`Imported: ${item.title} (${item.authorName}) images=${images.length}`);
    }

    await client.query("COMMIT");
    console.log(`Done. Imported ${imported} Abohoman entries for ${TARGET_YEAR}.`);
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
