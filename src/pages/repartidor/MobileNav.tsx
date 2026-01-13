import "./driver.css";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaCompass,
  FaClipboardList,
  FaWallet,
  FaBell,
  FaUserCircle,
} from "react-icons/fa";

const items = [
  { to: "/repartidor/dashboard", icon: FaCompass, label: "Inicio" },
  { to: "/repartidor/pedidos", icon: FaClipboardList, label: "Pedidos" },
  { to: "/repartidor/cartera", icon: FaWallet, label: "Cartera" },
  { to: "/repartidor/avisos", icon: FaBell, label: "Avisos" },
  { to: "/repartidor/cuenta", icon: FaUserCircle, label: "Cuenta" },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="nav-bar" role="navigation" aria-label="Mobile navigation">
      {items.map((it) => {
        const Icon = it.icon;
        const active = pathname === it.to;
        return (
          <button
            key={it.to}
            onClick={() => navigate(it.to)}
            className={"nav-link" + (active ? " active" : "")}
            type="button"
            aria-label={it.label}
          >
            <Icon />
          </button>
        );
      })}
    </nav>
  );
}
