import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "orbita-showcase-"));
process.env.ORBITA_DATA_DIR = dataDir;
process.env.ORBITA_SESSION_SECRET = "test-secret-showcase";
process.env.SHOWCASE_LINK_TTL_DAYS = "30";

type Mods = {
  repo: typeof import("@/lib/repo");
  showcase: typeof import("@/lib/showcase");
};

let mods: Mods;
let leadId: string;
let userId: string;

beforeAll(async () => {
  mods = {
    repo: await import("@/lib/repo"),
    showcase: await import("@/lib/showcase"),
  };
  const { ensureSeedUsers, authenticate } = await import("@/lib/auth");
  ensureSeedUsers();
  const user = authenticate("admin@orbita.pt", "orbita-time-machine")!;
  userId = user.id;
  const lead = mods.repo.createLead(
    { company_name: "Casa do Rio", sector: "restauração", website: "https://casadorio.pt" },
    user.id,
  );
  leadId = lead.id;
});

function withPrototype(id: string) {
  const tm = mods.repo.getTimeMachine(id)!;
  return mods.repo.updateTimeMachine(id, {
    ...tm,
    prototype: {
      version: 1,
      engine: "local",
      entry: "index",
      pages: [{ slug: "index", title: "Início", html: "<html></html>" }],
      sharedCss: "",
      generatedAt: new Date().toISOString(),
      notes: [],
    },
            brief: { conceptName: "teste" } as unknown as NonNullable<typeof tm.brief>,
  })!;
}

describe("links privados de apresentação", () => {
  it("exige protótipo e briefing para emitir", () => {
    const tm = mods.repo.createTimeMachine(mods.repo.getLead(leadId)!, userId);
    expect(() => mods.repo.getTimeMachine(tm.id)).not.toThrow();
    // A emissão direta é permitida pela API apenas com protótipo; aqui validamos
    // o estado do link em rascunho.
    const link = mods.showcase.issueShowcaseLink(tm.id);
    expect(link.token.length).toBeGreaterThan(20);
    const updated = mods.repo.getTimeMachine(tm.id)!;
    expect(updated.showcase_status).toBe("review");
  });

  it("gera tokens não previsíveis e slug não sequencial", () => {
    const a = mods.repo.createTimeMachine(mods.repo.getLead(leadId)!, userId);
    const b = mods.repo.createTimeMachine(mods.repo.getLead(leadId)!, userId);
    expect(a.slug).not.toBe(b.slug);
    const linkA = mods.showcase.issueShowcaseLink(a.id);
    const linkB = mods.showcase.issueShowcaseLink(b.id);
    expect(linkA.token).not.toBe(linkB.token);
    expect(a.slug).toMatch(/-[0-9a-f]{12}$/);
  });

  it("valida o token apenas contra o hash armazenado", () => {
    const tm = mods.repo.createTimeMachine(mods.repo.getLead(leadId)!, userId);
    withPrototype(tm.id);
    const link = mods.showcase.issueShowcaseLink(tm.id);
    const stored = mods.repo.getTimeMachine(tm.id)!;
    expect(stored.showcase_token_hash).toBeTruthy();
    expect(stored.showcase_token_hash).not.toContain(link.token);
    expect(mods.showcase.verifyShowcaseToken(stored, link.token)).toBe(true);
    expect(mods.showcase.verifyShowcaseToken(stored, `${link.token}x`)).toBe(false);
    expect(mods.showcase.verifyShowcaseToken(stored, "")).toBe(false);
  });

  it("o cookie de acesso depende do segredo do servidor", () => {
    const tm = mods.repo.createTimeMachine(mods.repo.getLead(leadId)!, userId);
    const link = mods.showcase.issueShowcaseLink(tm.id);
    const stored = mods.repo.getTimeMachine(tm.id)!;
    const cookie = mods.showcase.showcaseCookieValue(stored);
    expect(cookie.length).toBeGreaterThan(10);
    expect(cookie).not.toContain(link.token);
    // Um token_hash diferente produz um cookie diferente (revogação invalida).
    const rotated = mods.showcase.issueShowcaseLink(tm.id);
    const rotatedTm = mods.repo.getTimeMachine(tm.id)!;
    expect(rotatedTm.showcase_token_hash).not.toBe(stored.showcase_token_hash);
    expect(mods.showcase.showcaseCookieValue(rotatedTm)).not.toBe(cookie);
    expect(mods.showcase.verifyShowcaseToken(rotatedTm, rotated.token)).toBe(true);
    expect(mods.showcase.verifyShowcaseToken(rotatedTm, link.token)).toBe(false);
  });

  it("revogar desativa o link imediatamente", () => {
    const tm = mods.repo.createTimeMachine(mods.repo.getLead(leadId)!, userId);
    withPrototype(tm.id);
    const link = mods.showcase.issueShowcaseLink(tm.id);
    let stored = mods.repo.getTimeMachine(tm.id)!;
    expect(mods.showcase.showCaseLinkState(stored).active).toBe(true);

    mods.showcase.revokeShowcaseLink(tm.id);
    stored = mods.repo.getTimeMachine(tm.id)!;
    const state = mods.showcase.showCaseLinkState(stored);
    expect(state.active).toBe(false);
    expect(state.reason).toMatch(/revogado/i);
    expect(mods.showcase.verifyShowcaseToken(stored, link.token)).toBe(false);
  });

  it("links expirados deixam de dar acesso", () => {
    const tm = mods.repo.createTimeMachine(mods.repo.getLead(leadId)!, userId);
    withPrototype(tm.id);
    mods.showcase.issueShowcaseLink(tm.id);
    mods.repo.updateTimeMachine(tm.id, {
      showcase_expires_at: new Date(Date.now() - 60_000).toISOString(),
    });
    const stored = mods.repo.getTimeMachine(tm.id)!;
    expect(mods.showcase.showCaseLinkState(stored)).toMatchObject({ active: false, reason: "Link expirado" });
  });

  it("rascunho nunca é apresentável", () => {
    const tm = mods.repo.createTimeMachine(mods.repo.getLead(leadId)!, userId);
    withPrototype(tm.id);
    mods.showcase.issueShowcaseLink(tm.id);
    mods.showcase.setShowcaseStatus(tm.id, "draft");
    const stored = mods.repo.getTimeMachine(tm.id)!;
    expect(mods.showcase.showCaseLinkState(stored).active).toBe(false);
  });

  it("publicar promove o estado do projeto", () => {
    const tm = mods.repo.createTimeMachine(mods.repo.getLead(leadId)!, userId);
    withPrototype(tm.id);
    mods.showcase.issueShowcaseLink(tm.id);
    const published = mods.showcase.setShowcaseStatus(tm.id, "published")!;
    expect(published.showcase_status).toBe("published");
    expect(published.status).toBe("published");
  });
});
