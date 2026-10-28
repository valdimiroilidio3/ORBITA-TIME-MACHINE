import { z } from "zod";
import type { CompanyIntelligence, CreativeBrief, Lead, Opportunity } from "../types";
import { ARCHETYPES } from "../creative/archetypes";
import { aiAvailable, callAi } from "./provider";

const BriefEnrichmentSchema = z.object({
  conceptName: z.string().min(3).max(80),
  positioning: z.string().min(20).max(600),
  businessGoal: z.string().min(20).max(600),
  narrative: z.string().min(15).max(400),
  heroHeading: z.string().min(5).max(90),
  heroSupport: z.string().min(20).max(400),
  photographyDirection: z.string().min(20).max(600),
  sectionCopy: z.array(z.string().min(15).max(400)).min(2).max(6),
});

export type BriefEnrichment = z.infer<typeof BriefEnrichmentSchema>;

export interface EnrichmentOutcome {
  brief: CreativeBrief;
  engine: "remote" | "local";
  costCents: number;
  error: string | null;
}

function buildPrompt(
  lead: Lead,
  company: CompanyIntelligence,
  opportunities: Opportunity[],
  brief: CreativeBrief,
): string {
  const archetype = ARCHETYPES[brief.archetype as keyof typeof ARCHETYPES] ?? ARCHETYPES.professional;
  return `Empresa: ${lead.company_name}
Setor: ${lead.sector}
Localização: ${lead.location ?? "não indicada"}
Serviços conhecidos: ${company.services.join(", ") || "a confirmar"}
Arquétipo visual decidido: ${archetype.label} (${archetype.mood})
Posicionamento atual proposto: ${brief.positioning}
Oportunidades observadas (com evidência):
${opportunities.map((o) => `- [${o.category}/${o.priority}] ${o.observation} (${o.evidence})`).join("\n") || "- sem evidência recolhida"}

Escreve em português europeu, tom ${archetype.tone}. Regras obrigatórias:
- Não inventes prémios, certificações, avaliações, número de clientes, anos de atividade ou moradas.
- Não uses superlativos vazios (líder, melhor, único).
- Frases curtas e concretas. Nada de clichés de agência ("soluções inovadoras", "paixão pelo que fazemos").
- headline e support devem poder ser publicados sem validação adicional.
Responde APENAS com JSON válido no formato:
{"conceptName":"string","positioning":"string","businessGoal":"string","narrative":"string","heroHeading":"string","heroSupport":"string","photographyDirection":"string","sectionCopy":["string","string","string"]}`;
}

function parseJsonBlock(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Resposta sem objeto JSON.");
  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Enriquecimento remoto opcional do briefing. Se o fornecedor falhar, o
 * briefing local (determinístico e completo) é mantido — a geração nunca fica
 * bloqueada por indisponibilidade de IA externa.
 */
export async function enrichBrief(
  lead: Lead,
  company: CompanyIntelligence,
  opportunities: Opportunity[],
  brief: CreativeBrief,
  signal?: AbortSignal,
): Promise<EnrichmentOutcome> {
  if (!aiAvailable()) {
    return { brief, engine: "local", costCents: 0, error: null };
  }
  const result = await callAi({
    system:
      "És um diretor criativo sénior de uma agência portuguesa de produto digital. Escreves copy factual, específica e verificável. Respondes apenas em JSON.",
    prompt: buildPrompt(lead, company, opportunities, brief),
    signal,
  });
  if (!result.ok) {
    return { brief, engine: "local", costCents: result.costCents, error: result.error };
  }
  try {
    const parsed = BriefEnrichmentSchema.parse(parseJsonBlock(result.text));
    const sections = brief.sections.map((section, index) => ({
      ...section,
      copy: parsed.sectionCopy[index] ?? section.copy,
    }));
    const enriched: CreativeBrief = {
      ...brief,
      conceptName: parsed.conceptName,
      positioning: parsed.positioning,
      businessGoal: parsed.businessGoal,
      narrative: parsed.narrative,
      photographyDirection: parsed.photographyDirection,
      sections,
      copyBlocks: [
        { heading: parsed.heroHeading, body: parsed.heroSupport },
        brief.copyBlocks[1],
      ],
      engine: "remote",
    };
    return { brief: enriched, engine: "remote", costCents: result.costCents, error: null };
  } catch (error) {
    return {
      brief,
      engine: "local",
      costCents: result.costCents,
      error: `Fornecedor de IA devolveu conteúdo inválido (${(error as Error).message}). Mantido o briefing local.`,
    };
  }
}
