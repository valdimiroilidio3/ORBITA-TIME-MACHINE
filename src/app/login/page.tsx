import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { config } from "@/lib/config";
import { ensureSeedUsers } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { BrandMark } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  ensureSeedUsers();
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-orbita-line bg-orbita-base p-10 lg:flex">
        <BrandMark />
        <div className="max-w-md">
          <p className="eyebrow mb-4">Pré-visualização comercial</p>
          <h1 className="font-display text-[clamp(34px,4vw,54px)] font-semibold leading-[1.02] tracking-[-0.04em] text-orbita-ink">
            Mostra o que a empresa
            <br />
            <span className="text-orbita-acid">pode ser</span> antes de
            <br />
            vender o website.
          </h1>
          <p className="mt-5 text-[14px] text-orbita-muted">
            A ORBITA Time Machine captura o website atual de uma lead, analisa as oportunidades com evidência e
            constrói uma proposta visual navegável — comparável lado a lado, com link privado de apresentação.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-orbita-dim">
          <li className="rounded border border-orbita-line p-3">Captura real · Playwright</li>
          <li className="rounded border border-orbita-line p-3">Prompt master editável</li>
          <li className="rounded border border-orbita-line p-3">Protótipo navegável</li>
          <li className="rounded border border-orbita-line p-3">Link privado revogável</li>
        </ul>
      </div>

      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-orbita-ink">Entrar no sistema</h2>
          <p className="mt-1.5 text-[13px] text-orbita-muted">Acesso reservado à equipa ORBITA.</p>
          <LoginForm devAutoLogin={config.devAutoLogin} />
          {config.devAutoLogin && (
            <p className="mt-4 rounded border border-orbita-line bg-orbita-base px-3 py-2 font-mono text-[10.5px] leading-relaxed text-orbita-dim">
              Ambiente de desenvolvimento: entrada automática ativa (ORBITA_DEV_AUTOLOGIN).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
