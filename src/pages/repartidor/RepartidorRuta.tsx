import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MapaRutaProfesional from "../../components/MapaRutaProfesional";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import "./driver.css";

export default function RepartidorRuta() {
  const { id } = useParams();
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
      <h3 style={{ marginBottom: 8 }}>Ruta del Pedido</h3>
      <MapaRutaProfesional
        clienteLat={clienteLat}
        clienteLng={clienteLng}
        restauranteLat={restLat ?? undefined}
        restauranteLng={restLng ?? undefined}
        repartidorId={usuario?.id ?? null}
      />
    </div>
  );
}
