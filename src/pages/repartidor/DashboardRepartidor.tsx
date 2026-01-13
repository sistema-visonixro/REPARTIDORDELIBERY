import DriverHeader from "./DriverHeader";
import EarningsCard from "./EarningsCard";
import Pedidos from "./Pedidos";
import MobileNav from "./MobileNav";
import "./driver.css";

export default function DashboardRepartidor() {
  return (
    <div className="mobile-viewport">
      <DriverHeader />

      <EarningsCard />

      <div className="section-header">
        <h3 style={{ fontSize: "1.1rem" }}>Pedido disponible</h3>
        <span
          style={{
            color: "var(--accent)",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          NUEVO
        </span>
      </div>

      <Pedidos showAssignedOnly={false} showUnassignedOnly={true} />

      <MobileNav />
    </div>
  );
}
