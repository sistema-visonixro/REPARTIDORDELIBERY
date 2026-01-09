import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

interface ItemCarrito {
  id: string;
  platillo_id: string;
  cantidad: number;
  precio_unitario: number;
  notas: string | null;
  platillo_nombre: string;
  platillo_descripcion: string;
  platillo_imagen: string;
  restaurante_nombre: string;
  restaurante_emoji: string;
  subtotal: number;
}

interface ResumenCarrito {
  restaurante_nombre: string;
  restaurante_emoji: string;
  total_items: number;
  cantidad_total: number;
  total_carrito: number;
  un_solo_restaurante: boolean;
}

export default function Carrito() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [resumen, setResumen] = useState<ResumenCarrito | null>(null);
  const [loading, setLoading] = useState(true);
  const [creandoPedido, setCreandoPedido] = useState(false);

  // Formulario de pedido
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    cargarCarrito();
  }, []);

  const cargarCarrito = async () => {
    if (!usuario?.id) return;

    try {
      // Cargar items del carrito
      const { data: itemsData, error: itemsError } = await supabase
        .from("vista_carrito")
        .select("*")
        .eq("usuario_id", usuario.id);

      if (itemsError) throw itemsError;

      // Cargar resumen
      const { data: resumenData, error: resumenError } = await supabase
        .from("vista_resumen_carrito")
        .select("*")
        .eq("usuario_id", usuario.id)
        .single();

      if (resumenError && resumenError.code !== "PGRST116") throw resumenError;

      setItems(itemsData || []);
      setResumen(resumenData);
    } catch (error) {
      console.error("Error al cargar carrito:", error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarCantidad = async (itemId: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;

    try {
      const { error } = await supabase
        .from("carrito")
        .update({ cantidad: nuevaCantidad })
        .eq("id", itemId);

      if (error) throw error;
      await cargarCarrito();
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  const eliminarItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("carrito")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      await cargarCarrito();
    } catch (error) {
      console.error("Error al eliminar item:", error);
    }
  };

  const vaciarCarrito = async () => {
    if (!usuario?.id) return;

    const confirmar = window.confirm("¿Seguro que quieres vaciar el carrito?");
    if (!confirmar) return;

    try {
      const { error } = await supabase.rpc("limpiar_carrito_usuario", {
        p_usuario_id: usuario.id,
      });

      if (error) throw error;
      await cargarCarrito();
    } catch (error) {
      console.error("Error al vaciar carrito:", error);
    }
  };

  const crearPedido = async () => {
    if (!usuario?.id || !direccion.trim()) {
      alert("Por favor ingresa la dirección de entrega");
      return;
    }

    setCreandoPedido(true);
    try {
      // Obtener coordenadas (por ahora usamos coordenadas dummy, puedes integrar geolocalización)
      const { error } = await supabase.rpc("crear_pedido_desde_carrito", {
        p_usuario_id: usuario.id,
        p_direccion_entrega: direccion,
        p_latitud: 19.4326, // Coordenadas de ejemplo
        p_longitud: -99.1332,
        p_notas_cliente: notas || null,
      });

      if (error) throw error;

      alert("¡Pedido creado exitosamente! 🎉");
      navigate("/pedidos");
    } catch (error: any) {
      console.error("Error al crear pedido:", error);
      alert(error.message || "Error al crear el pedido");
    } finally {
      setCreandoPedido(false);
    }
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto p-4 pb-24">
          <h1 className="text-2xl font-bold mb-6">🛒 Mi Carrito</h1>
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">Tu carrito está vacío</p>
            <button
              onClick={() => navigate("/home")}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Explorar Restaurantes
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-4 pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🛒 Mi Carrito</h1>
          <button
            onClick={vaciarCarrito}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Vaciar carrito
          </button>
        </div>

        {/* Resumen del restaurante */}
        {resumen && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">
              {resumen.restaurante_emoji} {resumen.restaurante_nombre}
            </h2>
            <p className="text-sm text-gray-600">
              {resumen.total_items} producto{resumen.total_items > 1 ? "s" : ""}{" "}
              · {resumen.cantidad_total} item
              {resumen.cantidad_total > 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Items del carrito */}
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex space-x-4">
                {item.platillo_imagen && (
                  <img
                    src={item.platillo_imagen}
                    alt={item.platillo_nombre}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{item.platillo_nombre}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    ${item.precio_unitario.toFixed(2)}
                  </p>
                  {item.notas && (
                    <p className="text-sm text-gray-500 italic mb-2">
                      Nota: {item.notas}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          actualizarCantidad(item.id, item.cantidad - 1)
                        }
                        disabled={item.cantidad <= 1}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          actualizarCantidad(item.id, item.cantidad + 1)
                        }
                        className="w-8 h-8 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center space-x-4">
                      <p className="font-bold text-indigo-600">
                        ${item.subtotal.toFixed(2)}
                      </p>
                      <button
                        onClick={() => eliminarItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Formulario de pedido */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📍 Datos de Entrega</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Dirección de entrega *
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle, número, colonia..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Indicaciones, referencias, etc."
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Total y botón */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold">Total:</span>
            <span className="text-2xl font-bold text-indigo-600">
              ${resumen?.total_carrito.toFixed(2)}
            </span>
          </div>

          <button
            onClick={crearPedido}
            disabled={creandoPedido || !direccion.trim()}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg"
          >
            {creandoPedido ? "⏳ Creando pedido..." : "🚀 Realizar Pedido"}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
