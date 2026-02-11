import "./driver.css";
import { formatHNL } from "../../lib/currency";

export default function Cartera() {
  return (
    <div style={{ padding: 16 }}>
      <h2>Cartera</h2>
      <p>
        Saldo disponible: <strong>{formatHNL(0)}</strong>
      </p>
      <p>Historial de pagos y ajustes aparecerán aquí.</p>
    </div>
  );
}
