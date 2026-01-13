import "./driver.css";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Pedido = {
  id: string;
  numero_pedido?: string;
  restaurante?: string;
  direccion_entrega?: string;
  total?: number;
  estado?: string;
  creado_en?: string;
};

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("pedidos")
          .select("*")
          .order("creado_en", { ascending: false });

        if (error) throw error;
        setPedidos((data as Pedido[]) || []);
      } catch (err: any) {
        console.error("Error cargando pedidos:", err);
        setError(err.message || "Error al cargar pedidos");
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  if (loading) return <div className="order-item">Cargando pedidos...</div>;
  if (error) return <div className="order-item">Error: {error}</div>;

  return (
    <div>
      {pedidos.map((p) => (
        <div key={p.id} className="order-item">
          <div className="order-info">
            <span className="badge">{p.restaurante || "Pedido"}</span>
            <span style={{ fontWeight: "bold", color: "var(--success)" }}>
              ${p.total?.toFixed(2) || "0.00"}
            </span>
          </div>

          <div className="route-visual">
            <div className="point">
              <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                {p.restaurante || "-"}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                {p.creado_en}
              </p>
            </div>
            <div className="point destination">
              <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                {p.direccion_entrega || "-"}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Estado: {p.estado || "-"}
              </p>
            </div>
          </div>

          <button className="btn-accept">ACEPTAR PEDIDO</button>
        </div>
      ))}
    </div>
  );
}
