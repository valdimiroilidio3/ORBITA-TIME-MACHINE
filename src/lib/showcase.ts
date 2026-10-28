import { config } from "./config";
import { hmac, randomToken, safeEqual, sha256, tokenHint } from "./crypto";
import { getTimeMachine, updateTimeMachine } from "./repo";
import type { ShowcaseStatus, TimeMachine } from "./types";

export const SHOWCASE_COOKIE_PREFIX = "orbita_show_";

export function showcaseCookieName(timeMachineId: string): string {
  return `${SHOWCASE_COOKIE_PREFIX}${timeMachineId}`;
}

export function showcaseCookieValue(tm: Pick<TimeMachine, "id" | "showcase_token_hash">): string {
  return hmac(`showcase:${tm.id}:${tm.showcase_token_hash ?? ""}`);
}

export interface IssuedLink {
  token: string;
  path: string;
  expiresAt: Date;
  hint: string;
}

export function issueShowcaseLink(timeMachineId: string, ttlDays = config.showcase.ttlDays): IssuedLink {
  const tm = getTimeMachine(timeMachineId);
  if (!tm) throw new Error("Time Machine não encontrada.");
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  updateTimeMachine(timeMachineId, {
    // Um link só é utilizável fora do rascunho: a emissão promove para revisão.
    showcase_status: tm.showcase_status === "draft" ? "review" : tm.showcase_status,
    showcase_token_hash: sha256(token),
    showcase_token_hint: tokenHint(token),
    showcase_created_at: tm.showcase_created_at ?? new Date().toISOString(),
    showcase_last_rotated_at: new Date().toISOString(),
    showcase_revoked_at: null,
    showcase_expires_at: expiresAt.toISOString(),
  });
  return {
    token,
    path: `/showcase/${tm.slug}?k=${token}`,
    expiresAt,
    hint: tokenHint(token),
  };
}

export function revokeShowcaseLink(timeMachineId: string): void {
  updateTimeMachine(timeMachineId, {
    showcase_token_hash: null,
    showcase_revoked_at: new Date().toISOString(),
    showcase_expires_at: null,
  });
}

export function setShowcaseStatus(timeMachineId: string, status: ShowcaseStatus): TimeMachine | null {
  const tm = getTimeMachine(timeMachineId);
  if (!tm) return null;
  const next = updateTimeMachine(timeMachineId, {
    showcase_status: status,
    status:
      status === "published"
        ? "published"
        : status === "review" && tm.status === "published"
          ? "review"
          : tm.status,
  });
  return next;
}

export function showCaseLinkState(tm: TimeMachine): {
  active: boolean;
  reason: string | null;
  expiresAt: string | null;
  hint: string | null;
} {
  if (tm.showcase_revoked_at) return { active: false, reason: "Acesso revogado", expiresAt: null, hint: null };
  if (!tm.showcase_token_hash) return { active: false, reason: "Sem link emitido", expiresAt: null, hint: null };
  if (tm.showcase_expires_at && new Date(tm.showcase_expires_at).getTime() < Date.now()) {
    return { active: false, reason: "Link expirado", expiresAt: tm.showcase_expires_at, hint: tm.showcase_token_hint };
  }
  if (tm.showcase_status === "draft") {
    return { active: false, reason: "Projeto em rascunho", expiresAt: tm.showcase_expires_at, hint: tm.showcase_token_hint };
  }
  return { active: true, reason: null, expiresAt: tm.showcase_expires_at, hint: tm.showcase_token_hint };
}

export function verifyShowcaseToken(tm: TimeMachine, token: string | undefined | null): boolean {
  if (!token || !tm.showcase_token_hash) return false;
  return safeEqual(sha256(token), tm.showcase_token_hash);
}
