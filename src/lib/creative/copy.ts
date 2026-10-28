import type { ArchetypeId } from "./archetypes";
import { hashSeed } from "./art";

export type CopyKey =
  | "hero"
  | "support"
  | "section"
  | "ctaPrimary"
  | "ctaSecondary"
  | "aboutHeading"
  | "concept";

type Vars = {
  company: string;
  place: string;
  sector: string;
  service: string;
  title?: string;
};

const BANK: Record<ArchetypeId, Record<CopyKey, string[]>> = {
  gastronomy: {
    hero: [
      "Cozinha de estação, servida sem pressa.",
      "O que a estação dá, à mesa de {company}.",
      "Produto honesto. Mesa cuidada.",
    ],
    support: [
      "{company} cozinha com produto da estação{place}. Menu curto, execução rigorosa, sala atenta.",
      "Uma casa{place} onde o menu muda com o mercado e o serviço conhece cada prato.",
    ],
    section: [
      "{title}: {service} com origem identificada, preparado no dia e servido com explicação do que está no prato.",
      "{title} — cada {service} tem produtor, técnica e momento próprio. A equipa explica antes de servir.",
    ],
    ctaPrimary: ["Reservar mesa", "Reservar agora", "Quero reservar"],
    ctaSecondary: ["Ver o menu", "Conhecer a casa"],
    aboutHeading: ["A casa", "Quem cozinha", "A nossa mesa"],
    concept: ["«Mesa de estação»", "«Origem à vista»", "«Serviço sem pressa»"],
  },
  clinical: {
    hero: [
      "Cuidado clínico com tempo para ouvir.",
      "Diagnóstico rigoroso, explicações claras.",
      "Medicina de proximidade, sem pressa artificial.",
    ],
    support: [
      "{company} acompanha cada caso{place} com equipa fixa, protocolos definidos e tempo de consulta adequado.",
      "Marcação simples, resposta em 24 horas úteis e acompanhamento contínuo{place}.",
    ],
    section: [
      "{title}: {service} prestado por profissionais dedicados, com explicação do procedimento e do plano de seguimento.",
      "{title} — avaliação inicial, plano explicado por escrito e revisão de resultados.",
    ],
    ctaPrimary: ["Marcar consulta", "Pedir marcação", "Agendar avaliação"],
    ctaSecondary: ["Falar com a equipa", "Ver especialidades"],
    aboutHeading: ["A equipa", "Como trabalhamos", "O nosso método"],
    concept: ["«Tempo clínico»", "«Clareza que tranquiliza»", "«Rigor com proximidade»"],
  },
  industrial: {
    hero: [
      "Capacidade industrial. Prazos que se cumprem.",
      "Da especificação à entrega, sem surpresas.",
      "Engenharia aplicada, produção controlada.",
    ],
    support: [
      "{company} produz e entrega{place} com controlo de processo documentado e resposta técnica em 48 horas.",
      "Orçamentação com ficha técnica, prazo comprometido e rastreabilidade de lote.",
    ],
    section: [
      "{title}: {service} com especificação técnica, tolerâncias e prazos definidos antes do arranque.",
      "{title} — {service} documentado, com ensaios e registo de qualidade por encomenda.",
    ],
    ctaPrimary: ["Pedir proposta técnica", "Solicitar cotação", "Falar com engenharia"],
    ctaSecondary: ["Ver capacidades", "Descarregar fichas técnicas"],
    aboutHeading: ["Capacidade instalada", "Como produzimos", "Controlo de qualidade"],
    concept: ["«Precisão operacional»", "«Do desenho à peça»", "«Processo verificável»"],
  },
  studio: {
    hero: [
      "Trabalho com intenção, resultado documentado.",
      "Menos ruído. Mais decisão.",
      "Ideias que se sustentam em uso real.",
    ],
    support: [
      "{company} trabalha com marcas que precisam de clareza{place}: estratégia primeiro, execução depois, medição sempre.",
      "Processo em quatro fases, entregáveis definidos e um interlocutor único.",
    ],
    section: [
      "{title}: {service} conduzido com método, entregue com documentação e critérios de avaliação acordados.",
      "{title} — {service} com direção de arte própria e foco no comportamento real do utilizador.",
    ],
    ctaPrimary: ["Iniciar um projeto", "Falar sobre um projeto", "Pedir proposta"],
    ctaSecondary: ["Ver trabalho", "Conhecer o processo"],
    aboutHeading: ["Abordagem", "Como trabalhamos", "Método"],
    concept: ["«Menos, melhor»", "«Forma com função»", "«Intenção visível»"],
  },
  professional: {
    hero: [
      "Decisões complexas, respostas claras.",
      "Rigor técnico. Linguagem que se entende.",
      "Experiência que se traduz em segurança.",
    ],
    support: [
      "{company} apoia empresas e particulares{place} com acompanhamento próximo e explicação clara de cada passo.",
      "Primeira análise sem compromisso, com âmbito, prazos e honorários definidos por escrito.",
    ],
    section: [
      "{title}: {service} com parecer escrito, calendário processual e responsável direto pelo caso.",
      "{title} — {service} conduzido com confidencialidade e comunicação proativa em cada fase.",
    ],
    ctaPrimary: ["Pedir primeira análise", "Marcar reunião", "Falar com um especialista"],
    ctaSecondary: ["Áreas de prática", "Conhecer a equipa"],
    aboutHeading: ["A sociedade", "Como trabalhamos", "Princípios"],
    concept: ["«Clareza antes da complexidade»", "«Rigor sem ruído»", "«Confiança documentada»"],
  },
  tech: {
    hero: [
      "Software que resolve o problema real.",
      "Menos funcionalidades. Mais resultado.",
      "Do problema ao produto em produção.",
    ],
    support: [
      "{company} desenha e opera software{place} com foco em fiabilidade, integração e custo total de propriedade.",
      "Arquitetura documentada, entregas incrementais e métricas de produto visíveis.",
    ],
    section: [
      "{title}: {service} com especificação aberta, ambiente de testes e monitorização desde o primeiro dia.",
      "{title} — {service} construído com revisão de código, CI e observabilidade.",
    ],
    ctaPrimary: ["Pedir demonstração", "Falar com produto", "Solicitar acesso"],
    ctaSecondary: ["Ver como funciona", "Ler documentação"],
    aboutHeading: ["O produto", "Como construímos", "Arquitetura"],
    concept: ["«Prova pelo produto»", "«Sistemas legíveis»", "«Menos atrito»"],
  },
  realestate: {
    hero: [
      "O espaço certo, apresentado como deve ser.",
      "Luz, escala e detalhe: cada imóvel com ficha completa.",
      "Decisões de vida, com informação rigorosa.",
    ],
    support: [
      "{company} acompanha compra, venda e arrendamento{place} com avaliação fundamentada e visita sem pressão.",
      "Fichas completas, documentação verificada e acompanhamento até escritura.",
    ],
    section: [
      "{title}: {service} com áreas, certificados e estado de conservação confirmados antes da visita.",
      "{title} — {service} apoiado em avaliação de mercado e análise de envolvente.",
    ],
    ctaPrimary: ["Agendar visita", "Pedir avaliação", "Marcar reunião"],
    ctaSecondary: ["Ver imóveis", "Conhecer o processo"],
    aboutHeading: ["A consultora", "Como apresentamos", "O processo"],
    concept: ["«Espaço em silêncio»", "«Luz e escala»", "«Detalhe verificável»"],
  },
  commerce: {
    hero: [
      "Produto bom, compra simples.",
      "Escolher rápido. Comprar sem dúvida.",
      "Stock real, entrega anunciada.",
    ],
    support: [
      "{company} vende{place} com informação de produto completa, envio em 24–48 horas e devolução sem complicações.",
      "Catálogo organizado por necessidade, apoio direto e política de devolução clara.",
    ],
    section: [
      "{title}: {service} com disponibilidade em tempo real, ficha detalhada e apoio ao cliente no mesmo canal.",
      "{title} — {service} selecionado, com preço transparente e opções de entrega explícitas.",
    ],
    ctaPrimary: ["Comprar agora", "Ver campanha", "Falar com a loja"],
    ctaSecondary: ["Ver catálogo", "Condições de envio"],
    aboutHeading: ["A loja", "Como comprar", "Envio e devoluções"],
    concept: ["«Desejo sem atrito»", "«Escolha informada»", "«Compra direta»"],
  },
};

export function artifactSeed(company: string): string {
  return `${company.toLowerCase()}::${hashSeed(company).toString(16)}`;
}

function fill(template: string, vars: Vars): string {
  return template
    .replace(/\{company\}/g, vars.company)
    .replace(/\{place\}/g, vars.place)
    .replace(/\{sector\}/g, vars.sector)
    .replace(/\{service\}/g, vars.service)
    .replace(/\{title\}/g, vars.title ?? "");
}

/** Escolha determinística: a mesma empresa recebe sempre a mesma variante. */
export function pickCopy(
  archetype: ArchetypeId,
  key: CopyKey,
  seed: string,
  vars: Vars,
): string {
  const options = BANK[archetype]?.[key] ?? BANK.professional[key];
  const index = hashSeed(`${seed}:${key}`) % options.length;
  return fill(options[index], vars);
}
