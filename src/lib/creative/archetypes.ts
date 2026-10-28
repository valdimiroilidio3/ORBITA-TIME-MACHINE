import type { DesignTokens } from "../types";

export type ArchetypeId =
  | "gastronomy"
  | "clinical"
  | "industrial"
  | "studio"
  | "professional"
  | "tech"
  | "realestate"
  | "commerce";

export interface Archetype {
  id: ArchetypeId;
  label: string;
  keywords: string[];
  mood: string;
  palette: DesignTokens["palette"];
  typography: DesignTokens["typography"];
  motion: string;
  layout: string;
  heroConcept: string;
  photographyDirection: string;
  microInteractions: string[];
  sections: { title: string; purpose: string }[];
  serviceLabel: string;
  narrative: string;
  tone: string;
  grain: number;
  shape: "orbit" | "plated" | "grid" | "arc" | "strata" | "frame" | "module";
}

const SERIF_EDITORIAL = `"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif`;
const GROTESK = `"Helvetica Neue", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif`;
const CONDENSED = `"Arial Narrow", "Helvetica Neue Condensed", "Roboto Condensed", "Segoe UI", system-ui, sans-serif`;

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  gastronomy: {
    id: "gastronomy",
    label: "Restauração & hospitalidade",
    keywords: ["restaur", "cafe", "café", "bar", "pastelaria", "padaria", "hotel", "turismo", "vinho", "cerveja", "catering", "cozinha"],
    mood: "Editorial quente, apetite visual, calma cuidada",
    palette: {
      background: "#141210",
      surface: "#1D1A17",
      ink: "#F6F1E8",
      muted: "#A79C8C",
      accent: "#E0A45E",
      accentInk: "#1A1512",
      secondary: "#6E7F5B",
    },
    typography: {
      display: SERIF_EDITORIAL,
      body: GROTESK,
      displayClass: "display",
      bodyClass: "body",
      scale: "Display 1.15× fluido (clamp 44–104px), corpo 17–19px, entrelinha 1.65",
      notes: "Serifada alta para títulos, grotesca neutra para leitura. Kerning apertado (-0.03em) apenas em display.",
    },
    motion: "Revelações por máscara com 700ms, marquee lento do menu do dia, parallax máximo de 6% na hero.",
    layout: "Grelha editorial de 12 colunas com margens generosas; hero em duas colunas assimétricas (7/5) com imagem a sangrar.",
    heroConcept:
      "Composição de mesa em contraluz: primeiro plano do prato em macro, tipografia serifada a sobrepor-se ao canto inferior esquerdo, reserva de espaço para o menu do dia.",
    photographyDirection:
      "Fotografia gastronómica com luz natural lateral, planos macro e enquadramentos de contexto (sala, equipa, detalhe de ingrediente). Fundos escuros, textura de linho e madeira.",
    microInteractions: [
      "Hover nos itens do menu revela ingredientes com deslocamento de 4px",
      "Botão de reserva com preenchimento progressivo a partir do cursor",
      "Cursor contextual sobre imagens de prato ('ver detalhe')",
    ],
    sections: [
      { title: "Assinatura da casa", purpose: "Promessa gastronómica em uma frase e imagem de atmosfera" },
      { title: "Menu em destaque", purpose: "Seleção sazonal com preços e etiquetas de restrição" },
      { title: "A experiência", purpose: "Sala, serviço e ocasiões — texto curto e fotografia ambiente" },
      { title: "Reservas", purpose: "CTA principal, horários e política de mesa" },
      { title: "Visita", purpose: "Localização, mapa, transportes e horários" },
    ],
    serviceLabel: "Menu",
    narrative: "A história começa no produto e termina à mesa: origem, sazonalidade e hospitalidade.",
    tone: "Caloroso, concreto, sem superlativos vazios",
    grain: 0.55,
    shape: "plated",
  },
  clinical: {
    id: "clinical",
    label: "Saúde & bem-estar",
    keywords: ["clínica", "clinica", "dent", "médic", "medic", "fisio", "saúde", "saude", "psicolog", "estética", "estetica", "nutri", "veterin", "farmác", "farmac", "wellness", "spa"],
    mood: "Claro, sereno, rigoroso — confiança antes de persuasão",
    palette: {
      background: "#F4F6F3",
      surface: "#FFFFFF",
      ink: "#12211F",
      muted: "#5B6B66",
      accent: "#2E6B5E",
      accentInk: "#FFFFFF",
      secondary: "#C9D8CF",
    },
    typography: {
      display: GROTESK,
      body: GROTESK,
      displayClass: "display",
      bodyClass: "body",
      scale: "Títulos 40–72px com peso 500, corpo 17px, entrelinha 1.7",
      notes: "Uma única família humanista com pesos contrastados; serifada opcional apenas para citações clínicas.",
    },
    motion: "Transições de 240ms, fade sequencial de 60ms por bloco, zero parallax; respeitar prefers-reduced-motion.",
    layout: "Grelha de 12 colunas com muito espaço branco; blocos de informação em cartões sem sombra, separados por linhas de 1px.",
    heroConcept:
      "Hero dividida: à esquerda, promessa clínica clara e dois CTAs (marcar consulta / falar com a equipa); à direita, retrato ambiental da equipa em luz difusa, com painel de credenciais sobreposto.",
    photographyDirection:
      "Retratos naturais de equipa e espaço clínico em luz difusa, tons frios e pele real. Sem imagens de stock genéricas de mãos com luvas.",
    microInteractions: [
      "Acordeão de especialidades com altura animada",
      "Estados de foco visíveis em todos os formulários",
      "Indicador de progresso no pedido de marcação (demonstrativo)",
    ],
    sections: [
      { title: "Confiança imediata", purpose: "Credenciais, especialidades e localização acima da dobra" },
      { title: "Especialidades", purpose: "Lista navegável com uma explicação clara por área" },
      { title: "Equipa", purpose: "Perfis com formação e número de cédula" },
      { title: "Marcação", purpose: "Fluxo de pedido de consulta com tempo de resposta" },
      { title: "Perguntas frequentes", purpose: "Redução de fricção pré-consulta" },
    ],
    serviceLabel: "Especialidades",
    narrative: "Rigor clínico traduzido em linguagem simples, com prova de competência em cada ecrã.",
    tone: "Tranquilo, preciso, empático",
    grain: 0.25,
    shape: "arc",
  },
  industrial: {
    id: "industrial",
    label: "Indústria, engenharia & construção",
    keywords: ["indústria", "industria", "constru", "engenharia", "metal", "logístic", "logistic", "transporte", "energia", "fabrica", "fábrica", "manuten", "serralh", "marcen", "mobilidade", "auto"],
    mood: "Técnico, robusto, orientado a especificações",
    palette: {
      background: "#0C0E0F",
      surface: "#15181A",
      ink: "#EDEFEA",
      muted: "#8B9490",
      accent: "#B9FF00",
      accentInk: "#0B0F00",
      secondary: "#C4763B",
    },
    typography: {
      display: CONDENSED,
      body: GROTESK,
      displayClass: "display",
      bodyClass: "body",
      scale: "Títulos condensados 48–96px em uppercase, corpo 16–18px, dados em mono 13px",
      notes: "Condensada para impacto industrial, mono para especificações e números — nunca para parágrafos longos.",
    },
    motion: "Contadores de capacidade, transições de 180ms, revelação de grelha técnica; sem efeitos decorativos.",
    layout: "Grelha rígida de 12 colunas com fios visíveis; tabelas de especificação e faixas de dados a toda a largura.",
    heroConcept:
      "Hero a toda a largura com imagem ambiental de operação (máquina, armazém, obra) e uma faixa de dados sobreposta: capacidade, anos de operação, certificações reais fornecidas pelo cliente.",
    photographyDirection:
      "Fotografia industrial em grande angular, luz dura no local de trabalho, pessoas em ação com EPI. Preferir fotografia própria do cliente.",
    microInteractions: [
      "Hover em cartões de produto revela ficha técnica",
      "Transição de filtro por categoria sem recarregar",
      "Navegação sticky com indicador de secção",
    ],
    sections: [
      { title: "Capacidade operacional", purpose: "O que a empresa faz e a que escala" },
      { title: "Soluções", purpose: "Catálogo com fichas técnicas e aplicações" },
      { title: "Processo", purpose: "Do pedido à entrega, em passos verificáveis" },
      { title: "Certificações e obra", purpose: "Prova documental, sem invenção de referências" },
      { title: "Pedido de proposta", purpose: "Formulário técnico com upload de desenho" },
    ],
    serviceLabel: "Soluções",
    narrative: "Da especificação à entrega: engenharia demonstrável, prazos e rastreabilidade.",
    tone: "Direto, técnico, mensurável",
    grain: 0.4,
    shape: "grid",
  },
  studio: {
    id: "studio",
    label: "Estúdios criativos & arquitetura",
    keywords: ["estúdio", "estudio", "studio", "design", "agência", "agencia", "arquitet", "arquitet", "fotograf", "marca", "branding", "arte", "publicidade", "vídeo", "video", "interiores"],
    mood: "Editorial arrojado, tipografia como protagonista",
    palette: {
      background: "#F2F0EA",
      surface: "#FFFFFF",
      ink: "#0D0D0C",
      muted: "#6B6A64",
      accent: "#B9FF00",
      accentInk: "#0B0F00",
      secondary: "#1F2933",
    },
    typography: {
      display: GROTESK,
      body: GROTESK,
      displayClass: "display",
      bodyClass: "body",
      scale: "Display 64–148px com tracking -0.05em, corpo 16px, legendas em mono 12px",
      notes: "Tipografia grande como elemento gráfico; uma família, pesos 400/500, itálico cirúrgico para ênfase.",
    },
    motion: "Revelação de linhas por clip-path 800ms, hover com deslocamento de imagem e inversão de cor.",
    layout: "Grelha assimétrica com colunas irregulares, margens amplas, trabalho apresentado em séries numeradas.",
    heroConcept:
      "Hero tipográfica: declaração de posicionamento em 3 linhas grandes, índice de projetos numerado em mono, imagem de portefólio a entrar por baixo da linha de base.",
    photographyDirection:
      "Fotografia de projeto em alta resolução, luz controlada, composição arquitetónica. Cada peça com contexto e créditos.",
    microInteractions: [
      "Índice de projetos com pré-visualização flutuante",
      "Transição de página com máscara vertical",
      "Cursor aumentado sobre peças de portefólio",
    ],
    sections: [
      { title: "Declaração", purpose: "Posicionamento em uma frase memorável" },
      { title: "Índice de trabalhos", purpose: "Portefólio navegável com contexto" },
      { title: "Abordagem", purpose: "Método de trabalho em 4 fases" },
      { title: "Reconhecimento", purpose: "Prémios e publicações verificados" },
      { title: "Contacto", purpose: "Formulário de projeto com orçamento indicativo" },
    ],
    serviceLabel: "Trabalho",
    narrative: "Ideias com consequência: processo visível e resultados documentados.",
    tone: "Confiante, preciso, sem adjetivos decorativos",
    grain: 0.35,
    shape: "frame",
  },
  professional: {
    id: "professional",
    label: "Serviços profissionais & advocacia",
    keywords: ["advog", "jurídic", "juridic", "consultor", "contabil", "auditor", "seguro", "impost", "fiscal", "gestão", "gestao", "recursos humanos", "formação", "formacao", "econom"],
    mood: "Sóbrio, editorial, autoridade sem ostentação",
    palette: {
      background: "#0B1220",
      surface: "#121B2B",
      ink: "#F1EFE8",
      muted: "#9AA3B2",
      accent: "#C8A46B",
      accentInk: "#141008",
      secondary: "#3B5675",
    },
    typography: {
      display: SERIF_EDITORIAL,
      body: GROTESK,
      displayClass: "display",
      bodyClass: "body",
      scale: "Títulos serifados 40–84px, corpo 17px, entrelinha 1.75",
      notes: "Serifada de transição para autoridade, grotesca para leitura longa; nunca condensada.",
    },
    motion: "Fades de 300ms, sublinhados que crescem da esquerda, zero movimento em blocos de conteúdo legal.",
    layout: "Duas colunas com medida de leitura de 66 caracteres e barras laterais de índice.",
    heroConcept:
      "Hero tipográfica sóbria com a promessa em serifada e um painel discreto de áreas de prática; retrato institucional em preto e branco.",
    photographyDirection:
      "Retratos formais em luz suave e arquitetura de escritório; preto e branco com grão fino para consistência.",
    microInteractions: [
      "Índice de áreas de prática com âncoras suaves",
      "Tooltip em termos jurídicos complexos",
      "Botão de contacto persistente e discreto",
    ],
    sections: [
      { title: "Prova de experiência", purpose: "Áreas de prática e anos de atividade" },
      { title: "Áreas de prática", purpose: "Uma página por área com FAQ" },
      { title: "Equipa", purpose: "Perfis, formação e idiomas" },
      { title: "Perspetivas", purpose: "Artigos que demonstram conhecimento" },
      { title: "Primeira consulta", purpose: "Fluxo de contacto com confidencialidade explícita" },
    ],
    serviceLabel: "Áreas de prática",
    narrative: "Clareza antes da complexidade: explicar o problema jurídico antes de vender a solução.",
    tone: "Formal, claro, sem jargão desnecessário",
    grain: 0.3,
    shape: "strata",
  },
  tech: {
    id: "tech",
    label: "Software & tecnologia",
    keywords: ["software", "tecnolog", "saas", "startup", "digital", "dados", "data", "cloud", "ciber", "cyber", "inteligência artificial", "plataforma", "app", "eletr"],
    mood: "Produto primeiro, interface como prova",
    palette: {
      background: "#0A0B0D",
      surface: "#121417",
      ink: "#F3F5F7",
      muted: "#8F979E",
      accent: "#4FD1C5",
      accentInk: "#04211E",
      secondary: "#7A7BFF",
    },
    typography: {
      display: GROTESK,
      body: GROTESK,
      displayClass: "display",
      bodyClass: "body",
      scale: "Títulos 44–88px, UI em mono 13px, corpo 16–18px",
      notes: "Grotesca neutra para produto, mono para metadados e código; evitar gradientes decorativos.",
    },
    motion: "Transições de 160ms, prova de produto com scroll sincronizado, sem animações em loop.",
    layout: "Grelha de 12 colunas com blocos de prova (screenshot de produto, métricas reais, integrações).",
    heroConcept:
      "Hero com a promessa e, imediatamente abaixo, um recorte real do produto em moldura de janela — nunca uma maqueta genérica.",
    photographyDirection:
      "Menos fotografia, mais interface. Onde houver pessoas, contexto de utilização real e diversidade autêntica.",
    microInteractions: [
      "Tabs de funcionalidades com transição de 120ms",
      "Copiar comando com feedback inline",
      "Estados de carregamento honestos",
    ],
    sections: [
      { title: "Proposta de valor", purpose: "Problema, solução e para quem, em 20 segundos" },
      { title: "Produto", purpose: "Fluxos reais com anotações" },
      { title: "Integrações", purpose: "Ecossistema verificável" },
      { title: "Segurança e confiança", purpose: "Políticas, alojamento e conformidade" },
      { title: "Começar", purpose: "Demonstração ou pedido de acesso" },
    ],
    serviceLabel: "Produto",
    narrative: "Mostrar o produto a funcionar em vez de o descrever.",
    tone: "Concreto, técnico, sem hype",
    grain: 0.2,
    shape: "module",
  },
  realestate: {
    id: "realestate",
    label: "Imobiliário & arquitetura de interiores",
    keywords: ["imobil", "imóv", "imov", "arrenda", "mediação", "mediacao", "interiores", "decora", "lar", "construção civil"],
    mood: "Luxo discreto, luz natural, espaço em silêncio",
    palette: {
      background: "#16120F",
      surface: "#211C18",
      ink: "#F5EFE7",
      muted: "#A79B8E",
      accent: "#C9A227",
      accentInk: "#1A1408",
      secondary: "#7A6A58",
    },
    typography: {
      display: SERIF_EDITORIAL,
      body: GROTESK,
      displayClass: "display",
      bodyClass: "body",
      scale: "Títulos 40–80px em serifada leve, corpo 17px, fichas em mono 12px",
      notes: "Serifada elegante com muito espaço; grelha de fichas técnicas em mono discreto.",
    },
    motion: "Crossfades de galeria de 600ms, zoom lento de 1.02 em hero, sem movimento em fichas técnicas.",
    layout: "Grelha de imagens a sangrar com fichas de imóvel em coluna lateral fixa.",
    heroConcept:
      "Hero fotográfica a toda a largura com um único imóvel em destaque, ficha técnica mínima sobreposta e filtro de pesquisa discreto na base.",
    photographyDirection:
      "Fotografia de arquitetura com luz natural, verticais corrigidas, planos amplos e detalhes de material.",
    microInteractions: [
      "Galeria com transição de imagem por opacidade",
      "Filtro de imóveis com atualização instantânea",
      "Marcadores de mapa com pré-visualização",
    ],
    sections: [
      { title: "Imóvel em destaque", purpose: "Ancorar a marca num exemplo real" },
      { title: "Portefólio", purpose: "Listagem filtrável com fichas completas" },
      { title: "Serviços", purpose: "Avaliação, mediação e acompanhamento jurídico" },
      { title: "Processo", purpose: "Etapas de compra ou arrendamento" },
      { title: "Visita", purpose: "Agendamento de visita com disponibilidade" },
    ],
    serviceLabel: "Serviços",
    narrative: "Espaço, luz e detalhe: cada imóvel apresentado como uma decisão de vida.",
    tone: "Elegante, concreto, contido",
    grain: 0.3,
    shape: "frame",
  },
  commerce: {
    id: "commerce",
    label: "Retalho, produto & comércio",
    keywords: ["loja", "retalho", "comércio", "comercio", "moda", "produto", "distribu", "supermerc", "merce", "flor", "móve", "move", "decoraç", "decorac", "brinquedo", "livraria"],
    mood: "Energia comercial com precisão de catálogo",
    palette: {
      background: "#0F0F10",
      surface: "#191A1C",
      ink: "#FAFAF7",
      muted: "#9B9B96",
      accent: "#FF5A36",
      accentInk: "#1B0A05",
      secondary: "#B9FF00",
    },
    typography: {
      display: GROTESK,
      body: GROTESK,
      displayClass: "display",
      bodyClass: "body",
      scale: "Títulos 40–76px com peso 600, preços em mono 15px tabular",
      notes: "Uma família com pesos fortes; números tabulares para preços e stock.",
    },
    motion: "Hover com escala 1.02 em 160ms, entrada escalonada de grelha de produto, zero animação em checkout.",
    layout: "Grelha de produto de 4 colunas (2 em mobile) com filtros laterais persistentes.",
    heroConcept:
      "Hero com campanha em curso, produto em primeiro plano e barra de benefícios (envio, devolução, apoio) imediatamente visível.",
    photographyDirection:
      "Fotografia de produto em fundo neutro com sombra suave, mais planos de lifestyle para campanhas.",
    microInteractions: [
      "Adicionar ao carrinho com feedback imediato",
      "Filtros com transição sem recarregar",
      "Imagem de produto com zoom no hover",
    ],
    sections: [
      { title: "Campanha", purpose: "Oferta ou novidade em destaque" },
      { title: "Categorias", purpose: "Navegação por necessidade de compra" },
      { title: "Produtos em destaque", purpose: "Seleção com preço e disponibilidade" },
      { title: "Confiança", purpose: "Envio, devoluções e apoio" },
      { title: "Loja física", purpose: "Morada, horário e contactos" },
    ],
    serviceLabel: "Produtos",
    narrative: "Do desejo ao checkout, cada passo sem atrito.",
    tone: "Direto, energético, informativo",
    grain: 0.35,
    shape: "grid",
  },
};

