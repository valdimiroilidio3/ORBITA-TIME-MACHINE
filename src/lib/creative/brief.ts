import type {
  CompanyIntelligence,
  CreativeBrief,
  CurrentExperience,
  Lead,
  Opportunity,
} from "../types";
import { ARCHETYPES, pickArchetype, tokensFor, type Archetype } from "./archetypes";
import { artifactSeed, pickCopy } from "./copy";

export function buildCompanyIntelligence(
  lead: Lead,
  experience: CurrentExperience,
): CompanyIntelligence {
  const primary = experience.pages[0];
  const facts: string[] = [];
  const hypotheses: string[] = [];

  facts.push(`Empresa: ${lead.company_name}`);
  facts.push(`Setor declarado: ${lead.sector}`);
  if (lead.location) facts.push(`Localização: ${lead.location}`);
  if (lead.website) facts.push(`Website: ${lead.website}${experience.reachable ? " (acedido com sucesso)" : " (não acessível na captura)"}`);
  if (experience.pages.length > 0) facts.push(`Páginas analisadas: ${experience.pages.length}`);
  if (primary?.title) facts.push(`Título atual do site: ${primary.title}`);
  if (primary?.description) facts.push(`Descrição publicada: ${primary.description}`);
  if (lead.services.length > 0) facts.push(`Serviços registados na base de leads: ${lead.services.join("; ")}`);
  if (lead.contact_phone) facts.push(`Telefone público: ${lead.contact_phone}`);
  if (experience.screenshots.desktop || experience.screenshots.mobile) {
    facts.push(`Captura visual disponível (${experience.captureSource === "upload" ? "carregada pelo operador" : "automática"})`);
  }

  const servicesFromSite = primary?.h2.slice(0, 6) ?? [];
  const services = [...new Set([...lead.services, ...servicesFromSite])].slice(0, 8);

  const targetAudience = lead.sector
    ? {
        text: `Clientes de ${lead.sector.toLowerCase()}${lead.location ? ` em ${lead.location} e arredores` : ""}, em fase de comparação de fornecedores.`,
        hypothesis: true,
      }
    : {
        text: "Público não declarado no CRM — a validar com o comercial responsável.",
        hypothesis: true,
      };
  hypotheses.push("Público-alvo inferido a partir do setor e localização; não confirmado pelo cliente.");

  const valueProposition = primary?.description
    ? { text: primary.description, hypothesis: false }
    : primary?.h1[0]
      ? { text: primary.h1[0], hypothesis: false }
      : { text: "Não foi possível recolher uma proposta de valor publicada.", hypothesis: true };
  if (valueProposition.hypothesis) {
    hypotheses.push("Proposta de valor ausente no site; a formulação apresentada é uma hipótese editorial.");
  }

  const brandElements = {
    colors: primary?.colors.slice(0, 8) ?? [],
    fonts: primary?.fontFamilies.slice(0, 6) ?? [],
    logoDetected: Boolean(primary && /\blogo\b/i.test(JSON.stringify(primary))),
    tone: ARCHETYPES[pickArchetype(lead.sector, lead.services)].tone,
  };

  return {
    companyName: lead.company_name,
    sector: lead.sector,
    location: lead.location,
    website: lead.website,
    services,
    targetAudience,
    valueProposition,
    brandElements,
    facts,
    hypotheses,
  };
}

