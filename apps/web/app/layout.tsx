import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { PwaRegister } from "./pwa-register";
import { RouterShell } from "@/components/layout/RouterShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Mira — Знай свою норму",
  description: "Приватный умный дневник женского здоровья: цикл, симптомы, личная норма, аналитика и отчёт врачу.",
  applicationName: "Mira",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mira"
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        <PwaRegister />
        <RouterShell>{children}</RouterShell>
      </body>
    </html>
  );
}
