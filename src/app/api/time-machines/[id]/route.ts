import { z } from "zod";
import { PermissionError } from "@/lib/access";
import { deleteTimeMachine, getLatestJob, getLead, getTimeMachine, listJobs, updateTimeMachine } from "@/lib/repo";
import { can } from "@/lib/auth";
import { fail, handleError, json, requireUser } from "@/lib/http";
import { deleteAllArtifacts } from "@/lib/artifacts";
import { STEP_ORDER } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const tm = getTimeMachine(id);
  if (!tm) return fail("Time Machine não encontrada.", 404, "not_found");
  const job = getLatestJob(tm.id);
  return json({
    timeMachine: tm,
    lead: getLead(tm.lead_id),
    job,
    jobs: listJobs(tm.id, 8),
    steps: STEP_ORDER,
  });
}

const patchSchema = z.object({
  master_prompt: z.string().max(60_000).optional(),
  title: z.string().min(2).max(160).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    if (!can(auth.user, "tm:edit")) throw new PermissionError("forbidden", "Sem permissão para editar.");
    const { id } = await params;
    const tm = getTimeMachine(id);
    if (!tm) return fail("Time Machine não encontrada.", 404, "not_found");
    const body = patchSchema.parse(await request.json());
    const updated = updateTimeMachine(id, body);
    return json({ timeMachine: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    if (!can(auth.user, "tm:delete")) throw new PermissionError("forbidden", "Apenas administradores podem eliminar.");
    const { id } = await params;
    const tm = getTimeMachine(id);
    if (!tm) return fail("Time Machine não encontrada.", 404, "not_found");
    deleteTimeMachine(id);
    deleteAllArtifacts(id);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
