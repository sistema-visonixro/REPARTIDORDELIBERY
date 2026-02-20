import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MapaGoogle3DPro from "../../components/MapaGoogle3DPro";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { FaArrowLeft } from "react-icons/fa";
import "./driver.css";

export default function RepartidorRuta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clienteLat, setClienteLat] = useState<number | null>(null);
  const [clienteLng, setClienteLng] = useState<number | null>(null);
  const [restLat, setRestLat] = useState<number | null>(null);
  const [restLng, setRestLng] = useState<number | null>(null);
  const [clienteUsuarioId, setClienteUsuarioId] = useState<string | null>(null);

  const { usuario } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Try to fetch pedido with restaurant coords if available
        const { data, error } = await supabase
          .from("pedidos")
          .select("*, restaurantes(nombre, direccion, latitud, longitud)")
          .eq("id", id)
          .single();

        if (error) throw error;

        const pedido: any = data;

        const pedidoLat = Number(pedido.latitud);
        const pedidoLng = Number(pedido.longitud);
        const pedidoCoordsValid =
          Number.isFinite(pedidoLat) && Number.isFinite(pedidoLng);

        let clienteCoords: { lat: number; lng: number } | null = null;
        const pedidoClienteUsuarioId = pedido.usuario_id as string | null;
        setClienteUsuarioId(pedidoClienteUsuarioId);

        // 0) Fuente primaria: vista de ubicación actual por pedido (si está disponible)
        const { data: vistaActual } = await supabase
          .from("vista_ubicacion_actual_pedido")
          .select("cliente_latitud, cliente_longitud")
          .eq("pedido_id", id)
          .maybeSingle();

        if (vistaActual) {
          const lat = Number((vistaActual as any).cliente_latitud);
          const lng = Number((vistaActual as any).cliente_longitud);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            clienteCoords = { lat, lng };
          }
        }

        // 1) Tomar ubicación en vivo del cliente si existe
        if (!clienteCoords && pedidoClienteUsuarioId) {
          const { data: udata, error: uerr } = await supabase
            .from("ubicacion_real")
            .select("latitud, longitud")
            .eq("usuario_id", pedidoClienteUsuarioId)
            .maybeSingle();

          if (!uerr && udata) {
            const lat = Number(udata.latitud);
            const lng = Number(udata.longitud);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              clienteCoords = { lat, lng };
            }
          }
        }

        // 2) Fallback final: coordenadas guardadas en pedido
        if (!clienteCoords && pedidoCoordsValid) {
          clienteCoords = { lat: pedidoLat, lng: pedidoLng };
        }

        setClienteLat(clienteCoords?.lat ?? null);
        setClienteLng(clienteCoords?.lng ?? null);

        const rest = pedido.restaurantes;
        if (rest && rest.latitud && rest.longitud) {
          setRestLat(Number(rest.latitud));
          setRestLng(Number(rest.longitud));
        }
      } catch (err: any) {
        console.error("Error cargando datos de ruta:", err);
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, usuario?.id]);

  useEffect(() => {
    if (!clienteUsuarioId) return;

    const actualizarCliente = async () => {
      const { data } = await supabase
        .from("ubicacion_real")
        .select("latitud, longitud")
        .eq("usuario_id", clienteUsuarioId)
        .maybeSingle();

      if (!data) return;

      const lat = Number(data.latitud);
      const lng = Number(data.longitud);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setClienteLat(lat);
        setClienteLng(lng);
      }
    };

    const channel = supabase
      .channel(`tracking-cliente-${clienteUsuarioId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ubicacion_real",
          filter: `usuario_id=eq.${clienteUsuarioId}`,
        },
        (payload: any) => {
          const nuevo = payload?.new;
          if (!nuevo) return;
          const lat = Number(nuevo.latitud);
          const lng = Number(nuevo.longitud);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setClienteLat(lat);
            setClienteLng(lng);
          }
        },
      )
      .subscribe();

    const interval = window.setInterval(actualizarCliente, 5_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [clienteUsuarioId]);

  if (loading) return <div className="order-item">Cargando ruta...</div>;
  if (error) return <div className="order-item">Error: {error}</div>;
  if (clienteLat == null || clienteLng == null)
    return (
      <div className="order-item">
        No hay coordenadas del cliente disponibles
      </div>
    );

  return (
    <div className="mobile-viewport">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => navigate("/repartidor/pedidos")}
          className="btn-back"
          style={{
            background: "var(--gradient)",
            border: "none",
            borderRadius: "12px",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
            fontSize: "18px",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow =
              "0 6px 16px rgba(37, 99, 235, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(37, 99, 235, 0.3)";
          }}
        >
          <FaArrowLeft />
        </button>
        <h3 style={{ margin: 0, flex: 1 }}>Ruta del Pedido</h3>
      </div>
      <MapaGoogle3DPro
        clienteLat={clienteLat}
        clienteLng={clienteLng}
        restauranteLat={restLat ?? undefined}
        restauranteLng={restLng ?? undefined}
        repartidorId={usuario?.id ?? null}
      />
    </div>
  );
}
