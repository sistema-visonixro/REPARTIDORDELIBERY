import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio: number;
  disponible: boolean;
  restaurante?: { nombre: string };
}

export default function PlatillosPorCategoria() {
  const { categoriaId } = useParams();
  const navigate = useNavigate();
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaNombre, setCategoriaNombre] = useState("");

  useEffect(() => {
    if (categoriaId) cargarDatos();
  }, [categoriaId]);

  async function cargarDatos() {
    setLoading(true);
    try {
      // 1. Nombre de categoría
      const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", categoriaId).single();
      if (cat) setCategoriaNombre(cat.nombre);

      // 2. Platillos con JOIN a restaurantes
      const { data, error } = await supabase
        .from("platillos")
        .select(`
          id, nombre, descripcion, imagen_url, precio, disponible,
          restaurantes ( nombre )
        `)
        .eq("categoria_id", categoriaId)
        .eq("disponible", true);

      if (error) throw error;

      // Normalizar datos para que coincidan con la interfaz
      const formateados = (data || []).map((p: any) => ({
        ...p,
        restaurante: p.restaurantes
      }));

      setPlatillos(formateados);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageContainer}>
      {/* Botón flotante para volver */}
      <BackButton onClick={() => navigate(-1)} style={{ top: 20, right: 20 }} />

      {/* Header Minimalista */}
      <header style={headerStyle}>
        <span style={subtitleStyle}>Explorar categoría</span>
        <h1 style={titleStyle}>{categoriaNombre || "Cargando..." }</h1>
      </header>

      {loading ? (
        <div style={center}>Cargando delicias...</div>
      ) : platillos.length === 0 ? (
        <div style={center}>No hay platillos en esta categoría todavía.</div>
      ) : (
        <div style={gridStyle}>
          {platillos.map((p) => (
            <div 
              key={p.id} 
              onClick={() => navigate(`/platillo/${p.id}`)} 
              style={cardStyle}
            >
              <div style={imageContainer}>
                <img 
                  src={p.imagen_url || "https://via.placeholder.com/300"} 
                  alt={p.nombre} 
                  style={imgStyle} 
                />
                <div style={priceBadge}>${Number(p.precio).toFixed(2)}</div>
              </div>
              
              <div style={cardContent}>
                <div style={restName}>{p.restaurante?.nombre || "Restaurante"}</div>
                <h3 style={dishName}>{p.nombre}</h3>
                <p style={dishDesc}>{p.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Estilos en Objeto JS (Garantiza que funcionen de inmediato) ---

const pageContainer: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f2f2f7", // Color gris claro estilo iOS
  padding: "20px",
  paddingTop: "60px"
};

/* floatingBackBtn removed; using BackButton component */

const headerStyle: React.CSSProperties = {
  marginBottom: "30px",
  paddingLeft: "10px"
};

const subtitleStyle: React.CSSProperties = {
  color: "#8e8e93",
  textTransform: "uppercase",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "1px"
};

const titleStyle: React.CSSProperties = {
  fontSize: "34px",
  fontWeight: 800,
  color: "#1c1c1e",
  margin: "5px 0 0 0"
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "20px"
};

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
  cursor: "pointer",
  transition: "transform 0.2s ease"
};

const imageContainer: React.CSSProperties = {
  position: "relative",
  height: "200px",
  width: "100%"
};

const imgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover"
};

const priceBadge: React.CSSProperties = {
  position: "absolute",
  bottom: "15px",
  left: "15px",
  background: "rgba(255,255,255,0.9)",
  padding: "5px 12px",
  borderRadius: "10px",
  fontWeight: 800,
  fontSize: "14px",
  color: "#000",
  backdropFilter: "blur(5px)"
};

const cardContent: React.CSSProperties = {
  padding: "15px"
};

const restName: React.CSSProperties = {
  color: "#007aff",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "4px"
};

const dishName: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  margin: "0 0 8px 0",
  color: "#1c1c1e"
};

const dishDesc: React.CSSProperties = {
  fontSize: "14px",
  color: "#636366",
  lineHeight: "1.4",
  margin: 0
};

const center: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "50px",
  color: "#8e8e93"
};