import { useEffect, useState, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FaBullseye,
  FaClock,
  FaHouse,
  FaLocationCrosshairs,
  FaMapLocationDot,
  FaMotorcycle,
  FaRulerCombined,
  FaSatelliteDish,
  FaStore,
  FaStreetView,
} from "react-icons/fa6";
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

const iconMarkup = {
  restaurante: renderToStaticMarkup(<FaStore />),
  cliente: renderToStaticMarkup(<FaHouse />),
  repartidor: renderToStaticMarkup(<FaMotorcycle />),
};

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

  const crearContenidoMarcador = (
    tipo: "restaurante" | "cliente" | "repartidor",
  ) => {
    const markerEl = document.createElement("div");
    markerEl.className = `map-marker map-marker--${tipo}`;
    markerEl.innerHTML = `
      <span class="map-marker__icon">${iconMarkup[tipo]}</span>
    `;
    return markerEl;
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
      const { AdvancedMarkerElement } =
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
        const restauranteMarker = new AdvancedMarkerElement({
          map: map,
          position: { lat: restauranteLat, lng: restauranteLng },
          content: crearContenidoMarcador("restaurante"),
          title: "Restaurante - Punto de recogida",
        });

        // Popup info
        const restauranteInfo = new window.google.maps.InfoWindow({
          content: `
            <div class="info-window-3d">
              <div class="info-icon">${iconMarkup.restaurante}</div>
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
      const clienteMarker = new AdvancedMarkerElement({
        map: map,
        position: { lat: clienteLat, lng: clienteLng },
        content: crearContenidoMarcador("cliente"),
        title: "Cliente - Destino de entrega",
      });

      const clienteInfo = new window.google.maps.InfoWindow({
        content: `
          <div class="info-window-3d">
            <div class="info-icon">${iconMarkup.cliente}</div>
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
        crearMarcadorRepartidor(map, repartidorPos, AdvancedMarkerElement);
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
      const { AdvancedMarkerElement } =
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
    AdvancedMarkerElement: any,
  ) => {
    const marker = new AdvancedMarkerElement({
      map: map,
      position: { lat: pos.lat, lng: pos.lng },
      content: crearContenidoMarcador("repartidor"),
      title: "Repartidor - En camino",
    });

    const repartidorInfo = new window.google.maps.InfoWindow({
      content: `
        <div class="info-window-3d">
          <div class="info-icon">${iconMarkup.repartidor}</div>
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

    const panorama = googleMapRef.current.getStreetView();

    if (showStreetView) {
      panorama.setVisible(false);
      setShowStreetView(false);
      return;
    }

    if (!repartidorPos || !window.google?.maps?.StreetViewService) return;

    const sv = new window.google.maps.StreetViewService();
    const target = new window.google.maps.LatLng(
      repartidorPos.lat,
      repartidorPos.lng,
    );

    sv.getPanorama(
      {
        location: target,
        radius: 120,
        source: window.google.maps.StreetViewSource.OUTDOOR,
      },
      (data: any, status: any) => {
        if (status !== "OK" || !data?.location?.latLng) {
          console.warn("Street View no disponible cerca de esta ubicación");
          return;
        }

        panorama.setPosition(data.location.latLng);
        panorama.setPov({ heading: 0, pitch: 0 });
        panorama.setZoom(1);
        panorama.setVisible(true);
        setShowStreetView(true);
      },
    );
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
        <button
          className="map-center-fab"
          onClick={centrarEnRepartidor}
          title="Centrar en repartidor"
          disabled={!repartidorPos}
        >
          <FaLocationCrosshairs />
        </button>
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
                  <span className="stat-icon">
                    <FaRulerCombined />
                  </span>
                  <div className="stat-content">
                    <span className="stat-label">Distancia</span>
                    <span className="stat-value">
                      {distancia || "Calculando..."}
                    </span>
                  </div>
                </div>
                <div className="info-stat-card">
                  <span className="stat-icon">
                    <FaClock />
                  </span>
                  <div className="stat-content">
                    <span className="stat-label">Tiempo estimado</span>
                    <span className="stat-value">
                      {duracion || "Calculando..."}
                    </span>
                  </div>
                </div>
                <div className="info-stat-card">
                  <span className="stat-icon">
                    <FaBullseye />
                  </span>
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
            <span className="selector-icon">
              <FaMapLocationDot />
            </span>
            <h4>Seleccionar Ruta</h4>
          </div>
          <div className="selector-buttons">
            <button
              className={`ruta-btn ${tipoRuta === "cliente" ? "active" : ""}`}
              onClick={() => setTipoRuta("cliente")}
              disabled={!repartidorPos}
            >
              <span className="ruta-icon">
                <FaHouse />
              </span>
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
              <span className="ruta-icon">
                <FaStore />
              </span>
              <div className="ruta-info">
                <span className="ruta-title">Ruta al Restaurante</span>
                <span className="ruta-desc">Punto de recogida</span>
              </div>
            </button>
          </div>
        </div>

        <div className="controles-secundarios">
          <button
            className="control-chip"
            onClick={cambiarVistaAerea}
            title="Cambiar vista"
          >
            <FaSatelliteDish />
            <span>Vista</span>
          </button>
          <button
            className={`control-chip ${showStreetView ? "active" : ""}`}
            onClick={toggleStreetView}
            title="Street View"
            disabled={!repartidorPos}
          >
            <FaStreetView />
            <span>Street View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
