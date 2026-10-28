import type { PageAnalysis } from "../types";

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (entity.startsWith("#")) {
      const code = parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

export function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function all(html: string, regex: RegExp): string[] {
  const out: string[] = [];
  for (const match of html.matchAll(regex)) out.push(match[1] ?? "");
  return out;
}

function metaContent(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]).trim();
  }
  return null;
}

const CTA_PATTERN =
  /^(contacte(-nos)?|contacta(-nos)?|contact|fale (connosco|comigo)|ligue(-nos)?|marque|marcar|agendar|agende|reservar|reserve|comprar|compre|orçamento|pedir orçamento|solicitar orçamento|quote|book( now)?|get a quote|call now|saiba mais|ver mais|descobrir|conhecer|explorar|inscreva-se|subscrever|download|whatsapp|email|e-mail)/i;

export function extractHexColors(html: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    let hex = match[1].toLowerCase();
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex === "ffffff" || hex === "000000") continue;
    found.add(`#${hex}`);
  }
  return [...found].slice(0, 24);
}

export function extractFonts(html: string): string[] {
  const families = new Set<string>();
  for (const match of html.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    const first = match[1].split(",")[0].replace(/["']/g, "").trim();
    if (first && !/^(inherit|initial|unset|sans-serif|serif|system-ui|-apple-system)$/i.test(first)) {
      families.add(first);
    }
  }
  for (const match of html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([A-Za-z+0-9:;@,]+)/gi)) {
    for (const part of decodeEntities(match[1]).split("|")) {
      const name = part.split(":")[0].replace(/\+/g, " ").trim();
      if (name) families.add(name);
    }
  }
  return [...families].slice(0, 12);
}

export function analyzeHtml(html: string, url: string, status: number | null): PageAnalysis {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const h1 = all(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map((v) => stripTags(v)).filter(Boolean);
  const h2 = all(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi).map((v) => stripTags(v)).filter(Boolean);
  const anchorTexts = all(html, /<a\b[^>]*>([\s\S]*?)<\/a>/gi).map((v) => stripTags(v)).filter(Boolean);
  const buttonTexts = all(html, /<button\b[^>]*>([\s\S]*?)<\/button>/gi).map((v) => stripTags(v)).filter(Boolean);
  const ctaLabels = [...anchorTexts, ...buttonTexts]
    .filter((label) => label.length > 1 && label.length < 42 && CTA_PATTERN.test(label))
    .slice(0, 12);
  const images = html.match(/<img\b[^>]*>/gi) || [];
  const imagesWithoutAlt = images.filter((tag) => !/\balt\s*=\s*["'][^"']+["']/i.test(tag)).length;
  const hrefs = all(html, /<a\b[^>]+href=["']([^"']+)["']/gi);
  const origin = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return "";
    }
  })();
  const internalLinks = hrefs.filter((h) => h.startsWith("/") || h.startsWith("#") || (origin && h.startsWith(origin))).length;
  const externalLinks = hrefs.length - internalLinks;
  const text = stripTags(html);
  const wordCount = text ? text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
  const hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(html);
  const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
  const favicon = /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html);

  return {
    url,
    status,
    title: title ? decodeEntities(stripTags(title)).slice(0, 180) : null,
    description: metaContent(html, "description"),
    h1: h1.slice(0, 6),
    h2: h2.slice(0, 20),
    wordCount,
    ctaCount: ctaLabels.length,
    ctaLabels,
    images: images.length,
    imagesWithoutAlt,
    hasViewportMeta,
    hasLangAttr: Boolean(langMatch),
    fontFamilies: extractFonts(html),
    colors: extractHexColors(html),
    hasStructuredData: /application\/ld\+json/i.test(html),
    hasOpenGraph: /<meta[^>]+property=["']og:/i.test(html),
    hasFavicon: favicon,
    internalLinks,
    externalLinks,
    notes: [],
  };
}

/** Extrai serviços plausíveis do conteúdo textual da página (heurística transparente). */
export function guessServicesFromText(text: string, sector: string): string[] {
  const dictionary: Record<string, string[]> = {
    restauração: ["Menu sazonal", "Reservas", "Eventos privados", "Take-away", "Vinhos"],
    clínica: ["Consultas", "Medicina dentária", "Fisioterapia", "Análises", "Telemedicina"],
    indústria: ["Produção", "Engenharia", "Manutenção", "Logística", "Certificação"],
    tecnologia: ["Desenvolvimento de software", "Cloud", "Integrações", "Consultoria", "Suporte"],
    imobiliário: ["Venda de imóveis", "Arrendamento", "Avaliação", "Mediação", "Investimento"],
    construção: ["Remodelação", "Obra nova", "Fiscalização", "Design de interiores", "Licenciamento"],
    jurídico: ["Direito civil", "Direito laboral", "Fiscalidade", "Contencioso", "Consultoria"],
    "estúdio criativo": ["Branding", "Web design", "Fotografia", "Motion", "Direção de arte"],
    turismo: ["Experiências", "Alojamento", "Tours", "Transferes", "Pacotes"],
    retalho: ["Loja online", "Encomendas", "Devoluções", "Cartão presente", "Campanhas"],
  };
  const key = sector.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const entry = Object.entries(dictionary).find(([name]) =>
    key.includes(name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")),
  );
  const detected: string[] = [];
  const lower = text.toLowerCase();
  for (const keyword of ["reserva", "orçamento", "entrega", "consulta", "marcação", "formação", "projeto", "manutenção"]) {
    if (lower.includes(keyword)) detected.push(keyword[0].toUpperCase() + keyword.slice(1));
  }
  return [...new Set([...(entry?.[1] ?? []), ...detected])].slice(0, 6);
}
