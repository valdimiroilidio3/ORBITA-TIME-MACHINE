import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "orbita-auth-"));
process.env.ORBITA_DATA_DIR = dataDir;
process.env.ORBITA_SESSION_SECRET = "auth-test-secret";

let auth: typeof import("@/lib/auth");
let cryptoMod: typeof import("@/lib/crypto");

beforeAll(async () => {
  auth = await import("@/lib/auth");
  cryptoMod = await import("@/lib/crypto");
  auth.ensureSeedUsers();
});

describe("palavras-passe", () => {
  it("usa scrypt com sal e compara em tempo constante", () => {
    const hash = cryptoMod.hashPassword("segredo");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(cryptoMod.verifyPassword("segredo", hash)).toBe(true);
    expect(cryptoMod.verifyPassword("outro", hash)).toBe(false);
    expect(cryptoMod.hashPassword("segredo")).not.toBe(hash);
  });
});

describe("autenticação e sessões", () => {
  it("autentica utilizadores semeados", () => {
    const user = auth.authenticate("admin@orbita.pt", "orbita-time-machine");
    expect(user?.role).toBe("admin");
    expect(auth.authenticate("admin@orbita.pt", "errada")).toBeNull();
    expect(auth.authenticate("nao-existe@orbita.pt", "x")).toBeNull();
  });

  it("cria cookie assinado e valida-o", () => {
    const user = auth.authenticate("equipa@orbita.pt", "equipa-time-machine")!;
    const { cookieValue } = auth.createSession(user.id);
    expect(cookieValue.split(".")).toHaveLength(3);
    expect(auth.readSession(cookieValue)?.email).toBe("equipa@orbita.pt");
    expect(auth.readSession(`${cookieValue}x`)).toBeNull();
    expect(auth.readSession("aaa.bbb.ccc")).toBeNull();
    expect(auth.readSession(undefined)).toBeNull();
  });

  it("invalida a sessão no logout", () => {
    const user = auth.authenticate("equipa@orbita.pt", "equipa-time-machine")!;
    const { cookieValue } = auth.createSession(user.id);
    auth.destroySession(cookieValue);
    expect(auth.readSession(cookieValue)).toBeNull();
  });
});

describe("matriz de permissões", () => {
  it("separa admin, membro e leitor", () => {
    expect(auth.can({ role: "admin" }, "tm:delete")).toBe(true);
    expect(auth.can({ role: "member" }, "tm:delete")).toBe(false);
    expect(auth.can({ role: "member" }, "tm:run")).toBe(true);
    expect(auth.can({ role: "member" }, "tm:publish")).toBe(false);
    expect(auth.can({ role: "viewer" }, "tm:create")).toBe(false);
    expect(auth.can(null, "tm:edit")).toBe(false);
  });
});
