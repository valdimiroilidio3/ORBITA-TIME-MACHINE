import { describe, expect, it } from "vitest";
import {
  assertSafeUrl,
  isBlockedAddress,
  isPrivateIPv4,
  isPrivateIPv6,
  normalizeInputUrl,
  UrlRejectedError,
} from "@/lib/urls";

describe("normalização de URLs", () => {
  it("adiciona https quando o esquema está ausente", () => {
    expect(normalizeInputUrl("exemplo.pt").toString()).toBe("https://exemplo.pt/");
  });

  it("rejeita protocolos não HTTP", () => {
    expect(() => normalizeInputUrl("file:///etc/passwd")).toThrow(UrlRejectedError);
    expect(() => normalizeInputUrl("javascript:alert(1)")).toThrow(UrlRejectedError);
    expect(() => normalizeInputUrl("gopher://exemplo.pt")).toThrow(UrlRejectedError);
  });

  it("rejeita credenciais embutidas", () => {
    expect(() => normalizeInputUrl("https://user:pass@exemplo.pt")).toThrow(/credenciais/i);
  });

  it("rejeita portas não permitidas", () => {
    expect(() => normalizeInputUrl("http://exemplo.pt:8080")).toThrow(/porta/i);
    expect(() => normalizeInputUrl("https://exemplo.pt:443")).not.toThrow();
  });

  it("bloqueia localhost e sufixos internos", () => {
    for (const host of [
      "http://localhost",
      "http://localhost:3000",
      "http://api.localhost",
      "http://router.local",
      "http://intranet.corp",
      "http://servico.internal",
    ]) {
      expect(() => normalizeInputUrl(host), host).toThrow(UrlRejectedError);
    }
  });

  it("bloqueia IPs literais privados e de metadados", () => {
    for (const host of [
      "http://127.0.0.1",
      "http://10.1.2.3",
      "http://172.16.0.9",
      "http://192.168.1.1",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]",
      "http://[fd00::1]",
    ]) {
      expect(() => normalizeInputUrl(host), host).toThrow(UrlRejectedError);
    }
  });

  it("aceita domínios públicos", () => {
    expect(normalizeInputUrl("https://www.orbita.pt/sobre").hostname).toBe("www.orbita.pt");
    expect(normalizeInputUrl("http://exemplo.com").protocol).toBe("http:");
  });

  it("rejeita URLs vazias ou excessivamente longas", () => {
    expect(() => normalizeInputUrl("")).toThrow(UrlRejectedError);
    expect(() => normalizeInputUrl(`https://exemplo.com/${"a".repeat(3000)}`)).toThrow(/longa/i);
  });
});

describe("classificação de IPs", () => {
  it("identifica IPv4 privados", () => {
    expect(isPrivateIPv4("10.0.0.1")).toBe(true);
    expect(isPrivateIPv4("192.168.0.10")).toBe(true);
    expect(isPrivateIPv4("172.31.255.255")).toBe(true);
    expect(isPrivateIPv4("169.254.169.254")).toBe(true);
    expect(isPrivateIPv4("100.64.0.1")).toBe(true);
    expect(isPrivateIPv4("8.8.8.8")).toBe(false);
    expect(isPrivateIPv4("1.1.1.1")).toBe(false);
  });

  it("identifica IPv6 privados e mapeados", () => {
    expect(isPrivateIPv6("::1")).toBe(true);
    expect(isPrivateIPv6("fe80::1")).toBe(true);
    expect(isPrivateIPv6("fd12:3456::1")).toBe(true);
    expect(isPrivateIPv6("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIPv6("2001:4860:4860::8888")).toBe(false);
  });

  it("trata entradas inválidas como bloqueadas", () => {
    expect(isBlockedAddress("não-é-ip")).toBe(true);
  });
});

describe("assertSafeUrl (resolução DNS)", () => {
  it("aceita IP público literal", async () => {
    const safe = await assertSafeUrl("https://1.1.1.1");
    expect(safe.addresses).toEqual(["1.1.1.1"]);
  });

  it("rejeita domínio que não resolve", async () => {
    await expect(assertSafeUrl("https://dominio-inexistente-orbita.invalid")).rejects.toThrow(/resolver/i);
  });

  it("nunca devolve hosts internos", async () => {
    await expect(assertSafeUrl("http://metadata.google.internal")).rejects.toThrow(UrlRejectedError);
    await expect(assertSafeUrl("http://127.0.0.1:80")).rejects.toThrow(UrlRejectedError);
  });
});
