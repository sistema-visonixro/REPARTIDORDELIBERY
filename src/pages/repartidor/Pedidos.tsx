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
  costo_envio?: number;
  estado?: string;
  creado_en?: string;
  repartidor_id?: string;
  notas_cliente?: string | null;
  tipo_pago?: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
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
        const fetched = (data as any[]) || [];
        
        // Obtener IDs únicos de usuarios
        const usuarioIds = [...new Set(fetched.map((p: any) => p.usuario_id).filter(Boolean))];
        
        console.log("Pedidos obtenidos:", fetched.length);
        console.log("Usuario IDs para consultar:", usuarioIds);
        
        // Consultar información de usuarios si hay pedidos
        let usuariosMap = new Map();
        if (usuarioIds.length > 0) {
          const { data: usuarios } = await supabase
            .from("usuarios")
            .select("id, nombre, telefono")
            .in("id", usuarioIds);
          
          console.log("Usuarios obtenidos:", usuarios);
          
          (usuarios || []).forEach((u: any) => {
            usuariosMap.set(u.id, u);
          });
        }
        
        // Combinar datos de pedidos con usuarios
        const pedidosConUsuarios = fetched.map((p: any) => {
          const usuario = usuariosMap.get(p.usuario_id);
          console.log(`Pedido ${p.id}: usuario_id=${p.usuario_id}, usuario=`, usuario);
          return {
            ...p,
            cliente_nombre: usuario?.nombre || "",
            cliente_telefono: usuario?.telefono || "",
          };
        });
        
        // Filtrar pedidos con estado 'entregado' como medida de seguridad
        const visible = pedidosConUsuarios.filter(
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

  const handleMarkDelivered = async (pedidoId: string, costoEnvio?: number) => {
    if (!usuario) return;
    try {
      console.log("handleMarkDelivered: inicio", {
        pedidoId,
        usuarioId: usuario.id,
      });
      setDelivering((s) => ({ ...s, [pedidoId]: true }));
      const data = await marcarPedidoEntregado(
        pedidoId,
        usuario.id,
        costoEnvio,
      );
      console.log("handleMarkDelivered: resultado service", data);
      if (!data) {
        alert(
          "No se pudo marcar como entregado. Verifica el estado del pedido.",
        );
        setRefreshKey((k) => k + 1);
        return;
      }
      alert("Pedido marcado como entregado.");
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("Error al marcar entregado:", err);
      const msg =
        err?.message ||
        JSON.stringify(err) ||
        "Error al marcar el pedido como entregado";
      alert(msg);
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
        const clienteNombre = p.cliente_nombre || "Cliente";
        const clienteTelefono = p.cliente_telefono || null;
        
        console.log("Renderizando pedido:", {
          id: p.id,
          usuario_id: (p as any).usuario_id,
          cliente_nombre: clienteNombre,
          cliente_telefono: clienteTelefono,
        });
        
        return (
          <div key={p.id} className="order-item">
            <div className="order-info">
              <span className="badge">{nombreRest || "Pedido"}</span>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-dim)",
                    margin: 0,
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Total a cobrar
                </p>
                <p
                  style={{
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    color: "var(--success)",
                    margin: 0,
                  }}
                >
                  {formatHNL(p.total)}
                </p>
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-dim)",
                    margin: 0,
                    marginTop: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Tu ganancia
                </p>
                <p
                  style={{
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: "#f59e0b",
                    margin: 0,
                  }}
                >
                  {formatHNL(p.costo_envio ?? 0)}
                </p>
              </div>
            </div>

            {/* Información del pedido */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "8px",
                marginBottom: "12px",
                padding: "12px",
                background: "var(--card-bg-secondary)",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontSize: "1.2rem" }}>📍</div>
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-dim)",
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  Dirección de entrega
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "var(--text-main)",
                    margin: 0,
                  }}
                >
                  {p.direccion_entrega || "-"}
                </p>
              </div>

              <div style={{ fontSize: "1.2rem" }}>💳</div>
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-dim)",
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  Tipo de pago
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "var(--text-main)",
                    margin: 0,
                    textTransform: "capitalize",
                  }}
                >
                  {p.tipo_pago || "Efectivo"}
                </p>
              </div>

              {/* Mostrar siempre para debugging */}
              <div style={{ fontSize: "1.2rem" }}>📞</div>
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-dim)",
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  Cliente
                </p>
                {clienteTelefono ? (
                  <a
                    href={`tel:${clienteTelefono}`}
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "var(--accent)",
                      textDecoration: "none",
                      display: "block",
                    }}
                  >
                    {clienteNombre}
                    <br />
                    <span style={{ color: "#10b981" }}>{clienteTelefono}</span>
                  </a>
                ) : (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-dim)",
                      margin: 0,
                    }}
                  >
                    {clienteNombre || "Sin información"}
                    <br />
                    <span style={{ fontSize: "0.75rem", color: "red" }}>
                      Sin teléfono
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="route-visual">
              <div className="point">
                <p
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--text-main)",
                    marginBottom: 4,
                  }}
                >
                  🏪 {direccionRest}
                </p>

                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-dim)",
                    margin: 0,
                  }}
                >
                  {p.creado_en}
                </p>
              </div>
              <div className="point destination">
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-dim)",
                    margin: 0,
                  }}
                >
                  <strong>Estado:</strong>{" "}
                  <span
                    style={{
                      color:
                        p.estado === "en_camino"
                          ? "var(--success)"
                          : p.estado === "listo"
                            ? "var(--accent)"
                            : "var(--text-main)",
                      fontWeight: 600,
                    }}
                  >
                    {p.estado || "-"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              {p.notas_cliente && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    background: "var(--card-bg-secondary)",
                    borderRadius: 12,
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      margin: 0,
                    }}
                  >
                    <strong style={{ color: "var(--accent)" }}>💬 Nota:</strong>{" "}
                    {p.notas_cliente}
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
                    onClick={() => handleMarkDelivered(p.id, p.costo_envio)}
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
