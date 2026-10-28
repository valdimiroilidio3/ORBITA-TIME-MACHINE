import fs from "node:fs";
import path from "node:path";
import { config } from "./config";
import { createArtifact, deleteArtifactsOfKind, listArtifacts } from "./repo";
import type { Artifact } from "./types";
import type { CapturedImage } from "./capture";

export function storeCapturedImages(timeMachineId: string, images: CapturedImage[]): Artifact[] {
  const stored: Artifact[] = [];
  for (const image of images) {
    const extension = image.mime === "image/png" ? "png" : "jpg";
    const stamp = Date.now();
    const filename = `${image.kind.replace("screenshot-", "")}-${stamp}.${extension}`;
    const dir = path.join(config.artifactsDir, timeMachineId);
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, path.basename(filename));
    fs.writeFileSync(target, image.buffer);
    stored.push(
      createArtifact({
        time_machine_id: timeMachineId,
        kind: image.kind,
        filename,
        mime: image.mime,
        bytes: image.buffer.byteLength,
        width: image.width,
        height: image.height,
        source: "playwright",
      }),
    );
  }
  return stored;
}

export function storeUploadedImage(
  timeMachineId: string,
  kind: Artifact["kind"],
  buffer: Buffer,
  mime: string,
  width: number | null,
  height: number | null,
): Artifact {
  const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const stamp = Date.now();
  const filename = `upload-${kind.replace("screenshot-", "")}-${stamp}.${extension}`;
  const dir = path.join(config.artifactsDir, timeMachineId);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, path.basename(filename));
  fs.writeFileSync(target, buffer);
  return createArtifact({
    time_machine_id: timeMachineId,
    kind,
    filename,
    mime,
    bytes: buffer.byteLength,
    width,
    height,
    source: "upload",
  });
}

export function readArtifactFile(artifact: Artifact): Buffer | null {
  const target = path.join(config.artifactsDir, artifact.time_machine_id, path.basename(artifact.filename));
  if (!target.startsWith(config.artifactsDir)) return null;
  if (!fs.existsSync(target)) return null;
  return fs.readFileSync(target);
}

export function latestArtifacts(timeMachineId: string): Partial<Record<Artifact["kind"], Artifact>> {
  const map: Partial<Record<Artifact["kind"], Artifact>> = {};
  for (const artifact of listArtifacts(timeMachineId)) {
    if (!map[artifact.kind]) map[artifact.kind] = artifact;
  }
  return map;
}

export function clearCaptures(timeMachineId: string): void {
  const existing = listArtifacts(timeMachineId).filter((a) => a.kind.startsWith("screenshot-"));
  for (const artifact of existing) {
    const target = path.join(config.artifactsDir, artifact.time_machine_id, path.basename(artifact.filename));
    fs.rmSync(target, { force: true });
  }
  deleteArtifactsOfKind(timeMachineId, ["screenshot-desktop", "screenshot-mobile", "screenshot-full"]);
}

export function deleteAllArtifacts(timeMachineId: string): void {
  fs.rmSync(path.join(config.artifactsDir, timeMachineId), { recursive: true, force: true });
}
