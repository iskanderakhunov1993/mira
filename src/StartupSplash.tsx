import { useEffect, useState, type ReactNode } from 'react';
import './startupSplash.css';

type SplashPhase = 'visible' | 'leaving' | 'hidden';

export function StartupGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SplashPhase>('visible');

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setPhase('leaving'), 1050);
    const hideTimer = window.setTimeout(() => setPhase('hidden'), 1450);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {children}
      {phase !== 'hidden' && (
        <div className={`startup-splash ${phase === 'leaving' ? 'is-leaving' : ''}`} role="status" aria-label="Запуск Mira">
          <div className="startup-splash-content">
            <img className="startup-splash-logo" src="/mira-logo-transparent.png" alt="Mira" />
          </div>
        </div>
      )}
    </>
  );
}
