import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orbita: {
          void: "#08090A",
          base: "#0B0D0E",
          panel: "#111315",
          raised: "#171A1C",
          line: "#23272A",
          acid: "#B9FF00",
          ink: "#F2F4F1",
          muted: "#8E9691",
          dim: "#5E665F",
          danger: "#FF5B45",
          warn: "#FFB020",
          info: "#7AA2FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: { tightest: "-0.045em" },
      transitionTimingFunction: { orbita: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [],
};

export default config;
