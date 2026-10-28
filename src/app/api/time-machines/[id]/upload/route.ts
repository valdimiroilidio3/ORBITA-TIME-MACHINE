import { PermissionError } from "@/lib/access";
import { can } from "@/lib/auth";
import { fail, handleError, json, requireUser } from "@/lib/http";
import { inspectImage } from "@/lib/image";
import { storeUploadedImage } from "@/lib/artifacts";
import { buildPreserveList } from "@/lib/analysis/opportunities";
import { getLead, getTimeMachine, updateTimeMachine } from "@/lib/repo";
import type { Artifact } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_KINDS: Artifact["kind"][] = ["screenshot-desktop", "screenshot-mobile"];

/**
 * Upload de screenshots autorizados (quando a captura automática não é
 * possível ou o operador tem imagens próprias). Nunca substitui a captura
 * real por uma imagem fabricada: fica registado como origem "upload".
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    if (!can(auth.user, "tm:edit")) throw new PermissionError("forbidden", "Sem permissão para editar.");
    const { id } = await params;
    const tm = getTimeMachine(id);
    if (!tm) return fail("Time Machine não encontrada.", 404, "not_found");
    const lead = getLead(tm.lead_id);

    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "screenshot-desktop") as Artifact["kind"];
    if (!ALLOWED_KINDS.includes(kind)) return fail("Tipo de captura inválido.", 422, "invalid_kind");
    if (!(file instanceof File)) return fail("Ficheiro em falta.", 422, "missing_file");
    if (file.size > MAX_BYTES) return fail("Ficheiro acima de 8 MB.", 413, "too_large");
    const buffer = Buffer.from(await file.arrayBuffer());
    const info = inspectImage(buffer);
    if (!info.valid) return fail("Formato de imagem não suportado (PNG, JPEG ou WebP).", 415, "invalid_image");

    const artifact = storeUploadedImage(id, kind, buffer, info.mime, info.width, info.height);

    const experience = tm.current_experience;
    if (experience) {
      const screenshots = { ...experience.screenshots, [kind === "screenshot-mobile" ? "mobile" : "desktop"]: artifact.id };
      const next = {
        ...experience,
        screenshots,
        captureSource: "upload" as const,
        capturedAt: experience.capturedAt ?? new Date().toISOString(),
      };
      updateTimeMachine(id, {
        current_experience: { ...next, preserve: experience.preserve.length ? experience.preserve : lead ? buildPreserveList(next, lead) : [] },
      });
    }
    return json({ artifact, timeMachine: getTimeMachine(id) }, 201);
  } catch (error) {
    return handleError(error);
  }
}
