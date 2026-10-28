import { describe, expect, it } from "vitest";
import { ARCHETYPES, pickArchetype, tokensFor } from "@/lib/creative/archetypes";
import { buildCompanyIntelligence, buildLocalBrief, briefToMasterPrompt } from "@/lib/creative/brief";
import { generatePrototype, escapeHtml } from "@/lib/creative/prototype";
import { analyzeHtml } from "@/lib/analysis/html";
import { buildOpportunities } from "@/lib/analysis/opportunities";
import { generateArtwork, hashSeed } from "@/lib/creative/art";
import type { CurrentExperience, Lead } from "@/lib/types";

function makeLead(patch: Partial<Lead> = {}): Lead {
  return {
    id: "lead_x",
    company_name: "Casa do Rio",
    sector: "restauração",
    location: "Coimbra",
    website: "https://casadorio.pt",
    contact_name: "Marta",
    contact_email: "geral@casadorio.pt",
    contact_phone: "+351 239 000 000",
    whatsapp: null,
    services: ["Menu sazonal", "Reservas"],
    notes: null,
    owner_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...patch,
  };
}

function makeExperience(lead: Lead): CurrentExperience {
  const html = `<html><head><title>${lead.company_name}</title></head><body><h1>${lead.company_name}</h1>
    <p>${"conteúdo ".repeat(60)}</p><a href="/contacto">Contacte-nos</a></body></html>`;
  const page = analyzeHtml(html, lead.website ?? "https://x.pt", 200);
  return {
    reachable: true,
    finalUrl: lead.website,
    statusCode: 200,
    capturedAt: new Date().toISOString(),
    captureSource: "playwright",
    pages: [page],
    screenshots: { desktop: "art_1" },
    preserve: [],
    captureError: null,
  };
}

describe("arquétipos criativos", () => {
  it("distingue setores diferentes", () => {
    expect(pickArchetype("restauração")).toBe("gastronomy");
    expect(pickArchetype("clínica dentária")).toBe("clinical");
    expect(pickArchetype("indústria metalúrgica")).toBe("industrial");
    expect(pickArchetype("estúdio criativo")).toBe("studio");
    expect(pickArchetype("advocacia")).toBe("professional");
    expect(pickArchetype("software")).toBe("tech");
    expect(pickArchetype("imobiliário")).toBe("realestate");
    expect(pickArchetype("loja de moda")).toBe("commerce");
  });

  it("cai num arquétipo sóbrio quando o setor é desconhecido", () => {
    expect(pickArchetype("setor inventado xyz")).toBe("professional");
  });

  it("gera paletas distintas por arquétipo", () => {
    const palettes = new Set(Object.values(ARCHETYPES).map((item) => item.palette.accent));
    expect(palettes.size).toBeGreaterThanOrEqual(6);
  });

  it("integra cor de marca detetada como acento secundário", () => {
    const tokens = tokensFor(ARCHETYPES.gastronomy, ["#3355aa"]);
    expect(tokens.palette.secondary).toBe("#3355aa");
  });
});

describe("briefing e prompt master", () => {
  const lead = makeLead();
  const experience = makeExperience(lead);
  const company = buildCompanyIntelligence(lead, experience);
  const opportunities = buildOpportunities(lead, experience);
  const brief = buildLocalBrief(lead, company, experience, opportunities);

  it("produz copy específica com o nome e localização", () => {
    expect(brief.copyBlocks[0].heading.length).toBeGreaterThan(8);
    expect(brief.conceptName.length).toBeGreaterThan(3);
    expect(brief.sections.length).toBeGreaterThanOrEqual(4);
    expect(brief.ctas[0].label.length).toBeGreaterThan(3);
  });

  it("é determinístico para a mesma empresa", () => {
    const again = buildLocalBrief(lead, company, experience, opportunities);
    expect(again.copyBlocks[0].heading).toBe(brief.copyBlocks[0].heading);
    expect(again.conceptName).toBe(brief.conceptName);
  });

  it("distingue restaurante de clínica", () => {
    const clinicLead = makeLead({ company_name: "Clínica Mondego", sector: "clínica" });
    const clinicExp = makeExperience(clinicLead);
    const clinicBrief = buildLocalBrief(
      clinicLead,
      buildCompanyIntelligence(clinicLead, clinicExp),
      clinicExp,
      buildOpportunities(clinicLead, clinicExp),
    );
    expect(clinicBrief.archetype).toBe("clinical");
    expect(clinicBrief.copyBlocks[0].heading).not.toBe(brief.copyBlocks[0].heading);
    expect(clinicBrief.tokens.palette.background).not.toBe(brief.tokens.palette.background);
  });

  it("gera um prompt master com todas as secções exigidas", () => {
    const prompt = briefToMasterPrompt(lead, company, experience, opportunities, brief);
    for (const heading of [
      "Contexto real da empresa",
      "Objetivo comercial",
      "Público-alvo",
      "Posicionamento",
      "Direção de arte",
      "Paleta de cores",
      "Sistema tipográfico",
      "Layout e hierarquia visual",
      "Hero cinematográfica",
      "Conceito de fotografia/vídeo",
      "Microinterações",
      "Estrutura de páginas",
      "Copywriting",
      "Chamadas para ação",
      "Mobile-first",
      "Acessibilidade",
      "SEO técnico",
      "Performance",
      "Funcionalidades e integrações",
      "Restrições técnicas",
      "Critérios de aceitação",
    ]) {
      expect(prompt).toContain(heading);
    }
    expect(prompt).toContain(lead.company_name);
    expect(prompt).toMatch(/não copiar|Não copiar/i);
  });
});

