import { z } from "zod";
import { PermissionError } from "@/lib/access";
import { getTimeMachine } from "@/lib/repo";
import { can } from "@/lib/auth";
import { fail, handleError, json, requireUser } from "@/lib/http";
import {
  issueShowcaseLink,
  revokeShowcaseLink,
  setShowcaseStatus,
} from "@/lib/showcase";

type Params = { params: Promise<{ id: string }> };

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("issue"), ttlDays: z.number().int().min(1).max(365).optional() }),
  z.object({ action: z.literal("rotate"), ttlDays: z.number().int().min(1).max(365).optional() }),
  z.object({ action: z.literal("revoke") }),
  z.object({ action: z.literal("status"), status: z.enum(["draft", "review", "published"]) }),
]);

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    if (!can(auth.user, "tm:share")) throw new PermissionError("forbidden", "Sem permissão para partilhar.");
    const { id } = await params;
    const tm = getTimeMachine(id);
    if (!tm) return fail("Time Machine não encontrada.", 404, "not_found");
    const body = schema.parse(await request.json());

    if (body.action === "status") {
      if (body.status === "published" && !can(auth.user, "tm:publish")) {
        throw new PermissionError("forbidden", "Apenas administradores podem publicar.");
      }
      const updated = setShowcaseStatus(id, body.status);
      return json({ ok: true, timeMachine: updated });
    }

    if (body.action === "revoke") {
      revokeShowcaseLink(id);
      return json({ ok: true, timeMachine: getTimeMachine(id) });
    }

    if (!tm.prototype || !tm.brief) {
      return fail("Gera um protótipo antes de criar o link de apresentação.", 409, "not_ready");
    }
    const link = issueShowcaseLink(id, body.ttlDays);
    return json({
      ok: true,
      link: { path: link.path, expiresAt: link.expiresAt, hint: link.hint },
      timeMachine: getTimeMachine(id),
    });
  } catch (error) {
    return handleError(error);
  }
}
