import { ChevronRight, Crown } from "lucide-react";
import { navigation } from "../data/demo";
import type { Screen } from "../types";
import { Logo } from "./Logo";

type SidebarProps = {
  active: Screen;
  onNavigate: (screen: Screen) => void;
};

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="desktop-nav" aria-label="Основная навигация">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={active === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-spacer" />
      <button className="membership-card">
        <span className="membership-icon">
          <Crown size={16} />
        </span>
        <span>
          <small>Ayla Premium</small>
          <strong>Go to premium</strong>
        </span>
        <ChevronRight size={17} />
      </button>
      <p className="safety-note">
        Ayla не ставит диагнозы и не заменяет консультацию врача.
      </p>
    </aside>
  );
}
