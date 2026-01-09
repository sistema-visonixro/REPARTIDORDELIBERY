import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import MapaTracking from "../components/MapaTracking";

interface DetallePedido {
  pedido_id: string;
  numero_pedido: string;
  total: number;
  estado: string;
  direccion_entrega: string;
  latitud: number;
  longitud: number;
  notas_cliente: string | null;
  creado_en: string;
  confirmado_en: string | null;
  asignado_en: string | null;
  entregado_en: string | null;
  restaurante_nombre: string;
  restaurante_emoji: string;
  repartidor_nombre: string | null;
  repartidor_telefono: string | null;
  repartidor_foto: string | null;
  repartidor_vehiculo: string | null;
  tiene_repartidor: boolean;
  tracking_activo: boolean;
  total_items: number;
}

interface ItemPedido {
  detalle_id: string;
  platillo_nombre: string;
  platillo_descripcion: string;
  platillo_imagen: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas_platillo: string | null;
}

export default function DetallePedidoCliente() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState<DetallePedido | null>(null);
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario || !pedidoId) {
      navigate("/login");
      return;
    }

    cargarPedido();

    // Suscribirse a cambios en el pedido
    const channel = supabase
      .channel(`pedido-${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `id=eq.${pedidoId}`,
        },
        () => {
          cargarPedido();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pedidoId, usuario]);

  const cargarPedido = async () => {
    if (!pedidoId) return;

    try {
      // Cargar información del pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("vista_pedidos_cliente")
        .select("*")
        .eq("pedido_id", pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      // Cargar items del pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from("vista_detalle_pedido_completo")
        .select("*")
        .eq("pedido_id", pedidoId);

      if (itemsError) throw itemsError;

      setPedido(pedidoData as DetallePedido);
      setItems(itemsData as ItemPedido[]);
    } catch (error) {
      console.error("Error al cargar pedido:", error);
      alert("Error al cargar el pedido");
    } finally {
      setLoading(false);
    }
  };

  const obtenerEstadoColor = (estado: string) => {
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
      pendiente: "⏳ Esperando confirmación",
      confirmado: "✅ Confirmado por el restaurante",
      en_preparacion: "👨‍🍳 Preparando tu pedido",
      listo: "📦 Listo para entrega",
      en_camino: "🚚 En camino a tu ubicación",
      entregado: "✅ Entregado",
      cancelado: "❌ Cancelado",
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Pedido no encontrado</p>
        <button
          onClick={() => navigate("/pedidos")}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Volver a mis pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Pedido #{pedido.numero_pedido}
            </h1>
            <p className="text-gray-600">
              {pedido.restaurante_emoji} {pedido.restaurante_nombre}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo-600">
              ${pedido.total.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">{pedido.total_items} items</p>
          </div>
        </div>

        {/* Estado del pedido */}
        <div
          className={`px-4 py-3 rounded-lg ${obtenerEstadoColor(
            pedido.estado
          )}`}
        >
          <p className="text-center font-semibold text-lg">
            {obtenerTextoEstado(pedido.estado)}
          </p>
        </div>

        {/* Timeline del pedido */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
              ✓
            </div>
            <div>
              <p className="font-medium">Pedido realizado</p>
              <p className="text-sm text-gray-500">
                {new Date(pedido.creado_en).toLocaleString("es-MX")}
              </p>
            </div>
          </div>

          {pedido.confirmado_en && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                ✓
              </div>
              <div>
                <p className="font-medium">Confirmado</p>
                <p className="text-sm text-gray-500">
                  {new Date(pedido.confirmado_en).toLocaleString("es-MX")}
                </p>
              </div>
            </div>
          )}

          {pedido.asignado_en && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                ✓
              </div>
              <div>
                <p className="font-medium">Repartidor asignado</p>
                <p className="text-sm text-gray-500">
                  {new Date(pedido.asignado_en).toLocaleString("es-MX")}
                </p>
              </div>
            </div>
          )}

          {pedido.entregado_en && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                ✓
              </div>
              <div>
                <p className="font-medium">Entregado</p>
                <p className="text-sm text-gray-500">
                  {new Date(pedido.entregado_en).toLocaleString("es-MX")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información del repartidor */}
      {pedido.tiene_repartidor && pedido.repartidor_nombre && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">🚚 Tu Repartidor</h2>
          <div className="flex items-center space-x-4">
            {pedido.repartidor_foto ? (
              <img
                src={pedido.repartidor_foto}
                alt={pedido.repartidor_nombre}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
                👤
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-lg">
                {pedido.repartidor_nombre}
              </p>
              {pedido.repartidor_vehiculo && (
                <p className="text-gray-600 capitalize">
                  {pedido.repartidor_vehiculo}
                </p>
              )}
              {pedido.repartidor_telefono && (
                <a
                  href={`tel:${pedido.repartidor_telefono}`}
                  className="text-indigo-600 hover:underline text-sm"
                >
                  📞 {pedido.repartidor_telefono}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mapa de tracking */}
      {pedido.tracking_activo && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">
            🗺️ Ubicación en Tiempo Real
          </h2>
          <MapaTracking
            pedidoId={pedidoId!}
            clienteLat={pedido.latitud}
            clienteLng={pedido.longitud}
          />
        </div>
      )}

      {/* Dirección de entrega */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h2 className="text-lg font-semibold mb-3">📍 Dirección de Entrega</h2>
        <p className="text-gray-900">{pedido.direccion_entrega}</p>
        {pedido.notas_cliente && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-1">
              💬 Notas de entrega:
            </p>
            <p className="text-gray-700">{pedido.notas_cliente}</p>
          </div>
        )}
      </div>

      {/* Items del pedido */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h2 className="text-lg font-semibold mb-4">📦 Items del Pedido</h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.detalle_id}
              className="flex space-x-4 border-b pb-4 last:border-b-0"
            >
              {item.platillo_imagen && (
                <img
                  src={item.platillo_imagen}
                  alt={item.platillo_nombre}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-semibold">{item.platillo_nombre}</h3>
                  <p className="font-bold text-indigo-600">
                    ${item.subtotal.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {item.platillo_descripcion}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Cantidad: {item.cantidad} × $
                    {item.precio_unitario.toFixed(2)}
                  </p>
                </div>
                {item.notas_platillo && (
                  <p className="text-sm text-gray-600 italic mt-1">
                    Nota: {item.notas_platillo}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total:</span>
            <span className="text-indigo-600">${pedido.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Botón de volver */}
      <button
        onClick={() => navigate("/pedidos")}
        className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
      >
        ← Volver a Mis Pedidos
      </button>
    </div>
  );
}
