import { useEffect, useState, useRef } from "react";
import "./MapaGoogle3DPro.css";
import { supabase } from "../lib/supabase";

interface MapaGoogle3DProProps {
  clienteLat: number;
  clienteLng: number;
  restauranteLat?: number | null;
  restauranteLng?: number | null;
  repartidorId?: string | null;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function MapaGoogle3DPro({
  clienteLat,
  clienteLng,
  restauranteLat,
  restauranteLng,
  repartidorId,
}: MapaGoogle3DProProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const repartidorMarkerRef = useRef<any>(null);

  const [repartidorPos, setRepartidorPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [distancia, setDistancia] = useState<string>("");
  const [duracion, setDuracion] = useState<string>("");
  const [showStreetView, setShowStreetView] = useState(false);
  const [tipoRuta, setTipoRuta] = useState<"cliente" | "restaurante">(
    "cliente",
  );

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
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [repartidorId]);

  // Inicializar Google Maps 3D
  useEffect(() => {
    if (loading || !mapRef.current || !window.google) return;

    const initMap = async () => {
      const { Map } = await window.google.maps.importLibrary("maps");
      const { AdvancedMarkerElement, PinElement } =
        await window.google.maps.importLibrary("marker");

      // Calcular centro
      const centerLat = repartidorPos
        ? (repartidorPos.lat + clienteLat) / 2
        : clienteLat;
      const centerLng = repartidorPos
        ? (repartidorPos.lng + clienteLng) / 2
        : clienteLng;

      // Crear mapa con vista 3D
      const map = new Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 15,
        mapId: "DEMO_MAP_ID", // Necesario para 3D
        tilt: 45,
        heading: 0,
        mapTypeId: "satellite",
        fullscreenControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain"],
        },
        streetViewControl: true,
        zoomControl: true,
        rotateControl: true,
        gestureHandling: "greedy",
      });

      googleMapRef.current = map;

      // Servicios de direcciones
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer(
        {
          map: map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#667eea",
            strokeWeight: 6,
            strokeOpacity: 0.9,
          },
        },
      );

      // Marcador del restaurante
      if (restauranteLat && restauranteLng) {
        const restaurantePinBackground = new PinElement({
          background: "#FF6B6B",
          borderColor: "#C92A2A",
          glyphColor: "#FFF",
          scale: 1.5,
        });

        const restauranteMarker = new AdvancedMarkerElement({
          map: map,
          position: { lat: restauranteLat, lng: restauranteLng },
          content: restaurantePinBackground.element,
          title: "Restaurante - Punto de recogida",
        });

        // Popup info
        const restauranteInfo = new window.google.maps.InfoWindow({
          content: `
            <div class="info-window-3d">
              <div class="info-icon">🍽️</div>
              <h3>Restaurante</h3>
              <p>Punto de recogida</p>
            </div>
          `,
        });

        restauranteMarker.addListener("click", () => {
          restauranteInfo.open(map, restauranteMarker);
        });
      }

      // Marcador del cliente
      const clientePinBackground = new PinElement({
        background: "#51CF66",
        borderColor: "#2F9E44",
        glyphColor: "#FFF",
        scale: 1.5,
      });

      const clienteMarker = new AdvancedMarkerElement({
        map: map,
        position: { lat: clienteLat, lng: clienteLng },
        content: clientePinBackground.element,
        title: "Cliente - Destino de entrega",
      });

      const clienteInfo = new window.google.maps.InfoWindow({
        content: `
          <div class="info-window-3d">
            <div class="info-icon">🏠</div>
            <h3>Cliente</h3>
            <p>Destino de entrega</p>
          </div>
        `,
      });

      clienteMarker.addListener("click", () => {
        clienteInfo.open(map, clienteMarker);
      });

      // Marcador del repartidor (si existe)
      if (repartidorPos) {
        crearMarcadorRepartidor(
          map,
          repartidorPos,
          PinElement,
          AdvancedMarkerElement,
        );
        calcularRuta();
      }

      // Ajustar vista para mostrar todos los puntos
      ajustarVista(map);

