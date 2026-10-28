import Link from "next/link";
import { config } from "@/lib/config";
import { BrandMark } from "@/components/ui";

export const metadata = { title: "Acesso indisponível", robots: { index: false, follow: false } };

export default async function UnavailablePage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md rounded-lg border border-orbita-line bg-orbita-panel p-7">
        <BrandMark />
        <p className="eyebrow mb-2 mt-8">Acesso privado</p>
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-orbita-ink">
          Link inválido ou expirado
        </h1>
        <p className="mt-2 text-[13px] text-orbita-muted">
          {motivo ?? "Este link não é válido. Os links da ORBITA são individuais e podem ser revogados a qualquer momento."}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a className="btn btn-ghost" href={`mailto:${config.showcase.contactEmail}`}>
            Contactar ORBITA
          </a>
          <Link className="btn btn-ghost" href="/login">
            Entrar na equipa
          </Link>
        </div>
      </div>
    </div>
  );
}
