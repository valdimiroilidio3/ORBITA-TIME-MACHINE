import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureSeedUsers } from "@/lib/auth";
import { getCurrentUser } from "@/lib/current-user";
import { config } from "@/lib/config";
import { recoverStaleJobs } from "@/lib/jobs";
import { BrandMark } from "@/components/ui";
import { UserMenu } from "@/components/UserMenu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  ensureSeedUsers();
  recoverStaleJobs();
  const user = await getCurrentUser();
  if (!user) {
    // Em desenvolvimento/pré-visualização entra diretamente no dashboard.
    redirect(config.devAutoLogin ? "/api/dev/login" : "/login");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-orbita-line bg-orbita-void/85 backdrop-blur-md">
        <div className="shell flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <BrandMark />
            <nav aria-label="Navegação principal" className="hidden items-center gap-1 sm:flex">
              <Link href="/" className="nav-item nav-item-active">
                Projetos
              </Link>
              <Link href="/showcase/indisponivel" className="nav-item" prefetch={false}>
                Acesso privado
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-orbita-dim md:inline">
              Ambiente seguro
            </span>
            <UserMenu user={user} />
          </div>
        </div>
      </header>
      <main className="shell py-6 lg:py-8">{children}</main>
    </div>
  );
}
