import type {
  CompanyIntelligence,
  CreativeBrief,
  CurrentExperience,
  Lead,
  Opportunity,
} from "@/lib/types";
import { ARCHETYPES } from "@/lib/creative/archetypes";
import { EmptyState, Field, Panel, PriorityPill, Tag } from "@/components/ui";
import { formatDate } from "@/lib/format";

export function CompanySection({ company, lead }: { company: CompanyIntelligence | null; lead: Lead }) {
  return (
    <Panel eyebrow="A · Company Intelligence" title="Quem é a empresa" id="empresa">
      {!company ? (
        <EmptyState
          title="Ainda sem dados consolidados"
          description="A recolha de dados corre na primeira etapa da geração e usa apenas a informação do CRM e o conteúdo público do website."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Empresa" value={company.companyName} />
            <Field label="Setor" value={company.sector} />
            <Field label="Localização" value={company.location ?? "não indicada"} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Website original"
              value={
                company.website ? (
                  <span className="font-mono text-[12px] text-orbita-muted">{company.website}</span>
                ) : (
                  <span className="text-orbita-dim">sem website registado</span>
                )
              }
            />
            <Field
              label="Contactos públicos"
              value={
                [lead.contact_phone, lead.contact_email].filter(Boolean).join(" · ") || (
                  <span className="text-orbita-dim">não registados</span>
                )
              }
            />
          </div>

          <div>
            <p className="eyebrow mb-1.5">Serviços identificados</p>
            {company.services.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {company.services.map((service) => (
                  <Tag key={service}>{service}</Tag>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-orbita-dim">Nenhum serviço explícito — a confirmar com o cliente.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-orbita-line bg-orbita-base p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <p className="eyebrow">Público-alvo</p>
                <span className="pill border-orbita-warn/40 text-orbita-warn">hipótese</span>
              </div>
              <p className="text-[12.5px] text-orbita-ink">{company.targetAudience.text}</p>
            </div>
            <div className="rounded-md border border-orbita-line bg-orbita-base p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <p className="eyebrow">Proposta de valor atual</p>
                {company.valueProposition.hypothesis ? (
                  <span className="pill border-orbita-warn/40 text-orbita-warn">hipótese</span>
                ) : (
                  <span className="pill border-orbita-acid/40 text-orbita-acid">publicada</span>
                )}
              </div>
              <p className="text-[12.5px] text-orbita-ink">{company.valueProposition.text}</p>
            </div>
          </div>

          <div className="rounded-md border border-orbita-line bg-orbita-base p-3">
            <p className="eyebrow mb-2">Elementos de marca identificados</p>
            <div className="flex flex-wrap items-center gap-2">
              {company.brandElements.colors.length > 0 ? (
                company.brandElements.colors.slice(0, 8).map((color) => (
                  <span key={color} className="flex items-center gap-1.5 font-mono text-[10.5px] text-orbita-muted">
                    <span className="h-3.5 w-3.5 rounded-sm border border-white/10" style={{ background: color }} aria-hidden />
                    {color}
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-orbita-dim">Sem cores detetadas no HTML.</span>
              )}
            </div>
            <p className="mt-2 font-mono text-[10.5px] text-orbita-dim">
              Tipografia: {company.brandElements.fonts.slice(0, 4).join(", ") || "não detetada"} · Tom: {company.brandElements.tone}
            </p>
          </div>

          <details className="rounded-md border border-orbita-line bg-orbita-base p-3">
            <summary className="cursor-pointer text-[12.5px] text-orbita-ink">Factos recolhidos e hipóteses ({company.facts.length}/{company.hypotheses.length})</summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-1.5 text-orbita-acid">Factos verificáveis</p>
                <ul className="space-y-1 text-[12px] text-orbita-muted">
                  {company.facts.map((fact) => (
                    <li key={fact}>· {fact}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-1.5 text-orbita-warn">Hipóteses a validar</p>
                <ul className="space-y-1 text-[12px] text-orbita-muted">
                  {company.hypotheses.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        </div>
      )}
    </Panel>
  );
}

export function ExperienceSection({
  experience,
  lead,
}: {
  experience: CurrentExperience | null;
  lead: Lead;
}) {
  return (
    <Panel eyebrow="B · Current Experience" title="Website atual" id="experiencia">
      {!experience ? (
        <EmptyState
          title="Sem captura ainda"
          description="A captura automática corre com Playwright em ambiente isolado. Se o site bloquear bots, podes carregar imagens autorizadas."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`pill ${
                experience.reachable ? "border-orbita-acid/40 text-orbita-acid" : "border-orbita-danger/40 text-orbita-danger"
              }`}
            >
              {experience.reachable ? "acessível" : "inacessível"}
            </span>
            <span className="pill border-orbita-line text-orbita-muted">
              {experience.captureSource === "playwright"
                ? "captura automática"
                : experience.captureSource === "upload"
                  ? "captura autorizada (upload)"
                  : "sem captura"}
            </span>
            {experience.statusCode && <span className="data">HTTP {experience.statusCode}</span>}
            {experience.capturedAt && <span className="data">{formatDate(experience.capturedAt, true)}</span>}
          </div>

          {experience.captureError && (
            <p className="rounded border border-orbita-warn/30 bg-orbita-warn/5 px-3 py-2 text-[12px] text-orbita-warn">
              {experience.captureError}
            </p>
          )}

          {experience.pages.length > 0 ? (
            <div className="space-y-2">
              {experience.pages.map((page) => (
                <details key={page.url} className="rounded-md border border-orbita-line bg-orbita-base p-3">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                    <span className="truncate font-mono text-[11.5px] text-orbita-ink">{page.url}</span>
                    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-orbita-dim">
                      <span>{page.wordCount} palavras</span>
                      <span>{page.ctaCount} CTAs</span>
                      <span>{page.h1.length} H1</span>
                    </span>
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="eyebrow mb-1">Título</p>
                      <p className="text-[12px] text-orbita-muted">{page.title ?? "sem título"}</p>
                      <p className="eyebrow mb-1 mt-3">Descrição</p>
                      <p className="text-[12px] text-orbita-muted">{page.description ?? "sem meta description"}</p>
                    </div>
                    <div>
                      <p className="eyebrow mb-1">Hierarquia detetada</p>
                      <ul className="space-y-0.5 text-[12px] text-orbita-muted">
                        {page.h1.slice(0, 2).map((h) => (
                          <li key={h}>H1 · {h}</li>
                        ))}
                        {page.h2.slice(0, 4).map((h) => (
                          <li key={h}>H2 · {h}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Tag>{page.hasViewportMeta ? "viewport ok" : "sem viewport"}</Tag>
                    <Tag>{page.imagesWithoutAlt} imagens sem alt</Tag>
                    <Tag>{page.hasStructuredData ? "JSON-LD" : "sem JSON-LD"}</Tag>
                    <Tag>{page.hasOpenGraph ? "Open Graph" : "sem OG"}</Tag>
                    <Tag>{page.images} imagens</Tag>
                    {page.notes.map((note) => (
                      <Tag key={note}>{note}</Tag>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sem páginas analisadas"
              description={
                lead.website
                  ? "O website não devolveu HTML utilizável. Podes tentar novamente a captura ou carregar imagens autorizadas."
                  : "Esta lead não tem website registado — a Time Machine mostrará a proposta sem comparação de origem."
              }
            />
          )}

          {experience.preserve.length > 0 && (
            <div>
              <p className="eyebrow mb-1.5">Elementos a preservar</p>
              <ul className="grid gap-1 text-[12px] text-orbita-muted sm:grid-cols-2">
                {experience.preserve.map((item) => (
                  <li key={item}>+ {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

export function OpportunitySection({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <Panel
      eyebrow="C · Opportunity Map"
      title={`Oportunidades com evidência (${opportunities.length})`}
      id="oportunidades"
    >
      {opportunities.length === 0 ? (
        <EmptyState
          title="Sem oportunidades documentadas"
          description="Corre a etapa de análise. Não registamos problemas sem evidência observável no site — se não houver evidência, o mapa fica vazio."
        />
      ) : (
        <ul className="space-y-2">
          {opportunities.map((item) => (
            <li key={item.id} className="rounded-md border border-orbita-line bg-orbita-base p-3">
              <div className="flex flex-wrap items-center gap-2">
                <PriorityPill priority={item.priority} />
                <Tag>{item.category}</Tag>
                {item.hypothesis && <span className="pill border-orbita-warn/40 text-orbita-warn">hipótese</span>}
              </div>
              <p className="mt-2 text-[13px] font-medium text-orbita-ink">{item.observation}</p>
              <dl className="mt-2 grid gap-2 text-[12px] sm:grid-cols-2">
                <div>
                  <dt className="eyebrow mb-0.5">Evidência</dt>
                  <dd className="font-mono text-[11px] text-orbita-muted">{item.evidence}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-0.5">Problema</dt>
                  <dd className="text-orbita-muted">{item.problem}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-0.5">Alteração proposta</dt>
                  <dd className="text-orbita-muted">{item.proposedChange}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-0.5">Benefício esperado</dt>
                  <dd className="text-orbita-muted">{item.expectedBenefit}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function BriefSection({ brief }: { brief: CreativeBrief | null }) {
  if (!brief) {
    return (
      <Panel eyebrow="Direção criativa" title="Briefing" id="brief">
        <EmptyState
          title="Sem direção criativa"
          description="A etapa de direção criativa produz o conceito, o sistema de design e o copywriting específico para esta empresa."
        />
      </Panel>
    );
  }
  const archetype = ARCHETYPES[brief.archetype as keyof typeof ARCHETYPES];
  const palette = brief.tokens.palette;

  return (
    <Panel
      eyebrow="Direção criativa"
      title={brief.conceptName}
      id="brief"
      actions={<Tag>{archetype?.label ?? brief.archetype}</Tag>}
    >
      <div className="space-y-4">
        <p className="max-w-prose text-[13px] text-orbita-ink">{brief.positioning}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-orbita-line bg-orbita-base p-3">
            <p className="eyebrow mb-1.5">Hero</p>
            <p className="font-display text-[17px] leading-tight tracking-[-0.02em] text-orbita-ink">{brief.copyBlocks[0]?.heading}</p>
            <p className="mt-1.5 text-[12px] text-orbita-muted">{brief.copyBlocks[0]?.body}</p>
          </div>
          <div className="rounded-md border border-orbita-line bg-orbita-base p-3">
            <p className="eyebrow mb-1.5">Paleta & tipografia</p>
            <div className="flex gap-1">
              {Object.entries(palette).map(([key, value]) => (
                <span
                  key={key}
                  title={`${key}: ${value}`}
                  className="h-6 flex-1 rounded-sm border border-white/10"
                  style={{ background: value }}
                />
              ))}
            </div>
            <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-orbita-dim">
              {brief.tokens.typography.scale}
            </p>
          </div>
        </div>

        <div>
          <p className="eyebrow mb-1.5">Estrutura de páginas</p>
          <ol className="grid gap-1.5 text-[12px] text-orbita-muted sm:grid-cols-2">
            {brief.sections.map((section, index) => (
              <li key={section.title} className="rounded border border-orbita-line/70 bg-orbita-base px-2.5 py-2">
                <span className="font-mono text-[10px] text-orbita-acid">0{index + 1}</span>{" "}
                <span className="text-orbita-ink">{section.title}</span>
                <span className="block text-[11.5px] text-orbita-dim">{section.purpose}</span>
              </li>
            ))}
          </ol>
        </div>

        <details className="rounded-md border border-orbita-line bg-orbita-base p-3">
          <summary className="cursor-pointer text-[12.5px] text-orbita-ink">Especificação completa (UX, SEO, performance, acessibilidade)</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {[
              ["Acessibilidade", brief.accessibility],
              ["SEO técnico", brief.seo],
              ["Performance", brief.performance],
              ["Funcionalidades", brief.features],
              ["Integrações", brief.integrations],
              ["Critérios de aceitação", brief.acceptanceCriteria],
            ].map(([title, items]) => (
              <div key={title as string}>
                <p className="eyebrow mb-1">{title as string}</p>
                <ul className="space-y-1 text-[11.5px] text-orbita-muted">
                  {(items as string[]).map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      </div>
    </Panel>
  );
}
