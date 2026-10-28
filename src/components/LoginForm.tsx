"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Credenciais inválidas.");
      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao entrar.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@orbita.pt"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Palavra-passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p role="alert" className="rounded border border-orbita-danger/40 bg-orbita-danger/10 px-3 py-2 text-[12.5px] text-orbita-danger">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? "A entrar…" : "Entrar"}
      </button>
      <p className="font-mono text-[10.5px] leading-relaxed text-orbita-dim">
        Credenciais iniciais definidas em <code>.env</code> (ORBITA_ADMIN_EMAIL / ORBITA_ADMIN_PASSWORD). Altera-as antes
        de expor o sistema.
      </p>
    </form>
  );
}