      // Animación inicial de rotación 360°
      animarRotacionInicial(map);
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Esperar a que se cargue la API
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 100);
    }
  }, [loading, clienteLat, clienteLng, restauranteLat, restauranteLng]);

  // Recalcular ruta cuando cambie el tipo de ruta seleccionado
  useEffect(() => {
    if (repartidorPos && googleMapRef.current) {
      calcularRuta();
    }
  }, [tipoRuta]);

  // Actualizar posición del repartidor en tiempo real
  useEffect(() => {
    if (!repartidorPos || !googleMapRef.current) return;

    const updateRepartidor = async () => {
      const { AdvancedMarkerElement, PinElement } =
        await window.google.maps.importLibrary("marker");

      if (repartidorMarkerRef.current) {
        // Animar movimiento del marcador existente
        repartidorMarkerRef.current.position = {
          lat: repartidorPos.lat,
          lng: repartidorPos.lng,
        };
      } else {
        // Crear nuevo marcador
        crearMarcadorRepartidor(
          googleMapRef.current,
          repartidorPos,
          PinElement,
          AdvancedMarkerElement,
        );
      }

      // Recalcular ruta
      calcularRuta();
    };

    updateRepartidor();
  }, [repartidorPos]);

  const crearMarcadorRepartidor = (
    map: any,
    pos: { lat: number; lng: number },
    PinElement: any,
    AdvancedMarkerElement: any,
  ) => {
    const repartidorPinBackground = new PinElement({
      background: "#667eea",
      borderColor: "#5568D3",
      glyphColor: "#FFF",
      scale: 1.8,
    });

    const marker = new AdvancedMarkerElement({
      map: map,
      position: { lat: pos.lat, lng: pos.lng },
      content: repartidorPinBackground.element,
      title: "Repartidor - En camino",
    });

    const repartidorInfo = new window.google.maps.InfoWindow({
      content: `
        <div class="info-window-3d">
          <div class="info-icon">🚚</div>
          <h3>Repartidor</h3>
          <p>En camino a tu ubicación</p>
          ${distancia ? `<p><strong>${distancia}</strong> - ${duracion}</p>` : ""}
        </div>
      `,
    });

    marker.addListener("click", () => {
      repartidorInfo.open(map, marker);
    });

    repartidorMarkerRef.current = marker;
  };

  const calcularRuta = () => {
    if (
      !repartidorPos ||
      !directionsServiceRef.current ||
      !directionsRendererRef.current
    )
      return;

    const origin = { lat: repartidorPos.lat, lng: repartidorPos.lng };
    let destination;

    // Determinar el destino según el tipo de ruta seleccionado
    if (tipoRuta === "restaurante" && restauranteLat && restauranteLng) {
      destination = { lat: restauranteLat, lng: restauranteLng };
    } else {
      destination = { lat: clienteLat, lng: clienteLng };
    }

    directionsServiceRef.current.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      },
      (result: any, status: any) => {
        if (status === "OK") {
          directionsRendererRef.current.setDirections(result);

          // Extraer distancia y duración
          const leg = result.routes[0].legs[0];
          setDistancia(leg.distance.text);
          setDuracion(leg.duration.text);
        }
      },
    );
  };

  const ajustarVista = (map: any) => {
    const bounds = new window.google.maps.LatLngBounds();

    if (restauranteLat && restauranteLng) {
      bounds.extend({ lat: restauranteLat, lng: restauranteLng });
    }
    bounds.extend({ lat: clienteLat, lng: clienteLng });
    if (repartidorPos) {
      bounds.extend({ lat: repartidorPos.lat, lng: repartidorPos.lng });
    }

    map.fitBounds(bounds);
  };

  const animarRotacionInicial = (map: any) => {
    let currentHeading = 0;
    const rotacionInterval = setInterval(() => {
      if (currentHeading >= 360) {
        clearInterval(rotacionInterval);
        map.setHeading(0);
        return;
      }
      currentHeading += 2;
      map.setHeading(currentHeading);
    }, 20);
  };

  const toggleStreetView = () => {
    if (!googleMapRef.current) return;

    if (!showStreetView && repartidorPos) {
      const panorama = googleMapRef.current.getStreetView();
      panorama.setPosition({ lat: repartidorPos.lat, lng: repartidorPos.lng });
      panorama.setVisible(true);
      setShowStreetView(true);
    } else {
      const panorama = googleMapRef.current.getStreetView();
      panorama.setVisible(false);
      setShowStreetView(false);
    }
  };

  const centrarEnRepartidor = () => {
    if (!googleMapRef.current || !repartidorPos) return;
    googleMapRef.current.panTo({
      lat: repartidorPos.lat,
      lng: repartidorPos.lng,
    });
    googleMapRef.current.setZoom(17);
  };

  const cambiarVistaAerea = () => {
    if (!googleMapRef.current) return;
    const currentType = googleMapRef.current.getMapTypeId();
    const newType = currentType === "satellite" ? "roadmap" : "satellite";
    googleMapRef.current.setMapTypeId(newType);
  };

  if (loading) {
    return (
      <div className="mapa-loading">
        <div className="loading-spinner"></div>
        <p>Cargando mapa 3D...</p>
      </div>
    );
  }

  return (
    <div className="mapa-google-3d-wrapper">
      {/* Contenedor del mapa */}
      <div className="mapa-google-3d-container">
        <div ref={mapRef} className="mapa-google-3d"></div>
      </div>

      {/* Panel de controles - Fuera del mapa */}
      <div className="panel-controles-externo">
        {/* Panel de Seguimiento en vivo */}
        <div className="info-panel-3d-externo">
          <div className="info-header">
            <span className="status-indicator"></span>
            <h3>Seguimiento en vivo</h3>
          </div>
          {repartidorPos ? (
            <>
              <div className="info-stats-grid">
                <div className="info-stat-card">
                  <span className="stat-icon">📍</span>
                  <div className="stat-content">
                    <span className="stat-label">Distancia</span>
                    <span className="stat-value">
                      {distancia || "Calculando..."}
                    </span>
                  </div>
                </div>
                <div className="info-stat-card">
                  <span className="stat-icon">⏱️</span>
                  <div className="stat-content">
                    <span className="stat-label">Tiempo estimado</span>
                    <span className="stat-value">
                      {duracion || "Calculando..."}
                    </span>
                  </div>
                </div>
                <div className="info-stat-card">
                  <span className="stat-icon">🎯</span>
                  <div className="stat-content">
                    <span className="stat-label">Destino</span>
                    <span className="stat-value">
                      {tipoRuta === "cliente" ? "Cliente" : "Restaurante"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="info-no-data">
              <span className="no-data-icon">📡</span>
              <p>Esperando ubicación del repartidor...</p>
            </div>
          )}
        </div>

        {/* Selector de Ruta */}
        <div className="selector-ruta">
          <div className="selector-header">
            <span className="selector-icon">🗺️</span>
            <h4>Seleccionar Ruta</h4>
          </div>
          <div className="selector-buttons">
            <button
              className={`ruta-btn ${tipoRuta === "cliente" ? "active" : ""}`}
              onClick={() => setTipoRuta("cliente")}
              disabled={!repartidorPos}
            >
              <span className="ruta-icon">🏠</span>
              <div className="ruta-info">
                <span className="ruta-title">Ruta al Cliente</span>
                <span className="ruta-desc">Punto de entrega</span>
              </div>
            </button>
            <button
              className={`ruta-btn ${tipoRuta === "restaurante" ? "active" : ""}`}
              onClick={() => setTipoRuta("restaurante")}
              disabled={!repartidorPos || !restauranteLat || !restauranteLng}
            >
              <span className="ruta-icon">🍽️</span>
              <div className="ruta-info">
                <span className="ruta-title">Ruta al Restaurante</span>
                <span className="ruta-desc">Punto de recogida</span>
              </div>
            </button>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="controles-grupo">
          <div className="grupo-header">
            <span className="grupo-icon">⚡</span>
            <h4>Acciones Rápidas</h4>
          </div>
          <div className="controles-grid">
            <button
              className="control-btn-nuevo special"
              onClick={centrarEnRepartidor}
              title="Centrar en repartidor"
              disabled={!repartidorPos}
            >
              <span className="btn-icon">🎯</span>
              <span className="btn-label">Centrar</span>
            </button>
            <button
              className="control-btn-nuevo special"
              onClick={cambiarVistaAerea}
              title="Cambiar vista"
            >
              <span className="btn-icon">🛰️</span>
              <span className="btn-label">Vista</span>
            </button>
            <button
              className="control-btn-nuevo special"
              onClick={toggleStreetView}
              title="Street View"
              disabled={!repartidorPos}
            >
              <span className="btn-icon">👁️</span>
              <span className="btn-label">Street View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
