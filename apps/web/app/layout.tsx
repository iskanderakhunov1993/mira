import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PwaRegister } from "./pwa-register";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Mira — Слушай себя",
  description: "Приватное веб-приложение для отслеживания цикла, самочувствия, питания и активности.",
  applicationName: "Mira",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mira"
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/mira-icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
