import dns from "node:dns/promises";
import net from "node:net";
import { config } from "./config";

export class UrlRejectedError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "UrlRejectedError";
    this.code = code;
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
  "169.254.169.254",
  "0.0.0.0",
  "[::1]",
  "::1",
]);

const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".localdomain",
  ".internal",
  ".intranet",
  ".lan",
  ".home",
  ".corp",
  ".onion",
  ".in-addr.arpa",
  ".ip6.arpa",
];

const ALLOWED_PORTS = new Set(["", "80", "443"]);

const IPV4_BLOCKED: [number, number][] = [
  [0x00000000, 0x00ffffff], // 0.0.0.0/8
  [0x0a000000, 0x0affffff], // 10/8
  [0x7f000000, 0x7fffffff], // 127/8
  [0xa9fe0000, 0xa9feffff], // 169.254/16 (link-local + metadata)
  [0xac100000, 0xac1fffff], // 172.16/12
  [0xc0a80000, 0xc0a8ffff], // 192.168/16
  [0x64400000, 0x647fffff], // 100.64/10 CGNAT
  [0xc0000000, 0xc00000ff], // 192.0.0/24
  [0xc0000200, 0xc00002ff], // 192.0.2/24 TEST-NET
  [0xc6120000, 0xc613ffff], // 198.18/15 benchmark
  [0xc6336400, 0xc63364ff], // 198.51.100/24 TEST-NET
  [0xcb007100, 0xcb0071ff], // 203.0.113/24 TEST-NET
  [0xe0000000, 0xefffffff], // 224/4 multicast
  [0xf0000000, 0xffffffff], // 240/4 + broadcast
];

export function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value >>> 0;
}

export function isPrivateIPv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  if (value === null) return true;
  return IPV4_BLOCKED.some(([start, end]) => value >= start && value <= end);
}

function expandIPv6(ip: string): string[] | null {
  let clean = ip.split("%")[0];
  if (clean.startsWith("[") && clean.endsWith("]")) clean = clean.slice(1, -1);
  // Converte sufixo IPv4 (::ffff:127.0.0.1) em dois grupos hexadecimais.
  const dotted = clean.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) {
    const v4 = ipv4ToInt(dotted[1]);
    if (v4 === null) return null;
    const high = ((v4 >>> 16) & 0xffff).toString(16);
    const low = (v4 & 0xffff).toString(16);
    clean = `${clean.slice(0, clean.length - dotted[1].length)}${high}:${low}`;
  }
  if (!net.isIPv6(clean)) return null;
  const [head, tail] = clean.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  if (!clean.includes("::")) return clean.split(":");
  const missing = 8 - (headParts.length + tailParts.length);
  return [...headParts, ...Array.from({ length: Math.max(missing, 0) }, () => "0"), ...tailParts];
}

export function isPrivateIPv6(ip: string): boolean {
  const groups = expandIPv6(ip);
  if (!groups) return true;
  const normalized = groups.map((g) => g.padStart(4, "0").toLowerCase());
  const [g0, g1] = normalized;
  const allZero = normalized.every((g) => g === "0000");
  if (allZero) return true; // ::
  if (g0 === "0000" && g1 === "0000" && normalized.slice(0, 7).every((g) => g === "0000")) {
    return true; // ::1
  }
  // IPv4-mapped ::ffff:a.b.c.d
  if (normalized.slice(0, 5).every((g) => g === "0000") && normalized[5] === "ffff") {
    const hex = normalized[6] + normalized[7];
    const ipv4 = [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      parseInt(hex.slice(6, 8), 16),
    ].join(".");
    return isPrivateIPv4(ipv4);
  }
  const first = parseInt(g0, 16);
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (g0 === "2001" && g1 === "0db8") return true; // documentation
  return false;
}

export function isBlockedAddress(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true;
}

export interface SafeUrl {
  url: URL;
  href: string;
  hostname: string;
  addresses: string[];
}

