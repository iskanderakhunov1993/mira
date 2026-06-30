import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MIRA — женское здоровье",
    short_name: "MIRA",
    description: "Твой персональный помощник в мире женского здоровья",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#E872A0",
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
        src: "/icons/icon-192.png",
        sizes: "72x72",
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
