import "./driver.css";
import { formatHNL } from "../../lib/currency";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { marcarPedidoEntregado } from "../../services/repartidor.service";

type Pedido = {
  id: string;
  numero_pedido?: string;
  restaurante?: string;
  direccion_entrega?: string;
  total?: number;
  estado?: string;
  creado_en?: string;
  repartidor_id?: string;
  notas_cliente?: string | null;
};

export default function Pedidos({
  showAssignedOnly = true,
  showUnassignedOnly = false,
}: {
  showAssignedOnly?: boolean;
  showUnassignedOnly?: boolean;
}) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});
  const [delivering, setDelivering] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true);
      try {
        if (!usuario) {
          setPedidos([]);
          setLoading(false);
          return;
        }

        let query = supabase
          .from("pedidos")
          .select("*, restaurantes(nombre, direccion)");
        // Excluir pedidos ya entregados
        query = query.neq("estado", "entregado");
        if (showAssignedOnly) {
          query = query.eq("repartidor_id", usuario.id);
        } else if (showUnassignedOnly) {
          query = query.is("repartidor_id", null);
        }
        const { data, error } = await query.order("creado_en", {
          ascending: false,
        });

        if (error) throw error;
        // Filtrar pedidos con estado 'entregado' como medida de seguridad
        const fetched = (data as Pedido[]) || [];
        // Normalizar y filtrar cualquier variante de 'entregado' (mayúsculas/espacios)
        const visible = fetched.filter(
          (p) =>
            (p.estado || "").toString().toLowerCase().trim() !== "entregado",
        );
        setPedidos(visible);
      } catch (err: any) {
        console.error("Error cargando pedidos:", err);
        setError(err.message || "Error al cargar pedidos");
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, [usuario, showAssignedOnly, refreshKey]);

  if (loading) return <div className="order-item">Cargando pedidos...</div>;
  if (error) return <div className="order-item">Error: {error}</div>;

  const handleTake = async (pedidoId: string) => {
    if (!usuario) return;
    try {
      setAssigning((s) => ({ ...s, [pedidoId]: true }));

      const { data, error } = await supabase.rpc("asignar_repartidor_pedido", {
        p_pedido_id: pedidoId,
        p_repartidor_id: usuario.id,
      });

      if (error) {
        console.error("Error asignando pedido:", error);
        alert("No se pudo asignar el pedido: " + error.message);
        return;
      }

      // La función devuelve booleano: true si se asignó, false si no (ya fue tomado o estado no válido)
      if (!data) {
        // Obtener estado actual del pedido para diagnóstico
        try {
          const { data: latest, error: latestErr } = await supabase
            .from("pedidos")
            .select("estado, repartidor_id, asignado_en")
            .eq("id", pedidoId)
            .single();

          if (!latestErr && latest) {
            alert(
              `No fue posible tomar el pedido. Estado: ${latest.estado} | repartidor_id: ${latest.repartidor_id} | asignado_en: ${latest.asignado_en}`,
            );
          } else {
            alert(
              "No fue posible tomar el pedido. Puede ya estar asignado o no estar listo para asignación.",
            );
          }
        } catch (e) {
          console.error("Error consultando estado del pedido:", e);
          alert(
            "No fue posible tomar el pedido. Puede ya estar asignado o no estar listo para asignación.",
          );
        }

        setRefreshKey((k) => k + 1);
        return;
      }

      setRefreshKey((k) => k + 1);
    } finally {
      setAssigning((s) => ({ ...s, [pedidoId]: false }));
    }
  };

  const handleMarkDelivered = async (pedidoId: string) => {
    if (!usuario) return;
    try {
      setDelivering((s) => ({ ...s, [pedidoId]: true }));
      const data = await marcarPedidoEntregado(pedidoId, usuario.id);
      if (!data) {
        alert(
          "No se pudo marcar como entregado. Verifica el estado del pedido.",
        );
        setRefreshKey((k) => k + 1);
        return;
      }
      alert("Pedido marcado como entregado.");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Error al marcar entregado:", err);
      alert("Error al marcar el pedido como entregado");
    } finally {
      setDelivering((s) => ({ ...s, [pedidoId]: false }));
    }
  };

  return (
    <div>
      {pedidos.map((p) => {
        const rest: any = (p as any).restaurantes;
        const nombreRest = rest?.nombre || p.restaurante || "-";
        const direccionRest = rest?.direccion || "-";
        return (
          <div key={p.id} className="order-item">
            <div className="order-info">
              <span className="badge">{nombreRest || "Pedido"}</span>
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--success)" }}>
                {formatHNL(p.total)}
              </span>
            </div>

            <div className="route-visual">
              <div className="point">
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)", marginBottom: 4 }}>
                  {direccionRest}
                </p>

                <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", margin: 0 }}>
                  {p.creado_en}
                </p>
              </div>
              <div className="point destination">
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)", marginBottom: 4 }}>
                  {p.direccion_entrega || "-"}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", margin: 0 }}>
                  <strong>Estado:</strong> {p.estado || "-"}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              {p.notas_cliente && (
                <div style={{ marginBottom: 12, padding: 12, background: "var(--card-bg-secondary)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                    <strong style={{ color: "var(--accent)" }}>💬 Nota:</strong> {p.notas_cliente}
                  </p>
                </div>
              )}
              <button
                className="btn-accept"
                onClick={() => {
                  if (p.repartidor_id && p.repartidor_id === usuario?.id) {
                    // ver ruta
                    navigate(`/repartidor/ruta/${p.id}`);
                  } else {
                    handleTake(p.id);
                  }
                }}
                disabled={
                  assigning[p.id] ||
                  (!!p.repartidor_id && p.repartidor_id !== usuario?.id)
                }
              >
                {assigning[p.id]
                  ? "..."
                  : p.repartidor_id
                    ? p.repartidor_id === usuario?.id
                      ? "VER RUTA"
                      : "YA ASIGNADO"
                    : "TOMAR PEDIDO"}
              </button>

              {p.repartidor_id &&
                p.repartidor_id === usuario?.id &&
                p.estado === "en_camino" && (
                  <button
                    className="btn-accept bg-green-600 hover:bg-green-700"
                    onClick={() => handleMarkDelivered(p.id)}
                    disabled={delivering[p.id]}
                  >
                    {delivering[p.id] ? "..." : "ENTREGADO"}
                  </button>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
