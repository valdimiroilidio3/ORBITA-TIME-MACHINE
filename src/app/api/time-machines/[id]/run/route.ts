import { z } from "zod";
import { PermissionError } from "@/lib/access";
import { getJob, getTimeMachine } from "@/lib/repo";
import { can } from "@/lib/auth";
import { fail, handleError, json, requireUser } from "@/lib/http";
import { startGeneration } from "@/lib/jobs";
import { STEP_ORDER } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  steps: z
    .array(z.enum(["ingest", "capture", "analyze", "brief", "prompt", "prototype", "finalize"]))
    .min(1)
    .optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    if (!can(auth.user, "tm:run")) throw new PermissionError("forbidden", "Sem permissão para gerar.");
    const { id } = await params;
    const tm = getTimeMachine(id);
    if (!tm) return fail("Time Machine não encontrada.", 404, "not_found");

    const raw = await request.json().catch(() => ({}));
    const body = schema.parse(raw ?? {});
    const steps = body.steps && body.steps.length > 0 ? body.steps : STEP_ORDER;
    const job = startGeneration({ timeMachineId: id, steps, userId: auth.user.id });
    return json({ job: getJob(job.id), timeMachine: getTimeMachine(id) }, 202);
  } catch (error) {
    return handleError(error);
  }
}
