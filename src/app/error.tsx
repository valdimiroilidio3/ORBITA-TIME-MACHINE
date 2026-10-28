"use client";

import { BrandMark } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-lg rounded-lg border border-orbita-line bg-orbita-panel p-7">
        <BrandMark />
        <p className="eyebrow mb-2 mt-8">Falha inesperada</p>
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-orbita-ink">
          Algo falhou ao renderizar esta página
        </h1>
        <p className="mt-2 text-[13px] text-orbita-muted">
          Os dados do projeto não foram alterados. Podes tentar novamente — se o erro persistir, consulta os logs do
          servidor.
        </p>
        <p className="mt-3 rounded border border-orbita-danger/30 bg-orbita-danger/5 px-3 py-2 font-mono text-[11px] text-orbita-danger/90">
          {error.digest ?? error.message}
        </p>
        <button type="button" className="btn btn-primary mt-6" onClick={reset}>
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
