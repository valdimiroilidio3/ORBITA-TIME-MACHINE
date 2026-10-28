import { z } from "zod";
import { createTimeMachine, getLead, listTimeMachines } from "@/lib/repo";
import { startGeneration } from "@/lib/jobs";
import { STEP_ORDER } from "@/lib/types";
import { handleError, json, requireUser } from "@/lib/http";
import type { TmStatus } from "@/lib/types";

const schema = z.object({
  leadId: z.string().min(3),
  autoStart: z.boolean().optional().default(false),
});

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const params = new URL(request.url).searchParams;
  const items = listTimeMachines({
    query: params.get("q") ?? undefined,
    status: (params.get("status") as TmStatus | "all") ?? "all",
    sector: params.get("sector") ?? "all",
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });
  return json({ items });
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser("tm:create");
    if ("response" in auth) return auth.response;
    const body = schema.parse(await request.json());
    const lead = getLead(body.leadId);
    if (!lead) return json({ error: "Lead não encontrada." }, 404);
    const tm = createTimeMachine(lead, auth.user.id);
    let started = false;
    let warning: string | null = null;
    if (body.autoStart) {
      // O fluxo principal arranca automaticamente ao criar a Time Machine.
      try {
        startGeneration({ timeMachineId: tm.id, steps: STEP_ORDER, userId: auth.user.id });
        started = true;
      } catch (error) {
        warning = error instanceof Error ? error.message : "Não foi possível iniciar a geração.";
      }
    }
    return json({ timeMachine: tm, started, warning }, 201);
  } catch (error) {
    return handleError(error);
  }
}
