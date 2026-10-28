export type Role = "admin" | "member" | "viewer";

export type TmStatus =
  | "awaiting"
  | "analyzing"
  | "capturing"
  | "creative"
  | "building"
  | "review"
  | "published"
  | "failed";

export type ShowcaseStatus = "draft" | "review" | "published";

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type StepKey =
  | "ingest"
  | "capture"
  | "analyze"
  | "brief"
  | "prompt"
  | "prototype"
  | "finalize";

export type StepStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

export interface Lead {
  id: string;
  company_name: string;
  sector: string;
  location: string | null;
  website: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  services: string[];
  notes: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyIntelligence {
  companyName: string;
  sector: string;
  location: string | null;
  website: string | null;
  services: string[];
  targetAudience: { text: string; hypothesis: boolean };
  valueProposition: { text: string; hypothesis: boolean };
  brandElements: {
    colors: string[];
    fonts: string[];
    logoDetected: boolean;
    tone: string;
  };
  facts: string[];
  hypotheses: string[];
}

export interface PageAnalysis {
  url: string;
  status: number | null;
  title: string | null;
  description: string | null;
  h1: string[];
  h2: string[];
  wordCount: number;
  ctaCount: number;
  ctaLabels: string[];
  images: number;
  imagesWithoutAlt: number;
  hasViewportMeta: boolean;
  hasLangAttr: boolean;
  fontFamilies: string[];
  colors: string[];
  hasStructuredData: boolean;
  hasOpenGraph: boolean;
  hasFavicon: boolean;
  internalLinks: number;
  externalLinks: number;
  notes: string[];
  error?: string;
}

export type Priority = "alta" | "média" | "baixa";

export interface Opportunity {
  id: string;
  category: "conteúdo" | "identidade visual" | "UX" | "mobile" | "conversão" | "técnico" | "SEO";
  observation: string;
  evidence: string;
  problem: string;
  proposedChange: string;
  expectedBenefit: string;
  priority: Priority;
  hypothesis: boolean;
}

export interface CurrentExperience {
  reachable: boolean;
  finalUrl: string | null;
  statusCode: number | null;
  capturedAt: string | null;
  captureSource: "playwright" | "upload" | "none";
  pages: PageAnalysis[];
  screenshots: {
    desktop?: string;
    mobile?: string;
    fullPage?: string;
  };
  preserve: string[];
  captureError?: string | null;
}

export interface DesignTokens {
  palette: {
    background: string;
    surface: string;
    ink: string;
    muted: string;
    accent: string;
    accentInk: string;
    secondary: string;
  };
  typography: {
    display: string;
    body: string;
    displayClass: string;
    bodyClass: string;
    scale: string;
    notes: string;
  };
  motion: string;
  layout: string;
}

export interface CreativeBrief {
  archetype: string;
  conceptName: string;
  positioning: string;
  targetAudience: string;
  businessGoal: string;
  narrative: string;
  heroConcept: string;
  photographyDirection: string;
  microInteractions: string[];
  tokens: DesignTokens;
  sections: { title: string; purpose: string; copy: string }[];
  ctas: { label: string; intent: string; note: string }[];
  copyBlocks: { heading: string; body: string }[];
  accessibility: string[];
  seo: string[];
  performance: string[];
  features: string[];
  integrations: string[];
  technicalConstraints: string[];
  acceptanceCriteria: string[];
  references: string[];
  engine: "remote" | "local";
}

export interface PrototypePage {
  slug: string;
  title: string;
  html: string;
}

export interface Prototype {
  version: number;
  engine: "remote" | "local";
  entry: string;
  pages: PrototypePage[];
  sharedCss: string;
  generatedAt: string;
  notes: string[];
}

export interface TimeMachine {
  id: string;
  lead_id: string;
  slug: string;
  title: string;
  status: TmStatus;
  progress: number;
  current_step: StepKey | null;
  company: CompanyIntelligence | null;
  current_experience: CurrentExperience | null;
  opportunities: Opportunity[];
  brief: CreativeBrief | null;
  master_prompt: string | null;
  prototype: Prototype | null;
  showcase_status: ShowcaseStatus;
  showcase_token_hash: string | null;
  showcase_token_hint: string | null;
  showcase_created_at: string | null;
  showcase_last_rotated_at: string | null;
  showcase_revoked_at: string | null;
  showcase_expires_at: string | null;
  ai_calls: number;
  cost_cents: number;
  last_error: string | null;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JobStep {
  key: StepKey;
  status: StepStatus;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  error: string | null;
  log: string[];
}

export interface Job {
  id: string;
  time_machine_id: string;
  status: JobStatus;
  requested_steps: StepKey[];
  steps: JobStep[];
  engine: string | null;
  cost_cents: number;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_by: string;
  created_at: string;
}

export interface Artifact {
  id: string;
  time_machine_id: string;
  kind: "screenshot-desktop" | "screenshot-mobile" | "screenshot-full" | "prototype" | "upload";
  filename: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  source: "playwright" | "upload" | "generator";
  created_at: string;
}

export interface TimeMachineSummary extends TimeMachine {
  lead: Lead;
  job: Job | null;
}

export const STATUS_LABELS: Record<TmStatus, string> = {
  awaiting: "A aguardar",
  analyzing: "A analisar website",
  capturing: "A capturar screenshots",
  creative: "A gerar direção criativa",
  building: "A construir protótipo",
  review: "Em revisão",
  published: "Publicada",
  failed: "Falhou",
};

export const SHOWCASE_LABELS: Record<ShowcaseStatus, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  published: "Publicada",
};

export const STEP_LABELS: Record<StepKey, string> = {
  ingest: "Recolha de dados da empresa",
  capture: "Captura do website atual",
  analyze: "Análise e oportunidades",
  brief: "Direção criativa",
  prompt: "Prompt master",
  prototype: "Protótipo navegável",
  finalize: "Publicação para revisão",
};

export const STEP_ORDER: StepKey[] = [
  "ingest",
  "capture",
  "analyze",
  "brief",
  "prompt",
  "prototype",
  "finalize",
];
