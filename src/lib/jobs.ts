import { config } from "./config";
import { getDb, nowIso } from "./db";
import {
  countRunningJobs,
  createJob,
  getJob,
  getLead,
  getTimeMachine,
  recordUsage,
  runsInLastHour,
  updateJob,
  updateJobStep,
  updateTimeMachine,
} from "./repo";
import { analyzeAdditionalPages, captureWebsite } from "./capture";
import { clearCaptures, latestArtifacts, storeCapturedImages } from "./artifacts";
import { buildCompanyIntelligence, buildLocalBrief, briefToMasterPrompt } from "./creative/brief";
import { buildOpportunities, buildPreserveList } from "./analysis/opportunities";
import { enrichBrief } from "./ai/enrich";
import { generatePrototype } from "./creative/prototype";
import { aiAvailable } from "./ai/provider";
import type {
  CurrentExperience,
  Job,
  JobStatus,
  StepKey,
  TimeMachine,
  TmStatus,
} from "./types";
import { STEP_ORDER } from "./types";

export class GenerationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "GenerationError";
  }
}

const RUNNING = new Set<string>();
const globalJob = globalThis as unknown as { __orbitaRunning?: Set<string> };
const running = globalJob.__orbitaRunning ?? (globalJob.__orbitaRunning = RUNNING);

const STEP_STATUS: Record<StepKey, TmStatus> = {
  ingest: "analyzing",
  capture: "capturing",
  analyze: "analyzing",
  brief: "creative",
  prompt: "creative",
  prototype: "building",
  finalize: "review",
};

export interface StartOptions {
  timeMachineId: string;
  steps: StepKey[];
  userId: string;
  skipLimits?: boolean;
}

export function assertCanStart(userId: string, timeMachineId: string): void {
  const tm = getTimeMachine(timeMachineId);
  if (!tm) throw new GenerationError("not_found", "Time Machine não encontrada.");
  const runningJobs = countRunningJobs();
  if (runningJobs >= config.limits.maxConcurrentJobs) {
    throw new GenerationError(
      "concurrency",
      `Limite de gerações simultâneas atingido (${config.limits.maxConcurrentJobs}). Aguarda a conclusão da geração em curso.`,
    );
  }
  const hourly = runsInLastHour(userId);
  if (hourly >= config.limits.runsPerHour) {
    throw new GenerationError(
      "rate_limit",
      `Limite de ${config.limits.runsPerHour} gerações por hora atingido para este utilizador.`,
    );
  }
  if (tm.cost_cents >= config.limits.maxCostCentsPerTm) {
    throw new GenerationError(
      "budget",
      `Orçamento de IA deste projeto esgotado (${tm.cost_cents}/${config.limits.maxCostCentsPerTm} cêntimos).`,
    );
  }
}

/**
 * Cria o job e executa-o em background. O estado real é persistido passo a
 * passo, pelo que a UI acompanha progresso verdadeiro (nunca simulado) e a
 * geração sobrevive a reaberturas da página.
 */
export function startGeneration({ timeMachineId, steps, userId, skipLimits }: StartOptions): Job {
  if (running.has(timeMachineId)) {
    throw new GenerationError("already_running", "Já existe uma geração em curso para esta Time Machine.");
  }
  if (!skipLimits) assertCanStart(userId, timeMachineId);
  const ordered = STEP_ORDER.filter((step) => steps.includes(step));
  if (ordered.length === 0) throw new GenerationError("no_steps", "Nenhuma etapa selecionada.");

  const tm = getTimeMachine(timeMachineId);
  if (!tm) throw new GenerationError("not_found", "Time Machine não encontrada.");

  const job = createJob(timeMachineId, ordered, userId);
  recordUsage(userId, "generation_run", 0, timeMachineId);
  updateTimeMachine(timeMachineId, {
    status: "awaiting",
    progress: 0,
    current_step: ordered[0],
    last_error: null,
  });

  running.add(timeMachineId);
  void executeJob(job.id, ordered, userId)
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Falha inesperada na geração.";
      updateJob(job.id, {
        status: "failed",
        error: message,
        finished_at: nowIso(),
      });
      updateTimeMachine(timeMachineId, { status: "failed", last_error: message });
    })
    .finally(() => {
      running.delete(timeMachineId);
    });

  return getJob(job.id)!;
}

