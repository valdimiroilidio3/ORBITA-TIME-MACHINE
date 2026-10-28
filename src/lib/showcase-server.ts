import { cookies } from "next/headers";
import { safeEqual } from "./crypto";
import type { TimeMachine } from "./types";
import { showCaseLinkState, showcaseCookieName, showcaseCookieValue } from "./showcase";

/** Valida o cookie de acesso de apresentação (sem estado no servidor). */
export async function hasShowcaseCookie(tm: TimeMachine): Promise<boolean> {
  const store = await cookies();
  const value = store.get(showcaseCookieName(tm.id))?.value;
  if (!value) return false;
  return safeEqual(value, showcaseCookieValue(tm));
}

export async function showcaseAccessState(tm: TimeMachine): Promise<{
  granted: boolean;
  reason: string | null;
}> {
  const link = showCaseLinkState(tm);
  if (!link.active) return { granted: false, reason: link.reason };
  if (await hasShowcaseCookie(tm)) return { granted: true, reason: null };
  return { granted: false, reason: "Acesso por link privado" };
}
