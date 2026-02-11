import "./driver.css";
import { formatHNL } from "../../lib/currency";

export default function EarningsCard() {
  return (
    <div className="earnings-card">
      <p>Ganancias de hoy</p>
      <h2>{formatHNL(124.8)}</h2>
      <div
        style={{ display: "flex", gap: 15, marginTop: 10, fontSize: "0.8rem" }}
      >
        <span>
          <i className="fas fa-motorcycle"></i> 14 Viajes
        </span>
        <span>
          <i className="fas fa-clock"></i> 5h 20m
        </span>
      </div>
    </div>
  );
}
