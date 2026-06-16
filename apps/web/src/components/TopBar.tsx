import { Bell, CalendarDays } from "lucide-react";
import { Logo } from "./Logo";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="mobile-logo">
        <Logo />
      </div>
      <div className="date-pill">
        <CalendarDays size={16} />
        <span>Сегодня, 15 июня</span>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" aria-label="Уведомления">
          <Bell size={19} />
          <span className="notification-dot" />
        </button>
        <button className="avatar" aria-label="Профиль">
          А
        </button>
      </div>
    </header>
  );
}
