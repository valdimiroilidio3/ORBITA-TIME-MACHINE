"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/lib/types";
import { patchJson } from "@/lib/client";

export function LeadEditor({ lead, canEdit }: { lead: Lead; canEdit: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company_name: lead.company_name,
    sector: lead.sector,
    location: lead.location ?? "",
    website: lead.website ?? "",
    contact_name: lead.contact_name ?? "",
    contact_email: lead.contact_email ?? "",
    contact_phone: lead.contact_phone ?? "",
    whatsapp: lead.whatsapp ?? "",
    services: lead.services.join(", "),
    notes: lead.notes ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!canEdit) return null;

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      await patchJson(`/api/leads/${lead.id}`, {
        company_name: form.company_name.trim(),
        sector: form.sector.trim(),
        location: form.location.trim() || null,
        website: form.website.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        services: form.services.split(",").map((item) => item.trim()).filter(Boolean),
        notes: form.notes.trim() || null,
      });
      setMessage("Dados da lead atualizados.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-ghost btn-sm w-full justify-between"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>Editar dados da empresa</span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="label" htmlFor="edit-name">Empresa</label>
            <input id="edit-name" className="input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="edit-sector">Setor</label>
              <input id="edit-sector" className="input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="edit-location">Localização</label>
              <input id="edit-location" className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="edit-website">Website</label>
            <input id="edit-website" className="input font-mono text-[11.5px]" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="edit-phone">Telefone</label>
              <input id="edit-phone" className="input" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="edit-whatsapp">WhatsApp</label>
              <input id="edit-whatsapp" className="input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="edit-email">Email</label>
            <input id="edit-email" className="input" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="edit-services">Serviços (vírgulas)</label>
            <input id="edit-services" className="input" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} />
          </div>
          <button type="button" className="btn btn-primary btn-sm w-full" onClick={save} disabled={busy}>
            {busy ? "A guardar…" : "Guardar dados"}
          </button>
          <p className="text-[10.5px] leading-relaxed text-orbita-dim">
            Alterar o website ou o setor altera a captura e o arquétipo criativo — repete as etapas «Captura» e
            «Direção criativa» para refletir os novos dados.
          </p>
          {message && <p role="status" className="text-[11px] text-orbita-muted">{message}</p>}
        </div>
      )}
    </div>
  );
}
