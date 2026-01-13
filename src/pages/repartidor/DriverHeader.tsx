import "./driver.css";
import { useAuth } from "../../context/AuthContext";

export default function DriverHeader() {
  const { usuario } = useAuth();
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
          <h4 style={{ fontSize: "1rem" }}>{name}</h4>
          <p style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>
            <i
              className="fas fa-star"
              style={{ color: "#fbbf24", marginRight: 6 }}
            ></i>
            4.95 Rating
          </p>
        </div>
      </div>
      <div className="online-toggle">EN LÍNEA</div>
    </header>
  );
}
