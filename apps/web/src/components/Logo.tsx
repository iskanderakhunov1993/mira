export function Logo() {
  return (
    <div className="logo" aria-label="Ayla">
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" role="img">
          <path
            className="logo-orbit"
            d="M7.5 22.4C4.8 14.8 9.7 7.2 17.2 6.5c7.7-.7 13.5 5.6 12.7 12.4-.8 7-7.4 11.6-13.8 9.4-5.8-2-8-8.4-5-13.2"
          />
          <path
            className="logo-body"
            d="M19.8 9.4c-1.2 4.8-4.8 9.2-7.8 13.2m7.8-13.2c1.4 5 4.9 9.3 8.1 13.2M15 20.2h9.7M12 22.6c2.1 2.7 4.8 5.7 7.8 8 3-2.3 5.8-5.3 8.1-8"
          />
          <circle cx="19.8" cy="8.2" r="1.7" />
        </svg>
      </span>
      <span className="logo-copy">
        <strong>Ayla</strong>
        <small>body intelligence</small>
      </span>
    </div>
  );
}
