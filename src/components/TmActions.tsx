"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, patchJson } from "@/lib/client";

export function TmActions({
  timeMachineId,
  archived,
  canEdit,
  canDelete,
}: {
  timeMachineId: string;
  archived: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archive() {
    setBusy("archive");
    setError(null);
    try {
      await patchJson(`/api/time-machines/${timeMachineId}/archive`, { archived: !archived });
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falha ao arquivar.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    try {
      await apiFetch(`/api/time-machines/${timeMachineId}`, { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falha ao eliminar.");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={archive} disabled={busy !== null}>
          {busy === "archive" ? "…" : archived ? "Restaurar" : "Arquivar"}
        </button>
      )}
      {canDelete &&
        (confirming ? (
          <span className="flex items-center gap-1.5">
            <button type="button" className="btn btn-danger btn-sm" onClick={remove} disabled={busy !== null}>
              {busy === "delete" ? "A eliminar…" : "Confirmar eliminação"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </span>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}>
            Eliminar
          </button>
        ))}
      {error && <span className="text-[11.5px] text-orbita-danger">{error}</span>}
    </div>
  );
}
