import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerPlatillosPorRestaurante,
  crearPlatillo,
  actualizarPlatillo,
  eliminarPlatillo,
} from "../../services/restaurante.service";
import type { Platillo } from "../../types/restaurante.types";
import Header from "../../components/Header";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaUtensils,
} from "react-icons/fa";

export default function GestionPlatillos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [platilloEditando, setPlatilloEditando] = useState<Platillo | null>(null);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [tiempoPreparacion, setTiempoPreparacion] = useState("15");
  const [disponible, setDisponible] = useState(true);
  const [esVegetariano, setEsVegetariano] = useState(false);
  const [esPicante, setEsPicante] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!usuario || usuario.tipo_usuario !== "restaurante") {
      navigate("/");
      return;
    }

    cargarPlatillos();
  }, [usuario, navigate]);

  const cargarPlatillos = async () => {
    if (!usuario) return;

    setLoading(true);
    const data = await obtenerPlatillosPorRestaurante(usuario.id);
    setPlatillos(data);
    setLoading(false);
  };

  const abrirModalNuevo = () => {
    setPlatilloEditando(null);
    resetFormulario();
    setMostrarModal(true);
  };

  const abrirModalEditar = (platillo: Platillo) => {
    setPlatilloEditando(platillo);
    setNombre(platillo.nombre);
    setDescripcion(platillo.descripcion || "");
    setPrecio(platillo.precio.toString());
    setImagenUrl(platillo.imagen_url || "");
    setTiempoPreparacion(platillo.tiempo_preparacion.toString());
    setDisponible(platillo.disponible);
    setEsVegetariano(platillo.es_vegetariano);
    setEsPicante(platillo.es_picante);
    setMostrarModal(true);
  };

  const resetFormulario = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setImagenUrl("");
    setTiempoPreparacion("15");
    setDisponible(true);
    setEsVegetariano(false);
    setEsPicante(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    setGuardando(true);

    try {
      const datos = {
        restaurante_id: usuario.id,
        nombre,
        descripcion: descripcion || undefined,
        precio: parseFloat(precio),
        imagen_url: imagenUrl || undefined,
        tiempo_preparacion: parseInt(tiempoPreparacion),
        disponible,
        es_vegetariano: esVegetariano,
        es_picante: esPicante,
      };

      if (platilloEditando) {
        // Actualizar
        const resultado = await actualizarPlatillo(platilloEditando.id, datos);
        if (resultado) {
          await cargarPlatillos();
          setMostrarModal(false);
        }
      } else {
        // Crear
        const resultado = await crearPlatillo(datos);
        if (resultado) {
          await cargarPlatillos();
          setMostrarModal(false);
        }
      }
    } catch (error) {
      console.error("Error al guardar platillo:", error);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este platillo?")) return;

    const resultado = await eliminarPlatillo(id);
    if (resultado) {
      await cargarPlatillos();
    }
  };

  const toggleDisponibilidad = async (platillo: Platillo) => {
    const resultado = await actualizarPlatillo(platillo.id, {
      disponible: !platillo.disponible,
    });

    if (resultado) {
      await cargarPlatillos();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando platillos...</p>
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
              <h1 className="text-3xl font-bold text-gray-800">Gestión de Platillos</h1>
              <p className="text-gray-600">{platillos.length} platillos en total</p>
            </div>
          </div>

          <button
            onClick={abrirModalNuevo}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-700 transition flex items-center shadow-lg"
          >
            <FaPlus className="mr-2" />
            Nuevo Platillo
          </button>
        </div>

        {/* Lista de Platillos */}
        {platillos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaUtensils className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay platillos</h3>
            <p className="text-gray-600 mb-6">Comienza agregando platillos a tu menú</p>
            <button
              onClick={abrirModalNuevo}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
            >
              Agregar Primer Platillo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platillos.map((platillo) => (
              <div
                key={platillo.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                {/* Imagen */}
                <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100">
                  {platillo.imagen_url ? (
                    <img
                      src={platillo.imagen_url}
                      alt={platillo.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FaUtensils className="text-6xl text-orange-300" />
                    </div>
                  )}

                  {/* Badge disponibilidad */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => toggleDisponibilidad(platillo)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        platillo.disponible
                          ? "bg-green-500 text-white"
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {platillo.disponible ? <FaEye className="inline mr-1" /> : <FaEyeSlash className="inline mr-1" />}
                      {platillo.disponible ? "Disponible" : "No disponible"}
                    </button>
                  </div>

                  {/* Badges características */}
                  <div className="absolute bottom-3 left-3 flex space-x-2">
                    {platillo.es_vegetariano && (
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        🌱 Vegetariano
                      </span>
                    )}
                    {platillo.es_picante && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        🌶️ Picante
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{platillo.nombre}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {platillo.descripcion || "Sin descripción"}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-orange-600">
                      ${platillo.precio.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ⏱️ {platillo.tiempo_preparacion} min
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => abrirModalEditar(platillo)}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center justify-center"
                    >
                      <FaEdit className="mr-2" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(platillo.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {platilloEditando ? "Editar Platillo" : "Nuevo Platillo"}
                </h2>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="Ej: Tacos al Pastor"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="Describe el platillo..."
                  />
                </div>

                {/* Precio y Tiempo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio ($) *
                    </label>
                    <input
                      type="number"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tiempo Preparación (min)
                    </label>
                    <input
                      type="number"
                      value={tiempoPreparacion}
                      onChange={(e) => setTiempoPreparacion(e.target.value)}
                      min="5"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Imagen URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL de la Imagen
                  </label>
                  <input
                    type="url"
                    value={imagenUrl}
                    onChange={(e) => setImagenUrl(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                {/* Características */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <label className="font-semibold text-gray-700">Disponible</label>
                    <button
                      type="button"
                      onClick={() => setDisponible(!disponible)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition ${
                        disponible ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                          disponible ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <label className="font-semibold text-gray-700">🌱 Vegetariano</label>
                    <button
                      type="button"
                      onClick={() => setEsVegetariano(!esVegetariano)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition ${
                        esVegetariano ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                          esVegetariano ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <label className="font-semibold text-gray-700">🌶️ Picante</label>
                    <button
                      type="button"
                      onClick={() => setEsPicante(!esPicante)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition ${
                        esPicante ? "bg-red-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                          esPicante ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {guardando ? "Guardando..." : platilloEditando ? "Actualizar" : "Crear"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
