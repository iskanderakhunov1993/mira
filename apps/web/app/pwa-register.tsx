"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    let interval: number | undefined;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        const notifyUpdate = () => {
          window.dispatchEvent(new CustomEvent("mira-sw-update", { detail: registration }));
        };

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              notifyUpdate();
            }
          });
        });

        interval = window.setInterval(() => {
          registration.update().catch(() => undefined);
        }, 15 * 60 * 1000);
      }).catch(() => {
        // The app remains usable online if the optional offline shell cannot register.
      });
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return null;
}
