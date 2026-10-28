import { config } from "./config";
import { analyzeHtml } from "./analysis/html";
import { UrlRejectedError, assertSafeUrl, fetchHtml, normalizeInputUrl } from "./urls";
import type { PageAnalysis } from "./types";

export interface CapturedImage {
  kind: "screenshot-desktop" | "screenshot-mobile" | "screenshot-full";
  buffer: Buffer;
  mime: string;
  width: number;
  height: number;
}

export interface CaptureOutcome {
  reachable: boolean;
  source: "playwright" | "none";
  finalUrl: string | null;
  statusCode: number | null;
  pages: PageAnalysis[];
  images: CapturedImage[];
  error: string | null;
  errorCode: string | null;
}

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

function blockReason(rawUrl: string): string | null {
  try {
    normalizeInputUrl(rawUrl);
    return null;
  } catch (error) {
    return error instanceof UrlRejectedError ? error.message : "URL de recurso inválida";
  }
}

/**
 * Captura real com Playwright (Chromium). Cada recurso é validado antes do
 * pedido para reduzir superfície de SSRF; o browser corre com sandbox do SO.
 * Se o binário do browser não estiver disponível, degrada para análise HTML
 * sem screenshots — nunca inventa uma imagem.
 */
export async function captureWebsite(rawUrl: string): Promise<CaptureOutcome> {
  const base: CaptureOutcome = {
    reachable: false,
    source: "none",
    finalUrl: null,
    statusCode: null,
    pages: [],
    images: [],
    error: null,
    errorCode: null,
  };

  try {
    await assertSafeUrl(rawUrl);
  } catch (error) {
    return {
      ...base,
      error: error instanceof Error ? error.message : "URL rejeitada",
      errorCode: error instanceof UrlRejectedError ? error.code : "invalid_url",
    };
  }

  if (!config.capture.enabled) {
    return { ...base, error: "Captura desativada por configuração (CAPTURE_ENABLED=false).", errorCode: "disabled" };
  }

  // 1) Análise HTML via fetch endurecido (independente do browser).
  let htmlPages: PageAnalysis[] = [];
  let finalUrl: string | null = null;
  let statusCode: number | null = null;
  let htmlError: string | null = null;

  try {
    const page = await fetchHtml(rawUrl, config.capture.maxBytes);
    finalUrl = page.finalUrl;
    statusCode = page.status;
    htmlPages = [analyzeHtml(page.html, page.finalUrl, page.status)];
    if (page.status >= 400) {
      htmlError = `O website respondeu com HTTP ${page.status}.`;
    }
  } catch (error) {
    htmlError = error instanceof Error ? error.message : "Falha ao ler o HTML.";
  }

  // 2) Captura de ecrã com Playwright.
  const images: CapturedImage[] = [];
  let captureError: string | null = null;
  let captureCode: string | null = null;

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      timeout: 25_000,
    });
    try {
      const blockedHosts: string[] = [];
      const makeContext = async (viewport: { width: number; height: number }) => {
        const context = await browser.newContext({
          viewport,
          deviceScaleFactor: 1,
          locale: "pt-PT",
          timezoneId: "Europe/Lisbon",
          reducedMotion: "reduce",
          userAgent:
            "Mozilla/5.0 (compatible; OrbitaTimeMachine/1.0; +https://orbita.pt/bot) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        });
        await context.route("**/*", (route) => {
          const requestUrl = route.request().url();
          if (requestUrl.startsWith("data:") || requestUrl.startsWith("blob:")) {
            return route.continue();
          }
          const reason = blockReason(requestUrl);
          if (reason) {
            try {
              const host = new URL(requestUrl).hostname;
              if (!blockedHosts.includes(host)) blockedHosts.push(host);
            } catch {
              /* ignora */
            }
            return route.abort("blockedbyclient");
          }
          return route.continue();
        });
        return context;
      };

      const desktop = await makeContext(DESKTOP);
      const page = await desktop.newPage();
      const response = await page.goto(rawUrl, {
        waitUntil: "domcontentloaded",
        timeout: config.capture.navTimeoutMs,
      });
      const scrolled = await page
        .evaluate(async () => {
          const step = Math.max(window.innerHeight * 0.8, 400);
          const limit = Math.min(document.body.scrollHeight, window.innerHeight * 8);
          for (let y = 0; y < limit; y += step) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 120));
          }
          window.scrollTo(0, 0);
          return document.title;
        })
        .catch(() => null);
      await page.waitForTimeout(600);

      const desktopShot = await page.screenshot({ type: "png", animations: "disabled" });
      const fullShot = await page
        .screenshot({ type: "png", fullPage: true, animations: "disabled" })
        .catch(() => null);
      const liveAnalysis = await page
        .evaluate(() => ({
          title: document.title,
          h1: Array.from(document.querySelectorAll("h1")).map((el) => el.textContent?.trim() ?? "").filter(Boolean),
          h2: Array.from(document.querySelectorAll("h2")).map((el) => el.textContent?.trim() ?? "").filter(Boolean).slice(0, 20),
          fonts: Array.from(
            new Set(
              Array.from(document.querySelectorAll("body *"))
                .slice(0, 400)
                .map((el) => getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim())
                .filter(Boolean),
            ),
          ).slice(0, 10),
        }))
        .catch(() => null);

      const htmlContent = await page.content().catch(() => "");
      if (htmlContent) {
        const hydrated = analyzeHtml(htmlContent, page.url(), response?.status() ?? statusCode);
        if (liveAnalysis) {
          hydrated.h1 = liveAnalysis.h1.length > 0 ? liveAnalysis.h1.slice(0, 6) : hydrated.h1;
          hydrated.h2 = liveAnalysis.h2.length > 0 ? liveAnalysis.h2 : hydrated.h2;
          if (liveAnalysis.fonts.length > 0) {
            hydrated.fontFamilies = Array.from(new Set([...hydrated.fontFamilies, ...liveAnalysis.fonts])).slice(0, 10);
          }
          if (liveAnalysis.title) hydrated.title = liveAnalysis.title.slice(0, 180);
        }
        hydrated.notes.push("Analisado no DOM renderizado (após hidratação).");
        if (blockedHosts.length > 0) {
          hydrated.notes.push(`Recursos bloqueados por política anti-SSRF: ${blockedHosts.slice(0, 3).join(", ")}`);
        }
        htmlPages = [hydrated];
        finalUrl = page.url();
        statusCode = response?.status() ?? statusCode;
      }
      void scrolled;

      images.push({
        kind: "screenshot-desktop",
        buffer: Buffer.from(desktopShot),
        mime: "image/png",
        width: DESKTOP.width,
        height: DESKTOP.height,
      });
      if (fullShot) {
        images.push({
          kind: "screenshot-full",
          buffer: Buffer.from(fullShot),
          mime: "image/png",
          width: DESKTOP.width,
          height: 0,
        });
      }

      const mobile = await makeContext(MOBILE);
      const mobilePage = await mobile.newPage();
      await mobilePage
        .goto(page.url(), { waitUntil: "domcontentloaded", timeout: config.capture.navTimeoutMs })
        .catch(() => null);
      await mobilePage.waitForTimeout(500);
      const mobileShot = await mobilePage.screenshot({ type: "png", animations: "disabled" });
      images.push({
        kind: "screenshot-mobile",
        buffer: Buffer.from(mobileShot),
        mime: "image/png",
        width: MOBILE.width,
        height: MOBILE.height,
      });

      await mobile.close();
      await desktop.close();
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    captureCode = "capture_unavailable";
    captureError = `Captura visual indisponível (${message.slice(0, 200)}). Pode carregar screenshots autorizados manualmente.`;
  }

  const reachable = htmlPages.length > 0 && !htmlError && (statusCode ?? 0) < 400;
  return {
    reachable,
    source: images.length > 0 ? "playwright" : "none",
    finalUrl,
    statusCode,
    pages: htmlPages,
    images,
    error: htmlError ?? captureError,
    errorCode: htmlError ? "http_error" : captureCode,
  };
}

