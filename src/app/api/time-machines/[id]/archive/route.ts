import { z } from "zod";
import { PermissionError } from "@/lib/access";
import { can } from "@/lib/auth";
import { fail, handleError, json, requireUser } from "@/lib/http";
import { getTimeMachine, updateTimeMachine } from "@/lib/repo";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ archived: z.boolean() });

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    if (!can(auth.user, "tm:edit")) throw new PermissionError("forbidden", "Sem permissão para editar.");
    const { id } = await params;
    const tm = getTimeMachine(id);
    if (!tm) return fail("Time Machine não encontrada.", 404, "not_found");
    const body = schema.parse(await request.json());
    const updated = updateTimeMachine(id, { archived_at: body.archived ? new Date().toISOString() : null });
    return json({ timeMachine: updated });
  } catch (error) {
    return handleError(error);
  }
}
