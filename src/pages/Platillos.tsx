import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio: number;
  disponible: boolean;
  restaurante_id: string;
  restaurante?: { id: string; nombre: string } | null;
}

export default function Platillos() {
  const { categoriaId } = useParams();
  const navigate = useNavigate();
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaNombre, setCategoriaNombre] = useState<string | null>(null);

  useEffect(() => {
    if (!categoriaId) return;
    async function cargarPlatillos() {
      setLoading(true);
      try {
        // Obtener nombre de la categoría (opcional)
        const { data: catData } = await supabase
          .from("categorias")
          .select("nombre")
          .eq("id", categoriaId)
          .single();
        if (catData) setCategoriaNombre(catData.nombre || null);

        // Traer platillos y nombre del restaurante asociado
        const { data, error } = await supabase
          .from("platillos")
          .select(
            `id,nombre,descripcion,imagen_url,precio,disponible,restaurante_id, restaurantes(id,nombre)`
          )
          .eq("categoria_id", categoriaId)
          .order("nombre", { ascending: true });

        if (error) {
          console.error("Error cargando platillos:", error);
          setPlatillos([]);
        } else {
          // Mapear para asegurar shape
          const mapped = (data || []).map((p: any) => ({
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            imagen_url: p.imagen_url,
            precio: p.precio,
            disponible: p.disponible,
            restaurante_id: p.restaurante_id,
            restaurante: p.restaurantes
              ? { id: p.restaurantes.id, nombre: p.restaurantes.nombre }
              : null,
          }));
          setPlatillos(mapped);
        }
      } catch (err) {
        console.error(err);
        setPlatillos([]);
      } finally {
        setLoading(false);
      }
    }

    cargarPlatillos();
  }, [categoriaId]);

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        ← Volver
      </button>

      <h2 style={{ fontSize: 20, marginBottom: 8 }}>
        {categoriaNombre ?? "Platillos"}
      </h2>

      {loading ? (
        <p>Cargando platillos...</p>
      ) : platillos.length === 0 ? (
        <p>No hay platillos disponibles para esta categoría.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {platillos.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/platillo/${p.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  navigate(`/platillo/${p.id}`);
              }}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                background: "#fff",
                borderRadius: 12,
                padding: 12,
                boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 8,
                  overflow: "hidden",
                  flex: "0 0 84px",
                }}
              >
                <img
                  src={p.imagen_url || "/placeholder.png"}
                  alt={p.nombre}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <h3 style={{ fontSize: 16, margin: 0 }}>{p.nombre}</h3>
                  <div style={{ fontWeight: 700 }}>${p.precio.toFixed(2)}</div>
                </div>
                <p
                  style={{
                    margin: "6px 0 0 0",
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  {p.descripcion}
                </p>
                {p.restaurante && (
                  <p
                    style={{
                      margin: "6px 0 0 0",
                      fontSize: 12,
                      color: "#374151",
                    }}
                  >
                    En: {p.restaurante.nombre}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
