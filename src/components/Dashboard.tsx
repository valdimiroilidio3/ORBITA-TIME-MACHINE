"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Lead, TimeMachineSummary, TmStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { displayUrl, formatDate, initials } from "@/lib/format";
import { postJson } from "@/lib/client";
import { Progress, StatusPill } from "@/components/ui";

interface Props {
  items: TimeMachineSummary[];
  leads: Lead[];
  sectors: string[];
  canCreate: boolean;
}

const STATUS_OPTIONS: (TmStatus | "all" | "archived")[] = [
  "all",
  "awaiting",
  "analyzing",
  "capturing",
  "creative",
  "building",
  "review",
  "published",
  "failed",
  "archived",
];

export function Dashboard({ items, leads, sectors, canCreate }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [sector, setSector] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status === "archived") {
        if (!item.archived_at) return false;
      } else if (item.archived_at) {
        return false;
      } else if (status !== "all" && item.status !== status) {
        return false;
      }
      if (sector !== "all" && item.lead.sector !== sector) return false;
      if (from && item.created_at < `${from}T00:00:00.000Z`) return false;
      if (to && item.created_at > `${to}T23:59:59.999Z`) return false;
      if (!q) return true;
      return (
        item.lead.company_name.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        (item.lead.website ?? "").toLowerCase().includes(q) ||
        item.lead.sector.toLowerCase().includes(q)
      );
    });
  }, [items, query, status, sector, from, to]);

  const stats = useMemo(() => {
    const active = items.filter((item) => !item.archived_at);
    return {
      total: active.length,
      published: active.filter((item) => item.status === "published").length,
      review: active.filter((item) => item.status === "review").length,
      failed: active.filter((item) => item.status === "failed").length,
    };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-orbita-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Transformação digital visual</p>
          <h1 className="h-display max-w-2xl">Time Machine</h1>
          <p className="mt-2 max-w-xl text-[13.5px] text-orbita-muted">
            Transforma uma lead numa demonstração visual personalizada: análise do website atual, proposta ORBITA,
            comparação interativa e link privado de apresentação.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.12em] text-orbita-dim">
            <span>
              <strong className="mr-1 text-orbita-ink">{stats.total}</strong>projetos
            </span>
            <span>
              <strong className="mr-1 text-orbita-warn">{stats.review}</strong>revisão
            </span>
            <span>
              <strong className="mr-1 text-orbita-acid">{stats.published}</strong>publicados
            </span>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setDialogOpen(true)} disabled={!canCreate}>
            + Nova Time Machine
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-orbita-line bg-orbita-panel p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-orbita-dim" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar por lead, empresa ou website…"
            aria-label="Pesquisar leads e projetos"
            className="input pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input w-auto min-w-[150px] py-2 text-[13px]"
            value={status}
            onChange={(event) => setStatus(event.target.value as (typeof STATUS_OPTIONS)[number])}
            aria-label="Filtrar por estado"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "Todos os estados" : option === "archived" ? "Arquivados" : STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          <select
            className="input w-auto min-w-[140px] py-2 text-[13px]"
            value={sector}
            onChange={(event) => setSector(event.target.value)}
            aria-label="Filtrar por setor"
          >
            <option value="all">Todos os setores</option>
            {sectors.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-[12px] text-orbita-muted">
            De
            <input type="date" className="input w-auto py-2 text-[12.5px]" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-[12px] text-orbita-muted">
            Até
            <input type="date" className="input w-auto py-2 text-[12.5px]" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-orbita-line bg-orbita-panel/40 px-6 py-14 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-orbita-dim">Sem resultados</p>
          <p className="mx-auto mt-3 max-w-md text-[14px] text-orbita-ink">
            {items.length === 0
              ? "Ainda não existe nenhuma Time Machine. Começa por selecionar uma lead."
              : "Nenhum projeto corresponde aos filtros aplicados."}
          </p>
          {items.length === 0 && canCreate && (
            <button type="button" className="btn btn-primary mt-5" onClick={() => setDialogOpen(true)}>
              Criar a primeira Time Machine
            </button>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.id}>
              <Link
                href={`/tm/${item.id}`}
                className="group flex h-full flex-col rounded-lg border border-orbita-line bg-orbita-panel p-4 transition-all duration-200 ease-orbita hover:border-orbita-muted/50 hover:bg-orbita-raised"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-orbita-line bg-orbita-base font-display text-[13px] font-semibold tracking-[0.02em] text-orbita-ink">
                    {initials(item.lead.company_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium text-orbita-ink">{item.lead.company_name}</p>
                    <p className="truncate font-mono text-[11px] text-orbita-dim">
                      {displayUrl(item.lead.website)}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded border border-orbita-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-orbita-muted">
                    {item.lead.sector}
                  </span>
                  {item.archived_at && (
                    <span className="rounded border border-orbita-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-orbita-dim">
                      arquivado
                    </span>
                  )}
                  {item.showcase_status === "published" && (
                    <span className="rounded border border-orbita-acid/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-orbita-acid">
                      link ativo
                    </span>
                  )}
                  {item.opportunities.length > 0 && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-orbita-dim">
                      {item.opportunities.length} oportunidades
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-4">
                  {item.status === "failed" && item.last_error ? (
                    <p className="mb-2 line-clamp-2 text-[11.5px] text-orbita-danger/90">{item.last_error}</p>
                  ) : null}
                  {item.progress > 0 && item.progress < 100 && item.status !== "failed" ? (
                    <Progress value={item.progress} running label="Em curso" />
                  ) : (
                    <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.12em] text-orbita-dim">
                      <span>{formatDate(item.created_at)}</span>
                      <span className="transition-colors group-hover:text-orbita-acid">abrir →</span>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {dialogOpen && (
        <NewTimeMachineDialog
          leads={leads}
          onClose={() => setDialogOpen(false)}
          onCreated={(id) => {
            setBusy(false);
            router.push(`/tm/${id}`);
          }}
          busy={busy}
          setBusy={setBusy}
        />
      )}
    </div>
  );
}

function NewTimeMachineDialog({
  leads,
  onClose,
  onCreated,
  busy,
  setBusy,
}: {
  leads: Lead[];
  onClose: () => void;
  onCreated: (id: string) => void;
  busy: boolean;
  setBusy: (value: boolean) => void;
}) {
  const [selected, setSelected] = useState<string>(leads[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"existing" | "new">(leads.length === 0 ? "new" : "existing");
  const [autoStart, setAutoStart] = useState(true);
  const [newLead, setNewLead] = useState({
    company_name: "",
    sector: "indefinido",
    location: "",
    website: "",
    contact_email: "",
    contact_phone: "",
    services: "",
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const filteredLeads = leads.filter((lead) =>
    `${lead.company_name} ${lead.sector} ${lead.website ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleCreate() {
    setError(null);
    setBusy(true);
    try {
      let leadId = selected;
      if (mode === "new") {
        if (newLead.company_name.trim().length < 2) throw new Error("Indica o nome da empresa.");
        const created = await postJson<{ lead: Lead }>("/api/leads", {
          company_name: newLead.company_name.trim(),
          sector: newLead.sector.trim() || "indefinido",
          location: newLead.location.trim() || null,
          website: newLead.website.trim() || null,
          contact_email: newLead.contact_email.trim() || null,
          contact_phone: newLead.contact_phone.trim() || null,
          services: newLead.services
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 10),
        });
        leadId = created.lead.id;
      }
      if (!leadId) throw new Error("Seleciona uma lead.");
      const result = await postJson<{ timeMachine: { id: string } }>("/api/time-machines", {
        leadId,
        autoStart,
      });
      startTransition(() => onCreated(result.timeMachine.id));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível criar a Time Machine.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-tm-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-orbita-line bg-orbita-panel shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-orbita-line px-5 py-4">
          <div>
            <p className="eyebrow mb-1">Nova geração</p>
            <h2 id="new-tm-title" className="h-section">
              Selecionar lead
            </h2>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Fechar
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          <div className="flex gap-1 rounded-md border border-orbita-line bg-orbita-base p-1">
            <button
              type="button"
              className={`flex-1 rounded px-3 py-1.5 text-[12.5px] ${mode === "existing" ? "bg-orbita-raised text-orbita-ink" : "text-orbita-muted"}`}
              onClick={() => setMode("existing")}
              disabled={leads.length === 0}
            >
              Lead existente ({leads.length})
            </button>
            <button
              type="button"
              className={`flex-1 rounded px-3 py-1.5 text-[12.5px] ${mode === "new" ? "bg-orbita-raised text-orbita-ink" : "text-orbita-muted"}`}
              onClick={() => setMode("new")}
            >
              Criar lead
            </button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-2">
              <input
                className="input"
                placeholder="Pesquisar lead…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Pesquisar lead"
              />
              <ul role="listbox" aria-label="Leads disponíveis" className="scroll-x max-h-64 space-y-1 overflow-y-auto pr-1">
                {filteredLeads.map((lead) => (
                  <li key={lead.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected === lead.id}
                      onClick={() => setSelected(lead.id)}
                      className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors ${
                        selected === lead.id
                          ? "border-orbita-acid/60 bg-orbita-acid/5"
                          : "border-orbita-line bg-orbita-base hover:border-orbita-muted/40"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-[13.5px] text-orbita-ink">{lead.company_name}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-orbita-dim">{lead.sector}</span>
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[11px] text-orbita-dim">
                        {displayUrl(lead.website)}
                        {lead.location ? ` · ${lead.location}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
                {filteredLeads.length === 0 && (
                  <li className="px-2 py-6 text-center text-[13px] text-orbita-muted">Nenhuma lead encontrada.</li>
                )}
              </ul>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="lead-name">
                  Empresa *
                </label>
                <input
                  id="lead-name"
                  className="input"
                  value={newLead.company_name}
                  onChange={(event) => setNewLead({ ...newLead, company_name: event.target.value })}
                  placeholder="Ex.: Padaria do Bairro"
                />
              </div>
              <div>
                <label className="label" htmlFor="lead-sector">
                  Setor
                </label>
                <input
                  id="lead-sector"
                  className="input"
                  value={newLead.sector}
                  onChange={(event) => setNewLead({ ...newLead, sector: event.target.value })}
                  placeholder="restauração, clínica, indústria…"
                />
              </div>
              <div>
                <label className="label" htmlFor="lead-location">
                  Localização
                </label>
                <input
                  id="lead-location"
                  className="input"
                  value={newLead.location}
                  onChange={(event) => setNewLead({ ...newLead, location: event.target.value })}
                  placeholder="Coimbra"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="lead-website">
                  Website atual
                </label>
                <input
                  id="lead-website"
                  className="input"
                  value={newLead.website}
                  onChange={(event) => setNewLead({ ...newLead, website: event.target.value })}
                  placeholder="https://exemplo.pt"
                />
              </div>
              <div>
                <label className="label" htmlFor="lead-email">
                  Email
                </label>
                <input
                  id="lead-email"
                  className="input"
                  value={newLead.contact_email}
                  onChange={(event) => setNewLead({ ...newLead, contact_email: event.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="lead-phone">
                  Telefone
                </label>
                <input
                  id="lead-phone"
                  className="input"
                  value={newLead.contact_phone}
                  onChange={(event) => setNewLead({ ...newLead, contact_phone: event.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="lead-services">
                  Serviços (separados por vírgula)
                </label>
                <input
                  id="lead-services"
                  className="input"
                  value={newLead.services}
                  onChange={(event) => setNewLead({ ...newLead, services: event.target.value })}
                  placeholder="Reservas, Menu sazonal, Eventos"
                />
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded border border-orbita-danger/40 bg-orbita-danger/10 px-3 py-2 text-[12.5px] text-orbita-danger">
              {error}
            </p>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-orbita-line px-5 py-4">
          <label className="flex items-center gap-2 text-[11.5px] text-orbita-muted">
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(event) => setAutoStart(event.target.checked)}
              className="h-3.5 w-3.5 accent-orbita-acid"
            />
            Iniciar geração automaticamente
          </label>
          <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={busy}>
            {busy ? "A criar…" : "Criar e abrir"}
          </button>
        </footer>
      </div>
    </div>
  );
}
