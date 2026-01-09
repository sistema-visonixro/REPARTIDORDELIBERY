import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Restaurante {
  id: string;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  color_tema: string;
  emoji: string;
  calificacion: number;
  tiempo_entrega_min: number;
  costo_envio: number;
}

interface Props {
  restaurantes: Restaurante[];
}

export default function RestaurantCarousel({ restaurantes }: Props) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const isHovered = useRef(false);

  // iniciar autoplay (requestAnimationFrame similar a PlatillosCarousel)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || restaurantes.length === 0) return;

    let animationId: number;
    const scrollSpeed = 0.6; // píxeles por frame
    // Usaremos scrollPosition creciente y mapearemos a scrollLeft = maxScroll - scrollPosition
    let scrollPosition = 0;

    const animate = () => {
      if (!container) return;

      if (!isHovered.current) {
        scrollPosition += scrollSpeed;

        const maxScroll = Math.floor(container.scrollWidth / 2);
        if (scrollPosition >= maxScroll) {
          scrollPosition = 0;
        }

        // invertimos la asignación para que visualmente se mueva hacia la derecha
        container.scrollLeft = Math.max(0, maxScroll - Math.floor(scrollPosition));
      }

      animationId = requestAnimationFrame(animate);
    };

    // asegurar inicio con el scroll mostrando la mitad (equivalente a maxScroll)
    container.scrollLeft = Math.floor(container.scrollWidth / 2);
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [restaurantes]);

  if (restaurantes.length === 0) {
    return (
      <section style={{ marginBottom: "24px" }}>
        <div
          style={{
            position: "relative",
            borderRadius: "12px",
            overflow: "hidden",
            height: "160px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
          }}
        >
          <p style={{ color: "#fff", fontSize: "15px", fontWeight: 500 }}>
            No hay restaurantes disponibles
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: "24px" }}>
      <div
        style={{
          position: "relative",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "8px 16px",
        }}
      >
        {/* Contenedor horizontal scroll de cards (sin scrollbar visible) */}
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;} .hide-scrollbar{ -ms-overflow-style:none; scrollbar-width:none; }`}</style>
        <div
          ref={containerRef}
          className="hide-scrollbar"
          onMouseEnter={() => (isHovered.current = true)}
          onMouseLeave={() => (isHovered.current = false)}
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "hidden",
            paddingBottom: "8px",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {(
            restaurantes.length > 0
              ? [...restaurantes, ...restaurantes]
              : restaurantes
          ).map((restaurant, idx) => (
            <div
              key={`${restaurant.id}-${idx}`}
              style={{
                minWidth: "160px",
                flex: "0 0 auto",
                borderRadius: "10px",
                overflow: "hidden",
                background: "transparent",
                boxShadow: "none",
                border: "1px solid rgba(15,23,42,0.06)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                backdropFilter: "none",
              }}
              onClick={() => navigate(`/restaurante/${restaurant.id}`)}
            >
              <div
                style={{
                  height: "90px",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundImage: `url(${restaurant.imagen_url})`,
                }}
              />
              <div
                style={{
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {restaurant.nombre}
                  </h4>
                  <span style={{ fontSize: "16px" }}>{restaurant.emoji}</span>
                </div>
                <p style={{ margin: 0, fontSize: "11px", color: "#475569" }}>
                  {restaurant.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
            <button
              onClick={() => navigate("/restaurantes")}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                borderRadius: 10,
                border: "1px solid #e6e7eb",
                background: "#fff",
                cursor: "pointer",
                color: "#0f172a",
                boxShadow: "0 1px 3px rgba(2,6,23,0.06)",
              }}
            >
              Ver todos
            </button>
          </div>
      </div>
    </section>
  );
}

// Nota: la lógica de autoplay ahora se ejecuta dentro del componente usando
// requestAnimationFrame, similar a `PlatillosCarousel`.
