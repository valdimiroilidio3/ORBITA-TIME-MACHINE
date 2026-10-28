"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { patchJson } from "@/lib/client";

export function PromptEditor({
  timeMachineId,
  initialPrompt,
  editable,
}: {
  timeMachineId: string;
  initialPrompt: string;
  editable: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialPrompt);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const dirty = value !== initialPrompt;

  async function save() {
    setState("saving");
    setMessage(null);
    try {
      await patchJson(`/api/time-machines/${timeMachineId}`, { master_prompt: value });
      setState("saved");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Falha ao guardar.");
    }
  }

  function download() {
    const blob = new Blob([value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `orbita-prompt-master-${timeMachineId}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Prompt copiado para a área de transferência.");
    } catch {
      setMessage("O navegador bloqueou o acesso à área de transferência.");
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setState("idle");
        }}
        readOnly={!editable}
        spellCheck={false}
        rows={18}
        aria-label="Prompt master gerado"
        className="scroll-x w-full resize-y rounded-md border border-orbita-line bg-orbita-base p-3 font-mono text-[11.5px] leading-relaxed text-orbita-ink focus:border-orbita-acid/50 focus:outline-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {editable && (
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!dirty || state === "saving"}>
              {state === "saving" ? "A guardar…" : dirty ? "Guardar alterações" : "Sem alterações"}
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>
            Copiar
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={download}>
            Descarregar .md
          </button>
        </div>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-orbita-dim">
          {value.length.toLocaleString("pt-PT")} caracteres
          {state === "saved" && " · guardado"}
        </p>
      </div>
      {message && (
        <p role="status" className={`text-[11.5px] ${state === "error" ? "text-orbita-danger" : "text-orbita-muted"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
