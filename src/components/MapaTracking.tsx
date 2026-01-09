import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../lib/supabase";
import type { UbicacionTracking } from "../types/repartidor.types";

// Fix para los iconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Iconos personalizados
const iconoRepartidor = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconoCliente = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapaTrackingProps {
  pedidoId: string;
  clienteLat: number;
  clienteLng: number;
}

// Componente para centrar el mapa
function CentrarMapa({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);

  return null;
}

export default function MapaTracking({
  pedidoId,
  clienteLat,
  clienteLng,
}: MapaTrackingProps) {
  const [ubicacion, setUbicacion] = useState<UbicacionTracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUbicacion();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`tracking-${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ubicaciones_repartidor",
          filter: `pedido_id=eq.${pedidoId}`,
        },
        () => {
          cargarUbicacion();
        }
      )
      .subscribe();

    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      cargarUbicacion();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [pedidoId]);

  const cargarUbicacion = async () => {
    try {
      const { data, error } = await supabase
        .from("vista_ubicacion_actual_pedido")
        .select("*")
        .eq("pedido_id", pedidoId)
        .single();

      if (error) throw error;
      setUbicacion(data as UbicacionTracking);
    } catch (error) {
      console.error("Error al cargar ubicación:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Cargando mapa...</p>
      </div>
    );
  }

  // Calcular centro del mapa (punto medio entre repartidor y cliente)
  const centerLat = ubicacion
    ? (ubicacion.repartidor_latitud + clienteLat) / 2
    : clienteLat;
  const centerLng = ubicacion
    ? (ubicacion.repartidor_longitud + clienteLng) / 2
    : clienteLng;

  return (
    <div className="space-y-4">
      {/* Información de tracking */}
      {ubicacion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Última actualización:</p>
              <p className="font-medium">
                {Math.floor(ubicacion.segundos_desde_actualizacion / 60)}{" "}
                minutos atrás
              </p>
            </div>
            {ubicacion.velocidad && (
              <div>
                <p className="text-sm text-gray-600">Velocidad:</p>
                <p className="font-medium">
                  {ubicacion.velocidad.toFixed(1)} km/h
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="h-96 rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marcador del Cliente */}
          <Marker position={[clienteLat, clienteLng]} icon={iconoCliente}>
            <Popup>
              <div className="text-center">
                <p className="font-bold">🏠 Cliente</p>
                <p className="text-sm">Destino de entrega</p>
              </div>
            </Popup>
          </Marker>

          {/* Marcador del Repartidor */}
          {ubicacion && (
            <Marker
              position={[
                ubicacion.repartidor_latitud,
                ubicacion.repartidor_longitud,
              ]}
              icon={iconoRepartidor}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold">🚚 Repartidor</p>
                  <p className="text-sm">{ubicacion.repartidor_nombre}</p>
                  <p className="text-sm text-gray-600">
                    {ubicacion.tipo_vehiculo}
                  </p>
                  {ubicacion.velocidad && (
                    <p className="text-sm">
                      {ubicacion.velocidad.toFixed(1)} km/h
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          <CentrarMapa lat={centerLat} lng={centerLng} />
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="flex justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
          <span>Repartidor</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-600 rounded-full"></div>
          <span>Cliente (Destino)</span>
        </div>
      </div>

      {!ubicacion && (
        <div className="text-center text-gray-500 text-sm">
          El repartidor aún no ha iniciado el tracking GPS
        </div>
      )}
    </div>
  );
}
