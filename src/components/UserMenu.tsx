"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@/lib/types";

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-[12.5px] leading-tight text-orbita-ink">{user.name}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-orbita-dim">{user.role}</p>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={logout} disabled={busy}>
        {busy ? "…" : "Sair"}
      </button>
    </div>
  );
}
