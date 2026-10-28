import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "orbita-pipeline-"));
process.env.ORBITA_DATA_DIR = dataDir;
process.env.CAPTURE_ENABLED = "true";
process.env.AI_PROVIDER = "local";
process.env.LIMIT_MAX_CONCURRENT_JOBS = "2";
process.env.LIMIT_RUNS_PER_HOUR = "50";

let repo: typeof import("@/lib/repo");
let jobs: typeof import("@/lib/jobs");
let auth: typeof import("@/lib/auth");
let userId: string;

beforeAll(async () => {
  repo = await import("@/lib/repo");
  jobs = await import("@/lib/jobs");
  auth = await import("@/lib/auth");
  auth.ensureSeedUsers();
  userId = auth.authenticate("admin@orbita.pt", "orbita-time-machine")!.id;
});

async function waitForJob(jobId: string, timeoutMs = 25_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = repo.getJob(jobId);
    if (job && job.status !== "running" && job.status !== "queued") return job;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Job não terminou dentro do tempo esperado.");
}

function makeTm(website: string | null) {
  const lead = repo.createLead(
    {
      company_name: website ? "Empresa com Site" : "Empresa sem Site",
      sector: "indústria",
      location: "Mealhada",
      website,
      services: ["Produção", "Manutenção"],
    },
    userId,
  );
  return repo.createTimeMachine(lead, userId);
}

describe("GenerationJobManager", () => {
  it("executa o fluxo completo com site inacessível e preserva resultados", async () => {
    const tm = makeTm("https://dominio-inacessivel-orbita.invalid");
    const job = jobs.startGeneration({
      timeMachineId: tm.id,
      steps: ["ingest", "capture", "analyze", "brief", "prompt", "prototype", "finalize"],
      userId,
    });
    const finished = await waitForJob(job.id);
    expect(finished.status).toBe("succeeded");

    const stored = repo.getTimeMachine(tm.id)!;
    expect(stored.status).toBe("review");
    expect(stored.progress).toBe(100);
    expect(stored.company?.companyName).toBe("Empresa com Site");
    expect(stored.opportunities.length).toBeGreaterThan(0);
    expect(stored.brief?.archetype).toBe("industrial");
    expect(stored.master_prompt).toContain("PROMPT MASTER");
    expect(stored.prototype?.pages.length).toBe(3);
    expect(stored.current_experience?.reachable).toBe(false);
    expect(stored.current_experience?.captureError).toBeTruthy();
    // Sem captura, a comparação mostra estado alternativo e nunca uma imagem inventada.
    expect(stored.current_experience?.screenshots.desktop).toBeUndefined();
    const captureStep = finished.steps.find((step) => step.key === "capture")!;
    expect(captureStep.status).toBe("done");
    expect(captureStep.log.join(" ")).toMatch(/inacessível|prossegue/i);
  });

  it("funciona sem website registado", async () => {
    const tm = makeTm(null);
    const job = jobs.startGeneration({
      timeMachineId: tm.id,
      steps: ["ingest", "capture", "analyze", "brief", "prompt", "prototype", "finalize"],
      userId,
    });
    const finished = await waitForJob(job.id);
    expect(finished.status).toBe("succeeded");
    const stored = repo.getTimeMachine(tm.id)!;
    expect(stored.current_experience?.captureSource).toBe("none");
    expect(stored.opportunities[0].observation).toMatch(/não tem website/i);
    expect(stored.prototype).not.toBeNull();
  });

  it("regenera apenas a etapa pedida e preserva o resto", async () => {
    const tm = makeTm(null);
    const job = jobs.startGeneration({
      timeMachineId: tm.id,
      steps: ["ingest", "capture", "analyze", "brief", "prompt", "prototype", "finalize"],
      userId,
    });
    await waitForJob(job.id);
    const first = repo.getTimeMachine(tm.id)!;
    const originalPrompt = first.master_prompt;
    const prototypeV1 = first.prototype!.version;

    const second = jobs.startGeneration({ timeMachineId: tm.id, steps: ["prototype"], userId });
    await waitForJob(second.id);
    const updated = repo.getTimeMachine(tm.id)!;
    expect(updated.prototype!.version).toBe(prototypeV1 + 1);
    expect(updated.master_prompt).toBe(originalPrompt);
    expect(updated.opportunities).toEqual(first.opportunities);
  });

  it("marca falha quando uma etapa obrigatória não tem pré-requisitos", async () => {
    const tm = makeTm(null);
    const job = jobs.startGeneration({ timeMachineId: tm.id, steps: ["prototype"], userId });
    const finished = await waitForJob(job.id);
    expect(finished.status).toBe("failed");
    expect(finished.error).toMatch(/briefing/i);
    const stored = repo.getTimeMachine(tm.id)!;
    expect(stored.status).toBe("failed");
    expect(stored.last_error).toMatch(/prototype/i);
    // Dados anteriores não são destruídos por uma falha.
    expect(repo.getLead(tm.lead_id)).not.toBeNull();
  });

  it("recusa duas gerações simultâneas para o mesmo projeto", async () => {
    const tm = makeTm(null);
    const job = jobs.startGeneration({ timeMachineId: tm.id, steps: ["ingest", "brief"], userId });
    expect(() =>
      jobs.startGeneration({ timeMachineId: tm.id, steps: ["brief"], userId }),
    ).toThrow(/em curso/i);
    await waitForJob(job.id);
  });

  it("registra utilização para limites por hora", () => {
    expect(repo.runsInLastHour(userId)).toBeGreaterThan(0);
  });
});
