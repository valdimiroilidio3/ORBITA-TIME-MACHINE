import Link from "next/link";
import type { ReactNode } from "react";
import { STATUS_LABELS, type TmStatus, type Priority } from "@/lib/types";

const STATUS_STYLES: Record<TmStatus, string> = {
  awaiting: "border-orbita-line bg-orbita-raised text-orbita-muted",
  analyzing: "border-orbita-info/40 bg-orbita-info/10 text-orbita-info",
  capturing: "border-orbita-info/40 bg-orbita-info/10 text-orbita-info",
  creative: "border-orbita-acid/40 bg-orbita-acid/10 text-orbita-acid",
  building: "border-orbita-acid/40 bg-orbita-acid/10 text-orbita-acid",
  review: "border-orbita-warn/40 bg-orbita-warn/10 text-orbita-warn",
  published: "border-orbita-acid/50 bg-orbita-acid/15 text-orbita-acid",
  failed: "border-orbita-danger/40 bg-orbita-danger/10 text-orbita-danger",
};

const STATUS_DOT: Record<TmStatus, string> = {
  awaiting: "bg-orbita-dim",
  analyzing: "bg-orbita-info animate-pulse",
  capturing: "bg-orbita-info animate-pulse",
  creative: "bg-orbita-acid animate-pulse",
  building: "bg-orbita-acid animate-pulse",
  review: "bg-orbita-warn",
  published: "bg-orbita-acid",
  failed: "bg-orbita-danger",
};

export function StatusPill({ status, className = "" }: { status: TmStatus; className?: string }) {
  return (
    <span className={`pill ${STATUS_STYLES[status]} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    alta: "border-orbita-danger/40 text-orbita-danger",
    média: "border-orbita-warn/40 text-orbita-warn",
    baixa: "border-orbita-line text-orbita-muted",
  };
  return <span className={`pill ${styles[priority]}`}>Prioridade {priority}</span>;
}

export function Progress({
  value,
  running = false,
  label,
}: {
  value: number;
  running?: boolean;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="eyebrow">{label ?? "Progresso"}</span>
        <span className="data">{clamped}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progresso da geração"}
      >
        <div className={`progress-fill ${running ? "is-running" : ""}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function Panel({
  title,
  eyebrow,
  actions,
  children,
  className = "",
  id,
}: {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`surface ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-orbita-line px-4 py-3.5 sm:px-5">
          <div>
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            {title && <h2 className="h-section">{title}</h2>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon = "○",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-orbita-line bg-orbita-base/60 px-4 py-6">
      <span aria-hidden className="font-mono text-lg text-orbita-dim">
        {icon}
      </span>
      <p className="text-[14px] font-medium text-orbita-ink">{title}</p>
      <p className="max-w-prose text-[13px] text-orbita-muted">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function Field({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow mb-1">{label}</p>
      <div className={`text-[13.5px] text-orbita-ink ${mono ? "font-mono text-[12.5px]" : ""} break-words`}>{value}</div>
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-orbita-line bg-orbita-base px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-orbita-muted">
      {children}
    </span>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="ORBITA Time Machine — início">
      <span className="relative grid h-7 w-7 place-items-center rounded-full border border-orbita-acid/60">
        <span className="h-1.5 w-1.5 rounded-full bg-orbita-acid transition-transform duration-500 ease-orbita group-hover:scale-150" />
        <span className="absolute inset-0 rounded-full border border-orbita-acid/20 transition-transform duration-700 ease-orbita group-hover:rotate-180" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[13px] font-semibold tracking-[0.16em] text-orbita-ink">ORBITA</span>
        {!compact && (
          <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.22em] text-orbita-dim">Time Machine</span>
        )}
      </span>
    </Link>
  );
}
