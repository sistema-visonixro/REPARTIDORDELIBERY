import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from "react-leaflet";
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
  restauranteLat?: number | null;
  restauranteLng?: number | null;
  repartidorId?: string | null;
  showMarkers?: boolean;
  useGoogleIframe?: boolean;
}

// Componente para centrar el mapa
function CentrarMapa({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);

  return null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;
    try {
      map.fitBounds(points as any, { padding: [50, 50] });
    } catch (err) {
      // ignore
    }
  }, [points, map]);

  return null;
}

export default function MapaTracking({
  pedidoId,
  clienteLat,
  clienteLng,
  restauranteLat,
  restauranteLng,
  repartidorId,
  showMarkers = true,
  useGoogleIframe = false,
}: MapaTrackingProps) {
  const [ubicacion, setUbicacion] = useState<UbicacionTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [tilesError, setTilesError] = useState(0);
  const [tileUrl, setTileUrl] = useState(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  );

  useEffect(() => {
    if (tilesError > 3) {
      console.warn("Varias fallas al cargar tiles — cambiando a CartoDB");
      setTileUrl(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      );
      setTilesError(0);
    }
  }, [tilesError]);

  useEffect(() => {
    const cargarUbicacion = async () => {
      try {
        if (!repartidorId) return;
        const { data, error } = await supabase
          .from("ubicacion_real")
          .select(
            "usuario_id, latitud, longitud, velocidad, precision_metros, heading, actualizado_en"
          )
          .eq("usuario_id", repartidorId)
          .single();

        if (error) {
          // no lanzar, solo limpiar
          setUbicacion(null);
          return;
        }

        const now = new Date();
        const actualizado = data.actualizado_en
          ? new Date(data.actualizado_en)
          : now;
        const segundos = Math.floor(
          (now.getTime() - actualizado.getTime()) / 1000
        );

        const u: any = {
          pedido_id: pedidoId,
          repartidor_id: data.usuario_id,
          repartidor_latitud: Number(data.latitud),
          repartidor_longitud: Number(data.longitud),
          velocidad: data.velocidad ?? null,
          ultima_actualizacion: data.actualizado_en,
          tipo_vehiculo: null,
          repartidor_nombre: null,
          segundos_desde_actualizacion: segundos,
          cliente_latitud: clienteLat,
          cliente_longitud: clienteLng,
          direccion_entrega: undefined,
        };

        setUbicacion(u as UbicacionTracking);
      } catch (err) {
        console.error("Error al cargar ubicación (repartidor):", err);
      } finally {
        setLoading(false);
      }
    };

    cargarUbicacion();

    // Suscribirse a cambios en ubicacion_real para el repartidor
    if (repartidorId) {
      const channel = supabase
        .channel(`tracking-repartidor-${repartidorId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "ubicacion_real",
            filter: `usuario_id=eq.${repartidorId}`,
          },
          () => {
            cargarUbicacion();
          }
        )
        .subscribe();

      const interval = setInterval(() => cargarUbicacion(), 30000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [pedidoId, repartidorId, clienteLat, clienteLng]);

  if (loading) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
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
      {/* Información de tracking (opcional) */}
      {showMarkers && ubicacion && (
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
      <div className="h-[600px] rounded-lg overflow-hidden shadow-lg relative">
        {useGoogleIframe ? (
          // Mostrar iframe simple de Google Maps (sin API key)
          <iframe
            title={`mapa-pedido-${pedidoId}`}
            src={`https://www.google.com/maps?q=${centerLat},${centerLng}&z=14&output=embed`}
            style={{ border: 0, width: "100%", height: "100%" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url={tileUrl}
              crossOrigin="anonymous"
              eventHandlers={{
                tileerror: (e: any) => {
                  console.error("Tile error:", e);
                  setTilesError((c) => c + 1);
                },
              }}
            />

            {/* Marcadores (opcional) */}
            {showMarkers && (
              <>
                <Marker position={[clienteLat, clienteLng]} icon={iconoCliente}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold">🏠 Cliente</p>
                      <p className="text-sm">Destino de entrega</p>
                    </div>
                  </Popup>
                </Marker>

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

                {typeof restauranteLat === "number" &&
                  typeof restauranteLng === "number" && (
                    <Marker position={[restauranteLat, restauranteLng]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold">🍽️ Restaurante</p>
                          <p className="text-sm">Ubicación del restaurante</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
              </>
            )}

            {/* Dibujar ruta si hay al menos dos puntos */}
            {(() => {
              const pts: [number, number][] = [];
              if (
                typeof restauranteLat === "number" &&
                typeof restauranteLng === "number"
              )
                pts.push([restauranteLat, restauranteLng]);
              if (ubicacion)
                pts.push([
                  ubicacion.repartidor_latitud,
                  ubicacion.repartidor_longitud,
                ]);
              // siempre agregar cliente
              pts.push([clienteLat, clienteLng]);

              if (pts.length >= 2) {
                return (
                  <>
                    <Polyline
                      positions={pts}
                      pathOptions={{ color: "#2563eb", weight: 4 }}
                    />
                    <FitBounds points={pts} />
                  </>
                );
              }

              return null;
            })()}

            <CentrarMapa lat={centerLat} lng={centerLng} />
          </MapContainer>
        )}
      </div>

      {/* Leyenda (opcional) */}
      {showMarkers && (
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
      )}

      {!ubicacion && (
        <div className="text-center text-gray-500 text-sm">
          El repartidor aún no ha iniciado el tracking GPS
        </div>
      )}
    </div>
  );
}
