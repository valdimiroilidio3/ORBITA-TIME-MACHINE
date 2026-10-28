import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

/**
 * Persistência: SQLite via driver nativo embutido no Node (>=22.5).
 * Carregado com `process.getBuiltinModule` para não obrigar a compilação de
 * módulos nativos (better-sqlite3) neste ambiente. Em produção com Postgres,
 * basta substituir este módulo mantendo a interface dos repositórios.
 */
interface Statement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
}

interface Database {
  exec(sql: string): void;
  prepare(sql: string): Statement;
  close(): void;
}

type SqliteModule = { DatabaseSync: new (file: string) => Database };

const globalForDb = globalThis as unknown as {
  __orbitaDb?: Database;
  __orbitaDbReady?: boolean;
};

function loadSqlite(): SqliteModule {
  const getBuiltin = (process as unknown as { getBuiltinModule?: (id: string) => unknown })
    .getBuiltinModule;
  const mod = getBuiltin?.("node:sqlite") as SqliteModule | undefined;
  if (!mod?.DatabaseSync) {
    throw new Error(
      "SQLite nativo indisponível. ORBITA Time Machine requer Node.js >= 22.5 (process.getBuiltinModule / node:sqlite).",
    );
  }
  return mod;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','member','viewer')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT 'indefinido',
  location TEXT,
  website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  whatsapp TEXT,
  services TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  owner_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS time_machines (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting',
  progress INTEGER NOT NULL DEFAULT 0,
  current_step TEXT,
  company TEXT,
  current_experience TEXT,
  opportunities TEXT NOT NULL DEFAULT '[]',
  brief TEXT,
  master_prompt TEXT,
  prototype TEXT,
  showcase_status TEXT NOT NULL DEFAULT 'draft',
  showcase_token_hash TEXT,
  showcase_token_hint TEXT,
  showcase_created_at TEXT,
  showcase_last_rotated_at TEXT,
  showcase_revoked_at TEXT,
  showcase_expires_at TEXT,
  ai_calls INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  archived_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  time_machine_id TEXT NOT NULL REFERENCES time_machines(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  requested_steps TEXT NOT NULL DEFAULT '[]',
  steps TEXT NOT NULL DEFAULT '[]',
  engine TEXT,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TEXT,
  finished_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  time_machine_id TEXT NOT NULL REFERENCES time_machines(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  time_machine_id TEXT,
  kind TEXT NOT NULL,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tm_status ON time_machines(status);
CREATE INDEX IF NOT EXISTS idx_tm_created ON time_machines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_tm ON jobs(time_machine_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_tm ON artifacts(time_machine_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_events(user_id, created_at DESC);
`;

function init(): Database {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.mkdirSync(config.artifactsDir, { recursive: true });
  fs.mkdirSync(config.uploadsTmpDir, { recursive: true });
  const sqlite = loadSqlite();
  const db = new sqlite.DatabaseSync(config.dbFile);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  return db;
}

export function getDb(): Database {
  if (!globalForDb.__orbitaDb) {
    globalForDb.__orbitaDb = init();
  }
  return globalForDb.__orbitaDb;
}

export function artifactPath(id: string, filename: string): string {
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  const dir = path.join(config.artifactsDir, id);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, safe);
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value.length === 0) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
