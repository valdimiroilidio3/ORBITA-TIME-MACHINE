import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { publicUrl } from "@/lib/http";
import { getTimeMachineBySlug } from "@/lib/repo";
import {
  showCaseLinkState,
  showcaseCookieName,
  showcaseCookieValue,
  verifyShowcaseToken,
} from "@/lib/showcase";

type Params = { params: Promise<{ slug: string }> };

/**
 * Troca o token do link privado por um cookie HttpOnly e redireciona para o
 * URL limpo (sem token na barra de endereço nem em logs subsequentes).
 */
export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  const token = new URL(request.url).searchParams.get("k");
  const tm = getTimeMachineBySlug(slug);
  if (!tm) return NextResponse.redirect(publicUrl(request, "/showcase/indisponivel"));

  const link = showCaseLinkState(tm);
  if (!link.active || !verifyShowcaseToken(tm, token)) {
    return NextResponse.redirect(
      publicUrl(request, `/showcase/indisponivel?motivo=${encodeURIComponent(link.reason ?? "Link inválido")}`),
    );
  }

  const store = await cookies();
  const maxAge = Math.max(
    60,
    Math.floor(((tm.showcase_expires_at ? new Date(tm.showcase_expires_at).getTime() : Date.now() + 864e5) - Date.now()) / 1000),
  );
  store.set(showcaseCookieName(tm.id), showcaseCookieValue(tm), {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
    maxAge,
  });
  return NextResponse.redirect(publicUrl(request, `/showcase/${tm.slug}`));
}
