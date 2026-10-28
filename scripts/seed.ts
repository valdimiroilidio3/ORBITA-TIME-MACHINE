/**
 * Prepara a base local: utilizadores, leads de demonstração e (opcionalmente)
 * uma Time Machine de exemplo com protótipo gerado.
 *
 *   npm run db:seed               → leads de demonstração
 *   npm run db:seed -- --demo     → + geração completa de uma Time Machine
 *   npm run db:seed -- --reset    → apaga a base local antes de semear
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "../src/lib/config";
import { ensureSeedUsers, authenticate } from "../src/lib/auth";
import { createLead, getTimeMachine, listLeads, listTimeMachines } from "../src/lib/repo";
import { DEMO_LEADS } from "../src/lib/seed";
import { generatePrototype } from "../src/lib/creative/prototype";
import { buildCompanyIntelligence, buildLocalBrief, briefToMasterPrompt } from "../src/lib/creative/brief";
import { buildOpportunities, buildPreserveList } from "../src/lib/analysis/opportunities";
import { buildShowcaseSlug } from "../src/lib/crypto";
import { getDb, newId, nowIso } from "../src/lib/db";
import type { CreativeBrief, CurrentExperience } from "../src/lib/types";

const args = new Set(process.argv.slice(2));

if (args.has("--reset")) {
  const dbFile = config.dbFile;
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(`${dbFile}${suffix}`, { force: true });
  }
  fs.rmSync(path.join(config.artifactsDir), { recursive: true, force: true });
  console.log(`Base local removida (${dbFile}).`);
}

ensureSeedUsers();
const admin = authenticate(config.admin.email, config.admin.password);
if (!admin) throw new Error("Não foi possível autenticar o utilizador administrador.");

if (listLeads().length === 0) {
  for (const lead of DEMO_LEADS) createLead(lead, admin.id);
  console.log(`${DEMO_LEADS.length} leads de demonstração criadas.`);
} else {
  console.log(`${listLeads().length} leads já existentes — nada a criar.`);
}

if (args.has("--demo")) {
  if (listTimeMachines().length > 0) {
    console.log("Já existem Time Machines; a demonstração não foi gerada de novo.");
  } else {
    const lead = listLeads().find((item) => item.website) ?? listLeads()[0];
    const experience: CurrentExperience = {
      reachable: false,
      finalUrl: lead.website,
      statusCode: null,
      capturedAt: null,
      captureSource: "none",
      pages: [],
      screenshots: {},
      preserve: [],
      captureError: "Semente de demonstração: sem captura automática.",
    };
    const company = buildCompanyIntelligence(lead, experience);
    const opportunities = buildOpportunities(lead, experience);
    const brief: CreativeBrief = buildLocalBrief(lead, company, experience, opportunities);
    const prototype = generatePrototype(lead, company, brief, { version: 1, engine: "local" });
    const prompt = briefToMasterPrompt(lead, company, experience, opportunities, brief);
    const id = newId("tm");
    const ts = nowIso();
    getDb()
      .prepare(
        `INSERT INTO time_machines (id, lead_id, slug, title, status, progress, company, current_experience,
          opportunities, brief, master_prompt, prototype, showcase_status, created_by, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        id,
        lead.id,
        buildShowcaseSlug(lead.company_name),
        `${lead.company_name} — Time Machine`,
        "review",
        100,
        JSON.stringify(company),
        JSON.stringify({ ...experience, preserve: buildPreserveList(experience, lead) }),
        JSON.stringify(opportunities),
        JSON.stringify(brief),
        prompt,
        JSON.stringify(prototype),
        "draft",
        admin.id,
        ts,
        ts,
      );
    console.log(`Time Machine de demonstração criada: ${getTimeMachine(id)?.title}`);
  }
}

console.log(`\nPronto. Entra em /login com ${config.admin.email} / (palavra-passe definida em .env).`);
