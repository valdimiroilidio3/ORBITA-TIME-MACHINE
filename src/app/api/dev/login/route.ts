import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSession, ensureSeedUsers } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/http";

/**
 * Entrada automática no dashboard para desenvolvimento e pré-visualização.
 * Nunca está disponível em produção (NODE_ENV=production) nem quando
 * ORBITA_DEV_AUTOLOGIN=false — nesse caso responde 404.
 */
export async function GET(request: Request) {
  if (config.isProduction || !config.devAutoLogin) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  ensureSeedUsers();
  const admin = getDb()
    .prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1")
    .get() as { id: string } | undefined;

  if (!admin) {
    return NextResponse.json({ error: "Sem utilizador administrador para autenticar." }, { status: 409 });
  }

  const { cookieValue, expiresAt } = createSession(admin.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.redirect(publicUrl(request, "/"));
}
