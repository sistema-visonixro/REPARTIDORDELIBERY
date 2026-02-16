import Pedidos from "./Pedidos";
import "./driver.css";

export default function PedidosView() {
  return (
    <div className="mobile-viewport">
      <h2 style={{ marginBottom: 8 }}>Pedidos</h2>
      <Pedidos />
    </div>
  );
}
