import { useAuth } from "../../context/AuthContext";
import "./driver.css";

export default function Cuenta() {
  const { usuario } = useAuth();

  return (
    <div style={{ padding: 16 }}>
      <h2>Mi Cuenta</h2>
      <p>Nombre: {usuario?.nombre || "-"}</p>
      <p>Rol: {usuario?.tipo_usuario || "-"}</p>
      <p>ID: {usuario?.id || "-"}</p>
    </div>
  );
}
