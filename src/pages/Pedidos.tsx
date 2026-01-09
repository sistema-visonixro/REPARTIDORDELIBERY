import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

interface Pedido {
  pedido_id: string;
  numero_pedido: string;
  total: number;
  estado: string;
  restaurante_nombre: string;
  restaurante_emoji: string;
  tiene_repartidor: boolean;
  tracking_activo: boolean;
  repartidor_nombre: string | null;
  creado_en: string;
  total_items: number;
}

export default function Pedidos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPedidos();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel("mis-pedidos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `usuario_id=eq.${usuario?.id}`,
        },
        () => {
          cargarPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario?.id]);

  const cargarPedidos = async () => {
    if (!usuario?.id) return;

    try {
      const { data, error } = await supabase
        .from("vista_pedidos_cliente")
        .select("*")
        .eq("usuario_id", usuario.id)
        .order("creado_en", { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    const colores: Record<string, string> = {
      pendiente: "bg-yellow-100 text-yellow-800",
      confirmado: "bg-blue-100 text-blue-800",
      en_preparacion: "bg-purple-100 text-purple-800",
      listo: "bg-green-100 text-green-800",
      en_camino: "bg-indigo-100 text-indigo-800",
      entregado: "bg-gray-100 text-gray-800",
      cancelado: "bg-red-100 text-red-800",
    };
    return colores[estado] || "bg-gray-100 text-gray-800";
  };

  const obtenerTextoEstado = (estado: string) => {
    const textos: Record<string, string> = {
      pendiente: "⏳ Pendiente",
      confirmado: "✅ Confirmado",
      en_preparacion: "👨‍🍳 En Preparación",
      listo: "📦 Listo",
      en_camino: "🚚 En Camino",
      entregado: "✅ Entregado",
      cancelado: "❌ Cancelado",
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-4 pb-24">
        <h1 className="text-2xl font-bold mb-6">📦 Mis Pedidos</h1>

        {pedidos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              No tienes pedidos activos
            </p>
            <button
              onClick={() => navigate("/home")}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Hacer un Pedido
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div
                key={pedido.pedido_id}
                onClick={() => navigate(`/pedido/${pedido.pedido_id}`)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {pedido.restaurante_emoji} {pedido.restaurante_nombre}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Pedido #{pedido.numero_pedido}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-indigo-600">
                      ${pedido.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {pedido.total_items} item
                      {pedido.total_items > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Estado */}
                <div className="mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${obtenerColorEstado(
                      pedido.estado
                    )}`}
                  >
                    {obtenerTextoEstado(pedido.estado)}
                  </span>
                </div>

                {/* Info del repartidor */}
                {pedido.tiene_repartidor && pedido.repartidor_nombre && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-blue-800">
                      🚚 Repartidor: {pedido.repartidor_nombre}
                    </p>
                  </div>
                )}

                {/* Botón de tracking */}
                {pedido.tracking_activo && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-800">
                        📍 Tracking en vivo disponible
                      </p>
                      <span className="text-indigo-600 text-sm font-semibold">
                        Ver mapa →
                      </span>
                    </div>
                  </div>
                )}

                {/* Fecha */}
                <p className="text-xs text-gray-500">
                  {new Date(pedido.creado_en).toLocaleString("es-MX", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
