import type { CurrentExperience, Lead, Opportunity, PageAnalysis, Priority } from "../types";
import { guessServicesFromText } from "./html";

function opportunity(
  input: Omit<Opportunity, "id"> & { id?: string },
  index: number,
): Opportunity {
  return { id: input.id ?? `opp-${index + 1}`, ...input };
}

const PRIORITY_WEIGHT: Record<Priority, number> = { alta: 0, média: 1, baixa: 2 };

/**
 * Regras de oportunidade baseadas APENAS em evidência observável na página.
 * Cada item cita a página e o indicador que o sustenta. Nada é inventado:
 * hipóteses são marcadas explicitamente com `hypothesis: true`.
 */
export function buildOpportunities(
  lead: Lead,
  experience: CurrentExperience,
): Opportunity[] {
  const found: Omit<Opportunity, "id">[] = [];
  const primary = experience.pages[0];

  if (!lead.website) {
    found.push({
      category: "conversão",
      observation: "A empresa não tem website indicado na base de leads.",
      evidence: "Campo 'website' vazio no registo do lead.",
      problem: "A ausência de site próprio retira o controlo sobre a primeira impressão digital e sobre a pesquisa orgânica.",
      proposedChange:
        "Website institucional completo com páginas de serviços, prova e contacto, otimizado para pesquisa local.",
      expectedBenefit: "Presença própria pesquisável, contacto direto e base para campanhas pagas.",
      priority: "alta",
      hypothesis: false,
    });
  } else if (!experience.reachable) {
    found.push({
      category: "técnico",
      observation: `O website ${lead.website} não respondeu de forma utilizável durante a captura.`,
      evidence: experience.captureError
        ? `Erro de captura: ${experience.captureError}`
        : "Sem resposta HTTP válida.",
      problem: "Se o site falha para nós, falha para potenciais clientes — a marca perde contacto em momento de intenção.",
      proposedChange:
        "Substituir por uma experiência estática rápida e alojada em infraestrutura gerida, com monitorização de disponibilidade.",
      expectedBenefit: "Disponibilidade permanente e eliminação de perda de leads por indisponibilidade.",
      priority: "alta",
      hypothesis: false,
    });
  }

  if (experience.finalUrl && lead.website) {
    try {
      const before = new URL(lead.website.startsWith("http") ? lead.website : `https://${lead.website}`);
      const after = new URL(experience.finalUrl);
      if (before.protocol === "http:" && after.protocol === "http:") {
        found.push({
          category: "técnico",
          observation: "O website é servido sem HTTPS.",
          evidence: `URL final: ${experience.finalUrl}`,
          problem: "Navegadores marcam o site como 'não seguro' e o SEO perde sinal de confiança.",
          proposedChange: "Migrar para HTTPS com redirecionamento permanente e HSTS.",
          expectedBenefit: "Confiança do visitante e melhoria de sinais de pesquisa.",
          priority: "alta",
          hypothesis: false,
        });
      }
    } catch {
      /* URL já validada na captura; ignora inconsistências */
    }
  }

  if (primary && !primary.hasViewportMeta) {
    found.push({
      category: "mobile",
      observation: "A página inicial não declara meta viewport.",
      evidence: `<head> de ${primary.url} sem <meta name="viewport">.`,
      problem: "Em telemóvel o conteúdo é reduzido a uma miniatura ilegível, o que inviabiliza a maioria do tráfego.",
      proposedChange: "Layout mobile-first com tipografia fluida (clamp) e alvos de toque de 44px.",
      expectedBenefit: "Leitura correta em telemóvel e redução imediata do abandono móvel.",
      priority: "alta",
      hypothesis: false,
    });
  }

  if (primary && primary.h1.length === 0) {
    found.push({
      category: "SEO",
      observation: "A página inicial não tem título H1 identificável no HTML servido.",
      evidence: `Análise de ${primary.url}: 0 elementos <h1>.`,
      problem: "Sem hierarquia principal, o motor de busca e o leitor de ecrã não identificam o tema da página.",
      proposedChange: "H1 único com a proposta de valor e hierarquia H2 por secção.",
      expectedBenefit: "Melhor compreensão semântica e relevância de pesquisa.",
      priority: "média",
      hypothesis: false,
    });
  } else if (primary && primary.h1.length > 1) {
    found.push({
      category: "SEO",
      observation: `A página inicial tem ${primary.h1.length} elementos H1.`,
      evidence: `Títulos encontrados: ${primary.h1.slice(0, 3).join(" · ")}`,
      problem: "Hierarquia ambígua dilui a mensagem principal.",
      proposedChange: "Um único H1 com promessa clara; restantes níveis em H2/H3.",
      expectedBenefit: "Mensagem principal inequívoca para pessoas e motores de busca.",
      priority: "baixa",
      hypothesis: false,
    });
  }

  if (primary && primary.wordCount < 200 && primary.status && primary.status < 400) {
    found.push({
      category: "conteúdo",
      observation: `A página inicial tem apenas ${primary.wordCount} palavras de conteúdo útil.`,
      evidence: `Contagem após remoção de scripts e estilos em ${primary.url}.`,
      problem: "Conteúdo insuficiente não responde às dúvidas que antecedem o contacto.",
      proposedChange: "Estrutura editorial com proposta de valor, serviços, prova e FAQ.",
      expectedBenefit: "Menos perguntas repetidas e maior intenção de contacto.",
      priority: "alta",
      hypothesis: false,
    });
  }

  if (primary && primary.ctaCount === 0) {
    found.push({
      category: "conversão",
      observation: "Não foi identificado qualquer botão ou link com ação comercial clara.",
      evidence: `Análise de ${primary.url}: 0 elementos com verbos de ação (contactar, marcar, pedir orçamento).`,
      problem: "O visitante não tem um próximo passo evidente — o tráfego não se converte em contacto.",
      proposedChange: "CTA primário persistente no header e CTA contextual em cada secção.",
      expectedBenefit: "Aumento da taxa de contacto por visitante.",
      priority: "alta",
      hypothesis: false,
    });
  } else if (primary && primary.ctaCount > 6) {
    found.push({
      category: "conversão",
      observation: `Foram detetados ${primary.ctaCount} apelos à ação concorrentes na página inicial.`,
      evidence: `Exemplos: ${primary.ctaLabels.slice(0, 5).join(" · ")}`,
      problem: "Demasiadas ações com o mesmo peso visual produzem paralisia de decisão.",
      proposedChange: "Hierarquia com um CTA primário e CTAs secundários discretos.",
      expectedBenefit: "Foco na ação de maior valor comercial.",
      priority: "média",
      hypothesis: false,
    });
  }

  if (primary && primary.imagesWithoutAlt > 0) {
    found.push({
      category: "técnico",
      observation: `${primary.imagesWithoutAlt} de ${primary.images} imagens não têm texto alternativo.`,
      evidence: `Atributo alt ausente em ${primary.imagesWithoutAlt} elementos <img> de ${primary.url}.`,
      problem: "Conteúdo visual inacessível a leitores de ecrã e invisível para pesquisa de imagem.",
      proposedChange: "Texto alternativo descritivo obrigatório no sistema de conteúdo.",
      expectedBenefit: "Conformidade de acessibilidade e alcance adicional.",
      priority: "média",
      hypothesis: false,
    });
  }

  if (primary && primary.fontFamilies.length > 3) {
    found.push({
      category: "identidade visual",
      observation: `A página usa ${primary.fontFamilies.length} famílias tipográficas distintas.`,
      evidence: `Famílias detetadas: ${primary.fontFamilies.slice(0, 6).join(", ")}.`,
      problem: "Excesso de famílias destrói hierarquia e coerência de marca.",
      proposedChange: "Sistema com duas famílias e escala fixa de 6 tamanhos.",
      expectedBenefit: "Identidade mais forte com menos decisões de design.",
      priority: "média",
      hypothesis: false,
    });
  }

  if (primary && primary.colors.length > 8) {
    found.push({
      category: "identidade visual",
      observation: `Foram encontradas ${primary.colors.length} cores distintas no código da página.`,
      evidence: `Amostra: ${primary.colors.slice(0, 8).join(" ")}`,
      problem: "Paleta sem regra enfraquece o reconhecimento da marca.",
      proposedChange: "Paleta reduzida a uma cor de marca, neutros e um acento funcional.",
      expectedBenefit: "Reconhecimento imediato e consistência entre canais.",
      priority: "baixa",
      hypothesis: false,
    });
  }

  if (primary && !primary.hasStructuredData) {
    found.push({
      category: "SEO",
      observation: "Não existe marcação de dados estruturados (JSON-LD) na página inicial.",
      evidence: `Sem script application/ld+json em ${primary.url}.`,
      problem: "Perdem-se resultados enriquecidos (empresa local, horários, avaliações reais).",
      proposedChange: "JSON-LD de Organização e LocalBusiness com dados confirmados pelo cliente.",
      expectedBenefit: "Maior visibilidade nos resultados de pesquisa.",
      priority: "média",
      hypothesis: false,
    });
  }

  if (primary && !primary.hasOpenGraph) {
    found.push({
      category: "conteúdo",
      observation: "Página sem meta tags Open Graph.",
      evidence: "Nenhuma tag og:* no <head>.",
      problem: "Partilhas em redes sociais e WhatsApp aparecem sem imagem nem descrição.",
      proposedChange: "Imagens sociais 1200×630 por página, geradas a partir do sistema de design.",
      expectedBenefit: "Melhor taxa de clique em partilhas — relevante para recomendação boca-a-boca.",
      priority: "baixa",
      hypothesis: false,
    });
  }

  if (primary && primary.hasViewportMeta && primary.wordCount >= 200 && primary.ctaCount > 0) {
    found.push({
      category: "UX",
      observation: "A base técnica da página inicial está funcional: viewport declarado, conteúdo e ações presentes.",
      evidence: `${primary.wordCount} palavras, ${primary.ctaCount} CTAs, viewport presente.`,
      problem: "O potencial não é aproveitado: a experiência não traduz a qualidade real do serviço.",
      proposedChange: "Reformulação editorial com hierarquia, prova e narrativa orientada a decisão.",
      expectedBenefit: "Perceção de qualidade alinhada com o serviço efetivamente prestado.",
      priority: "média",
      hypothesis: true,
    });
  }

  const servicesGuess = guessServicesFromText(
    experience.pages.map((p) => `${p.title ?? ""} ${p.h2.join(" ")}`).join(" "),
    lead.sector,
  );
  if (servicesGuess.length === 0 && lead.services.length === 0) {
    found.push({
      category: "conteúdo",
      observation: "Os serviços oferecidos não estão explícitos na página inicial.",
      evidence: "Nenhum serviço listado no lead nem identificável no conteúdo analisado.",
      problem: "O visitante tem de inferir o que a empresa faz.",
      proposedChange: "Secção de serviços com descrição, aplicação e prazo por serviço.",
      expectedBenefit: "Qualificação automática de contactos.",
      priority: "alta",
      hypothesis: true,
    });
  }

  return found
    .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])
    .slice(0, 10)
    .map(opportunity);
}

