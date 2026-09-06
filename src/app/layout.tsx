import type { Metadata } from "next";
import { Mukta, Khand } from "next/font/google";
import "./globals.css";

const mukta = Mukta({
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
});

const khand = Khand({
  subsets: ["latin", "devanagari"],
  weight: ["500", "600", "700"],
  variable: "--font-khand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ask Sarkar",
  description:
    "What papers do I need? Ask before you travel to a government office.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${mukta.variable} ${khand.variable} antialiased`}
        style={{
          fontFamily:
            "var(--font-mukta), 'Noto Sans Devanagari', system-ui, -apple-system, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
