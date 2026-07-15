import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import './startupSplash.css';

type SplashPhase = 'visible' | 'leaving' | 'hidden';

const splashPetalClips = [
  { id: 'top', points: '626 490 430 100 830 100', twist: '-7deg' },
  { id: 'upper-right', points: '626 490 830 100 1040 468', twist: '7deg' },
  { id: 'lower-right', points: '626 490 1040 468 1040 850 863 850', twist: '-6deg' },
  { id: 'bottom', points: '626 490 863 850 418 850', twist: '6deg' },
  { id: 'lower-left', points: '626 490 418 850 210 850 210 540', twist: '-7deg' },
  { id: 'upper-left', points: '626 490 210 540 210 100 430 100', twist: '7deg' },
] as const;

export function StartupGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SplashPhase>('visible');

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setPhase('leaving'), 1900);
    const hideTimer = window.setTimeout(() => setPhase('hidden'), 2300);
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
            <svg className="startup-splash-logo" viewBox="210 100 830 1040" aria-hidden="true">
              <defs>
                {splashPetalClips.map((petal) => <clipPath key={petal.id} id={`startup-clip-${petal.id}`}><polygon points={petal.points} /></clipPath>)}
                <clipPath id="startup-clip-word"><rect x="270" y="850" width="710" height="300" /></clipPath>
              </defs>
              <g className="startup-splash-word" clipPath="url(#startup-clip-word)">
                <image href="/mira-logo-transparent.png" width="1254" height="1254" />
              </g>
              {splashPetalClips.map((petal, index) => (
                <g
                  key={petal.id}
                  className="startup-splash-petal"
                  clipPath={`url(#startup-clip-${petal.id})`}
                  style={{ '--petal-delay': `${480 + index * 100}ms`, '--petal-twist': petal.twist } as CSSProperties}
                >
                  <image href="/mira-logo-transparent.png" width="1254" height="1254" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