async function executeJob(jobId: string, steps: StepKey[], userId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) return;
  updateJob(jobId, { status: "running", started_at: nowIso() });

  for (const step of steps) {
    const startedAt = Date.now();
    const currentJob = getJob(jobId);
    const previous = currentJob?.steps.find((s) => s.key === step)?.status;
    if (previous === "done" && step !== "finalize") {
      // Etapa já concluída em execução anterior: mantém resultado.
      continue;
    }
    updateJobStep(jobId, step, { status: "running", started_at: nowIso(), error: null }, "Início");
    const tm = getTimeMachine(job!.time_machine_id);
    if (!tm) throw new GenerationError("not_found", "Time Machine removida durante a geração.");
    updateTimeMachine(tm.id, {
      status: step === "finalize" ? tm.status : STEP_STATUS[step],
      current_step: step,
      progress: progressFor(jobId),
    });

    try {
      const detail = await runStep(step, tm, jobId, userId);
      updateJobStep(
        jobId,
        step,
        { status: "done", finished_at: nowIso(), duration_ms: Date.now() - startedAt },
        detail || "Concluído",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      updateJobStep(
        jobId,
        step,
        { status: "failed", finished_at: nowIso(), duration_ms: Date.now() - startedAt, error: message },
        `Falhou: ${message}`,
      );
      updateJob(jobId, { status: "failed", error: message, finished_at: nowIso() });
      updateTimeMachine(tm.id, {
        status: "failed",
        last_error: `${step}: ${message}`,
        progress: progressFor(jobId),
      });
      return;
    }
    const current = getTimeMachine(tm.id);
    if (current) updateTimeMachine(tm.id, { progress: progressFor(jobId) });
  }

  const finalJob = getJob(jobId);
  const completed = finalJob?.steps.filter((s) => s.status === "done").length ?? 0;
  const tmFinal = getTimeMachine(finalJob!.time_machine_id);
  const failed = finalJob?.steps.some((s) => s.status === "failed") ?? false;
  updateJob(jobId, {
    status: failed ? "failed" : "succeeded",
    finished_at: nowIso(),
    cost_cents: tmFinal?.cost_cents ?? 0,
  });
  if (tmFinal) {
    updateTimeMachine(tmFinal.id, {
      status: failed ? "failed" : tmFinal.showcase_status === "published" ? "published" : "review",
      progress: 100,
      current_step: null,
    });
  }
  void completed;
  void userId;
}

function progressFor(jobId: string): number {
  const job = getJob(jobId);
  if (!job) return 0;
  const relevant = job.steps.filter((s) => s.status !== "skipped");
  if (relevant.length === 0) return 0;
  const done = relevant.filter((s) => s.status === "done").length;
  const runningCount = relevant.some((s) => s.status === "running") ? 0.5 : 0;
  return Math.min(99, Math.round(((done + runningCount) / relevant.length) * 100));
}

function emptyExperience(lead: { website: string | null }): CurrentExperience {
  return {
    reachable: false,
    finalUrl: null,
    statusCode: null,
    capturedAt: null,
    captureSource: "none",
    pages: [],
    screenshots: {},
    preserve: [],
    captureError: lead.website
      ? "Captura ainda não executada para este projeto."
      : "Lead sem website registado — não existe site atual para comparar.",
  };
}

