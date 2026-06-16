import { navigation } from "../data/demo";
import type { Screen } from "../types";

type MobileNavProps = {
  active: Screen;
  onNavigate: (screen: Screen) => void;
};

export function MobileNav({ active, onNavigate }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Мобильная навигация">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <button
            className={active === item.id ? "active" : ""}
            key={item.id}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
