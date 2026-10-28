import { cookies } from "next/headers";
import { SESSION_COOKIE, destroySession } from "@/lib/auth";

export async function POST() {
  const store = await cookies();
  destroySession(store.get(SESSION_COOKIE)?.value);
  store.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
