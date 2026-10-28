"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Job, StepKey, TimeMachine } from "@/lib/types";
import { STEP_LABELS, STEP_ORDER } from "@/lib/types";
import { apiFetch, postJson } from "@/lib/client";
import { Progress, StatusPill } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface Props {
  timeMachineId: string;
  initialTimeMachine: Pick<TimeMachine, "status" | "progress" | "current_step" | "last_error" | "ai_calls" | "cost_cents" | "showcase_status">;
  initialJob: Job | null;
  canRun: boolean;
}

interface StatusPayload {
  timeMachine: Pick<TimeMachine, "status" | "progress" | "current_step" | "last_error" | "ai_calls" | "cost_cents" | "showcase_status">;
  job: Job | null;
}

const STEP_SHORT: Record<StepKey, string> = {
  ingest: "Recolha",
  capture: "Captura",
  analyze: "Análise",
  brief: "Direção",
  prompt: "Prompt",
  prototype: "Protótipo",
  finalize: "Revisão",
};

export function RunPanel({ timeMachineId, initialTimeMachine, initialJob, canRun }: Props) {
  const router = useRouter();
  const [tm, setTm] = useState(initialTimeMachine);
  const [job, setJob] = useState<Job | null>(initialJob);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const running = job ? job.status === "running" || job.status === "queued" : false;

  const loadStatus = useCallback(async () => {
    try {
      const payload = await apiFetch<StatusPayload>(`/api/time-machines/${timeMachineId}`);
      setTm(payload.timeMachine);
      setJob(payload.job);
      if (payload.job && payload.job.status !== "running" && payload.job.status !== "queued") {
        router.refresh();
      }
    } catch {
      /* mantém último estado conhecido */
    }
  }, [router, timeMachineId]);

  useEffect(() => {
    if (!running) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(loadStatus, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [running, loadStatus]);

  async function run(steps?: StepKey[]) {
    setBusy(true);
    setError(null);
    try {
      const result = await postJson<{ job: Job; timeMachine: StatusPayload["timeMachine"] }>(
        `/api/time-machines/${timeMachineId}/run`,
        steps ? { steps } : {},
      );
      setJob(result.job);
      setTm(result.timeMachine);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Não foi possível iniciar a geração.");
    } finally {
      setBusy(false);
    }
  }

  const stepStates = STEP_ORDER.map((key) => {
    const step = job?.steps.find((item) => item.key === key);
    return { key, status: step?.status ?? "pending", error: step?.error ?? null, duration: step?.duration_ms ?? null };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <StatusPill status={tm.status} />
        <span className="data">{tm.ai_calls} chamadas IA · {tm.cost_cents}¢</span>
      </div>

      <Progress
        value={tm.progress}
        running={running}
        label={tm.current_step ? `${STEP_LABELS[tm.current_step]}` : "Progresso real"}
      />

      <div className="space-y-1.5">
        {stepStates.map((step) => (
          <div key={step.key} className="flex items-center justify-between gap-2 rounded border border-orbita-line/70 bg-orbita-base px-2.5 py-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <StepIcon status={step.status} />
              <span className="truncate text-[12.5px] text-orbita-ink">{STEP_LABELS[step.key]}</span>
            </div>
            <div className="flex items-center gap-2">
              {step.duration != null && <span className="data hidden sm:inline">{(step.duration / 1000).toFixed(1)}s</span>}
              {canRun && (
                <button
                  type="button"
                  onClick={() => run([step.key])}
                  disabled={busy || running}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-orbita-dim transition-colors hover:text-orbita-acid disabled:opacity-40"
                  title={`Repetir etapa: ${STEP_LABELS[step.key]}`}
                >
                  repetir
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {job?.steps
        .filter((step) => step.error)
        .map((step) => (
          <p key={step.key} className="rounded border border-orbita-danger/30 bg-orbita-danger/5 px-2.5 py-2 text-[11.5px] text-orbita-danger">
            {STEP_SHORT[step.key]}: {step.error}
          </p>
        ))}

      {tm.last_error && !running && (
        <p className="rounded border border-orbita-danger/30 bg-orbita-danger/5 px-2.5 py-2 text-[11.5px] text-orbita-danger">
          {tm.last_error}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded border border-orbita-danger/40 bg-orbita-danger/10 px-2.5 py-2 text-[11.5px] text-orbita-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={() => run()} disabled={!canRun || busy || running}>
          {running ? "A gerar…" : job?.status === "failed" ? "Repetir geração" : "Gerar tudo"}
        </button>
        {job?.status === "failed" && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => run(job.steps.filter((s) => s.status !== "done").map((s) => s.key))}
            disabled={!canRun || busy || running}
            title="Retoma a partir das etapas que falharam, preservando resultados já obtidos"
          >
            Retomar
          </button>
        )}
      </div>

      {job && (
        <p className="font-mono text-[10.5px] leading-relaxed text-orbita-dim">
          Job {job.id.slice(-6)} · {job.status} · {job.finished_at ? formatDate(job.finished_at, true) : "em curso"}
        </p>
      )}

      {!canRun && (
        <p className="text-[11.5px] text-orbita-dim">
          O teu perfil tem acesso de leitura. A geração está reservada a membros e administradores.
        </p>
      )}
    </div>
  );
}

function StepIcon({ status }: { status: string }) {
  const map: Record<string, { glyph: string; className: string }> = {
    done: { glyph: "✓", className: "text-orbita-acid border-orbita-acid/40" },
    running: { glyph: "◐", className: "text-orbita-info border-orbita-info/40 animate-pulse" },
    failed: { glyph: "✕", className: "text-orbita-danger border-orbita-danger/40" },
    skipped: { glyph: "–", className: "text-orbita-dim border-orbita-line" },
    pending: { glyph: "·", className: "text-orbita-dim border-orbita-line" },
  };
  const item = map[status] ?? map.pending;
  return (
    <span
      aria-hidden
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border font-mono text-[9px] leading-none ${item.className}`}
    >
      {item.glyph}
    </span>
  );
}
