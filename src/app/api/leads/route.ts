import { z } from "zod";
import { createLead, listLeads } from "@/lib/repo";
import { handleError, json, requireUser } from "@/lib/http";

const createSchema = z.object({
  company_name: z.string().min(2).max(160),
  sector: z.string().min(2).max(80).default("indefinido"),
  location: z.string().max(120).nullable().optional(),
  website: z.string().max(300).nullable().optional(),
  contact_name: z.string().max(120).nullable().optional(),
  contact_email: z.string().max(160).nullable().optional(),
  contact_phone: z.string().max(60).nullable().optional(),
  whatsapp: z.string().max(60).nullable().optional(),
  services: z.array(z.string().max(80)).max(12).default([]),
  notes: z.string().max(2000).nullable().optional(),
});

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const query = new URL(request.url).searchParams.get("q") ?? undefined;
  return json({ leads: listLeads(query) });
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser("lead:write");
    if ("response" in auth) return auth.response;
    const body = createSchema.parse(await request.json());
    const lead = createLead(body, auth.user.id);
    return json({ lead }, 201);
  } catch (error) {
    return handleError(error);
  }
}