export function buildPreserveList(experience: CurrentExperience, lead: Lead): string[] {
  const preserve: string[] = [];
  const primary = experience.pages[0];
  if (primary?.title) preserve.push(`Nome e título de marca atuais («${primary.title}»)`);
  if (lead.contact_phone) preserve.push("Número de telefone visível como canal direto");
  if (lead.services.length > 0) preserve.push("Serviços já comunicados pela empresa");
  if (primary && primary.ctaCount > 0) {
    preserve.push(`Ações comerciais que já funcionam (${primary.ctaLabels.slice(0, 3).join(", ")})`);
  }
  if (primary && primary.colors.length > 0) {
    preserve.push(`Cor(es) de marca presentes no site (${primary.colors.slice(0, 3).join(", ")})`);
  }
  if (primary && primary.wordCount >= 200) preserve.push("Conteúdo factual já publicado (reaproveitar copy)");
  if (lead.location) preserve.push(`Localização como sinal de proximidade (${lead.location})`);
  return [...new Set(preserve)].slice(0, 6);
}

export function pageEvidence(analysis: PageAnalysis): string {
  const parts = [`${analysis.url}`];
  if (analysis.status) parts.push(`HTTP ${analysis.status}`);
  parts.push(`${analysis.wordCount} palavras`);
  return parts.join(" · ");
}
