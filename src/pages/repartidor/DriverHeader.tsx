import "./driver.css";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  obtenerPerfilRepartidor,
  actualizarPerfilRepartidor,
} from "../../services/repartidor.service";
import { FaSun, FaMoon } from "react-icons/fa";

export default function DriverHeader() {
  const { usuario } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [disponible, setDisponible] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);

  const initials = (usuario?.nombre || usuario?.email || "?")
    .charAt(0)
    .toUpperCase();
  const name = usuario?.nombre
    ? `¡Hola, ${usuario.nombre.split(" ")[0]}!`
    : "¡Hola!";

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      if (!usuario) return;
      try {
        const perfil = await obtenerPerfilRepartidor(usuario.id);
        if (activo) setDisponible(Boolean(perfil.disponible));
      } catch (error) {
        console.error("Error cargando disponibilidad:", error);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, [usuario]);

  const toggleDisponible = async () => {
    if (!usuario || disponible === null) return;
    try {
      setToggling(true);
      const perfil = await obtenerPerfilRepartidor(usuario.id);
      const actualizado = await actualizarPerfilRepartidor(perfil.id, {
        disponible: !disponible,
      });
      setDisponible(Boolean(actualizado.disponible));
    } catch (error) {
      console.error("Error actualizando disponible:", error);
    } finally {
      setToggling(false);
    }
  };

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
            Panel del repartidor
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          className={`online-toggle ${disponible ? "online" : "offline"}`}
          type="button"
          onClick={toggleDisponible}
          disabled={toggling || disponible === null}
        >
          {disponible ? "EN LÍNEA" : "FUERA DE LÍNEA"}
        </button>
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
