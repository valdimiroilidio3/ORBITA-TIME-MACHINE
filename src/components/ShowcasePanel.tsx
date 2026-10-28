"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ShowcaseStatus, TimeMachine } from "@/lib/types";
import { SHOWCASE_LABELS } from "@/lib/types";
import { postJson } from "@/lib/client";
import { formatDate } from "@/lib/format";

interface Props {
  timeMachine: TimeMachine;
  canShare: boolean;
  canPublish: boolean;
  hasPrototype: boolean;
}

export function ShowcasePanel({ timeMachine, canShare, canPublish, hasPrototype }: Props) {
  const router = useRouter();
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const revoked = Boolean(timeMachine.showcase_revoked_at);
  const hasToken = Boolean(timeMachine.showcase_token_hash) && !revoked;
  const expired =
    Boolean(timeMachine.showcase_expires_at) && new Date(timeMachine.showcase_expires_at!).getTime() < Date.now();

  async function act(action: "issue" | "rotate" | "revoke" | "status", status?: ShowcaseStatus) {
    setBusy(action);
    setError(null);
    setCopied(false);
    try {
      const response = await postJson<{ link?: { path: string } }>(`/api/time-machines/${timeMachine.id}/showcase`, {
        action,
        ...(status ? { status } : {}),
        ...(action === "issue" || action === "rotate" ? { ttlDays: 30 } : {}),
      });
      if (response.link) {
        const absolute = `${window.location.origin}${response.link.path}`;
        setLink(absolute);
        try {
          await navigator.clipboard.writeText(absolute);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }
      router.refresh();
    } catch (actError) {
      setError(actError instanceof Error ? actError.message : "Ação falhou.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">Estado comercial</span>
        <span
          className={`pill ${
            timeMachine.showcase_status === "published"
              ? "border-orbita-acid/40 text-orbita-acid"
              : timeMachine.showcase_status === "review"
                ? "border-orbita-warn/40 text-orbita-warn"
                : "border-orbita-line text-orbita-muted"
          }`}
        >
          {SHOWCASE_LABELS[timeMachine.showcase_status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-md border border-orbita-line bg-orbita-base p-1">
        {(["draft", "review", "published"] as ShowcaseStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            disabled={!canPublish || busy !== null || timeMachine.showcase_status === status}
            onClick={() => act("status", status)}
            className={`rounded px-2 py-1.5 text-[11.5px] transition-colors disabled:opacity-50 ${
              timeMachine.showcase_status === status ? "bg-orbita-raised text-orbita-ink" : "text-orbita-muted hover:text-orbita-ink"
            } ${status === "published" ? "col-span-2" : ""}`}
            title={!canPublish ? "Apenas administradores alteram o estado comercial" : undefined}
          >
            {SHOWCASE_LABELS[status]}
          </button>
        ))}
      </div>

      <dl className="space-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-orbita-dim">
        <div className="flex justify-between gap-2">
          <dt>Link</dt>
          <dd className={hasToken && !expired ? "text-orbita-acid" : "text-orbita-muted"}>
            {revoked ? "revogado" : !hasToken ? "não emitido" : expired ? "expirado" : "ativo"}
          </dd>
        </div>
        {timeMachine.showcase_token_hint && (
          <div className="flex justify-between gap-2">
            <dt>Token</dt>
            <dd className="text-orbita-muted">{timeMachine.showcase_token_hint}</dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt>Expira</dt>
          <dd className="text-orbita-muted">{formatDate(timeMachine.showcase_expires_at)}</dd>
        </div>
      </dl>

      <p className="text-[11.5px] leading-relaxed text-orbita-muted">
        O link é individual e não previsível: o token é trocado por um cookie HttpOnly na primeira visita. O acesso
        pode ser revogado a qualquer momento.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm flex-1"
          onClick={() => act(hasToken ? "rotate" : "issue")}
          disabled={!canShare || !hasPrototype || busy !== null}
          title={!hasPrototype ? "Gera um protótipo primeiro" : undefined}
        >
          {busy === "issue" || busy === "rotate" ? "A gerar…" : hasToken ? "Novo link" : "Gerar link privado"}
        </button>
        {hasToken && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => act("revoke")} disabled={!canShare || busy !== null}>
            Revogar
          </button>
        )}
      </div>

      {link && (
        <div className="rounded border border-orbita-acid/30 bg-orbita-acid/5 p-2.5">
          <p className="eyebrow mb-1 text-orbita-acid">{copied ? "Link copiado" : "Link de apresentação"}</p>
          <input readOnly value={link} className="input font-mono text-[10.5px]" onFocus={(e) => e.currentTarget.select()} aria-label="Link privado de apresentação" />
          <a href={link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11.5px] text-orbita-ink underline decoration-orbita-line underline-offset-4 hover:decoration-orbita-acid">
            Abrir apresentação ↗
          </a>
        </div>
      )}

      {error && <p role="alert" className="text-[11.5px] text-orbita-danger">{error}</p>}
      {!canShare && <p className="text-[11.5px] text-orbita-dim">Sem permissão para partilhar este projeto.</p>}
    </div>
  );
}
