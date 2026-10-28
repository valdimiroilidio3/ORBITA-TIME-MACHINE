import type { Archetype } from "./archetypes";
import type { DesignTokens } from "../types";

/** PRNG determinístico — o mesmo lead gera sempre a mesma composição. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

interface ArtOptions {
  width?: number;
  height?: number;
  variant?: "hero" | "panel" | "portrait" | "texture";
}

/**
 * Arte abstrata original gerada pela ORBITA (SVG inline).
 * Não usa fotografias nem elementos de terceiros: é segura para demonstração
 * e é explicitamente identificada como imagem demonstrativa no protótipo.
 */
export function generateArtwork(
  archetype: Archetype,
  tokens: DesignTokens,
  seedText: string,
  options: ArtOptions = {},
): string {
  const width = options.width ?? 1200;
  const height = options.height ?? 900;
  const variant = options.variant ?? "hero";
  const rand = mulberry32(hashSeed(`${seedText}:${variant}:${archetype.id}`));
  const palette = tokens.palette;
  const bg = variant === "texture" ? palette.surface : palette.background;
  const accent = palette.accent;
  const secondary = palette.secondary;
  const muted = palette.muted;

  const layers: string[] = [];

  // Campos de cor: duas elipses grandes com opacidade baixa.
  layers.push(
    `<ellipse cx="${width * (0.2 + rand() * 0.2)}" cy="${height * (0.25 + rand() * 0.2)}" rx="${width * 0.55}" ry="${height * 0.5}" fill="${secondary}" opacity="0.28" filter="url(#soft)"/>`,
  );
  layers.push(
    `<ellipse cx="${width * (0.75 + rand() * 0.15)}" cy="${height * (0.7 + rand() * 0.15)}" rx="${width * 0.42}" ry="${height * 0.42}" fill="${accent}" opacity="0.16" filter="url(#soft)"/>`,
  );

  const shape = archetype.shape;
  if (shape === "plated") {
    const cx = width * 0.62;
    const cy = height * 0.52;
    const r = Math.min(width, height) * 0.28;
    layers.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.9"/>`);
    layers.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="${palette.surface}" opacity="0.85"/>`);
    layers.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="${accent}" opacity="0.25"/>`);
    for (let i = 0; i < 5; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = r * (1.05 + rand() * 0.25);
      layers.push(
        `<circle cx="${cx + Math.cos(angle) * dist}" cy="${cy + Math.sin(angle) * dist}" r="${3 + rand() * 7}" fill="${muted}" opacity="0.6"/>`,
      );
    }
  } else if (shape === "orbit") {
    for (let i = 0; i < 6; i++) {
      layers.push(
        `<ellipse cx="${width * 0.6}" cy="${height * 0.5}" rx="${100 + i * 70}" ry="${60 + i * 46}" fill="none" stroke="${i % 2 ? secondary : accent}" stroke-width="1" opacity="${0.5 - i * 0.06}" transform="rotate(${-18 + i * 4} ${width * 0.6} ${height * 0.5})"/>`,
      );
    }
    layers.push(`<circle cx="${width * 0.6}" cy="${height * 0.5}" r="26" fill="${accent}"/>`);
  } else if (shape === "grid") {
    const step = Math.max(48, Math.round(width / 18));
    for (let x = step; x < width; x += step) {
      layers.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${muted}" stroke-width="0.5" opacity="0.22"/>`);
    }
    for (let y = step; y < height; y += step) {
      layers.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${muted}" stroke-width="0.5" opacity="0.18"/>`);
    }
    const cols = 3;
    const cardW = width / (cols + 1.6);
    for (let i = 0; i < cols; i++) {
      const h = height * (0.22 + rand() * 0.34);
      layers.push(
        `<rect x="${width * 0.12 + i * (cardW + 24)}" y="${height * 0.55 - h / 2}" width="${cardW}" height="${h}" fill="${i === 1 ? accent : palette.surface}" opacity="${i === 1 ? 0.9 : 0.75}" rx="4"/>`,
      );
    }
  } else if (shape === "arc") {
    for (let i = 0; i < 5; i++) {
      const r = 120 + i * 90;
      layers.push(
        `<path d="M ${width * 0.15} ${height * 0.95} A ${r} ${r} 0 0 1 ${width * 0.15 + r} ${height * 0.95}" fill="none" stroke="${i === 2 ? accent : secondary}" stroke-width="${i === 2 ? 2 : 1}" opacity="${0.55 - i * 0.07}"/>`,
      );
    }
    layers.push(
      `<rect x="${width * 0.62}" y="${height * 0.18}" width="${width * 0.24}" height="${height * 0.52}" rx="120" fill="${palette.surface}" opacity="0.9"/>`,
    );
    layers.push(
      `<rect x="${width * 0.68}" y="${height * 0.26}" width="${width * 0.12}" height="${height * 0.36}" rx="60" fill="${accent}" opacity="0.3"/>`,
    );
  } else if (shape === "strata") {
    for (let i = 0; i < 7; i++) {
      const y = height * 0.25 + i * (height * 0.075);
      layers.push(
        `<rect x="${width * 0.08}" y="${y}" width="${width * (0.35 + rand() * 0.5)}" height="1.5" fill="${i === 3 ? accent : muted}" opacity="${i === 3 ? 0.9 : 0.35}"/>`,
      );
    }
    layers.push(
      `<rect x="${width * 0.66}" y="${height * 0.2}" width="${width * 0.2}" height="${height * 0.6}" fill="${palette.surface}" opacity="0.85"/>`,
    );
  } else if (shape === "frame") {
    const pad = Math.min(width, height) * 0.12;
    layers.push(
      `<rect x="${pad}" y="${pad}" width="${width - pad * 2}" height="${height - pad * 2}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.8"/>`,
    );
    layers.push(
      `<rect x="${width * 0.18}" y="${height * 0.28}" width="${width * 0.44}" height="${height * 0.44}" fill="${palette.surface}" opacity="0.9"/>`,
    );
    layers.push(
      `<rect x="${width * 0.55}" y="${height * 0.48}" width="${width * 0.28}" height="${height * 0.28}" fill="${secondary}" opacity="0.55"/>`,
    );
  } else {
    const blocks = 4;
    for (let i = 0; i < blocks; i++) {
      const w = width * (0.14 + rand() * 0.16);
      const h = height * (0.18 + rand() * 0.3);
      layers.push(
        `<rect x="${width * 0.12 + i * (width * 0.2)}" y="${height * 0.34 + (rand() - 0.5) * height * 0.2}" width="${w}" height="${h}" rx="10" fill="${i === 2 ? accent : palette.surface}" opacity="${i === 2 ? 0.85 : 0.7}"/>`,
      );
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Composição gráfica abstrata gerada pela ORBITA para ${seedText}">
<defs>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${Math.round(Math.min(width, height) * 0.09)}"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
</defs>
<rect width="${width}" height="${height}" fill="${bg}"/>
${layers.join("\n")}
<rect width="${width}" height="${height}" filter="url(#grain)" opacity="${archetype.grain * 0.16}" style="mix-blend-mode:overlay"/>
<rect width="${width}" height="${height}" fill="none" stroke="${muted}" stroke-width="1" opacity="0.25"/>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function artworkSet(
  archetype: Archetype,
  tokens: DesignTokens,
  company: string,
): { hero: string; panel: string; portrait: string; texture: string } {
  return {
    hero: generateArtwork(archetype, tokens, company, { width: 1400, height: 950, variant: "hero" }),
    panel: generateArtwork(archetype, tokens, company, { width: 900, height: 700, variant: "panel" }),
    portrait: generateArtwork(archetype, tokens, company, { width: 720, height: 900, variant: "portrait" }),
    texture: generateArtwork(archetype, tokens, company, { width: 600, height: 600, variant: "texture" }),
  };
}


