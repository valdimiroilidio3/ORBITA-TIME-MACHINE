"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

type Mode = "slider" | "split" | "current" | "proposed";
type Device = "desktop" | "mobile";

export interface ComparisonProps {
  timeMachineId: string;
  companyName: string;
  beforeDesktop?: string;
  beforeMobile?: string;
  beforeFull?: string;
  captureSource: "playwright" | "upload" | "none";
  capturedAt?: string | null;
  prototype: { entry: string; pages: { slug: string; title: string }[] } | null;
  initialMode?: Mode;
  allowOpen?: boolean;
}

const MODE_LABELS: Record<Mode, string> = {
  slider: "Divisor",
  split: "Lado a lado",
  current: "Site atual",
  proposed: "Nova proposta",
};

const DEVICE_ASPECT: Record<Device, string> = {
  desktop: "16 / 10",
  mobile: "9 / 18.5",
};

export function Comparison({
  timeMachineId,
  companyName,
  beforeDesktop,
  beforeMobile,
  captureSource,
  capturedAt,
  prototype,
  initialMode = "slider",
  allowOpen = true,
}: ComparisonProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [device, setDevice] = useState<Device>("desktop");
  const [position, setPosition] = useState(50);
  const [zoom, setZoom] = useState(false);
  const [page, setPage] = useState(prototype?.entry ?? "index");
  const [frameLoaded, setFrameLoaded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const sliderId = useId();

  const beforeSrc = device === "mobile" ? beforeMobile ?? beforeDesktop : beforeDesktop;
  const prototypeUrl = prototype ? `/api/prototype/${timeMachineId}/${page}` : null;

  const hasBefore = Boolean(beforeSrc);
  const effectiveMode: Mode = hasBefore ? mode : mode === "current" || mode === "split" ? "proposed" : mode;

  const closeZoom = useCallback(() => setZoom(false), []);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeZoom();
    };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom, closeZoom]);

  const beforeLabel = useMemo(
    () => (captureSource === "upload" ? "EXPERIÊNCIA ATUAL · imagem autorizada" : "EXPERIÊNCIA ATUAL"),
    [captureSource],
  );

  if (!prototype) {
    return (
      <div className="rounded-md border border-dashed border-orbita-line bg-orbita-base/60 px-5 py-8">
        <p className="eyebrow mb-2">Comparação indisponível</p>
        <p className="text-[14px] text-orbita-ink">Ainda não existe protótipo gerado para esta Time Machine.</p>
        <p className="mt-1 max-w-prose text-[13px] text-orbita-muted">
          Gera a direção criativa e o protótipo para ativar a comparação interativa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-orbita-line bg-orbita-base p-1">
          {(Object.keys(MODE_LABELS) as Mode[]).map((key) => {
            const disabled = !hasBefore && (key === "current" || key === "split");
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                disabled={disabled}
                aria-pressed={mode === key}
                title={disabled ? "Sem captura do website atual" : MODE_LABELS[key]}
                className={`rounded px-2.5 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  mode === key ? "bg-orbita-acid text-black" : "text-orbita-muted hover:text-orbita-ink"
                }`}
              >
                {MODE_LABELS[key]}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-orbita-line bg-orbita-base p-1">
            {(["desktop", "mobile"] as Device[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                aria-pressed={device === key}
                className={`rounded px-2.5 py-1.5 text-[12px] transition-colors ${
                  device === key ? "bg-orbita-raised text-orbita-ink" : "text-orbita-muted hover:text-orbita-ink"
                }`}
              >
                {key === "desktop" ? "Desktop" : "Mobile"}
              </button>
            ))}
          </div>
          {prototype.pages.length > 1 && (
            <select
              aria-label="Página do protótipo"
              value={page}
              onChange={(event) => {
                setPage(event.target.value);
                setFrameLoaded(false);
              }}
              className="input max-w-[190px] py-1.5 text-[12px]"
            >
              {prototype.pages.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>
          )}
          {hasBefore && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setZoom(true)}>
              Ampliar captura
            </button>
          )}
          {allowOpen && (
            <a
              className="btn btn-ghost btn-sm"
              href={prototypeUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              title="Abrir a proposta navegável num novo separador"
            >
              Abrir proposta ↗
            </a>
          )}
        </div>
      </div>

      <div
        className={`relative mx-auto w-full overflow-hidden rounded-md border border-orbita-line bg-orbita-void ${
          device === "mobile" ? "max-w-[400px]" : ""
        }`}
        style={{ aspectRatio: DEVICE_ASPECT[device] }}
      >
        {effectiveMode === "split" && hasBefore ? (
          <div className="grid h-full grid-cols-2">
            <div className="relative overflow-hidden border-r border-orbita-line">
              <Label>{beforeLabel}</Label>
              <Screenshot src={beforeSrc!} companyName={companyName} />
            </div>
            <div className="relative overflow-hidden">
              <Label right>NOVA PROPOSTA</Label>
              <Frame
                src={prototypeUrl ?? ""}
                title={`Protótipo ${companyName} — ${page}`}
                device={device}
                onLoad={() => setFrameLoaded(true)}
              />
            </div>
          </div>
        ) : effectiveMode === "current" && hasBefore ? (
          <div className="relative h-full">
            <Label>{beforeLabel}</Label>
            <Screenshot src={beforeSrc!} companyName={companyName} />
          </div>
        ) : effectiveMode === "proposed" ? (
          <div className="relative h-full">
            <Label right>NOVA PROPOSTA</Label>
            {!frameLoaded && (
              <div className="absolute inset-0 grid place-items-center bg-orbita-base">
                <span className="animate-pulse font-mono text-[11px] uppercase tracking-[0.2em] text-orbita-dim">
                  A carregar protótipo…
                </span>
              </div>
            )}
            <Frame
              src={prototypeUrl ?? ""}
              title={`Protótipo ${companyName} — ${page}`}
              device={device}
              onLoad={() => setFrameLoaded(true)}
            />
          </div>
        ) : (
          <div className="relative h-full">
            <Label>{hasBefore ? beforeLabel : "SEM CAPTURA DO WEBSITE ATUAL"}</Label>
            {hasBefore ? (
              <Screenshot src={beforeSrc!} companyName={companyName} />
            ) : (
              <div className="grid h-full place-items-center px-6 text-center">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orbita-dim">
                    Website atual não capturado
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-[13px] text-orbita-muted">
                    Não existe captura autorizada do site atual. A comparação mostra apenas a nova proposta — nenhuma
                    imagem é fabricada para preencher este espaço.
                  </p>
                </div>
              </div>
            )}

            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 0 0 ${hasBefore ? position : 0}%)` }}
              aria-hidden={!hasBefore}
            >
              {!frameLoaded && (
                <div className="absolute inset-0 grid place-items-center bg-orbita-base">
                  <span className="animate-pulse font-mono text-[11px] uppercase tracking-[0.2em] text-orbita-dim">
                    A carregar proposta…
                  </span>
                </div>
              )}
              <Frame
                src={prototypeUrl ?? ""}
                title={`Protótipo ${companyName} — ${page}`}
                device={device}
                onLoad={() => setFrameLoaded(true)}
              />
            </div>

            {hasBefore && (
              <>
                <div
                  className="pointer-events-none absolute inset-y-0 z-20 w-px bg-orbita-acid"
                  style={{ left: `${position}%` }}
                >
                  <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-orbita-acid bg-orbita-void text-orbita-acid">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M5 3L2 7l3 4M9 3l3 4-3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <Label right>NOVA PROPOSTA</Label>
                <input
                  id={sliderId}
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={position}
                  onChange={(event) => setPosition(Number(event.target.value))}
                  aria-label="Divisor de comparação entre o website atual e a nova proposta"
                  aria-valuetext={`${Math.round(position)}% da nova proposta visível`}
                  className="absolute inset-0 z-30 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
                />
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-orbita-dim">
        <span>
          {hasBefore
            ? `Posição ${Math.round(position)}% · ${captureSource === "upload" ? "captura autorizada" : "captura automática"}${capturedAt ? ` · ${new Date(capturedAt).toLocaleDateString("pt-PT")}` : ""}`
            : "Sem captura do website atual"}
        </span>
        <span>Teclado: ← → · Arrastar: rato ou toque</span>
      </div>

      {zoom && hasBefore && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Captura do website atual ampliada"
          tabIndex={-1}
          className="fixed inset-0 z-[120] flex flex-col bg-black/90 p-4 backdrop-blur"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeZoom();
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-orbita-muted">
              {companyName} · experiência atual
            </p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeZoom}>
              Fechar (Esc)
            </button>
          </div>
          <div className="scroll-x flex-1 overflow-auto rounded border border-orbita-line bg-orbita-void">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={beforeSrc!} alt={`Captura ampliada do website atual de ${companyName}`} className="mx-auto block max-w-none" />
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute top-3 z-20 rounded-sm border border-orbita-line bg-orbita-void/85 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-orbita-muted backdrop-blur ${
        right ? "right-3" : "left-3"
      }`}
    >
      {children}
    </span>
  );
}

function Screenshot({ src, companyName }: { src: string; companyName: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Captura do website atual de ${companyName}`}
      className="h-full w-full object-cover object-top"
      loading="lazy"
    />
  );
}

function Frame({
  src,
  title,
  device,
  onLoad,
}: {
  src: string;
  title: string;
  device: Device;
  onLoad: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-orbita-void">
      <iframe
        src={src}
        title={title}
        onLoad={onLoad}
        sandbox="allow-scripts"
        loading="lazy"
        className="h-full w-full border-0"
        data-device={device}
      />
    </div>
  );
}
