"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function UploadCapture({ timeMachineId, canEdit }: { timeMachineId: string; canEdit: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState("screenshot-desktop");
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    setState("uploading");
    setMessage(null);
    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);
    try {
      const response = await fetch(`/api/time-machines/${timeMachineId}/upload`, { method: "POST", body });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Falha no upload.");
      setState("idle");
      setMessage("Captura autorizada guardada.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Falha no upload.");
    }
  }

  if (!canEdit) return null;

  return (
    <div className="rounded-md border border-orbita-line bg-orbita-base p-3">
      <p className="eyebrow mb-2">Captura autorizada</p>
      <p className="mb-3 text-[12px] text-orbita-muted">
        Usa este campo quando a captura automática não for possível (site bloqueia bots, portal com login de cliente,
        imagens próprias). A origem fica registada como «upload» e é identificada na comparação.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="input w-auto py-1.5 text-[12px]"
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          aria-label="Tipo de captura"
        >
          <option value="screenshot-desktop">Desktop</option>
          <option value="screenshot-mobile">Mobile</option>
        </select>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={state === "uploading"}
        >
          {state === "uploading" ? "A enviar…" : "Carregar imagem"}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-orbita-dim">PNG · JPG · WebP · máx. 8 MB</span>
      </div>
      {message && (
        <p role="status" className={`mt-2 text-[11.5px] ${state === "error" ? "text-orbita-danger" : "text-orbita-muted"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
