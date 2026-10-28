import { getDb, newId, nowIso, parseJson } from "./db";
import { buildShowcaseSlug } from "./crypto";
import type {
  Artifact,
  CompanyIntelligence,
  CreativeBrief,
  CurrentExperience,
  Job,
  JobStatus,
  JobStep,
  Lead,
  Opportunity,
  Prototype,
  ShowcaseStatus,
  StepKey,
  StepStatus,
  TimeMachine,
  TimeMachineSummary,
  TmStatus,
} from "./types";
import { STEP_ORDER } from "./types";

/* ────────────────────────────── Leads ────────────────────────────── */

interface LeadRow {
  id: string;
  company_name: string;
  sector: string;
  location: string | null;
  website: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  services: string;
  notes: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    company_name: row.company_name,
    sector: row.sector,
    location: row.location,
    website: row.website,
    contact_name: row.contact_name,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    whatsapp: row.whatsapp,
    services: parseJson<string[]>(row.services, []),
    notes: row.notes,
    owner_id: row.owner_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface LeadInput {
  company_name: string;
  sector?: string;
  location?: string | null;
  website?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  whatsapp?: string | null;
  services?: string[];
  notes?: string | null;
}

export function listLeads(query?: string): Lead[] {
  const db = getDb();
  if (query && query.trim()) {
    const like = `%${query.trim().toLowerCase()}%`;
    return (
      db
        .prepare(
          `SELECT * FROM leads
           WHERE lower(company_name) LIKE ? OR lower(sector) LIKE ? OR lower(COALESCE(location,'')) LIKE ?
           ORDER BY company_name COLLATE NOCASE ASC LIMIT 200`,
        )
        .all(like, like, like) as unknown as LeadRow[]
    ).map(mapLead);
  }
  return (db.prepare("SELECT * FROM leads ORDER BY company_name COLLATE NOCASE LIMIT 200").all() as unknown as LeadRow[]).map(
    mapLead,
  );
}

export function getLead(id: string): Lead | null {
  const row = getDb().prepare("SELECT * FROM leads WHERE id = ?").get(id) as LeadRow | undefined;
  return row ? mapLead(row) : null;
}

export function createLead(input: LeadInput, ownerId: string | null): Lead {
  const id = newId("lead");
  const ts = nowIso();
  getDb()
    .prepare(
      `INSERT INTO leads (id, company_name, sector, location, website, contact_name, contact_email,
        contact_phone, whatsapp, services, notes, owner_id, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      id,
      input.company_name.trim(),
      (input.sector || "indefinido").trim(),
      input.location ?? null,
      input.website ?? null,
      input.contact_name ?? null,
      input.contact_email ?? null,
      input.contact_phone ?? null,
      input.whatsapp ?? null,
      JSON.stringify(input.services ?? []),
      input.notes ?? null,
      ownerId,
      ts,
      ts,
    );
  return getLead(id)!;
}

export function updateLead(id: string, patch: Partial<LeadInput>): Lead | null {
  const current = getLead(id);
  if (!current) return null;
  const merged: LeadInput = {
    company_name: patch.company_name ?? current.company_name,
    sector: patch.sector ?? current.sector,
    location: patch.location ?? current.location,
    website: patch.website ?? current.website,
    contact_name: patch.contact_name ?? current.contact_name,
    contact_email: patch.contact_email ?? current.contact_email,
    contact_phone: patch.contact_phone ?? current.contact_phone,
    whatsapp: patch.whatsapp ?? current.whatsapp,
    services: patch.services ?? current.services,
    notes: patch.notes ?? current.notes,
  };
  getDb()
    .prepare(
      `UPDATE leads SET company_name=?, sector=?, location=?, website=?, contact_name=?, contact_email=?,
        contact_phone=?, whatsapp=?, services=?, notes=?, updated_at=? WHERE id=?`,
    )
    .run(
      merged.company_name,
      merged.sector,
      merged.location ?? null,
      merged.website ?? null,
      merged.contact_name ?? null,
      merged.contact_email ?? null,
      merged.contact_phone ?? null,
      merged.whatsapp ?? null,
      JSON.stringify(merged.services ?? []),
      merged.notes ?? null,
      nowIso(),
      id,
    );
  return getLead(id);
}

/* ─────────────────────────── Time Machines ────────────────────────── */

interface TmRow {
  id: string;
  lead_id: string;
  slug: string;
  title: string;
  status: TmStatus;
  progress: number;
  current_step: StepKey | null;
  company: string | null;
  current_experience: string | null;
  opportunities: string;
  brief: string | null;
  master_prompt: string | null;
  prototype: string | null;
  showcase_status: ShowcaseStatus;
  showcase_token_hash: string | null;
  showcase_token_hint: string | null;
  showcase_created_at: string | null;
  showcase_last_rotated_at: string | null;
  showcase_revoked_at: string | null;
  showcase_expires_at: string | null;
  ai_calls: number;
  cost_cents: number;
  last_error: string | null;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapTm(row: TmRow): TimeMachine {
  return {
    id: row.id,
    lead_id: row.lead_id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    progress: row.progress,
    current_step: row.current_step,
    company: parseJson<CompanyIntelligence | null>(row.company, null),
    current_experience: parseJson<CurrentExperience | null>(row.current_experience, null),
    opportunities: parseJson<Opportunity[]>(row.opportunities, []),
    brief: parseJson<CreativeBrief | null>(row.brief, null),
    master_prompt: row.master_prompt,
    prototype: parseJson<Prototype | null>(row.prototype, null),
    showcase_status: row.showcase_status,
    showcase_token_hash: row.showcase_token_hash,
    showcase_token_hint: row.showcase_token_hint,
    showcase_created_at: row.showcase_created_at,
    showcase_last_rotated_at: row.showcase_last_rotated_at,
    showcase_revoked_at: row.showcase_revoked_at,
    showcase_expires_at: row.showcase_expires_at,
    ai_calls: row.ai_calls,
    cost_cents: row.cost_cents,
    last_error: row.last_error,
    archived_at: row.archived_at ?? null,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface TmFilter {
  status?: TmStatus | "all";
  sector?: string | "all";
  query?: string;
  from?: string;
  to?: string;
}

export function listTimeMachines(filter: TmFilter = {}): TimeMachineSummary[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.status && filter.status !== "all") {
    where.push("tm.status = ?");
    params.push(filter.status);
  }
  if (filter.sector && filter.sector !== "all") {
    where.push("l.sector = ?");
    params.push(filter.sector);
  }
  if (filter.from) {
    where.push("tm.created_at >= ?");
    params.push(`${filter.from}T00:00:00.000Z`);
  }
  if (filter.to) {
    where.push("tm.created_at <= ?");
    params.push(`${filter.to}T23:59:59.999Z`);
  }
  if (filter.query && filter.query.trim()) {
    where.push("(lower(l.company_name) LIKE ? OR lower(tm.title) LIKE ? OR lower(COALESCE(l.website,'')) LIKE ?)");
    const like = `%${filter.query.trim().toLowerCase()}%`;
    params.push(like, like, like);
  }
  const sql = `SELECT tm.* FROM time_machines tm JOIN leads l ON l.id = tm.lead_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY tm.created_at DESC LIMIT 200`;
  const rows = db.prepare(sql).all(...params) as unknown as TmRow[];
  return rows.map((row) => {
    const tm = mapTm(row);
    const lead = getLead(tm.lead_id)!;
    return { ...tm, lead, job: getLatestJob(tm.id) };
  });
}

export function getTimeMachine(id: string): TimeMachine | null {
  const row = getDb().prepare("SELECT * FROM time_machines WHERE id = ?").get(id) as TmRow | undefined;
  return row ? mapTm(row) : null;
}

export function getTimeMachineBySlug(slug: string): TimeMachine | null {
  const row = getDb().prepare("SELECT * FROM time_machines WHERE slug = ?").get(slug) as TmRow | undefined;
  return row ? mapTm(row) : null;
}

export function listSectors(): string[] {
  return (
    getDb().prepare("SELECT DISTINCT sector FROM leads ORDER BY sector COLLATE NOCASE").all() as {
      sector: string;
    }[]
  ).map((r) => r.sector);
}

export function createTimeMachine(lead: Lead, createdBy: string): TimeMachine {
  const id = newId("tm");
  const ts = nowIso();
  getDb()
    .prepare(
      `INSERT INTO time_machines (id, lead_id, slug, title, status, progress, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      id,
      lead.id,
      buildShowcaseSlug(lead.company_name),
      `${lead.company_name} — Time Machine`,
      "awaiting",
      0,
      createdBy,
      ts,
      ts,
    );
  return getTimeMachine(id)!;
}

const JSON_FIELDS = new Set([
  "company",
  "current_experience",
  "opportunities",
  "brief",
  "prototype",
]);

export function updateTimeMachine(
  id: string,
  patch: Partial<Omit<TimeMachine, "id" | "created_at">>,
): TimeMachine | null {
  const current = getTimeMachine(id);
  if (!current) return null;
  const entries = Object.entries(patch).filter(([key]) => key !== "id" && key !== "created_at");
  if (entries.length === 0) return current;
  const sets = entries.map(([key]) => `${key} = ?`).join(", ");
  const values = entries.map(([key, value]) =>
    JSON_FIELDS.has(key) && value !== null && typeof value === "object" ? JSON.stringify(value) : value,
  );
  getDb()
    .prepare(`UPDATE time_machines SET ${sets}, updated_at = ? WHERE id = ?`)
    .run(...values, nowIso(), id);
  return getTimeMachine(id);
}

export function deleteTimeMachine(id: string): void {
  getDb().prepare("DELETE FROM time_machines WHERE id = ?").run(id);
}

/* ──────────────────────────────── Jobs ───────────────────────────── */

interface JobRow {
  id: string;
  time_machine_id: string;
  status: JobStatus;
  requested_steps: string;
  steps: string;
  engine: string | null;
  cost_cents: number;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_by: string;
  created_at: string;
}

function mapJob(row: JobRow): Job {
  return {
    id: row.id,
    time_machine_id: row.time_machine_id,
    status: row.status,
    requested_steps: parseJson<StepKey[]>(row.requested_steps, []),
    steps: parseJson<JobStep[]>(row.steps, []),
    engine: row.engine,
    cost_cents: row.cost_cents,
    error: row.error,
    started_at: row.started_at,
    finished_at: row.finished_at,
    created_by: row.created_by,
    created_at: row.created_at,
  };
}

export function createJob(
  timeMachineId: string,
  requestedSteps: StepKey[],
  createdBy: string,
): Job {
  const id = newId("job");
  const steps: JobStep[] = STEP_ORDER.map((key) => ({
    key,
    status: requestedSteps.includes(key) ? ("pending" as StepStatus) : ("skipped" as StepStatus),
    started_at: null,
    finished_at: null,
    duration_ms: null,
    error: null,
    log: [],
  }));
  getDb()
    .prepare(
      `INSERT INTO jobs (id, time_machine_id, status, requested_steps, steps, cost_cents, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .run(id, timeMachineId, "queued", JSON.stringify(requestedSteps), JSON.stringify(steps), 0, createdBy, nowIso());
  return getJob(id)!;
}

export function getJob(id: string): Job | null {
  const row = getDb().prepare("SELECT * FROM jobs WHERE id = ?").get(id) as JobRow | undefined;
  return row ? mapJob(row) : null;
}

export function getLatestJob(timeMachineId: string): Job | null {
  const row = getDb()
    .prepare("SELECT * FROM jobs WHERE time_machine_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(timeMachineId) as JobRow | undefined;
  return row ? mapJob(row) : null;
}

export function listJobs(timeMachineId: string, limit = 20): Job[] {
  return (
    getDb()
      .prepare("SELECT * FROM jobs WHERE time_machine_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(timeMachineId, limit) as unknown as JobRow[]
  ).map(mapJob);
}

export function updateJob(id: string, patch: Partial<Omit<Job, "id">>): Job | null {
  const current = getJob(id);
  if (!current) return null;
  const merged = { ...current, ...patch };
  getDb()
    .prepare(
      `UPDATE jobs SET status=?, requested_steps=?, steps=?, engine=?, cost_cents=?, error=?,
        started_at=?, finished_at=? WHERE id=?`,
    )
    .run(
      merged.status,
      JSON.stringify(merged.requested_steps),
      JSON.stringify(merged.steps),
      merged.engine,
      merged.cost_cents,
      merged.error,
      merged.started_at,
      merged.finished_at,
      id,
    );
  return getJob(id);
}

export function updateJobStep(
  jobId: string,
  stepKey: StepKey,
  patch: Partial<JobStep>,
  logLine?: string,
): Job | null {
  const job = getJob(jobId);
  if (!job) return null;
  const steps = job.steps.map((step) => {
    if (step.key !== stepKey) return step;
    const next: JobStep = { ...step, ...patch };
    if (logLine) next.log = [...step.log, `[${new Date().toISOString()}] ${logLine}`].slice(-40);
    return next;
  });
  return updateJob(jobId, { steps });
}

export function countRunningJobs(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM jobs WHERE status IN ('queued','running')")
    .get() as { n: number };
  return Number(row?.n ?? 0);
}

/* ───────────────────────────── Artifacts ─────────────────────────── */

interface ArtifactRow {
  id: string;
  time_machine_id: string;
  kind: Artifact["kind"];
  filename: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  source: Artifact["source"];
  created_at: string;
}

export function createArtifact(input: Omit<Artifact, "id" | "created_at">): Artifact {
  const id = newId("art");
  getDb()
    .prepare(
      `INSERT INTO artifacts (id, time_machine_id, kind, filename, mime, bytes, width, height, source, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      id,
      input.time_machine_id,
      input.kind,
      input.filename,
      input.mime,
      input.bytes,
      input.width,
      input.height,
      input.source,
      nowIso(),
    );
  return { ...input, id, created_at: nowIso() };
}

export function listArtifacts(timeMachineId: string): Artifact[] {
  return (
    getDb()
      .prepare("SELECT * FROM artifacts WHERE time_machine_id = ? ORDER BY created_at DESC")
      .all(timeMachineId) as unknown as ArtifactRow[]
  ).map((row) => ({ ...row }));
}

export function getArtifact(id: string): Artifact | null {
  const row = getDb().prepare("SELECT * FROM artifacts WHERE id = ?").get(id) as ArtifactRow | undefined;
  return row ? { ...row } : null;
}

export function deleteArtifactsOfKind(timeMachineId: string, kinds: Artifact["kind"][]): void {
  const db = getDb();
  for (const kind of kinds) {
    db.prepare("DELETE FROM artifacts WHERE time_machine_id = ? AND kind = ?").run(timeMachineId, kind);
  }
}

/* ────────────────────────── Usage / limites ──────────────────────── */

export function recordUsage(
  userId: string,
  kind: string,
  costCents = 0,
  timeMachineId: string | null = null,
): void {
  getDb()
    .prepare(
      "INSERT INTO usage_events (id, user_id, time_machine_id, kind, cost_cents, created_at) VALUES (?,?,?,?,?,?)",
    )
    .run(newId("use"), userId, timeMachineId, kind, costCents, nowIso());
}

export function runsInLastHour(userId: string): number {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM usage_events WHERE user_id = ? AND kind = 'generation_run' AND created_at >= ?")
    .get(userId, since) as { n: number };
  return Number(row?.n ?? 0);
}
