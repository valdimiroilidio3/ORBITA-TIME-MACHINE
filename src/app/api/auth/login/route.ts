import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, authenticate, createSession, ensureSeedUsers } from "@/lib/auth";
import { config } from "@/lib/config";
import { fail, handleError, json } from "@/lib/http";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    ensureSeedUsers();
    const body = schema.parse(await request.json());
    const user = authenticate(body.email, body.password);
    if (!user) return fail("Credenciais inválidas.", 401, "invalid_credentials");
    const { cookieValue, expiresAt } = createSession(user.id);
    const store = await cookies();
    store.set(SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.isProduction,
      path: "/",
      expires: expiresAt,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return json({ ok: true, user });
  } catch (error) {
    return handleError(error);
  }
}
