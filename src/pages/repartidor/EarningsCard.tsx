import "./driver.css";
import { formatHNL } from "../../lib/currency";

export default function EarningsCard() {
  return (
    <div className="earnings-card">
      <p style={{ marginBottom: 8 }}>Ganancias de hoy</p>
      <h2>{formatHNL(124.8)}</h2>
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 16,
          fontSize: "0.85rem",
        }}
      >
        <span>
          <i className="fas fa-motorcycle" style={{ marginRight: 8 }}></i>
          14 Viajes
        </span>
        <span>
          <i className="fas fa-clock" style={{ marginRight: 8 }}></i>
          5h 20m
        </span>
      </div>
    </div>
  );
}
