import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import "./DetallePlatillo.css";

interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  precio?: number | null;
  disponible?: boolean | null;
  restaurante_id?: string | null;
  restaurantes?: Array<{ id: string; nombre: string }>; // query may return this field
  restaurante?: { id: string; nombre: string } | null;
}

// ... (Interface Platillo se mantiene igual)

export default function DetallePlatillo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [platillo, setPlatillo] = useState<Platillo | null>(null);
  const [loading, setLoading] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    cargar();
  }, [id]);

  async function cargar() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platillos")
        .select(
          `id,nombre,descripcion,imagen_url,precio,disponible,restaurante_id,restaurantes(id,nombre)`
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      const restInfo = Array.isArray(data.restaurantes)
        ? data.restaurantes[0]
        : data.restaurantes;
      setPlatillo({
        ...data,
        restaurante: restInfo
          ? { id: restInfo.id, nombre: restInfo.nombre }
          : null,
      });
    } catch (err) {
      console.error(err);
      setPlatillo(null);
    } finally {
      setLoading(false);
    }
  }

  // Lógica para agregar al carrito
  async function agregarAlCarrito() {
    if (!usuario) {
      navigate("/login");
      return;
    }

    if (!platillo) return;

    setAgregando(true);
    try {
      const userId = (usuario as any).id;
      const restauranteId = platillo.restaurante?.id ?? platillo.restaurante_id;

      // Verificar si ya existe el item en el carrito
      const { data: existente, error: selErr } = await supabase
        .from("carrito")
        .select("id,cantidad")
        .eq("usuario_id", userId)
        .eq("platillo_id", platillo.id)
        .maybeSingle();

      if (selErr) throw selErr;

      if (existente) {
        const nuevaCantidad = (existente.cantidad || 0) + quantity;
        const { error: updErr } = await supabase
          .from("carrito")
          .update({ cantidad: nuevaCantidad, notas: notes || null })
          .eq("id", existente.id);
        if (updErr) throw updErr;
      } else {
        const payload = {
          usuario_id: userId,
          platillo_id: platillo.id,
          cantidad: quantity,
          notas: notes || null,
          precio_unitario: platillo.precio ?? 0,
          restaurante_id: restauranteId,
        };

        const { error: insErr } = await supabase
          .from("carrito")
          .insert(payload);
        if (insErr) throw insErr;
      }

      navigate("/carrito");
    } catch (err: any) {
      console.error("Error agregarAlCarrito:", err);
      alert(err?.message || "No se pudo agregar al carrito. Intenta de nuevo.");
    } finally {
      setAgregando(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!platillo) return <NotFound navigate={navigate} />;

  return (
    <div
      className="detalle-page"
      style={{ minHeight: "100vh", background: "#fff", paddingBottom: 120 }}
    >
      {/* Botón Volver Flotante */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          cursor: "pointer",
          fontSize: 20,
        }}
      >
        ←
      </button>

      {/* Hero Image */}
      <div
        style={{
          width: "100%",
          height: 300,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={platillo.imagen_url || "/placeholder.png"}
          alt={platillo.nombre}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px" }}>
        {/* Encabezado */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                margin: 0,
                color: "#111827",
              }}
            >
              {platillo.nombre}
            </h1>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#059669" }}>
              ${(platillo.precio || 0).toFixed(2)}
            </div>
          </div>

          {platillo.restaurante && (
            <p
              onClick={() =>
                navigate(`/restaurante/${platillo.restaurante?.id}`)
              }
              style={{
                color: "#4f46e5",
                fontWeight: 600,
                marginTop: 4,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              📍 {platillo.restaurante.nombre}
            </p>
          )}

          <p
            style={{
              color: "#4b5563",
              lineHeight: "1.6",
              marginTop: 16,
              fontSize: 16,
            }}
          >
            {platillo.descripcion || "Sin descripción disponible."}
          </p>
        </div>

        <hr style={{ border: "0.5px solid #f3f4f6", margin: "24px 0" }} />

        {/* Sección de Notas */}
        <div style={{ marginBottom: 32 }}>
          <label
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: 12,
              fontSize: 15,
            }}
          >
            Instrucciones especiales
          </label>
          <textarea
            placeholder="Ej. Quitar cebolla, salsa aparte..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="notes"
          />
        </div>

        {/* Selector de Cantidad Central */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 24,
            marginBottom: 40,
          }}
        >
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            style={qtyBtnStyle}
            className="qty-btn"
          >
            −
          </button>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              minWidth: 20,
              textAlign: "center",
            }}
          >
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            style={qtyBtnStyle}
            className="qty-btn"
          >
            +
          </button>
        </div>
      </div>

      {/* Barra de Acción Inferior */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          padding: "20px",
          borderTop: "1px solid #f3f4f6",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button
            onClick={agregarAlCarrito}
            disabled={!platillo.disponible || agregando}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: 14,
              border: "none",
              background: platillo.disponible ? "#111827" : "#9ca3af",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: platillo.disponible ? "pointer" : "not-allowed",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{agregando ? "Agregando..." : "Añadir al carrito"}</span>
            <span style={{ opacity: 0.9 }}>
              ${((platillo.precio || 0) * quantity).toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Estilos Reutilizables
const qtyBtnStyle = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontSize: 24,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
};

// Componentes Auxiliares
function LoadingScreen() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        className="spinner"
        style={{
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #4f46e5",
          borderRadius: "50%",
          width: 40,
          height: 40,
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function NotFound({ navigate }: { navigate: any }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: 24, marginBottom: 8 }}>Platillo no encontrado</h2>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Lo sentimos, no pudimos encontrar lo que buscabas.
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: "12px 24px",
          background: "#4f46e5",
          color: "#fff",
          borderRadius: 12,
          border: "none",
          fontWeight: 600,
        }}
      >
        Volver atrás
      </button>
    </div>
  );
}
