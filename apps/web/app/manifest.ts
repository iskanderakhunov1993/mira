import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mira — Слушай себя",
    short_name: "Mira",
    description: "Приватное веб-приложение для отслеживания цикла, самочувствия, питания и активности.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F5FE",
    theme_color: "#9B8EC4",
    lang: "ru",
    orientation: "portrait",
    categories: ["health", "lifestyle"],
    icons: [
      {
        src: "/mira-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
