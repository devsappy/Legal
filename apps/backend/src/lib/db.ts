import Database from "better-sqlite3";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { GlossaryRow, ReviewRow, UserRole } from "@sahayak/shared";

/**
 * One SQLite file under data/ holds users, sessions, conversations,
 * feedback, the review queue and the glossary. Opened once per process;
 * the schema is created on first use and the demo admin is seeded so the
 * sign-in page keeps working out of the box.
 */
const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data", "sahayak.db");

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
  var __sahayakDb: Database.Database | undefined;
}

function open(): Database.Database {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      messages TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS conversations_user ON conversations(user_id, updated_at DESC);
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY,
      message_id TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      value TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      language TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      confidence REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS glossary (
      id INTEGER PRIMARY KEY,
      term TEXT NOT NULL UNIQUE,
      hi TEXT NOT NULL DEFAULT '',
      mr TEXT NOT NULL DEFAULT '',
      ta TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT ''
    );
  `);
  seed(db);
  return db;
}

function seed(db: Database.Database) {
  const users = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (users.n === 0) {
    db.prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')").run(
      "test@gmail.com",
      "Test User",
      hashPassword("1234"),
    );
  }
  const terms = db.prepare("SELECT COUNT(*) AS n FROM glossary").get() as { n: number };
  if (terms.n === 0) {
    const ins = db.prepare("INSERT INTO glossary (term, hi, mr, ta, source) VALUES (?, ?, ?, ?, ?)");
    for (const g of GLOSSARY_SEED) ins.run(g.term, g.hi, g.mr, g.ta, g.source);
  }
}

export function db(): Database.Database {
  // Survives Next's dev-mode module reloads without piling up connections.
  if (!globalThis.__sahayakDb) globalThis.__sahayakDb = open();
  return globalThis.__sahayakDb;
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
