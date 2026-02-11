import "./driver.css";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";

export default function DriverHeader() {
  const { usuario } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const initials = (usuario?.nombre || usuario?.email || "?")
    .charAt(0)
    .toUpperCase();
  const name = usuario?.nombre
    ? `¡Hola, ${usuario.nombre.split(" ")[0]}!`
    : "¡Hola!";

  return (
    <header className="header">
      <div className="user-profile">
        <div className="avatar-ring">
          <div className="avatar">{initials}</div>
        </div>
        <div>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
            {name}
          </h4>
          <p
            style={{ color: "var(--text-dim)", fontSize: "0.8rem", margin: 0 }}
          >
            <i
              className="fas fa-star"
              style={{ color: "#fbbf24", marginRight: 6 }}
            ></i>
            4.95 Rating
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="online-toggle">EN LÍNEA</div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          type="button"
        >
          {isDark ? <FaSun /> : <FaMoon />}
        </button>
      </div>
    </header>
  );
}