describe("protótipo navegável", () => {
  const lead = makeLead();
  const experience = makeExperience(lead);
  const company = buildCompanyIntelligence(lead, experience);
  const opportunities = buildOpportunities(lead, experience);
  const brief = buildLocalBrief(lead, company, experience, opportunities);
  const prototype = generatePrototype(lead, company, brief, { version: 1, engine: "local" });

  it("gera três páginas navegáveis e interligadas", () => {
    expect(prototype.pages).toHaveLength(3);
    const entry = prototype.pages.find((page) => page.slug === prototype.entry)!;
    for (const page of prototype.pages) {
      expect(entry.html).toContain(`./${page.slug}`);
    }
  });

  it("é autónomo: não faz pedidos externos (compatível com CSP restritiva)", () => {
    for (const page of prototype.pages) {
      const externalLinks = page.html.match(/(?:src|href)=["'](https?:)?\/\//g) ?? [];
      expect(externalLinks, page.slug).toHaveLength(0);
      expect(page.html).toContain("prefers-reduced-motion");
      expect(page.html).toContain('lang="pt-PT"');
      expect(page.html).toContain('name="viewport"');
    }
  });

  it("escapa conteúdo do utilizador (prevenção de XSS)", () => {
    const evil = makeLead({ company_name: `<script>alert("xss")</script>` });
    const evilProto = generatePrototype(
      evil,
      buildCompanyIntelligence(evil, makeExperience(evil)),
      buildLocalBrief(evil, buildCompanyIntelligence(evil, makeExperience(evil)), makeExperience(evil), []),
      { version: 1, engine: "local" },
    );
    for (const page of evilProto.pages) {
      expect(page.html).not.toContain(`<script>alert("xss")</script>`);
      expect(page.html).toContain("&lt;script&gt;");
    }
    expect(escapeHtml('<b>"x"</b>')).toBe("&lt;b&gt;&quot;x&quot;&lt;/b&gt;");
  });

  it("identifica-se como demonstração e desativa ações comerciais", () => {
    const entry = prototype.pages[0].html;
    expect(entry).toContain("Protótipo demonstrativo ORBITA");
    expect(entry).toContain("não é o website oficial");
    expect(entry).toMatch(/disabled/);
    expect(prototype.notes.join(" ")).toMatch(/nenhuma fotografia de terceiros/i);
  });

  it("aplica o rótulo de serviço do arquétipo", () => {
    const clinicLead = makeLead({ company_name: "Clínica Mondego", sector: "clínica" });
    const clinicExp = makeExperience(clinicLead);
    const clinicCompany = buildCompanyIntelligence(clinicLead, clinicExp);
    const clinicProto = generatePrototype(
      clinicLead,
      clinicCompany,
      buildLocalBrief(clinicLead, clinicCompany, clinicExp, []),
      { version: 1, engine: "local" },
    );
    expect(clinicProto.pages.map((p) => p.slug)).toContain("especialidades");
  });
});

describe("arte gerada", () => {
  it("é determinística e não referencia recursos externos", () => {
    const a = generateArtwork(ARCHETYPES.studio, tokensFor(ARCHETYPES.studio), "Estúdio Linha");
    const b = generateArtwork(ARCHETYPES.studio, tokensFor(ARCHETYPES.studio), "Estúdio Linha");
    expect(a).toBe(b);
    expect(a.startsWith("data:image/svg+xml;base64,")).toBe(true);
    const svg = Buffer.from(a.split(",")[1], "base64").toString();
    expect(svg).not.toMatch(/href=|xlink/);
    expect(hashSeed("abc")).toBe(hashSeed("abc"));
  });
});
