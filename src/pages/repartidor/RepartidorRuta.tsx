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

        // obtener ubicacion del cliente desde tabla ubicacion_real si existe
        if (pedido.usuario_id) {
          const { data: udata, error: uerr } = await supabase
            .from("ubicacion_real")
            .select("latitud, longitud")
            .eq("usuario_id", pedido.usuario_id)
            .single();

          if (!uerr && udata) {
            setClienteLat(Number(udata.latitud));
            setClienteLng(Number(udata.longitud));
          } else {
            setClienteLat(pedido.latitud || null);
            setClienteLng(pedido.longitud || null);
          }
        } else {
          setClienteLat(pedido.latitud || null);
          setClienteLng(pedido.longitud || null);
        }

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
  }, [id]);

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