/** Análise complementar de páginas internas adicionais (sem browser). */
export async function analyzeAdditionalPages(
  baseUrl: string,
  existing: PageAnalysis[],
  maxPages: number,
): Promise<PageAnalysis[]> {
  const extra: PageAnalysis[] = [];
  if (existing.length === 0) return extra;
  const budget = Math.max(0, Math.min(maxPages - 1, 2));
  if (budget === 0) return extra;
  let html = "";
  try {
    const page = await fetchHtml(baseUrl, Math.min(config.capture.maxBytes, 2_000_000));
    html = page.html;
  } catch {
    return extra;
  }
  const links = Array.from(html.matchAll(/<a\b[^>]+href=["']([^"'#?]+)["']/gi))
    .map((m) => m[1])
    .filter((href) => /^(https?:\/\/|\/)/.test(href));
  const candidates = new Set<string>();
  for (const link of links) {
    let absolute: URL;
    try {
      absolute = new URL(link, baseUrl);
    } catch {
      continue;
    }
    if (absolute.origin !== new URL(baseUrl).origin) continue;
    const path = absolute.pathname.replace(/\/$/, "") || "/";
    if (path === "/" || /\/(blog|noticias|news|login|conta|cart|carrinho)/i.test(path)) continue;
    if (/\.[a-z0-9]{2,5}$/i.test(path)) continue;
    candidates.add(absolute.toString());
    if (candidates.size >= budget) break;
  }
  for (const url of candidates) {
    try {
      const page = await fetchHtml(url, 1_800_000);
      extra.push(analyzeHtml(page.html, page.finalUrl, page.status));
    } catch {
      /* página secundária indisponível: não invalida o resto */
    }
  }
  return extra;
}
