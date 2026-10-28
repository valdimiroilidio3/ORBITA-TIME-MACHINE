import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ORBITA Time Machine",
    template: "%s · ORBITA Time Machine",
  },
  description:
    "Transforma qualquer lead numa demonstração visual personalizada: análise do website atual, proposta ORBITA e comparação interativa.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#08090A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body className="grain min-h-screen bg-orbita-void antialiased">{children}</body>
    </html>
  );
}
