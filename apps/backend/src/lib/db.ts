import postgres, { type Sql } from "postgres";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { GlossaryRow, ReviewRow, UserRole } from "@sahayak/shared";

/**
 * Postgres (Supabase) holds users, sessions, conversations, feedback, the
 * review queue and the glossary. DATABASE_URL is the project's connection
 * string; the schema is created on startup (ensureSchema) and the demo
 * admin is seeded so the sign-in page keeps working out of the box.
 *
 * Queries use postgres.js tagged templates: db()`SELECT … WHERE id = ${id}`.
 * `prepare: false` keeps it working through Supabase's transaction pooler.
 */
export type Role = UserRole;
export type UserRow = { id: number; email: string; name: string; role: Role; created_at: string };
export type ConversationRow = { id: string; user_id: number; title: string; messages: string; updated_at: string };
export type { GlossaryRow, ReviewRow };

/** Starter glossary, inserted on first run; admins extend it from the UI. */
const GLOSSARY_SEED: Omit<GlossaryRow, "id">[] = [
  { term: "Quorum", hi: "कोरम / गणपूर्ति", mr: "गणपूर्ती", ta: "குறைந்தபட்ச வருகை", source: "MSCS Act §39" },
  { term: "Registrar", hi: "रजिस्ट्रार / निबंधक", mr: "निबंधक", ta: "பதிவாளர்", source: "MSCS Act §3" },
  { term: "Bylaws", hi: "उपनियम", mr: "उपविधी", ta: "துணைவிதிகள்", source: "MSCS Act §3(d)" },
  { term: "Managing committee", hi: "प्रबंध समिति", mr: "व्यवस्थापक समिती", ta: "நிர்வாகக் குழு", source: "Model bylaws cl. 30" },
  { term: "Share capital", hi: "शेयर पूंजी", mr: "भाग भांडवल", ta: "பங்கு மூலதனம்", source: "MSCS Act §67" },
  { term: "Surplus", hi: "अधिशेष", mr: "नफा / अधिशेष", ta: "உபரி", source: "MSCS Act §63" },
  { term: "Arbitration", hi: "मध्यस्थता", mr: "लवाद", ta: "நடுவர் தீர்ப்பு", source: "MSCS Act §84" },
];

declare global {
  var __sahayakSql: Sql | undefined;
}

function connect(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and paste the Supabase connection string.");
  }
  return postgres(url, {
    // Supabase's pooler (port 6543) does not support prepared statements.
    prepare: false,
    max: Number(process.env.DB_POOL ?? 5),
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: process.env.DB_SSL === "0" ? undefined : "require",
    // CREATE … IF NOT EXISTS raises a NOTICE on every start; keep the log clean.
    onnotice: () => undefined,
    // Keep timestamps as ISO strings so JSON responses are stable across drivers.
    types: {
      timestamptz: { to: 1184, from: [1184, 1114], serialize: (v: string) => v, parse: (v: string) => new Date(v).toISOString() },
    },
  });
}

/** The shared connection pool; opened lazily so tests that only hash passwords never connect. */
export function db(): Sql {
  if (!globalThis.__sahayakSql) globalThis.__sahayakSql = connect();
  return globalThis.__sahayakSql;
}

/** Creates the tables if they are missing and seeds the demo admin and glossary. Called once at startup. */
export async function ensureSchema() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      messages TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS conversations_user ON conversations(user_id, updated_at DESC)`;
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      message_id TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      value TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      language TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      confidence DOUBLE PRECISION NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS glossary (
      id SERIAL PRIMARY KEY,
      term TEXT NOT NULL UNIQUE,
      hi TEXT NOT NULL DEFAULT '',
      mr TEXT NOT NULL DEFAULT '',
      ta TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT ''
    )`;
  await seed(sql);
}

async function seed(sql: Sql) {
  const [users] = await sql<{ n: string }[]>`SELECT COUNT(*) AS n FROM users`;
  if (Number(users.n) === 0) {
    await sql`INSERT INTO users (email, name, password_hash, role) VALUES ('test@gmail.com', 'Test User', ${hashPassword("1234")}, 'admin')`;
  }
  const [terms] = await sql<{ n: string }[]>`SELECT COUNT(*) AS n FROM glossary`;
  if (Number(terms.n) === 0) {
    await sql`INSERT INTO glossary ${sql(GLOSSARY_SEED, "term", "hi", "mr", "ta", "source")}`;
  }
}

/** True for a UNIQUE-constraint violation (duplicate email or glossary term). */
export function isUniqueViolation(err: unknown) {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

/* ---- passwords ---- */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function checkPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}
