import crypto from "node:crypto";
import { cookies } from "next/headers";

import { ensureCmsSchema, pool } from "@/lib/db";

const ADMIN_SESSION_COOKIE = "ingenium_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function encodePassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [salt, savedHash] = encoded.split(":");
  if (!salt || !savedHash) {
    return false;
  }
  const computedHash = hashPassword(password, salt);
  if (savedHash.length !== computedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(savedHash), Buffer.from(computedHash));
}

export async function ensureInitialAdminFromEnv() {
  await ensureCmsSchema();
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    return;
  }

  const { rows } = await pool.query<{ id: number }>(
    "SELECT id FROM admin_users WHERE email=$1 LIMIT 1",
    [adminEmail.toLowerCase()],
  );

  if (rows[0]) {
    return;
  }

  await pool.query(
    "INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)",
    [adminEmail.toLowerCase(), encodePassword(adminPassword)],
  );
}

export async function loginAdmin(email: string, password: string) {
  await ensureInitialAdminFromEnv();
  const { rows } = await pool.query<{
    id: number;
    email: string;
    password_hash: string;
  }>(
    "SELECT id, email, password_hash FROM admin_users WHERE email=$1 LIMIT 1",
    [email.toLowerCase()],
  );

  const user = rows[0];
  if (!user) {
    return null;
  }
  if (!verifyPassword(password, user.password_hash)) {
    return null;
  }

  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await pool.query(
    `
      INSERT INTO admin_sessions (token_hash, user_id, expires_at)
      VALUES ($1, $2, $3)
    `,
    [tokenHash, user.id, expiresAt],
  );

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { id: user.id, email: user.email };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    await pool.query("DELETE FROM admin_sessions WHERE token_hash=$1", [hashToken(token)]);
  }
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getCurrentAdmin() {
  await ensureCmsSchema();
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const { rows } = await pool.query<{
    id: number;
    email: string;
  }>(
    `
      SELECT u.id, u.email
      FROM admin_sessions s
      INNER JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash=$1 AND s.expires_at > NOW()
      LIMIT 1
    `,
    [hashToken(token)],
  );

  return rows[0] ?? null;
}
