import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import BottomNav from "../components/BottomNav";

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

export default function Restaurantes() {
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarRestaurantes();
  }, []);

  async function cargarRestaurantes() {
    try {
      const { data, error } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("activo", true)
        .order("calificacion", { ascending: false });

      if (error) {
        console.error("Error cargando restaurantes:", error);
        setRestaurantes([]);
      } else {
        const normalized = (data || []).map((r: any) => ({
          ...r,
          calificacion:
            typeof r.calificacion === "string"
              ? parseFloat(r.calificacion) || 0
              : r.calificacion ?? 0,
          costo_envio:
            typeof r.costo_envio === "string"
              ? parseFloat(r.costo_envio) || 0
              : r.costo_envio ?? 0,
          tiempo_entrega_min: r.tiempo_entrega_min
            ? Number(r.tiempo_entrega_min)
            : 0,
        }));

        setRestaurantes(normalized);
      }
    } catch (err) {
      console.error(err);
      setRestaurantes([]);
    } finally {
      setLoading(false);
    }
  }

  const filtrados = restaurantes.filter((r) =>
    `${r.nombre} ${r.descripcion}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{ minHeight: "100vh", background: "#fafafa", paddingBottom: 80 }}
    >
      {/* Header */}
      <header
        style={{
          background: "#fff",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#111827",
            margin: "0 0 12px 0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 28 }}>🍽️</span>
          Restaurantes
        </h1>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar restaurante..."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            outline: "none",
            fontSize: 14,
          }}
        />
      </header>

      {/* Content */}
      <main style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48 }}>⏳</div>
            <p style={{ color: "#6b7280", marginTop: 12 }}>Cargando...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48 }}>🔍</div>
            <p style={{ color: "#6b7280", marginTop: 12 }}>
              No se encontraron restaurantes
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtrados.map((restaurante) => (
              <div
                key={restaurante.id}
                onClick={() => navigate(`/restaurante/${restaurante.id}`)}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div
                  style={{
                    height: 140,
                    backgroundImage: `url(${restaurante.imagen_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div style={{ padding: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {restaurante.nombre}
                    </h3>
                    <span style={{ fontSize: 22 }}>{restaurante.emoji}</span>
                  </div>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    {restaurante.descripcion}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      fontSize: 13,
                      color: "#374151",
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>
                      ⭐ {restaurante.calificacion.toFixed(1)}
                    </span>
                    <span>{restaurante.tiempo_entrega_min} min</span>
                    <span>${restaurante.costo_envio} envío</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
