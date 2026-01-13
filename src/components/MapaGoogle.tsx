import { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { supabase } from "../lib/supabase";

interface MapaGoogleProps {
  pedidoId: string;
  clienteLat: number;
  clienteLng: number;
  restauranteLat?: number | null;
  restauranteLng?: number | null;
  repartidorId?: string | null;
}

const containerStyle = {
  width: "100%",
  height: "600px",
};

// API Key de Google Maps (puedes usar una demo o crear la tuya en https://console.cloud.google.com)
const GOOGLE_MAPS_API_KEY = "AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw"; // Reemplaza con tu API key

export default function MapaGoogle({
  clienteLat,
  clienteLng,
  restauranteLat,
  restauranteLng,
  repartidorId,
}: MapaGoogleProps) {
  const [repartidorPos, setRepartidorPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Centro del mapa
  const center = {
    lat: clienteLat,
    lng: clienteLng,
  };

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

  // Calcular ruta usando Google Directions API
  useEffect(() => {
    if (typeof window === "undefined" || !window.google) return;

    const calcularRuta = () => {
      const directionsService = new google.maps.DirectionsService();

      // Determinar origen y destino
      const waypoints: google.maps.DirectionsWaypoint[] = [];
      let origin: google.maps.LatLngLiteral;
      const destination: google.maps.LatLngLiteral = {
        lat: clienteLat,
        lng: clienteLng,
      };

      // Si hay restaurante, es el origen
      if (
        typeof restauranteLat === "number" &&
        typeof restauranteLng === "number"
      ) {
        origin = { lat: restauranteLat, lng: restauranteLng };

        // Si hay repartidor, agregarlo como waypoint
        if (repartidorPos) {
          waypoints.push({
            location: new google.maps.LatLng(
              repartidorPos.lat,
              repartidorPos.lng
            ),
            stopover: true,
          });
        }
      } else if (repartidorPos) {
        // Si no hay restaurante pero hay repartidor, el repartidor es el origen
        origin = { lat: repartidorPos.lat, lng: repartidorPos.lng };
      } else {
        // No hay suficientes puntos para trazar ruta
        return;
      }

      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          } else {
            console.error("Error al calcular ruta:", status);
          }
        }
      );
    };

    calcularRuta();
  }, [clienteLat, clienteLng, restauranteLat, restauranteLng, repartidorPos]);

  if (loading) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Cargando mapa...</p>
      </div>
    );
  }

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
      <div className="rounded-lg overflow-hidden shadow-lg">
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {/* Marcador del Restaurante */}
            {typeof restauranteLat === "number" &&
              typeof restauranteLng === "number" && (
                <Marker
                  position={{ lat: restauranteLat, lng: restauranteLng }}
                  label={{
                    text: "🍽️",
                    fontSize: "24px",
                    className: "marker-label",
                  }}
                  title="Restaurante"
                />
              )}

            {/* Marcador del Repartidor */}
            {repartidorPos && (
              <Marker
                position={repartidorPos}
                label={{
                  text: "🚚",
                  fontSize: "24px",
                  className: "marker-label",
                }}
                title="Repartidor"
              />
            )}

            {/* Marcador del Cliente */}
            <Marker
              position={{ lat: clienteLat, lng: clienteLng }}
              label={{
                text: "🏠",
                fontSize: "24px",
                className: "marker-label",
              }}
              title="Cliente (Destino)"
            />

            {/* Ruta calculada */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true, // Ocultamos los marcadores por defecto de Google
                  polylineOptions: {
                    strokeColor: "#2563eb",
                    strokeWeight: 5,
                    strokeOpacity: 0.8,
                  },
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Leyenda */}
      <div className="flex justify-center space-x-6 text-sm">
        {typeof restauranteLat === "number" &&
          typeof restauranteLng === "number" && (
            <div className="flex items-center space-x-2">
              <span className="text-xl">🍽️</span>
              <span>Restaurante</span>
            </div>
          )}
        {repartidorPos && (
          <div className="flex items-center space-x-2">
            <span className="text-xl">🚚</span>
            <span>Repartidor</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <span className="text-xl">🏠</span>
          <span>Cliente (Destino)</span>
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
