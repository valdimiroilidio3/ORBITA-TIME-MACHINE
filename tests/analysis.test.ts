import { describe, expect, it } from "vitest";
import { analyzeHtml, extractFonts, extractHexColors, stripTags } from "@/lib/analysis/html";
import { buildOpportunities, buildPreserveList } from "@/lib/analysis/opportunities";
import type { CurrentExperience, Lead } from "@/lib/types";

const lead = (patch: Partial<Lead> = {}): Lead => ({
  id: "lead_test",
  company_name: "Casa do Rio",
  sector: "restauração",
  location: "Coimbra",
  website: "https://casadorio.pt",
  contact_name: null,
  contact_email: "geral@casadorio.pt",
  contact_phone: "+351 239 000 000",
  whatsapp: null,
  services: ["Menu sazonal"],
  notes: null,
  owner_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...patch,
});

const experience = (pages: CurrentExperience["pages"], patch: Partial<CurrentExperience> = {}): CurrentExperience => ({
  reachable: pages.length > 0,
  finalUrl: "https://casadorio.pt/",
  statusCode: 200,
  capturedAt: new Date().toISOString(),
  captureSource: "playwright",
  pages,
  screenshots: {},
  preserve: [],
  captureError: null,
  ...patch,
});

const BAD_HTML = `<!doctype html><html><head><title>Casa do Rio</title>
<style>body{font-family:"Comic Sans MS",cursive;color:#ff0000} .x{font-family:Georgia} .y{font-family:"Open Sans"} .z{font-family:Lato}</style>
</head><body>
<img src="a.jpg"><img src="b.jpg" alt="prato">
<h1>Bem-vindos</h1><h1>Menu</h1>
<p>Pequeno texto.</p>
</body></html>`;

describe("análise de HTML", () => {
  it("extrai metadados e hierarquia", () => {
    const analysis = analyzeHtml(BAD_HTML, "https://casadorio.pt/", 200);
    expect(analysis.title).toBe("Casa do Rio");
    expect(analysis.h1).toEqual(["Bem-vindos", "Menu"]);
    expect(analysis.hasViewportMeta).toBe(false);
    expect(analysis.images).toBe(2);
    expect(analysis.imagesWithoutAlt).toBe(1);
    expect(analysis.wordCount).toBeLessThan(20);
    expect(analysis.ctaCount).toBe(0);
  });

  it("deteta cores e tipografia declaradas", () => {
    expect(extractHexColors(BAD_HTML)).toContain("#ff0000");
    expect(extractFonts(BAD_HTML)).toEqual(expect.arrayContaining(["Comic Sans MS", "Georgia"]));
  });

  it("remove scripts e estilos do texto útil", () => {
    const text = stripTags("<style>.a{}</style><script>alert(1)</script><p>Olá&nbsp;mundo</p>");
    expect(text).toBe("Olá mundo");
  });

  it("deteta CTAs por verbo de ação", () => {
    const html = `<html><head><meta name="viewport" content="width=device-width"><title>X</title></head>
      <body><h1>Serviço</h1><a href="/r">Reservar mesa</a><a href="/c">Pedir orçamento</a></body></html>`;
    const analysis = analyzeHtml(html, "https://x.pt", 200);
    expect(analysis.ctaLabels).toEqual(expect.arrayContaining(["Reservar mesa", "Pedir orçamento"]));
    expect(analysis.hasViewportMeta).toBe(true);
  });
});

describe("Opportunity Map baseado em evidência", () => {
  it("documenta apenas problemas com evidência observável", () => {
    const analysis = analyzeHtml(BAD_HTML, "https://casadorio.pt/", 200);
    const opportunities = buildOpportunities(lead(), experience([analysis]));
    const observations = opportunities.map((item) => item.observation).join(" | ");

    expect(observations).toMatch(/viewport/i);
    expect(observations).toMatch(/não têm texto alternativo/i);
    expect(observations).toMatch(/H1/i);
    expect(observations).toMatch(/apelos à ação|ação comercial clara/i);
    expect(observations).toMatch(/famílias tipográficas/i);

    for (const item of opportunities) {
      expect(item.evidence.length).toBeGreaterThan(3);
      expect(["alta", "média", "baixa"]).toContain(item.priority);
    }
  });

  it("não inventa problemas num site tecnicamente saudável", () => {
    const good = `<!doctype html><html lang="pt"><head><title>Casa do Rio</title>
      <meta name="viewport" content="width=device-width">
      <meta name="description" content="Cozinha de estação em Coimbra">
      <meta property="og:title" content="Casa do Rio">
      <style>body{font-family:Georgia}</style>
      <script type="application/ld+json">{"@type":"Restaurant"}</script></head>
      <body><h1>Cozinha de estação</h1>
      ${"<h2>Menu</h2><p>Prato sazonal com produto local e vinho da região.</p>".repeat(12)}
      <a href="/reservar">Reservar mesa</a></body></html>`;
    const analysis = analyzeHtml(good, "https://casadorio.pt/", 200);
    const opportunities = buildOpportunities(lead(), experience([analysis]));
    const observations = opportunities.map((item) => item.observation.toLowerCase()).join(" ");
    expect(observations).not.toMatch(/viewport/);
    expect(observations).not.toMatch(/texto alternativo/);
    expect(opportunities.every((item) => item.evidence.length > 0)).toBe(true);
  });

  it("assinala ausência de website como prioridade alta", () => {
    const opportunities = buildOpportunities(
      lead({ website: null }),
      experience([], { reachable: false, pages: [], finalUrl: null, statusCode: null }),
    );
    expect(opportunities[0].priority).toBe("alta");
    expect(opportunities[0].category).toBe("conversão");
    expect(opportunities[0].evidence).toMatch(/website/i);
  });

  it("assinala site inacessível sem fabricar conteúdo", () => {
    const opportunities = buildOpportunities(
      lead(),
      experience([], { reachable: false, captureError: "Falha ao contactar o website: timeout" }),
    );
    expect(opportunities[0].observation).toMatch(/não respondeu/i);
    expect(opportunities[0].evidence).toMatch(/timeout/);
  });

  it("constrói lista de elementos a preservar a partir de dados reais", () => {
    const analysis = analyzeHtml(BAD_HTML, "https://casadorio.pt/", 200);
    const preserve = buildPreserveList(experience([analysis]), lead());
    expect(preserve.join(" ")).toMatch(/Casa do Rio/);
    expect(preserve.join(" ")).toMatch(/telefone/i);
  });
});