export function buildLocalBrief(
  lead: Lead,
  company: CompanyIntelligence,
  experience: CurrentExperience,
  opportunities: Opportunity[],
): CreativeBrief {
  const archetypeId = pickArchetype(lead.sector, lead.services, lead.notes ?? "");
  const archetype: Archetype = ARCHETYPES[archetypeId];
  const colors = company.brandElements.colors;
  const tokens = tokensFor(archetype, colors);
  const seed = artifactSeed(lead.company_name);
  const place = lead.location ? ` em ${lead.location}` : "";
  const services = company.services.length > 0 ? company.services : archetype.sections.slice(1, 4).map((s) => s.title);
  const topOpportunities = opportunities.slice(0, 3).map((o) => o.observation);

  const hero = pickCopy(archetypeId, "hero", seed, {
    company: lead.company_name,
    place,
    sector: lead.sector.toLowerCase(),
    service: services[0] ?? archetype.serviceLabel,
  });
  const heroSupport = pickCopy(archetypeId, "support", seed, {
    company: lead.company_name,
    place,
    sector: lead.sector.toLowerCase(),
    service: services[0] ?? archetype.serviceLabel,
  });

  const sections = archetype.sections.map((section, index) => {
    const service = services[index % Math.max(services.length, 1)] ?? archetype.serviceLabel;
    return {
      title: section.title,
      purpose: section.purpose,
      copy: pickCopy(archetypeId, "section", `${seed}:${index}`, {
        company: lead.company_name,
        place,
        sector: lead.sector.toLowerCase(),
        service,
        title: section.title,
      }),
    };
  });

  const ctas = [
    {
      label: pickCopy(archetypeId, "ctaPrimary", seed, { company: lead.company_name, place, sector: lead.sector, service: services[0] ?? "" }),
      intent: "Pedido de contacto qualificado",
      note: "CTA primário no header e na hero",
    },
    {
      label: pickCopy(archetypeId, "ctaSecondary", seed, { company: lead.company_name, place, sector: lead.sector, service: services[0] ?? "" }),
      intent: "Avaliação de contexto antes do contacto",
      note: "CTA secundário, estilo fantasma",
    },
  ];

  const copyBlocks = [
    {
      heading: hero,
      body: heroSupport,
    },
    {
      heading: pickCopy(archetypeId, "aboutHeading", seed, { company: lead.company_name, place, sector: lead.sector, service: services[0] ?? "" }),
      body: `${lead.company_name} atua em ${lead.sector.toLowerCase()}${place}. ${
        company.valueProposition.hypothesis
          ? "A proposta de valor será confirmada com o cliente antes da publicação."
          : `A comunicação atual promete: “${company.valueProposition.text}”.`
      }`,
    },
  ];

  const conceptName = pickCopy(archetypeId, "concept", seed, {
    company: lead.company_name,
    place,
    sector: lead.sector,
    service: services[0] ?? "",
  });

  return {
    archetype: archetypeId,
    conceptName,
    positioning: `${lead.company_name} posiciona-se como referência de ${lead.sector.toLowerCase()}${place}, com comunicação que valoriza ${
      archetype.id === "industrial"
        ? "competência técnica e prazos"
        : archetype.id === "clinical"
          ? "confiança e clareza clínica"
          : archetype.id === "gastronomy"
            ? "produto, origem e hospitalidade"
            : archetype.id === "studio"
              ? "processo e resultado documentado"
              : "proximidade e rigor no serviço"
    }.`,
    targetAudience: company.targetAudience.text,
    businessGoal: `Converter visitantes em contactos qualificados (${ctas[0].label.toLowerCase()}) e reduzir a dependência de canais de terceiros${
      topOpportunities.length ? `, corrigindo: ${topOpportunities.join("; ")}` : ""
    }.`,
    narrative: archetype.narrative,
    heroConcept: `${archetype.heroConcept} Mensagem central: “${hero}”`,
    photographyDirection: archetype.photographyDirection,
    microInteractions: archetype.microInteractions,
    tokens,
    sections,
    ctas,
    copyBlocks,
    accessibility: [
      "Contraste mínimo AA (4.5:1) em texto normal e 3:1 em texto grande",
      "Navegação completa por teclado com foco visível de 2px",
      "Estrutura semântica com landmarks e um H1 por página",
      "Respeito por prefers-reduced-motion em todas as animações",
    ],
    seo: [
      "Título e meta descrição únicos por página, orientados à intenção local",
      "JSON-LD de Organização e LocalBusiness com dados confirmados",
      "Open Graph e Twitter Card com imagem gerada a partir do sistema de design",
      "URLs legíveis, sitemap e canonical",
    ],
    performance: [
      "LCP < 2.0s em 4G, CLS < 0.05, INP < 200ms",
      "Imagens em AVIF/WebP com dimensões declaradas",
      "CSS crítico inline; restante carregado de forma assíncrona",
      "Sem bibliotecas de animação acima de 10 kB",
    ],
    features: [
      `Navegação por ${archetype.serviceLabel.toLowerCase()} com páginas dedicadas`,
      "Formulário de contacto com validação e tempo de resposta prometido",
      "Integração com WhatsApp quando configurado",
      "Mapa estático com morada e horário",
      "Modo de conteúdo editável (CMS headless)",
    ],
    integrations: [
      lead.contact_email ? `Notificação de contactos para ${lead.contact_email}` : "Notificação de contactos por email da equipa",
      "Analytics com consentimento (eventos de CTA e scroll depth)",
      "Google Business Profile para sinal local",
    ],
    technicalConstraints: [
      "Sem dependências de terceiros para tipografia crítica (fallback local garantido)",
      "Sem autenticação de clientes nesta fase",
      "Sem pagamentos nesta fase",
      "Conteúdo demonstrativo identificado como tal até validação do cliente",
    ],
    acceptanceCriteria: [
      "Todas as páginas navegáveis sem erros de consola",
      "Layout válido em 360px, 768px, 1024px e 1440px",
      "Lighthouse mobile ≥ 90 em performance e acessibilidade",
      "Todos os CTAs demonstrativos com destino explícito",
      "Conteúdo não confirmado sinalizado ao cliente",
    ],
    references: [
      "Referências estéticas de qualidade (composição editorial, ritmo tipográfico) — sem cópia de marcas, textos ou imagens de terceiros.",
      archetype.mood,
    ],
    engine: "local",
  };
}

