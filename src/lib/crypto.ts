import crypto from "node:crypto";
import { config } from "./config";

export function hashPassword(password: string, salt?: string): string {
  const useSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, useSalt, 64).toString("hex");
  return `scrypt$${useSalt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, digest] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !digest) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hmac(value: string, secret = config.sessionSecret): string {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Slug público não previsível + sufixo legível para identificação humana. */
export function buildShowcaseSlug(companyName: string): string {
  const base = companyName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "empresa";
  return `${base}-${crypto.randomBytes(6).toString("hex")}`;
}

export function tokenHint(token: string): string {
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}
