import { showCaseLinkState } from "@/lib/showcase";
import { hasShowcaseCookie } from "@/lib/showcase-server";
import { sessionUserFromCookies } from "@/lib/access";
import { getTimeMachine } from "@/lib/repo";

type Params = { params: Promise<{ id: string; page: string }> };

/**
 * Serve o protótipo gerado em HTML isolado. O iframe usa sandbox sem
 * allow-same-origin; a CSP impede qualquer pedido de rede a partir do protótipo.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id, page } = await params;
  const tm = getTimeMachine(id);
  if (!tm?.prototype) return new Response("Protótipo não encontrado", { status: 404 });

  const user = await sessionUserFromCookies();
  let authorized = Boolean(user);
  if (!authorized) {
    const link = showCaseLinkState(tm);
    authorized = link.active && (await hasShowcaseCookie(tm));
  }
  if (!authorized) return new Response("Acesso negado", { status: 403 });

  const target = tm.prototype.pages.find((p) => p.slug === page) ?? tm.prototype.pages.find((p) => p.slug === tm.prototype!.entry);
  if (!target) return new Response("Página não encontrada", { status: 404 });

  return new Response(target.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}
