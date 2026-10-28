#!/usr/bin/env node
/**
 * Diagnóstico do ambiente de captura.
 * Verifica se o Playwright tem um browser utilizável; se não tiver, indica
 * como instalar (npm run capture:install) e confirma que o modo degradado
 * (análise HTML + upload autorizado) está operacional.
 */
const checks = [];

async function checkPlaywright() {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      timeout: 15_000,
    });
    const version = browser.version();
    await browser.close();
    checks.push({ name: "Chromium (Playwright)", ok: true, detail: version });
    return true;
  } catch (error) {
    checks.push({
      name: "Chromium (Playwright)",
      ok: false,
      detail: String(error?.message ?? error).split("\n")[0].slice(0, 220),
    });
    return false;
  }
}

async function checkNodeSqlite() {
  try {
    const sqlite = process.getBuiltinModule("node:sqlite");
    const db = new sqlite.DatabaseSync(":memory:");
    db.exec("CREATE TABLE t (a TEXT)");
    db.close();
    checks.push({ name: "node:sqlite", ok: true, detail: process.version });
  } catch (error) {
    checks.push({ name: "node:sqlite", ok: false, detail: String(error?.message ?? error) });
  }
}

async function checkFetch() {
  try {
    const response = await fetch("https://example.com", { signal: AbortSignal.timeout(8000) });
    checks.push({ name: "Rede de saída (HTTPS)", ok: response.ok, detail: `HTTP ${response.status}` });
  } catch (error) {
    const cause = error?.cause?.message ?? error?.message ?? String(error);
    checks.push({ name: "Rede de saída (HTTPS)", ok: false, detail: String(cause).slice(0, 160) });
  }
}

(async () => {
  await checkNodeSqlite();
  const hasBrowser = await checkPlaywright();
  await checkFetch();

  console.log("\nORBITA Time Machine — diagnóstico de captura\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✓" : "✕"} ${check.name.padEnd(26)} ${check.detail}`);
  }
  console.log("");
  if (!hasBrowser) {
    console.log("Sem browser, a captura automática fica desativada por etapa e a geração continua:");
    console.log("  · a análise usa o HTML servido (fetch endurecido, anti-SSRF);");
    console.log("  · a comparação apresenta o estado 'sem captura do website atual';");
    console.log("  · podes carregar screenshots autorizados no workspace.");
    console.log("\nPara ativar a captura real: npx playwright install --with-deps chromium\n");
    process.exitCode = 0;
  } else {
    console.log("Captura automática disponível (desktop, mobile e página completa).\n");
  }
})();
