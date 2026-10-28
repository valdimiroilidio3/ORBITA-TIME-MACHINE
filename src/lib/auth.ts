import { getDb, newId, nowIso } from "./db";
import { hmac, hashPassword, randomToken, safeEqual, sha256, verifyPassword } from "./crypto";
import { config } from "./config";
import type { Role, User } from "./types";

export const SESSION_COOKIE = "orbita_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export type Action =
  | "tm:create"
  | "tm:edit"
  | "tm:run"
  | "tm:delete"
  | "tm:publish"
  | "tm:share"
  | "lead:write";

const PERMISSIONS: Record<Role, Action[]> = {
  admin: ["tm:create", "tm:edit", "tm:run", "tm:delete", "tm:publish", "tm:share", "lead:write"],
  member: ["tm:create", "tm:edit", "tm:run", "tm:share", "lead:write"],
  viewer: [],
};

export function can(user: Pick<User, "role"> | null | undefined, action: Action): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role]?.includes(action) ?? false;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  created_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
  };
}

export function ensureSeedUsers(): void {
  const db = getDb();
  const admin = db.prepare("SELECT id FROM users WHERE email = ?").get(config.admin.email);
  if (!admin) {
    db.prepare(
      "INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?,?,?,?,?,?)",
    ).run(
      newId("usr"),
      config.admin.email,
      "Operador ORBITA",
      "admin",
      hashPassword(config.admin.password),
      nowIso(),
    );
  }
  const member = db.prepare("SELECT id FROM users WHERE email = ?").get(config.member.email);
  if (!member) {
    db.prepare(
      "INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?,?,?,?,?,?)",
    ).run(
      newId("usr"),
      config.member.email,
      "Equipa ORBITA",
      "member",
      hashPassword(config.member.password),
      nowIso(),
    );
  }
}

export function authenticate(email: string, password: string): User | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get((email || "").trim().toLowerCase()) as UserRow | undefined;
  if (!row) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return toUser(row);
}

export function createSession(userId: string): { cookieValue: string; expiresAt: Date } {
  const db = getDb();
  const sessionId = newId("ses");
  const secret = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  db.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?,?,?,?,?)",
  ).run(sessionId, userId, sha256(secret), expiresAt.toISOString(), nowIso());
  return { cookieValue: `${sessionId}.${secret}.${hmac(`${sessionId}.${secret}`)}`, expiresAt };
}

export function readSession(cookieValue: string | undefined | null): User | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return null;
  const [sessionId, secret, signature] = parts;
  if (!safeEqual(hmac(`${sessionId}.${secret}`), signature)) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.expires_at AS expires_at, s.token_hash AS token_hash, u.*
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
    )
    .get(sessionId) as (UserRow & { expires_at: string; token_hash: string }) | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }
  if (!safeEqual(row.token_hash, sha256(secret))) return null;
  return toUser(row);
}

export function destroySession(cookieValue: string | undefined | null): void {
  if (!cookieValue) return;
  const [sessionId] = cookieValue.split(".");
  if (!sessionId) return;
  getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