async function runStep(
  step: StepKey,
  tm: TimeMachine,
  jobId: string,
  userId: string,
): Promise<string> {
  const lead = getLead(tm.lead_id);
  if (!lead) throw new GenerationError("lead_missing", "Lead associada já não existe.");

  switch (step) {
    case "ingest": {
      const experience: CurrentExperience =
        tm.current_experience ?? {
          reachable: false,
          finalUrl: null,
          statusCode: null,
          capturedAt: null,
          captureSource: "none",
          pages: [],
          screenshots: {},
          preserve: [],
          captureError: null,
        };
      const company = buildCompanyIntelligence(lead, experience);
      updateTimeMachine(tm.id, { company, title: `${lead.company_name} — Time Machine` });
      updateJobStep(jobId, step, {}, `Lead carregada: ${lead.company_name} (${lead.sector}).`);
      return "Dados da empresa consolidados";
    }

    case "capture": {
      if (!lead.website) {
        const empty: CurrentExperience = {
          reachable: false,
          finalUrl: null,
          statusCode: null,
          capturedAt: nowIso(),
          captureSource: "none",
          pages: [],
          screenshots: {},
          preserve: buildPreserveList(
            { reachable: false, finalUrl: null, statusCode: null, capturedAt: null, captureSource: "none", pages: [], screenshots: {}, preserve: [] },
            lead,
          ),
          captureError: "Lead sem website registado — não existe site atual para comparar.",
        };
        updateTimeMachine(tm.id, { current_experience: empty });
        updateJobStep(jobId, step, {}, "Sem website: comparação ficará em modo 'sem captura'.");
        return "Sem website — captura não aplicável";
      }
      clearCaptures(tm.id);
      const outcome = await captureWebsite(lead.website);
      const artifacts = outcome.images.length > 0 ? storeCapturedImages(tm.id, outcome.images) : [];
      const recent = latestArtifacts(tm.id);
      const experience: CurrentExperience = {
        reachable: outcome.reachable,
        finalUrl: outcome.finalUrl,
        statusCode: outcome.statusCode,
        capturedAt: nowIso(),
        captureSource: artifacts.length > 0 ? "playwright" : "none",
        pages: outcome.pages,
        screenshots: {
          desktop: recent["screenshot-desktop"]?.id,
          mobile: recent["screenshot-mobile"]?.id,
          fullPage: recent["screenshot-full"]?.id,
        },
        preserve: [],
        captureError: outcome.error,
      };
      experience.preserve = buildPreserveList(experience, lead);
      updateTimeMachine(tm.id, { current_experience: experience });
      updateJobStep(
        jobId,
        step,
        {},
        `Estado HTTP ${outcome.statusCode ?? "?"} · ${outcome.pages.length} página(s) · ${artifacts.length} captura(s)${
          artifacts.length === 0 ? " · captura visual indisponível" : ""
        }${outcome.error ? ` · aviso: ${outcome.error}` : ""}`,
      );
      if (!outcome.reachable && outcome.pages.length === 0) {
        // Falha de captura não destrói o trabalho: a geração continua e a
        // comparação apresenta o estado "sem captura do website atual".
        updateJobStep(
          jobId,
          step,
          {},
          `Aviso: site inacessível (${outcome.error ?? "sem resposta"}). Prossegue sem captura de origem.`,
        );
        return "Website inacessível — geração prossegue sem captura";
      }
      return `${artifacts.length} captura(s) guardada(s)`;
    }

    case "analyze": {
      const experience = tm.current_experience;
      if (!experience) throw new GenerationError("no_capture", "Executa a captura antes da análise.");
      let pages = experience.pages;
      if (lead.website && pages.length > 0 && config.capture.maxPages > 1) {
        const extra = await analyzeAdditionalPages(lead.website, pages, config.capture.maxPages);
        const seen = new Set(pages.map((p) => p.url));
        pages = [...pages, ...extra.filter((p) => !seen.has(p.url))];
      }
      const withPages: CurrentExperience = { ...experience, pages };
      const opportunities = buildOpportunities(lead, withPages);
      const company = buildCompanyIntelligence(lead, withPages);
      updateTimeMachine(tm.id, {
        current_experience: { ...withPages, preserve: buildPreserveList(withPages, lead) },
        opportunities,
        company,
      });
      updateJobStep(
        jobId,
        step,
        {},
        `${pages.length} página(s) analisada(s) · ${opportunities.length} oportunidade(s) com evidência.`,
      );
      return `${opportunities.length} oportunidades documentadas`;
    }

    case "brief": {
      // O briefing pode ser produzido apenas com dados do CRM: a ausência de
      // captura reduz a evidência disponível, mas não bloqueia o trabalho.
      const experience = tm.current_experience ?? emptyExperience(lead);
      const company = tm.company ?? buildCompanyIntelligence(lead, experience);
      const opportunities =
        tm.opportunities.length > 0 ? tm.opportunities : buildOpportunities(lead, experience);
      const localBrief = buildLocalBrief(lead, company, experience, opportunities);
      const callsAvailable = tm.ai_calls < config.limits.maxAiCallsPerTm;
      const enriched =
        aiAvailable() && callsAvailable
          ? await enrichBrief(lead, company, opportunities, localBrief)
          : { brief: localBrief, engine: "local" as const, costCents: 0, error: null };
      const cost = Math.min(enriched.costCents, Math.max(0, config.limits.maxCostCentsPerTm - tm.cost_cents));
      updateTimeMachine(tm.id, {
        brief: enriched.brief,
        opportunities,
        ai_calls: tm.ai_calls + (enriched.costCents > 0 || enriched.engine === "remote" ? 1 : 0),
        cost_cents: tm.cost_cents + cost,
      });
      recordUsage(userId, "ai_brief", cost, tm.id);
      updateJobStep(
        jobId,
        step,
        {},
        `Direção criativa «${enriched.brief.conceptName}» (${enriched.engine === "remote" ? "fornecedor IA" : "motor local determinístico"})${enriched.error ? ` · ${enriched.error}` : ""}`,
      );
      return `Briefing gerado (${enriched.engine})`;
    }

    case "prompt": {
      const experience = tm.current_experience ?? emptyExperience(lead);
      const company = tm.company ?? buildCompanyIntelligence(lead, experience);
      if (!tm.brief) {
        throw new GenerationError("no_brief", "Gera a direção criativa antes do prompt master.");
      }
      const prompt = briefToMasterPrompt(lead, company, experience, tm.opportunities, tm.brief);
      updateTimeMachine(tm.id, { master_prompt: prompt });
      updateJobStep(jobId, step, {}, `Prompt master com ${prompt.length} caracteres.`);
      return "Prompt master gerado";
    }

    case "prototype": {
      if (!tm.brief) throw new GenerationError("no_brief", "Sem briefing criativo para construir o protótipo.");
      const experience = tm.current_experience ?? emptyExperience(lead);
      const company = tm.company ?? buildCompanyIntelligence(lead, experience);
      const version = (tm.prototype?.version ?? 0) + 1;
      const prototype = generatePrototype(lead, company, tm.brief, {
        version,
        engine: tm.brief.engine,
      });
      updateTimeMachine(tm.id, { prototype });
      updateJobStep(
        jobId,
        step,
        {},
        `Protótipo v${version} com ${prototype.pages.length} páginas navegáveis.`,
      );
      return `Protótipo v${version} construído`;
    }

    case "finalize": {
      const status: TmStatus = tm.showcase_status === "published" ? "published" : "review";
      updateTimeMachine(tm.id, { status, progress: 100, current_step: null });
      updateJobStep(jobId, step, {}, `Estado final: ${status}.`);
      return "Pronto para revisão";
    }

    default:
      return "ignorado";
  }
}

/** Marca jobs interrompidos (ex.: reinício do servidor) como falhados. */
export function recoverStaleJobs(): void {
  const db = getDb();
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const stale = db
    .prepare("SELECT id, time_machine_id FROM jobs WHERE status IN ('queued','running') AND created_at < ?")
    .all(cutoff) as { id: string; time_machine_id: string }[];
  for (const job of stale) {
    updateJob(job.id, {
      status: "failed",
      error: "Execução interrompida (reinício do processo). Podes repetir as etapas a partir do histórico.",
      finished_at: nowIso(),
    });
    updateTimeMachine(job.time_machine_id, {
      status: "failed",
      last_error: "Geração interrompida por reinício do servidor. Os dados parciais foram preservados.",
    });
  }
}



export function isRunning(timeMachineId: string): boolean {
  return running.has(timeMachineId);
}

export function jobStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    queued: "Em fila",
    running: "Em execução",
    succeeded: "Concluída",
    failed: "Falhou",
    cancelled: "Cancelada",
  };
  return labels[status];
}