export function briefToMasterPrompt(
  lead: Lead,
  company: CompanyIntelligence,
  experience: CurrentExperience,
  opportunities: Opportunity[],
  brief: CreativeBrief,
): string {
  const p = brief.tokens.palette;
  const t = brief.tokens.typography;
  const evidence = opportunities
    .map(
      (o) =>
        `- [${o.priority.toUpperCase()}] ${o.category}: ${o.observation} — Evidência: ${o.evidence}${
          o.hypothesis ? " (hipótese)" : ""
        }`,
    )
    .join("\n");

  return `# PROMPT MASTER — ${lead.company_name.toUpperCase()}
> Gerado pela ORBITA Time Machine. Uso interno: direção para design e desenvolvimento do novo website.

## 1. Contexto real da empresa
- Nome: ${lead.company_name}
- Setor: ${lead.sector}
- Localização: ${lead.location ?? "não indicada"}
- Website atual: ${lead.website ?? "sem website registado"}${experience.reachable ? ` (acedido, ${experience.pages.length} página(s) analisada(s))` : " (inacessível na captura)"}
- Serviços: ${company.services.join(", ") || "a confirmar com o cliente"}
- Contactos públicos: ${[lead.contact_phone, lead.contact_email].filter(Boolean).join(" · ") || "não registados"}

### Evidência recolhida
${evidence || "- Sem evidência recolhida: captura indisponível. Não assumir factos."}

### Informação a confirmar (não publicar como facto)
${company.hypotheses.map((h) => `- ${h}`).join("\n") || "- Nenhuma pendência identificada."}

## 2. Objetivo comercial
${brief.businessGoal}

## 3. Público-alvo
${brief.targetAudience}
Status: hipótese a validar com o comercial responsável.

## 4. Posicionamento
${brief.positioning}
Conceito: **${brief.conceptName}**
Narrativa: ${brief.narrative}

## 5. Direção de arte
Arquétipo aplicado: ${ARCHETYPES[brief.archetype as keyof typeof ARCHETYPES]?.label ?? brief.archetype} (${ARCHETYPES[brief.archetype as keyof typeof ARCHETYPES]?.mood ?? ""})
${brief.tokens.layout}

## 6. Paleta de cores
- Fundo: ${p.background}
- Superfície: ${p.surface}
- Texto: ${p.ink}
- Texto secundário: ${p.muted}
- Acento: ${p.accent} (apenas para ações e ênfase)
- Acento secundário: ${p.secondary}
Justificação: paleta derivada do setor e das cores já presentes na marca (${company.brandElements.colors.slice(0, 3).join(", ") || "nenhuma cor detetada — proposta nova"}).

## 7. Sistema tipográfico
- Display: ${t.display}
- Corpo: ${t.body}
- Escala: ${t.scale}
- Notas: ${t.notes}

## 8. Layout e hierarquia visual
Grelha de 12 colunas, medida de leitura 60–72 caracteres, ritmo vertical de 8px, uma ideia por secção, hierarquia com no máximo 3 níveis visíveis.

## 9. Hero cinematográfica
${brief.heroConcept}
Regras: imagem com intenção, tipografia como elemento principal, carregamento imediato, sem autoplay com som.

## 10. Conceito de fotografia/vídeo
${brief.photographyDirection}
Nesta fase de demonstração: arte abstrata original gerada, claramente identificada como demonstrativa. Nenhuma fotografia de terceiros é usada.

## 11. Microinterações e animações
${brief.microInteractions.map((m) => `- ${m}`).join("\n")}
Movimento: ${brief.tokens.motion}

## 12. Estrutura de páginas
${brief.sections.map((s, i) => `${i + 1}. **${s.title}** — ${s.purpose}\n   Copy: ${s.copy}`).join("\n")}

## 13. Copywriting
${brief.copyBlocks.map((b) => `### ${b.heading}\n${b.body}`).join("\n\n")}

## 14. Chamadas para ação
${brief.ctas.map((c) => `- **${c.label}** — ${c.intent} (${c.note})`).join("\n")}

## 15. Mobile-first
Conceber a 360px primeiro. Alvos de toque mínimos de 44px, navegação com um único menu, sem hover como único affordance, tipografia fluida com clamp().

## 16. Acessibilidade
${brief.accessibility.map((a) => `- ${a}`).join("\n")}

## 17. SEO técnico
${brief.seo.map((s) => `- ${s}`).join("\n")}

## 18. Performance
${brief.performance.map((p2) => `- ${p2}`).join("\n")}

## 19. Funcionalidades e integrações
Funcionalidades:
${brief.features.map((f) => `- ${f}`).join("\n")}
Integrações:
${brief.integrations.map((f) => `- ${f}`).join("\n")}

## 20. Restrições técnicas
${brief.technicalConstraints.map((c) => `- ${c}`).join("\n")}

## 21. Critérios de aceitação
${brief.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}

## 22. Limites de integridade
- Não copiar websites, textos, imagens ou marcas de terceiros.
- Não inventar prémios, certificações, avaliações ou números de clientes.
- Conteúdo não verificado deve aparecer como "a confirmar" até validação.
`;
}
