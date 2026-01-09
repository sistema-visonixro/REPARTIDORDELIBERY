import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerPedidosRestaurante,
  obtenerDetallePedido,
  actualizarEstadoPedido,
  suscribirsePedidosRestaurante,
} from "../../services/restaurante.service";
import type { PedidoRestaurante } from "../../types/restaurante.types";
import Header from "../../components/Header";
import {
  FaArrowLeft,
  FaClock,
  FaCheckCircle,
  FaUtensils,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
} from "react-icons/fa";

export default function PedidosRestaurante() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoRestaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoRestaurante | null>(null);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!usuario || usuario.tipo_usuario !== "restaurante") {
      navigate("/");
      return;
    }

    cargarPedidos();

    // Suscripción en tiempo real
    const unsubscribe = suscribirsePedidosRestaurante(usuario.id, (nuevosPedidos: PedidoRestaurante[]) => {
      setPedidos(nuevosPedidos);
    });

    return () => {
      unsubscribe();
    };
  }, [usuario, navigate]);

  const cargarPedidos = async () => {
    if (!usuario) return;

    setLoading(true);
    const data = await obtenerPedidosRestaurante(usuario.id);
    setPedidos(data);
    setLoading(false);
  };

  const abrirDetalle = async (pedido: PedidoRestaurante) => {
    setPedidoSeleccionado(pedido);
    setMostrarModal(true);

    const detallesData = await obtenerDetallePedido(pedido.id);
    setDetalles(detallesData);
  };

  const cambiarEstado = async (pedidoId: string, nuevoEstado: string) => {
    setProcesando(true);

    const exito = await actualizarEstadoPedido(pedidoId, nuevoEstado);

    if (exito) {
      await cargarPedidos();
      setMostrarModal(false);
    }

    setProcesando(false);
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtroEstado === "todos") return true;
    if (filtroEstado === "activos") {
      return ["pendiente", "confirmado", "en_preparacion", "listo"].includes(pedido.estado);
    }
    return pedido.estado === filtroEstado;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "confirmado":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "en_preparacion":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "listo":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "en_camino":
        return "bg-indigo-100 text-indigo-700 border-indigo-300";
      case "entregado":
        return "bg-green-100 text-green-700 border-green-300";
      case "cancelado":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "⏳ Pendiente";
      case "confirmado":
        return "✓ Confirmado";
      case "en_preparacion":
        return "👨‍🍳 En Preparación";
      case "listo":
        return "✅ Listo";
      case "en_camino":
        return "🚚 En Camino";
      case "entregado":
        return "🎉 Entregado";
      case "cancelado":
        return "❌ Cancelado";
      default:
        return estado;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 pb-20">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/restaurante/dashboard")}
              className="mr-4 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition"
            >
              <FaArrowLeft className="text-orange-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Pedidos del Restaurante</h1>
              <p className="text-gray-600">{pedidosFiltrados.length} pedidos</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroEstado("todos")}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                filtroEstado === "todos"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos ({pedidos.length})
            </button>
            <button
              onClick={() => setFiltroEstado("activos")}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                filtroEstado === "activos"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Activos (
              {
                pedidos.filter((p) =>
                  ["pendiente", "confirmado", "en_preparacion", "listo"].includes(p.estado)
                ).length
              }
              )
            </button>
            <button
              onClick={() => setFiltroEstado("pendiente")}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                filtroEstado === "pendiente"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pendientes ({pedidos.filter((p) => p.estado === "pendiente").length})
            </button>
            <button
              onClick={() => setFiltroEstado("en_preparacion")}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                filtroEstado === "en_preparacion"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              En Preparación ({pedidos.filter((p) => p.estado === "en_preparacion").length})
            </button>
            <button
              onClick={() => setFiltroEstado("listo")}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                filtroEstado === "listo"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Listos ({pedidos.filter((p) => p.estado === "listo").length})
            </button>
          </div>
        </div>

        {/* Lista de Pedidos */}
        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaUtensils className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay pedidos</h3>
            <p className="text-gray-600">No se encontraron pedidos con este filtro</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidosFiltrados.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                onClick={() => abrirDetalle(pedido)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{pedido.numero_pedido}</h3>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <FaClock className="mr-2" />
                      {new Date(pedido.creado_en).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getEstadoColor(
                      pedido.estado
                    )}`}
                  >
                    {getEstadoTexto(pedido.estado)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-gray-700">
                    <FaUser className="mr-3 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500">Cliente</p>
                      <p className="font-semibold">{pedido.cliente_nombre || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <FaPhone className="mr-3 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-semibold">{pedido.cliente_telefono || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start text-gray-700 mb-4">
                  <FaMapMarkerAlt className="mr-3 text-red-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Dirección de entrega</p>
                    <p className="font-semibold">{pedido.direccion_entrega}</p>
                  </div>
                </div>

                {pedido.notas_cliente && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Notas del cliente:</span> {pedido.notas_cliente}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-3xl font-bold text-orange-600">${pedido.total.toFixed(2)}</span>

                  {/* Acciones rápidas */}
                  {pedido.estado === "pendiente" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstado(pedido.id, "confirmado");
                      }}
                      className="bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-600 transition"
                    >
                      <FaCheckCircle className="inline mr-2" />
                      Confirmar
                    </button>
                  )}

                  {pedido.estado === "confirmado" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstado(pedido.id, "en_preparacion");
                      }}
                      className="bg-orange-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-orange-600 transition"
                    >
                      <FaUtensils className="inline mr-2" />
                      Iniciar Preparación
                    </button>
                  )}

                  {pedido.estado === "en_preparacion" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstado(pedido.id, "listo");
                      }}
                      className="bg-purple-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-purple-600 transition"
                    >
                      <FaCheckCircle className="inline mr-2" />
                      Marcar como Listo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Detalle */}
        {mostrarModal && pedidoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Detalle del Pedido
                </h2>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Info del pedido */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-lg mb-2">{pedidoSeleccionado.numero_pedido}</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">Cliente:</span> {pedidoSeleccionado.cliente_nombre}
                    </p>
                    <p>
                      <span className="font-semibold">Teléfono:</span> {pedidoSeleccionado.cliente_telefono}
                    </p>
                    <p>
                      <span className="font-semibold">Dirección:</span>{" "}
                      {pedidoSeleccionado.direccion_entrega}
                    </p>
                    <p>
                      <span className="font-semibold">Estado:</span>{" "}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(
                          pedidoSeleccionado.estado
                        )}`}
                      >
                        {getEstadoTexto(pedidoSeleccionado.estado)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Detalles del pedido */}
                <div>
                  <h3 className="font-bold text-lg mb-3">Productos</h3>
                  <div className="space-y-2">
                    {detalles.map((detalle) => (
                      <div
                        key={detalle.id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-xl"
                      >
                        <div>
                          <p className="font-semibold">
                            {detalle.platillo_nombre || detalle.bebida_nombre}
                          </p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {detalle.cantidad} × ${detalle.precio_unitario.toFixed(2)}
                          </p>
                          {detalle.notas && (
                            <p className="text-xs text-gray-500 mt-1">Nota: {detalle.notas}</p>
                          )}
                        </div>
                        <span className="font-bold text-orange-600">
                          ${detalle.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-800">Total</span>
                    <span className="text-3xl font-bold text-orange-600">
                      ${pedidoSeleccionado.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="space-y-2 pt-4">
                  {pedidoSeleccionado.estado === "pendiente" && (
                    <button
                      onClick={() => cambiarEstado(pedidoSeleccionado.id, "confirmado")}
                      disabled={procesando}
                      className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      {procesando ? "Procesando..." : "Confirmar Pedido"}
                    </button>
                  )}

                  {pedidoSeleccionado.estado === "confirmado" && (
                    <button
                      onClick={() => cambiarEstado(pedidoSeleccionado.id, "en_preparacion")}
                      disabled={procesando}
                      className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
                    >
                      {procesando ? "Procesando..." : "Iniciar Preparación"}
                    </button>
                  )}

                  {pedidoSeleccionado.estado === "en_preparacion" && (
                    <button
                      onClick={() => cambiarEstado(pedidoSeleccionado.id, "listo")}
                      disabled={procesando}
                      className="w-full bg-purple-500 text-white font-bold py-3 rounded-xl hover:bg-purple-600 transition disabled:opacity-50"
                    >
                      {procesando ? "Procesando..." : "Marcar como Listo"}
                    </button>
                  )}

                  <button
                    onClick={() => setMostrarModal(false)}
                    className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300 transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