export function normalizeInputUrl(raw: string): URL {
  const trimmed = (raw || "").trim();
  if (!trimmed) throw new UrlRejectedError("empty", "URL vazia.");
  if (trimmed.length > 2048) throw new UrlRejectedError("too_long", "URL demasiado longa.");
  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new UrlRejectedError("invalid", "URL inválida.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UrlRejectedError("protocol", "Apenas http/https são permitidos.");
  }
  if (url.username || url.password) {
    throw new UrlRejectedError("credentials", "URLs com credenciais não são permitidas.");
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new UrlRejectedError("port", `Porta ${url.port} não permitida na captura.`);
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) throw new UrlRejectedError("host", "Host em falta.");
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new UrlRejectedError("blocked_host", "Destino interno bloqueado.");
  }
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    throw new UrlRejectedError("blocked_host", "Domínio interno bloqueado.");
  }
  const bareHost = host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
  if (net.isIP(bareHost) && isBlockedAddress(bareHost)) {
    throw new UrlRejectedError("blocked_ip", "Endereço IP privado bloqueado.");
  }
  return url;
}

/**
 * Validação anti-SSRF: protocolo, porta, credenciais, host proibido e resolução
 * DNS com verificação de todos os registos (evita DNS rebinding parcial).
 */
export async function assertSafeUrl(raw: string): Promise<SafeUrl> {
  const url = normalizeInputUrl(raw);
  const rawHostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const hostname = rawHostname.startsWith("[") && rawHostname.endsWith("]") ? rawHostname.slice(1, -1) : rawHostname;
  if (net.isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new UrlRejectedError("blocked_ip", "Endereço IP privado bloqueado.");
    }
    return { url, href: url.toString(), hostname, addresses: [hostname] };
  }
  let addresses: string[] = [];
  try {
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    addresses = records.map((r) => r.address);
  } catch {
    throw new UrlRejectedError("dns", `Não foi possível resolver ${hostname}.`);
  }
  if (addresses.length === 0) {
    throw new UrlRejectedError("dns", `Sem registos DNS para ${hostname}.`);
  }
  for (const address of addresses) {
    if (isBlockedAddress(address)) {
      throw new UrlRejectedError(
        "blocked_ip",
        `O host ${hostname} resolve para um endereço privado/interno.`,
      );
    }
  }
  return { url, href: url.toString(), hostname, addresses };
}

export interface FetchHtmlResult {
  url: string;
  finalUrl: string;
  status: number;
  html: string;
  contentType: string;
  bytes: number;
  truncated: boolean;
}

const MAX_REDIRECTS = 3;

/** Fetch endurecido: revalida cada salto, limita tempo, tamanho e tipo. */
export async function fetchHtml(rawUrl: string, maxBytes = 3_000_000): Promise<FetchHtmlResult> {
  let current = rawUrl;
  let response: Response | null = null;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safe = await assertSafeUrl(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      response = await fetch(safe.href, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "OrbitaTimeMachineBot/1.0 (+https://orbita.pt/bot)",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "pt-PT,pt;q=0.9,en;q=0.5",
        },
      });
    } catch (error) {
      clearTimeout(timer);
      throw new UrlRejectedError(
        "fetch",
        `Falha ao contactar o website: ${(error as Error).message}`,
      );
    }
    clearTimeout(timer);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) break;
      current = new URL(location, safe.href).toString();
      continue;
    }
    break;
  }
  if (!response) throw new UrlRejectedError("fetch", "Sem resposta do website.");

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("html") && !contentType.includes("xml") && contentType !== "") {
    throw new UrlRejectedError("content_type", `Conteúdo não HTML (${contentType}).`);
  }
  const declaredLength = Number(response.headers.get("content-length") || "0");
  if (declaredLength > maxBytes) {
    throw new UrlRejectedError("too_large", "Resposta demasiado grande.");
  }
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let truncated = false;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value?.byteLength ?? 0;
      if (bytes > maxBytes) {
        truncated = true;
        await reader.cancel().catch(() => {});
        break;
      }
      if (value) chunks.push(value);
    }
  }
  const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
  return {
    url: rawUrl,
    finalUrl: response.url || current,
    status: response.status,
    html,
    contentType,
    bytes,
    truncated,
  };
}

export function captureBudget(): { maxBytes: number } {
  return { maxBytes: config.capture.maxBytes };
}
