import { cookies } from "next/headers";
import { SESSION_COOKIE, can, readSession } from "./auth";
import { getTimeMachine } from "./repo";
import { showCaseLinkState } from "./showcase";
import { hasShowcaseCookie } from "./showcase-server";
import type { Action } from "./auth";
import type { Artifact, TimeMachine, User } from "./types";

export async function sessionUserFromCookies(): Promise<User | null> {
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
}

export function assertPermission(user: User | null, action: Action): asserts user is User {
  if (!user) throw new PermissionError("unauthenticated", "Sessão necessária.");
  if (!can(user, action)) throw new PermissionError("forbidden", "Sem permissão para esta ação.");
}

export class PermissionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function authorizeTimeMachine(
  timeMachineId: string,
): Promise<{ user: User | null; tm: TimeMachine | null }> {
  const user = await sessionUserFromCookies();
  const tm = getTimeMachine(timeMachineId);
  return { user, tm };
}

export async function canReadArtifact(artifact: Artifact): Promise<boolean> {
  const user = await sessionUserFromCookies();
  if (user) return true;
  const tm = getTimeMachine(artifact.time_machine_id);
  if (!tm) return false;
  const link = showCaseLinkState(tm);
  if (!link.active) return false;
  return hasShowcaseCookie(tm);
}

export function publicTimeMachineView(tm: TimeMachine, lead: { company_name: string; sector: string; location: string | null }) {
  return {
    id: tm.id,
    slug: tm.slug,
    title: tm.title,
    status: tm.status,
    showcase_status: tm.showcase_status,
    company: tm.company,
    opportunities: tm.opportunities,
    current_experience: tm.current_experience,
    brief: tm.brief,
    prototype: tm.prototype,
    lead,
  };
}
