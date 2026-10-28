import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { config } from "@/lib/config";
import { getLead, getTimeMachineBySlug } from "@/lib/repo";
import { latestArtifacts } from "@/lib/artifacts";
import { sessionUserFromCookies } from "@/lib/access";
import { showCaseLinkState, verifyShowcaseToken } from "@/lib/showcase";
import { hasShowcaseCookie } from "@/lib/showcase-server";
import { formatDate } from "@/lib/format";
import { Comparison } from "@/components/Comparison";
import { BrandMark, PriorityPill, Tag } from "@/components/ui";
import { ARCHETYPES } from "@/lib/creative/archetypes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proposta privada",
  robots: { index: false, follow: false, nocache: true },
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string }>;
}

export default async function ShowcasePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { k } = await searchParams;
  const tm = getTimeMachineBySlug(slug);
  if (!tm) return <Unavailable motivo="Este link não existe." />;

  const link = showCaseLinkState(tm);
  const team = await sessionUserFromCookies();

  // Primeira visita com token: troca por cookie HttpOnly e limpa o URL.
  if (k && link.active && verifyShowcaseToken(tm, k)) {
    redirect(`/api/showcase/${slug}/access?k=${encodeURIComponent(k)}`);
  }

  const granted = team ? true : link.active && (await hasShowcaseCookie(tm));
  if (!granted) {
    return (
      <Unavailable
        motivo={
          link.reason ??
          "Este é um link privado. Pede um novo acesso ao teu contacto na ORBITA."
        }
      />
    );
  }

  const lead = getLead(tm.lead_id);
  if (!lead) return <Unavailable motivo="Os dados desta proposta foram removidos." />;

  const artifacts = latestArtifacts(tm.id);
  const beforeDesktop = artifacts["screenshot-desktop"] ? `/api/artifacts/${artifacts["screenshot-desktop"]!.id}` : undefined;
  const beforeMobile = artifacts["screenshot-mobile"] ? `/api/artifacts/${artifacts["screenshot-mobile"]!.id}` : undefined;
  const archetype = tm.brief ? ARCHETYPES[tm.brief.archetype as keyof typeof ARCHETYPES] : undefined;

  const quoteSubject = encodeURIComponent(`Proposta de website — ${lead.company_name}`);
  const quoteBody = encodeURIComponent(
    `Olá equipa ORBITA,\n\nVi a proposta criada para ${lead.company_name} e gostaria de avançar.\n\nObrigado.`,
  );
  const quoteHref = `mailto:${config.showcase.contactEmail}?subject=${quoteSubject}&body=${quoteBody}`;
  const whatsappHref = lead.whatsapp || config.showcase.whatsapp
    ? `https://wa.me/${(lead.whatsapp || config.showcase.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá! Vi a proposta para ${lead.company_name} e gostaria de falar sobre o próximo passo.`,
      )}`
    : null;
  const meetingHref = `mailto:${config.showcase.contactEmail}?subject=${encodeURIComponent(
    `Reunião — proposta ${lead.company_name}`,
  )}&body=${encodeURIComponent(`Olá,\n\nGostaria de agendar uma reunião de 30 minutos para rever a proposta de ${lead.company_name}.\n\nDisponibilidade:\n`)}`;

  return (
    <div className="min-h-screen">
      <header className="border-b border-orbita-line">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <BrandMark />
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-orbita-dim sm:inline">
              Apresentação privada
            </span>
            {team && (
              <Link href={`/tm/${tm.id}`} className="btn btn-ghost btn-sm">
                Abrir no workspace
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-orbita-acid/20 bg-orbita-acid/[0.04]">
        <div className="shell py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-orbita-acid">
          Conceito demonstrativo · não é o website oficial de {lead.company_name}
        </div>
      </div>

      <main className="shell space-y-14 py-10 lg:py-16">
        <section className="max-w-3xl">
          <p className="eyebrow mb-4">
            {lead.company_name} · {lead.sector}
            {lead.location ? ` · ${lead.location}` : ""}
          </p>
          <h1 className="font-display text-[clamp(32px,5.2vw,64px)] font-semibold leading-[0.98] tracking-[-0.045em] text-orbita-ink">
            {tm.brief?.copyBlocks[0]?.heading ?? tm.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-orbita-muted">
            {tm.brief?.positioning ??
              "Esta é uma proposta visual criada pela ORBITA a partir do contexto público da empresa."}
          </p>
          {tm.brief && (
            <p className="mt-4 max-w-2xl text-[13.5px] text-orbita-dim">
              Conceito «{tm.brief.conceptName}» · {archetype?.mood ?? "direção editorial"} · gerado em{" "}
              {formatDate(tm.prototype?.generatedAt ?? tm.updated_at)}
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-2">
            <a className="btn btn-primary" href={quoteHref}>
              Pedir orçamento
            </a>
            <a className="btn btn-ghost" href={meetingHref}>
              Agendar reunião
            </a>
            {whatsappHref && (
              <a className="btn btn-ghost" href={whatsappHref} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            )}
          </div>
        </section>

        <section aria-labelledby="comparacao-title" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow mb-2">Antes / depois</p>
              <h2 id="comparacao-title" className="font-display text-[clamp(22px,2.6vw,32px)] font-semibold tracking-[-0.03em] text-orbita-ink">
                Arrasta para revelar a nova proposta
              </h2>
            </div>
            <p className="max-w-sm text-[12.5px] text-orbita-dim">
              Comparação entre a experiência atual (captura autorizada ou automática) e o protótipo ORBITA.
            </p>
          </div>
          <div className="rounded-lg border border-orbita-line bg-orbita-panel p-3 sm:p-4">
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
          </div>
        </section>

        {tm.opportunities.length > 0 && (
          <section aria-labelledby="oportunidades-title" className="space-y-4">
            <div>
              <p className="eyebrow mb-2">Opportunity map</p>
              <h2 id="oportunidades-title" className="font-display text-[clamp(22px,2.6vw,32px)] font-semibold tracking-[-0.03em] text-orbita-ink">
                O que muda, com evidência
              </h2>
              <p className="mt-2 max-w-2xl text-[13.5px] text-orbita-muted">
                Cada ponto abaixo resulta de uma observação verificável na experiência atual. Sem evidência, não há
                recomendação.
              </p>
            </div>
            <ul className="grid gap-3 md:grid-cols-2">
              {tm.opportunities.map((item) => (
                <li key={item.id} className="rounded-lg border border-orbita-line bg-orbita-panel p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <PriorityPill priority={item.priority} />
                    <Tag>{item.category}</Tag>
                    {item.hypothesis && <span className="pill border-orbita-warn/40 text-orbita-warn">hipótese</span>}
                  </div>
                  <p className="text-[13.5px] font-medium text-orbita-ink">{item.observation}</p>
                  <p className="mt-2 text-[12.5px] text-orbita-muted">{item.proposedChange}</p>
                  <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-orbita-dim">{item.expectedBenefit}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tm.brief && (
          <section aria-labelledby="decisoes-title" className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-2">Decisões de UX/UI</p>
              <h2 id="decisoes-title" className="font-display text-[clamp(22px,2.6vw,32px)] font-semibold tracking-[-0.03em] text-orbita-ink">
                Porque é que a proposta é assim
              </h2>
              <ul className="mt-4 space-y-3">
                {tm.brief.sections.slice(0, 5).map((section, index) => (
                  <li key={section.title} className="rounded-lg border border-orbita-line bg-orbita-panel p-3.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orbita-acid">0{index + 1}</p>
                    <p className="mt-1 text-[13.5px] font-medium text-orbita-ink">{section.title}</p>
                    <p className="mt-1 text-[12.5px] text-orbita-muted">{section.purpose}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-2">Funcionalidades propostas</p>
              <h2 className="font-display text-[clamp(22px,2.6vw,32px)] font-semibold tracking-[-0.03em] text-orbita-ink">
                Base técnica da nova experiência
              </h2>
              <ul className="mt-4 space-y-1.5 text-[13px] text-orbita-muted">
                {tm.brief.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden className="text-orbita-acid">+</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-lg border border-orbita-line bg-orbita-panel p-4">
                <p className="eyebrow mb-1.5">Sistema visual</p>
                <div className="flex gap-1">
                  {Object.values(tm.brief.tokens.palette).map((color) => (
                    <span key={color} className="h-7 flex-1 rounded-sm border border-white/10" style={{ background: color }} title={color} />
                  ))}
                </div>
                <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-orbita-dim">{tm.brief.tokens.typography.scale}</p>
              </div>
            </div>
          </section>
        )}

        {tm.prototype && (
          <section aria-labelledby="prototipo-title" className="space-y-4">
            <div>
              <p className="eyebrow mb-2">Protótipo navegável</p>
              <h2 id="prototipo-title" className="font-display text-[clamp(22px,2.6vw,32px)] font-semibold tracking-[-0.03em] text-orbita-ink">
                Explora a proposta por dentro
              </h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-orbita-line bg-orbita-panel">
              <div className="flex items-center justify-between gap-2 border-b border-orbita-line px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orbita-dim">
                  {lead.company_name} · protótipo v{tm.prototype.version}
                </span>
                <a
                  className="btn btn-ghost btn-sm"
                  href={`/api/prototype/${tm.id}/${tm.prototype.entry}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir em ecrã inteiro ↗
                </a>
              </div>
              <iframe
                src={`/api/prototype/${tm.id}/${tm.prototype.entry}`}
                title={`Protótipo navegável de ${lead.company_name}`}
                sandbox="allow-scripts"
                className="h-[70vh] w-full border-0 bg-orbita-void"
              />
            </div>
          </section>
        )}

        <section className="rounded-lg border border-orbita-line bg-orbita-panel p-6 sm:p-10">
          <p className="eyebrow mb-3">Próximo passo</p>
          <h2 className="max-w-xl font-display text-[clamp(24px,3.2vw,40px)] font-semibold leading-[1.02] tracking-[-0.035em] text-orbita-ink">
            Queres este website a funcionar com o teu conteúdo real?
          </h2>
          <p className="mt-3 max-w-xl text-[14px] text-orbita-muted">
            A proposta apresentada é um conceito. Podemos avançar para produção com o teu conteúdo validado, integrações
            reais e prazos definidos.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a className="btn btn-primary" href={quoteHref}>
              Pedir orçamento
            </a>
            <a className="btn btn-ghost" href={meetingHref}>
              Agendar reunião
            </a>
            {whatsappHref && (
              <a className="btn btn-ghost" href={whatsappHref} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-orbita-line">
        <div className="shell flex flex-col gap-3 py-8 font-mono text-[10.5px] uppercase tracking-[0.12em] text-orbita-dim sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} ORBITA · proposta privada para {lead.company_name}</span>
          <span>
            Conceito demonstrativo · imagens geradas ·{" "}
            {tm.showcase_expires_at ? `acesso até ${formatDate(tm.showcase_expires_at)}` : "acesso por link"}
          </span>
        </div>
      </footer>
    </div>
  );
}

function Unavailable({ motivo }: { motivo: string }) {
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md rounded-lg border border-orbita-line bg-orbita-panel p-7">
        <BrandMark />
        <p className="eyebrow mb-2 mt-8">Acesso privado</p>
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-orbita-ink">
          Esta apresentação não está disponível
        </h1>
        <p className="mt-2 text-[13px] text-orbita-muted">{motivo}</p>
        <p className="mt-4 text-[12.5px] text-orbita-dim">
          Os links da ORBITA são individuais, expiram e podem ser revogados. Se precisas de voltar a ver a proposta,
          pede um novo link ao teu contacto.
        </p>
        <a className="btn btn-ghost mt-6" href={`mailto:${config.showcase.contactEmail}`}>
          Contactar ORBITA
        </a>
      </div>
    </div>
  );
}
