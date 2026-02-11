import { useEffect, useState, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./MapaRutaProfesional3D.css";
import { supabase } from "../lib/supabase";

// MapLibre GL es 100% gratuito y open-source, no requiere API key

interface MapaRutaProfesional3DProps {
  clienteLat: number;
  clienteLng: number;
  restauranteLat?: number | null;
  restauranteLng?: number | null;
  repartidorId?: string | null;
}

export default function MapaRutaProfesional3D({
  clienteLat,
  clienteLng,
  restauranteLat,
  restauranteLng,
  repartidorId,
}: MapaRutaProfesional3DProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const repartidorMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [repartidorPos, setRepartidorPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  console.log("🗺️ MapaRutaProfesional3D - Props recibidas:", {
    clienteLat,
    clienteLng,
    restauranteLat,
    restauranteLng,
    repartidorId,
  });

  // Cargar ubicación del repartidor
  useEffect(() => {
    const cargarUbicacionRepartidor = async () => {
      console.log("📡 Cargando ubicación del repartidor...", repartidorId);

      if (!repartidorId) {
        console.log("⚠️ No hay repartidorId, finalizando carga");
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
          console.log("✅ Ubicación repartidor cargada:", data);
          setRepartidorPos({
            lat: Number(data.latitud),
            lng: Number(data.longitud),
          });
        } else {
          console.log("❌ Error o sin datos de repartidor:", error);
        }
      } catch (err) {
        console.error("💥 Error al cargar ubicación del repartidor:", err);
      } finally {
        setLoading(false);
      }
    };

    cargarUbicacionRepartidor();

    // Suscripción a cambios en tiempo real
    if (repartidorId) {
      console.log("🔄 Suscribiendo a actualizaciones en tiempo real...");
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
            console.log("🆕 Actualización de ubicación recibida:", payload.new);
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
        console.log("🔌 Desuscribiendo del canal...");
        supabase.removeChannel(channel);
      };
    }
  }, [repartidorId]);

  // Inicializar mapa 3D
  useEffect(() => {
    console.log("🎨 useEffect de inicialización de mapa ejecutado");
    console.log("⏳ Loading state:", loading);
    console.log("📦 mapContainerRef.current:", mapContainerRef.current);
    console.log("🗺️ mapRef.current:", mapRef.current);

    // Esperar a que termine de cargar antes de crear el mapa
    if (loading) {
      console.log("⏸️ Esperando a que termine la carga...");
      return;
    }

    if (!mapContainerRef.current) {
      console.error("❌ No hay contenedor para el mapa");
      return;
    }

    if (mapRef.current) {
      console.log("⏭️ El mapa ya existe, saltando inicialización");
      return;
    }

    // Calcular centro del mapa
    const centerLat = repartidorPos
      ? (repartidorPos.lat + clienteLat) / 2
      : clienteLat;
    const centerLng = repartidorPos
      ? (repartidorPos.lng + clienteLng) / 2
      : clienteLng;

    console.log("📍 Coordenadas:", {
      cliente: { lat: clienteLat, lng: clienteLng },
      repartidor: repartidorPos,
      centro: { lat: centerLat, lng: centerLng },
    });

    // Validar coordenadas
    if (
      isNaN(centerLat) ||
      isNaN(centerLng) ||
      centerLat === 0 ||
      centerLng === 0
    ) {
      console.error("❌ Coordenadas inválidas:", { centerLat, centerLng });
      return;
    }

    try {
      console.log("🚀 Intentando crear mapa MapLibre GL...");

      const tileSource = isDarkTheme ? "dark_all" : "rastertiles/voyager";
      const sourceId = isDarkTheme ? "carto-dark" : "carto-light";

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            [sourceId]: {
              type: "raster",
              tiles: [
                `https://a.basemaps.cartocdn.com/${tileSource}/{z}/{x}/{y}.png`,
                `https://b.basemaps.cartocdn.com/${tileSource}/{z}/{x}/{y}.png`,
                `https://c.basemaps.cartocdn.com/${tileSource}/{z}/{x}/{y}.png`,
              ],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            },
          },
          layers: [
            {
              id: sourceId,
              type: "raster",
              source: sourceId,
            },
          ],
        },
        center: [centerLng, centerLat],
        zoom: 13,
        pitch: 45,
        bearing: 0,
      });

      console.log("✅ Mapa creado con centro:", [centerLng, centerLat]);
      console.log("🗺️ Objeto mapa:", map);

      mapRef.current = map;

      map.on("load", () => {
        console.log("🎉 Mapa cargado exitosamente");

        // Agregar controles de navegación
        map.addControl(
          new maplibregl.NavigationControl({
            visualizePitch: true,
          }),
          "top-right",
        );
        console.log("🧭 Controles de navegación agregados");

        // Agregar control de pantalla completa
        map.addControl(new maplibregl.FullscreenControl(), "top-right");
        console.log("🖥️ Control de pantalla completa agregado");

        // Crear marcadores personalizados
        if (
          typeof restauranteLat === "number" &&
          typeof restauranteLng === "number"
        ) {
          const restauranteEl = document.createElement("div");
          restauranteEl.className = "marker-3d marker-restaurante";
          restauranteEl.innerHTML = `
            <div class="marker-pulse"></div>
            <div class="marker-icon">🍽️</div>
          `;

          new maplibregl.Marker({
            element: restauranteEl,
            anchor: "bottom",
          })
            .setLngLat([restauranteLng, restauranteLat])
            .setPopup(
              new maplibregl.Popup({
                offset: 25,
                className: "popup-3d",
              }).setHTML(
                `
                <div class="popup-content">
                  <div class="popup-icon">🍽️</div>
                  <h3>Restaurante</h3>
                  <p>Punto de recogida</p>
                </div>
                `,
              ),
            )
            .addTo(map);
          console.log("🍽️ Marcador de restaurante agregado");
        }

        // Marcador del cliente
        const clienteEl = document.createElement("div");
        clienteEl.className = "marker-3d marker-cliente";
        clienteEl.innerHTML = `
          <div class="marker-pulse"></div>
          <div class="marker-icon">👤</div>
        `;

        new maplibregl.Marker({
          element: clienteEl,
          anchor: "bottom",
        })
          .setLngLat([clienteLng, clienteLat])
          .setPopup(
            new maplibregl.Popup({ offset: 25, className: "popup-3d" }).setHTML(
              `
              <div class="popup-content">
                <div class="popup-icon">👤</div>
                <h3>Cliente</h3>
                <p>Destino de entrega</p>
              </div>
              `,
            ),
          )
          .addTo(map);
        console.log("🏠 Marcador de cliente agregado");

        setLoading(false);
        console.log("✅ Inicialización del mapa completa");
      });

      map.on("error", (e) => {
        console.error(" MapLibre GL error:", e);
      });

      map.on("dataloading", () => {
        console.log("📥 Cargando datos del mapa...");
      });

      map.on("data", (e) => {
        console.log("📊 Datos del mapa recibidos:", e.dataType);
      });
    } catch (error) {
      console.error("💥 Error al crear el mapa:", error);
      setLoading(false);
      return;
    }

    return () => {
      console.log("🧹 Limpiando mapa...");
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [
    clienteLat,
    clienteLng,
    restauranteLat,
    restauranteLng,
    loading,
    isDarkTheme,
  ]);

  // Actualizar marcador del repartidor con animación
  useEffect(() => {
    if (!mapRef.current || !repartidorPos) return;

    const map = mapRef.current;
    console.log("🏍️ Actualizando posición del repartidor:", repartidorPos);

    if (repartidorMarkerRef.current) {
      // Animar el movimiento del marcador
      repartidorMarkerRef.current.setLngLat([
        repartidorPos.lng,
        repartidorPos.lat,
      ]);
      console.log("🔄 Marcador de repartidor movido");
    } else {
      // Crear marcador del repartidor
      const repartidorEl = document.createElement("div");
      repartidorEl.className = "marker-3d marker-repartidor";
      repartidorEl.innerHTML = `
        <div class="marker-pulse marker-pulse-active"></div>
        <div class="marker-icon marker-icon-animated">🏍️</div>
      `;

      const marker = new maplibregl.Marker({
        element: repartidorEl,
        anchor: "bottom",
      })
        .setLngLat([repartidorPos.lng, repartidorPos.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25, className: "popup-3d" }).setHTML(
            `
            <div class="popup-content">
              <div class="popup-icon">🏍️</div>
              <h3>Repartidor</h3>
              <p>Ubicación en tiempo real</p>
            </div>
            `,
          ),
        )
        .addTo(map);

      repartidorMarkerRef.current = marker;
      console.log("🏍️ Marcador de repartidor creado");
    }
  }, [repartidorPos]);

  if (loading) {
    console.log("⏳ Componente en estado de carga");
    return (
      <div className="map-3d-loading">
        <div className="loading-spinner"></div>
        <p>Cargando mapa 3D...</p>
        <p style={{ fontSize: "12px", marginTop: "10px" }}>
          Cliente: {clienteLat?.toFixed(4)}, {clienteLng?.toFixed(4)}
        </p>
      </div>
    );
  }

  // Validación adicional
  if (isNaN(clienteLat) || isNaN(clienteLng)) {
    console.error("❌ Coordenadas inválidas al renderizar");
    return (
      <div className="map-3d-loading">
        <p style={{ color: "red" }}>❌ Error: Coordenadas inválidas</p>
        <p style={{ fontSize: "12px" }}>
          Lat: {clienteLat}, Lng: {clienteLng}
        </p>
      </div>
    );
  }

  // Función para volar a una ubicación
  const flyToLocation = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 16,
        duration: 1500,
        essential: true,
      });
    }
  };

  // Dibujar ruta entre repartidor y destino usando OSRM
  const drawRouteTo = async (toLat: number, toLng: number) => {
    if (!mapRef.current || !repartidorPos) return;
    try {
      const from = `${repartidorPos.lng},${repartidorPos.lat}`;
      const to = `${toLng},${toLat}`;
      const url = `https://router.project-osrm.org/route/v1/driving/${from};${to}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OSRM error ${res.status}`);
      const data = await res.json();
      const coords = data?.routes?.[0]?.geometry;
      if (!coords) {
        console.error("No route geometry from OSRM", data);
        return;
      }

      const map = mapRef.current;

      // add or update source
      if (map.getSource("route")) {
        const source = map.getSource("route") as maplibregl.GeoJSONSource;
        source.setData({ type: 'Feature', properties: {}, geometry: coords });
      } else {
        map.addSource("route", {
          type: "geojson",
          data: { type: 'Feature', properties: {}, geometry: coords },
        } as any);

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#007bff",
            "line-width": 6,
            "line-opacity": 0.95,
          },
        });
      }

      // Ajustar vista para mostrar ruta completa
      try {
        const bbox = coords.coordinates.reduce(
          (acc: number[], cur: number[]) => {
            if (cur[0] < acc[0]) acc[0] = cur[0];
            if (cur[1] < acc[1]) acc[1] = cur[1];
            if (cur[0] > acc[2]) acc[2] = cur[0];
            if (cur[1] > acc[3]) acc[3] = cur[1];
            return acc;
          },
          [Infinity, Infinity, -Infinity, -Infinity],
        );
        map.fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]],
          ],
          { padding: 80, duration: 1000 },
        );
      } catch (err) {
        // ignore fitBounds errors
      }
    } catch (err) {
      console.error("Error obteniendo ruta OSRM:", err);
    }
  };

  console.log("🎨 Renderizando contenedor del mapa");

  return (
    <div
      className={`mapa-3d-container ${isDarkTheme ? "theme-dark" : "theme-light"}`}
    >
      {/* Botón toggle de tema */}
      <button
        className="theme-toggle-btn"
        onClick={() => setIsDarkTheme(!isDarkTheme)}
        title={isDarkTheme ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      >
        {isDarkTheme ? "☀️" : "🌙"}
      </button>

      {/* Panel de información flotante */}
      {repartidorPos && (
        <div className="info-panel-3d">
          <div className="info-card">
            <div className="info-icon">🏍️</div>
            <div className="info-text">
              <h3>Repartidor en camino</h3>
              <p className="info-status">
                <span className="status-dot"></span>
                En vivo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor del mapa */}
      <div ref={mapContainerRef} className="map-3d" />

      {/* Leyenda interactiva */}
      <div className="legend-3d">
        {typeof restauranteLat === "number" &&
          typeof restauranteLng === "number" && (
            <div
              className="legend-item legend-item-clickable"
              onClick={() => {
                flyToLocation(restauranteLat, restauranteLng);
                drawRouteTo(restauranteLat, restauranteLng);
              }}
              title="Ir a ubicación del restaurante"
            >
              <span className="legend-icon">🍽️</span>
              <span>Restaurante</span>
            </div>
          )}
        {repartidorPos && (
          <div
            className="legend-item legend-item-clickable"
            onClick={() => flyToLocation(repartidorPos.lat, repartidorPos.lng)}
            title="Ir a ubicación del repartidor"
          >
            <span className="legend-icon">🏍️</span>
            <span>Repartidor</span>
          </div>
        )}
        <div
          className="legend-item legend-item-clickable"
          onClick={() => {
            flyToLocation(clienteLat, clienteLng);
            drawRouteTo(clienteLat, clienteLng);
          }}
          title="Ir a ubicación del cliente"
        >
          <span className="legend-icon">👤</span>
          <span>Cliente</span>
        </div>
      </div>

      {!repartidorPos && (
        <div className="no-tracking-message">
          <div className="message-icon">📡</div>
          <p>Esperando señal GPS del repartidor...</p>
        </div>
      )}
    </div>
  );
}
