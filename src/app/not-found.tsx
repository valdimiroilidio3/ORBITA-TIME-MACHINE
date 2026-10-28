import Link from "next/link";
import { BrandMark } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md rounded-lg border border-orbita-line bg-orbita-panel p-7">
        <BrandMark />
        <p className="eyebrow mb-2 mt-8">Erro 404</p>
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-orbita-ink">
          Este projeto não existe
        </h1>
        <p className="mt-2 text-[13px] text-orbita-muted">
          A Time Machine pode ter sido eliminada ou o endereço está incorreto.
        </p>
        <Link href="/" className="btn btn-ghost mt-6">
          Voltar aos projetos
        </Link>
      </div>
    </div>
  );
}
