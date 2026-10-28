import path from "node:path";

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

const dataDir = path.resolve(process.env.ORBITA_DATA_DIR || "./data");
const isProduction = process.env.NODE_ENV === "production";

export const config = {
  dataDir,
  dbFile: path.join(dataDir, "orbita.sqlite"),
  artifactsDir: path.join(dataDir, "artifacts"),
  uploadsTmpDir: path.join(dataDir, "tmp"),
  sessionSecret:
    process.env.ORBITA_SESSION_SECRET ||
    "orbita-dev-secret-do-not-use-in-production-8f2c1",
  isProduction,
  /**
   * Entrada automática no dashboard em desenvolvimento (nunca em produção).
   * Desativar com ORBITA_DEV_AUTOLOGIN=false quando for preciso testar o login.
   */
  devAutoLogin: bool("ORBITA_DEV_AUTOLOGIN", !isProduction),
  admin: {
    email: (process.env.ORBITA_ADMIN_EMAIL || "admin@orbita.pt").toLowerCase(),
    password: process.env.ORBITA_ADMIN_PASSWORD || "orbita-time-machine",
  },
  member: {
    email: (process.env.ORBITA_MEMBER_EMAIL || "equipa@orbita.pt").toLowerCase(),
    password: process.env.ORBITA_MEMBER_PASSWORD || "equipa-time-machine",
  },
  ai: {
    provider: (process.env.AI_PROVIDER || "auto").toLowerCase(),
    apiKey: process.env.AI_API_KEY || "",
    baseUrl: process.env.AI_BASE_URL || "",
    model: process.env.AI_MODEL || "",
    maxOutputTokens: num("AI_MAX_OUTPUT_TOKENS", 3500),
    timeoutMs: num("AI_TIMEOUT_MS", 45_000),
  },
  capture: {
    enabled: bool("CAPTURE_ENABLED", true),
    navTimeoutMs: num("CAPTURE_NAV_TIMEOUT_MS", 30_000),
    maxPages: num("CAPTURE_MAX_PAGES", 3),
    maxBytes: num("CAPTURE_MAX_BYTES", 8_000_000),
  },
  limits: {
    maxConcurrentJobs: num("LIMIT_MAX_CONCURRENT_JOBS", 2),
    runsPerHour: num("LIMIT_RUNS_PER_HOUR", 12),
    maxCostCentsPerTm: num("LIMIT_MAX_COST_CENTS_PER_TM", 250),
    maxAiCallsPerTm: num("LIMIT_MAX_AI_CALLS_PER_TM", 8),
  },
  showcase: {
    ttlDays: num("SHOWCASE_LINK_TTL_DAYS", 30),
    contactEmail: process.env.NEXT_PUBLIC_ORBITA_CONTACT_EMAIL || "hello@orbita.pt",
    whatsapp: process.env.NEXT_PUBLIC_ORBITA_WHATSAPP || "",
  },
};

export type AppConfig = typeof config;
