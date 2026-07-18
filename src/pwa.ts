export function registerMiraServiceWorker(): void {
  const viteEnv = (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env;
  if (!viteEnv?.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      window.dispatchEvent(new CustomEvent('mira:pwa-error'));
    });
  }, { once: true });
}
