import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

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

interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio: number;
  disponible: boolean;
  categoria_id?: string;
}

export default function RestauranteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    cargarDatos();
  }, [id]);

  async function cargarDatos() {
    try {
      // Cargar restaurante
      const { data: restData, error: restError } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("id", id)
        .single();

      if (restError) {
        console.error("Error cargando restaurante:", restError);
        setRestaurante(null);
      } else {
        setRestaurante(restData);
      }

      // Cargar platillos del restaurante
      const { data: platData, error: platError } = await supabase
        .from("platillos")
        .select("*")
        .eq("restaurante_id", id)
        .eq("disponible", true)
        .order("nombre", { ascending: true });

      if (platError) {
        console.error("Error cargando platillos:", platError);
        setPlatillos([]);
      } else {
        setPlatillos(platData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>⏳</div>
          <p style={{ color: "#6b7280", marginTop: 12 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!restaurante) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48 }}>😞</div>
        <p style={{ color: "#6b7280" }}>Restaurante no encontrado</p>
        <button
          onClick={() => navigate("/restaurantes")}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: "#4f46e5",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Ver restaurantes
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#fafafa", paddingBottom: 80 }}
    >
      {/* Header con imagen */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            height: 220,
            backgroundImage: `url(${restaurante.imagen_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,255,255,0.95)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          ←
        </button>
      </div>

      {/* Info del restaurante */}
      <div
        style={{
          background: "#fff",
          padding: "20px 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>{restaurante.emoji}</span>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {restaurante.nombre}
          </h1>
        </div>
        <p style={{ margin: "0 0 12px 0", fontSize: 14, color: "#6b7280" }}>
          {restaurante.descripcion}
        </p>
        <div
          style={{ display: "flex", gap: 16, fontSize: 14, color: "#374151" }}
        >
          <span style={{ fontWeight: 700 }}>
            ⭐ {restaurante.calificacion.toFixed(1)}
          </span>
          <span>{restaurante.tiempo_entrega_min} min</span>
          <span>${restaurante.costo_envio} envío</span>
        </div>
      </div>

      {/* Platillos */}
      <div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#111827",
            margin: "0 0 16px 0",
          }}
        >
          Menú
        </h2>

        {platillos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48 }}>🍽️</div>
            <p style={{ color: "#6b7280", marginTop: 12 }}>
              No hay platillos disponibles
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {platillos.map((platillo) => (
              <div
                key={platillo.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/platillo/${platillo.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    navigate(`/platillo/${platillo.id}`);
                }}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  gap: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                }}
              >
                {platillo.imagen_url && (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      backgroundImage: `url(${platillo.imagen_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      flex: "0 0 80px",
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {platillo.nombre}
                    </h3>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#059669",
                      }}
                    >
                      ${platillo.precio.toFixed(2)}
                    </span>
                  </div>
                  {platillo.descripcion && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      {platillo.descripcion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
