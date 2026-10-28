import { NextResponse } from "next/server";
import { z } from "zod";
import { PermissionError, sessionUserFromCookies } from "./access";
import type { Action } from "./auth";
import { can } from "./auth";
import type { User } from "./types";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, code?: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, code: code ?? null, ...extra }, { status });
}

export async function requireUser(action?: Action): Promise<{ user: User } | { response: NextResponse }> {
  const user = await sessionUserFromCookies();
  if (!user) return { response: fail("Sessão necessária.", 401, "unauthenticated") };
  if (action && !can(user, action)) {
    return { response: fail("Sem permissão para esta ação.", 403, "forbidden") };
  }
  return { user };
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof PermissionError) {
    return fail(error.message, error.code === "unauthenticated" ? 401 : 403, error.code);
  }
  if (error instanceof z.ZodError) {
    return fail("Dados inválidos.", 422, "validation", { issues: error.issues });
  }
  const code = (error as { code?: string })?.code;
  const message = error instanceof Error ? error.message : "Erro inesperado.";
  const knownCodes = ["not_found", "already_running", "concurrency", "rate_limit", "budget", "no_steps", "forbidden"];
  return fail(message, code && knownCodes.includes(code) ? 409 : 500, code);
}
