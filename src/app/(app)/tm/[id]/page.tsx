import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { can } from "@/lib/auth";
import { requireUser } from "@/lib/current-user";
import { getLatestJob, getLead, getTimeMachine, listJobs } from "@/lib/repo";
import { latestArtifacts } from "@/lib/artifacts";
import { displayUrl, formatDate, relativeTime } from "@/lib/format";
import { BriefSection, CompanySection, ExperienceSection, OpportunitySection } from "@/components/AnalysisSections";
import { Comparison } from "@/components/Comparison";
import { Panel, StatusPill, Tag } from "@/components/ui";
import { PromptEditor } from "@/components/PromptEditor";
import { RunPanel } from "@/components/RunPanel";
import { ShowcasePanel } from "@/components/ShowcasePanel";
import { UploadCapture } from "@/components/UploadCapture";
import { LeadEditor } from "@/components/LeadEditor";
import { TmActions } from "@/components/TmActions";
import { STEP_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tm = getTimeMachine(id);
  return { title: tm ? tm.title : "Time Machine" };
}

export default async function TimeMachinePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const tm = getTimeMachine(id);
  if (!tm) notFound();
  const lead = getLead(tm.lead_id);
  if (!lead) notFound();

  const job = getLatestJob(tm.id);
  const jobs = listJobs(tm.id, 6);
  const artifacts = latestArtifacts(tm.id);
  const beforeDesktop = artifacts["screenshot-desktop"] ? `/api/artifacts/${artifacts["screenshot-desktop"]!.id}` : undefined;
  const beforeMobile = artifacts["screenshot-mobile"] ? `/api/artifacts/${artifacts["screenshot-mobile"]!.id}` : undefined;

  const canRun = can(user, "tm:run");
  const canEdit = can(user, "tm:edit");
  const canShare = can(user, "tm:share");
  const canPublish = can(user, "tm:publish");
  const canDelete = can(user, "tm:delete");

  return (
    <div className="space-y-5">
      <nav aria-label="Trilho de navegação" className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-orbita-dim">
        <Link href="/" className="transition-colors hover:text-orbita-ink">
          Projetos
        </Link>
        <span aria-hidden>/</span>
        <span className="text-orbita-muted">{lead.company_name}</span>
      </nav>

      <header className="flex flex-col gap-4 border-b border-orbita-line pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusPill status={tm.status} />
            {tm.archived_at && <span className="pill border-orbita-line text-orbita-dim">arquivado</span>}
            <span className="pill border-orbita-line text-orbita-muted">{lead.sector}</span>
            {lead.location && <span className="pill border-orbita-line text-orbita-muted">{lead.location}</span>}
          </div>
          <h1 className="h-display truncate">{lead.company_name}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-orbita-dim">
            <span>{displayUrl(lead.website)}</span>
            <span aria-hidden>·</span>
            <span>criada {formatDate(tm.created_at)}</span>
            <span aria-hidden>·</span>
            <span>atualizada {relativeTime(tm.updated_at)}</span>
            {tm.current_step && (
              <>
                <span aria-hidden>·</span>
                <span className="text-orbita-info">{STEP_LABELS[tm.current_step]}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tm.prototype && (
            <a
              className="btn btn-ghost btn-sm"
              href={`/api/prototype/${tm.id}/${tm.prototype.entry}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver protótipo ↗
            </a>
          )}
          <TmActions timeMachineId={tm.id} archived={Boolean(tm.archived_at)} canEdit={canEdit} canDelete={canDelete} />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <Panel
            eyebrow="Time Machine"
            title="Comparação interativa"
            id="comparacao"
            actions={
              tm.prototype ? (
                <span className="data">protótipo v{tm.prototype.version} · {tm.prototype.pages.length} páginas</span>
              ) : undefined
            }
          >
            <Comparison
              timeMachineId={tm.id}
              companyName={lead.company_name}
              beforeDesktop={beforeDesktop}
              beforeMobile={beforeMobile}
              captureSource={tm.current_experience?.captureSource ?? "none"}
              capturedAt={tm.current_experience?.capturedAt ?? null}
              prototype={
                tm.prototype
                  ? {
                      entry: tm.prototype.entry,
                      pages: tm.prototype.pages.map((page) => ({ slug: page.slug, title: page.title })),
                    }
                  : null
              }
            />
          </Panel>

          <CompanySection company={tm.company} lead={lead} />
          <ExperienceSection experience={tm.current_experience} lead={lead} />
          <OpportunitySection opportunities={tm.opportunities} />
          <BriefSection brief={tm.brief} />

          <Panel
            eyebrow="Prompt master"
            title="Direção para design & desenvolvimento"
            id="prompt"
            actions={<Tag>editável</Tag>}
          >
            {tm.master_prompt ? (
              <PromptEditor timeMachineId={tm.id} initialPrompt={tm.master_prompt} editable={canEdit} />
            ) : (
              <p className="text-[13px] text-orbita-muted">
                O prompt master é gerado automaticamente a partir do contexto real da empresa, das evidências
                recolhidas e da direção criativa. Corre a etapa «Prompt master» na geração.
              </p>
            )}
          </Panel>

          {tm.prototype && (
            <Panel eyebrow="Protótipo" title="Páginas navegáveis" id="prototipo">
              <ul className="grid gap-2 sm:grid-cols-3">
                {tm.prototype.pages.map((page) => (
                  <li key={page.slug}>
                    <a
                      href={`/api/prototype/${tm.id}/${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-full flex-col justify-between rounded-md border border-orbita-line bg-orbita-base p-3 transition-colors hover:border-orbita-muted/50"
                    >
                      <span className="text-[13px] text-orbita-ink">{page.title}</span>
                      <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-orbita-dim">
                        /{page.slug} ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              <ul className="mt-3 space-y-1 font-mono text-[10.5px] text-orbita-dim">
                {tm.prototype.notes.map((note) => (
                  <li key={note}>· {note}</li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-[72px]">
          <Panel eyebrow="Geração" title="Pipeline">
            <RunPanel
              timeMachineId={tm.id}
              initialTimeMachine={{
                status: tm.status,
                progress: tm.progress,
                current_step: tm.current_step,
                last_error: tm.last_error,
                ai_calls: tm.ai_calls,
                cost_cents: tm.cost_cents,
                showcase_status: tm.showcase_status,
              }}
              initialJob={job}
              canRun={canRun}
            />
          </Panel>

          <Panel eyebrow="Apresentação" title="Link privado">
            <ShowcasePanel
              timeMachine={tm}
              canShare={canShare}
              canPublish={canPublish}
              hasPrototype={Boolean(tm.prototype)}
            />
          </Panel>

          <Panel eyebrow="Captura" title="Origem das imagens">
            <div className="space-y-3">
              <UploadCapture timeMachineId={tm.id} canEdit={canEdit} />
              <LeadEditor lead={lead} canEdit={canEdit} />
            </div>
          </Panel>

          <Panel eyebrow="Histórico" title="Execuções">
            {jobs.length === 0 ? (
              <p className="text-[12.5px] text-orbita-dim">Sem execuções registadas.</p>
            ) : (
              <ul className="space-y-2">
                {jobs.map((item) => (
                  <li key={item.id} className="rounded border border-orbita-line/70 bg-orbita-base px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-orbita-muted">
                        {item.id.slice(-6)}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                          item.status === "failed"
                            ? "text-orbita-danger"
                            : item.status === "succeeded"
                              ? "text-orbita-acid"
                              : "text-orbita-info"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-orbita-dim">
                      {formatDate(item.created_at, true)} · {item.steps.filter((s) => s.status === "done").length}/
                      {item.steps.filter((s) => s.status !== "skipped").length} etapas · {item.cost_cents}¢
                    </p>
                    {item.error && <p className="mt-1 text-[11px] text-orbita-danger/90">{item.error}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
