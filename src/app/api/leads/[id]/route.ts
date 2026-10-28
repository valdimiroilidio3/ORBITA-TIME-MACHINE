import { z } from "zod";
import { PermissionError } from "@/lib/access";
import { can } from "@/lib/auth";
import { fail, handleError, json, requireUser } from "@/lib/http";
import { getLead, updateLead } from "@/lib/repo";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  company_name: z.string().min(2).max(160).optional(),
  sector: z.string().min(2).max(80).optional(),
  location: z.string().max(120).nullable().optional(),
  website: z.string().max(300).nullable().optional(),
  contact_name: z.string().max(120).nullable().optional(),
  contact_email: z.string().max(160).nullable().optional(),
  contact_phone: z.string().max(60).nullable().optional(),
  whatsapp: z.string().max(60).nullable().optional(),
  services: z.array(z.string().max(80)).max(12).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    if (!can(auth.user, "lead:write")) throw new PermissionError("forbidden", "Sem permissão para editar a lead.");
    const { id } = await params;
    const lead = getLead(id);
    if (!lead) return fail("Lead não encontrada.", 404, "not_found");
    const body = schema.parse(await request.json());
    const updated = updateLead(id, body);
    return json({ lead: updated });
  } catch (error) {
    return handleError(error);
  }
}
