import { canReadArtifact } from "@/lib/access";
import { readArtifactFile } from "@/lib/artifacts";
import { getArtifact } from "@/lib/repo";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const artifact = getArtifact(id);
  if (!artifact) return new Response("Não encontrado", { status: 404 });
  if (!(await canReadArtifact(artifact))) return new Response("Acesso negado", { status: 403 });
  const buffer = readArtifactFile(artifact);
  if (!buffer) return new Response("Ficheiro indisponível", { status: 410 });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": artifact.mime,
      "content-length": String(buffer.byteLength),
      "cache-control": "private, max-age=300, no-transform",
      "content-disposition": `inline; filename="${artifact.filename}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