const KEYWORD_MAP: { id: ArchetypeId; words: string[] }[] = Object.values(ARCHETYPES).map((a) => ({
  id: a.id,
  words: a.keywords,
}));

/** Escolhe o arquétipo criativo com base no setor e, em segundo plano, nos serviços do lead. */
export function pickArchetype(sector: string, services: string[] = [], notes = ""): ArchetypeId {
  const haystack = `${sector} ${services.join(" ")} ${notes}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  let best: { id: ArchetypeId; score: number } = { id: "professional", score: 0 };
  for (const entry of KEYWORD_MAP) {
    let score = 0;
    for (const word of entry.words) {
      const normalized = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (haystack.includes(normalized)) score += normalized.length >= 6 ? 3 : 2;
    }
    if (score > best.score) best = { id: entry.id, score };
  }
  return best.score > 0 ? best.id : "professional";
}

export function tokensFor(archetype: Archetype, brandColors: string[] = []): DesignTokens {
  const palette = { ...archetype.palette };
  const usable = brandColors
    .filter((c) => /^#[0-9a-f]{6}$/i.test(c))
    .filter((c) => {
      const r = parseInt(c.slice(1, 3), 16);
      const g = parseInt(c.slice(3, 5), 16);
      const b = parseInt(c.slice(5, 7), 16);
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return luminance > 0.08 && luminance < 0.92;
    });
  if (usable.length > 0) {
    // Integra a cor de marca dominante como acento, mantendo contraste do sistema.
    palette.secondary = usable[0];
  }
  return {
    palette,
    typography: { ...archetype.typography },
    motion: archetype.motion,
    layout: archetype.layout,
  };
}
