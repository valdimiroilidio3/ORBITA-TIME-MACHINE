import { getDb } from "./db";
import { createLead, listLeads } from "./repo";

export interface DemoLeadSeed {
  company_name: string;
  sector: string;
  location: string;
  website: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  services: string[];
  notes: string;
}

export const DEMO_LEADS: DemoLeadSeed[] = [
  {
    company_name: "Casa do Rio",
    sector: "restauração",
    location: "Coimbra",
    website: "https://example.com",
    contact_name: "Marta Silva",
    contact_email: "geral@casadolrio.pt",
    contact_phone: "+351 239 000 000",
    services: ["Menu sazonal", "Reservas", "Eventos privados"],
    notes:
      "Lead de demonstração. O domínio aponta para example.com — serve para testar o estado 'sem conteúdo útil'.",
  },
  {
    company_name: "Clínica Mondego",
    sector: "clínica",
    location: "Coimbra",
    website: "https://example.org",
    contact_name: "Dr. Nuno Ferreira",
    contact_email: "geral@clinicamondego.pt",
    contact_phone: "+351 239 111 222",
    services: ["Medicina dentária", "Fisioterapia", "Consultas de especialidade"],
    notes: "Lead de demonstração com website placeholder.",
  },
  {
    company_name: "Metalúrgica Beira",
    sector: "indústria",
    location: "Mealhada",
    website: "",
    contact_name: "Rui Almeida",
    contact_email: "comercial@metalurgicabeira.pt",
    contact_phone: "+351 231 333 444",
    services: ["Produção de estruturas metálicas", "Serralharia", "Manutenção industrial"],
    notes: "Lead sem website — demonstra o fluxo de oportunidade 'sem presença digital própria'.",
  },
  {
    company_name: "Estúdio Linha",
    sector: "estúdio criativo",
    location: "Porto",
    website: "https://example.net",
    contact_name: "Ana Ribeiro",
    contact_email: "ola@estudiolinha.pt",
    contact_phone: "+351 220 555 666",
    services: ["Branding", "Web design", "Direção de arte"],
    notes: "Lead de demonstração com website placeholder.",
  },
];

/** Cria leads de demonstração apenas numa instalação sem leads. */
export function ensureDemoData(ownerId: string): void {
  const existing = getDb().prepare("SELECT COUNT(*) AS n FROM leads").get() as { n: number };
  if (Number(existing?.n ?? 0) > 0) return;
  for (const lead of DEMO_LEADS) {
    createLead(lead, ownerId);
  }
}

export function seedSummary(): { leads: number } {
  return { leads: listLeads().length };
}
