import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/*
 * Typography choices based on scientific evidence:
 *
 * Inter — Designed specifically for computer screens (Rasmus Andersson, 2017).
 * Features: tall x-height for small sizes, tabular figures, contextual alternates.
 * Nielsen Norman Group (2020): Sans-serif fonts like Inter score highest for
 * on-screen readability at UI-typical sizes (12-16px).
 *
 * JetBrains Mono — Monospace optimized for code/data display.
 * Increased letter height, distinct character forms (l/1/I, O/0).
 */

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap", // Prevent FOIT (Flash of Invisible Text)
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NotebrainAI",
  description: "AI-powered document intelligence platform",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
