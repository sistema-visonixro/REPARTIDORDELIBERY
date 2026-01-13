import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";
import { supabase } from "../lib/supabase";

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

// Iconos personalizados con emojis
const createEmojiIcon = (emoji: string) => {
  return L.divIcon({
    html: `<div style="font-size: 32px; text-align: center; line-height: 1;">${emoji}</div>`,
    className: "emoji-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const iconoRestaurante = createEmojiIcon("🍽️");
const iconoRepartidor = createEmojiIcon("🚚");
const iconoCliente = createEmojiIcon("🏠");

interface MapaRutaProfesionalProps {
  clienteLat: number;
  clienteLng: number;
  restauranteLat?: number | null;
  restauranteLng?: number | null;
  repartidorId?: string | null;
}

// Componente para agregar routing
function RoutingMachine({ waypoints }: { waypoints: L.LatLng[] }) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    // Eliminar control de routing anterior (protegido)
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (err) {
        console.warn("Error al remover routing control existente:", err);
      }
    }

    // Crear nuevo control de routing
    const routingControl = L.Routing.control({
      waypoints,
      lineOptions: {
        styles: [
          {
            color: "#2563eb",
            weight: 5,
            opacity: 0.8,
          },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      show: false, // No mostrar las instrucciones de navegación
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      createMarker: () => null as any, // No crear marcadores automáticos
    } as any).addTo(map);

    routingControlRef.current = routingControl;

    // Manejar errores de routing para evitar excepciones internas
    try {
      routingControl.on("routingerror", (err: any) => {
        console.error("Routing error:", err);
        // intentar limpiar control sin causar excepción
        try {
          if (routingControlRef.current) {
            map.removeControl(routingControlRef.current);
            routingControlRef.current = null;
          }
        } catch (e) {
          console.warn("Error limpiando routing control tras fallo:", e);
        }
      });
    } catch (e) {
      // no crítico
    }

    // Limpiar al desmontar
    return () => {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (err) {
          console.warn("Error al remover routing control en cleanup:", err);
        }
        routingControlRef.current = null;
      }
    };
  }, [map, waypoints]);

  return null;
}

export default function MapaRutaProfesional({
  clienteLat,
  clienteLng,
  restauranteLat,
  restauranteLng,
  repartidorId,
}: MapaRutaProfesionalProps) {
  const [repartidorPos, setRepartidorPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar ubicación del repartidor
  useEffect(() => {
    const cargarUbicacionRepartidor = async () => {
      if (!repartidorId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("ubicacion_real")
          .select("latitud, longitud")
          .eq("usuario_id", repartidorId)
          .single();

        if (!error && data) {
          setRepartidorPos({
            lat: Number(data.latitud),
            lng: Number(data.longitud),
          });
        }
      } catch (err) {
        console.error("Error al cargar ubicación del repartidor:", err);
      } finally {
        setLoading(false);
      }
    };

    cargarUbicacionRepartidor();

    // Suscripción a cambios en tiempo real
    if (repartidorId) {
      const channel = supabase
        .channel(`tracking-${repartidorId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "ubicacion_real",
            filter: `usuario_id=eq.${repartidorId}`,
          },
          (payload: any) => {
            if (payload.new) {
              setRepartidorPos({
                lat: Number(payload.new.latitud),
                lng: Number(payload.new.longitud),
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [repartidorId]);

  if (loading) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Cargando mapa...</p>
      </div>
    );
  }

  // Calcular centro del mapa
  const centerLat = repartidorPos
    ? (repartidorPos.lat + clienteLat) / 2
    : clienteLat;
  const centerLng = repartidorPos
    ? (repartidorPos.lng + clienteLng) / 2
    : clienteLng;

  // Construir waypoints para la ruta
  const waypoints: L.LatLng[] = [];
  if (
    typeof restauranteLat === "number" &&
    typeof restauranteLng === "number"
  ) {
    waypoints.push(L.latLng(restauranteLat, restauranteLng));
  }
  if (repartidorPos) {
    waypoints.push(L.latLng(repartidorPos.lat, repartidorPos.lng));
  }
  waypoints.push(L.latLng(clienteLat, clienteLng));

  return (
    <div className="space-y-4">
      {/* Información de tracking */}
      {repartidorPos && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚚</span>
            <div>
              <p className="font-medium text-gray-900">Repartidor en camino</p>
              <p className="text-sm text-gray-600">
                Ubicación actualizada en tiempo real
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marcador del Restaurante */}
          {typeof restauranteLat === "number" &&
            typeof restauranteLng === "number" && (
              <Marker
                position={[restauranteLat, restauranteLng]}
                icon={iconoRestaurante}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-lg">🍽️ Restaurante</p>
                    <p className="text-sm text-gray-600">Punto de recogida</p>
                  </div>
                </Popup>
              </Marker>
            )}

          {/* Marcador del Repartidor */}
          {repartidorPos && (
            <Marker
              position={[repartidorPos.lat, repartidorPos.lng]}
              icon={iconoRepartidor}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-lg">🚚 Repartidor</p>
                  <p className="text-sm text-gray-600">Ubicación actual</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcador del Cliente */}
          <Marker position={[clienteLat, clienteLng]} icon={iconoCliente}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-lg">🏠 Cliente</p>
                <p className="text-sm text-gray-600">Destino de entrega</p>
              </div>
            </Popup>
          </Marker>

          {/* Routing Machine - Ruta profesional por calles */}
          {waypoints.length >= 2 && <RoutingMachine waypoints={waypoints} />}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="flex justify-center space-x-6 text-sm">
        {typeof restauranteLat === "number" &&
          typeof restauranteLng === "number" && (
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🍽️</span>
              <span className="font-medium">Restaurante</span>
            </div>
          )}
        {repartidorPos && (
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚚</span>
            <span className="font-medium">Repartidor</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🏠</span>
          <span className="font-medium">Cliente</span>
        </div>
      </div>

      {!repartidorPos && (
        <div className="text-center text-gray-500 text-sm">
          El repartidor aún no ha iniciado el tracking GPS
        </div>
      )}
    </div>
  );
}
