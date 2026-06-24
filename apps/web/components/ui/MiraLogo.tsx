"use client";

/**
 * Glassmorphism logo matching the reference design:
 * - Rounded square with soft gradient + glass effect
 * - ∞ symbol with subtle inner shadow/stroke
 * - Multiple shadow layers for depth
 */
export function MiraLogo({ size = 80 }: { size?: number }) {
  const iconSize = size * 0.5;
  const radius = size * 0.22;
  const borderW = size * 0.015;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-[22%] opacity-40 blur-xl"
        style={{
          background: "linear-gradient(135deg, #C9B8E8 0%, #A08CC8 100%)",
        }}
      />

      {/* Main body */}
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-[22%]"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(145deg, rgba(210,195,240,0.85) 0%, rgba(175,155,215,0.9) 40%, rgba(150,130,200,0.95) 100%)",
          boxShadow: `
            0 ${size * 0.08}px ${size * 0.3}px rgba(155,142,196,0.35),
            0 ${size * 0.02}px ${size * 0.06}px rgba(155,142,196,0.2),
            inset 0 ${size * 0.015}px ${size * 0.03}px rgba(255,255,255,0.4),
            inset 0 -${size * 0.01}px ${size * 0.02}px rgba(100,80,160,0.15)
          `,
          border: `${borderW}px solid rgba(255,255,255,0.3)`,
        }}
      >
        {/* Glass highlight overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 40%, transparent 60%)",
            borderRadius: "inherit",
          }}
        />

        {/* ∞ symbol — proper infinity curve */}
        <svg
          width={iconSize}
          height={iconSize * 0.5}
          viewBox="0 0 120 60"
          fill="none"
          style={{ position: "relative", zIndex: 1 }}
        >
          {/* Shadow */}
          <path
            d="M60 30C60 30 68 12 84 12C96 12 104 20 104 30C104 40 96 48 84 48C68 48 60 30 60 30ZM60 30C60 30 52 48 36 48C24 48 16 40 16 30C16 20 24 12 36 12C52 12 60 30 60 30Z"
            stroke="rgba(80,60,130,0.12)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Main white stroke */}
          <path
            d="M60 30C60 30 68 12 84 12C96 12 104 20 104 30C104 40 96 48 84 48C68 48 60 30 60 30ZM60 30C60 30 52 48 36 48C24 48 16 40 16 30C16 20 24 12 36 12C52 12 60 30 60 30Z"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * Full logo lockup: icon + "Mira" text + tagline
 * For use on gradient backgrounds (white text)
 */
export function MiraLogoFull({ size = 80, tagline = "Слушай себя", light = false }: {
  size?: number;
  tagline?: string;
  light?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <MiraLogo size={size} />
      <div>
        <p className={`font-bold ${light ? "text-white" : "text-mira-text"}`} style={{ fontSize: size * 0.4 }}>
          Mira
        </p>
        {tagline && (
          <p className={`${light ? "text-white/70" : "text-mira-muted"}`} style={{ fontSize: size * 0.18 }}>
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Feature icons row matching the reference:
 * ∞ цикл | :) настроение | ⚡ энергия | 🌙 сон | ♥ здоровье
 */
export function MiraFeatureIcons({ light = false }: { light?: boolean }) {
  const color = light ? "text-white/80" : "text-mira-muted";
  const labelColor = light ? "text-white/60" : "text-mira-muted";

  return (
    <div className="flex items-center justify-center gap-6 sm:gap-10">
      {[
        { icon: <InfinityIcon />, label: "цикл" },
        { icon: <SmileIcon />, label: "настроение" },
        { icon: <BoltIcon />, label: "энергия" },
        { icon: <MoonIcon />, label: "сон" },
        { icon: <HeartIcon />, label: "здоровье" },
      ].map(item => (
        <div key={item.label} className="flex flex-col items-center gap-2">
          <div className={`${color} [&_svg]:h-7 [&_svg]:w-7`}>{item.icon}</div>
          <span className={`text-xs font-medium ${labelColor}`}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function InfinityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12C12 12 14 7 17 7C19.2 7 21 8.8 21 11C21 13.2 19.2 15 17 15C14 15 12 12 12 12ZM12 12C12 12 10 15 7 15C4.8 15 3 13.2 3 11C3 8.8 4.8 7 7 7C10 7 12 12 12 12Z" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
      <path d="M8.5 14.5C9.2 15.8 10.5 16.5 12 16.5C13.5 16.5 14.8 15.8 15.5 14.5" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4.5 13H12L11 22L19.5 11H12L13 2Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}
