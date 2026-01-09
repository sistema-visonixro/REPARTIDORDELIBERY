import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio?: number;
  disponible?: boolean;
  restaurante_id?: string;
  restaurante?: { id: string; nombre: string } | null;
}

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

      if (error) {
        console.error("Error cargando platillo:", error);
        setPlatillo(null);
      } else if (data) {
        const restInfo = Array.isArray(data.restaurantes)
          ? data.restaurantes[0]
          : data.restaurantes;
        const mapped = {
          id: data.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          imagen_url: data.imagen_url,
          precio: data.precio,
          disponible: data.disponible,
          restaurante_id: data.restaurante_id,
          restaurante: restInfo
            ? { id: restInfo.id, nombre: restInfo.nombre }
            : null,
        };
        setPlatillo(mapped);
      }
    } catch (err) {
      console.error(err);
      setPlatillo(null);
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
          <p style={{ color: "#6b7280", marginTop: 12 }}>
            Cargando platillo...
          </p>
        </div>
      </div>
    );
  }

  if (!platillo) {
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
        <div style={{ fontSize: 48 }}>😕</div>
        <p style={{ color: "#6b7280" }}>Platillo no encontrado</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "#4f46e5",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Volver
        </button>
      </div>
    );
  }

  const agregarAlCarrito = async () => {
    if (!platillo?.disponible || !usuario?.id || !platillo.restaurante_id)
      return;

    setAgregando(true);
    try {
      // Primero verificar si el platillo ya existe en el carrito
      const { data: itemExistente } = await supabase
        .from("carrito")
        .select("*")
        .eq("usuario_id", usuario.id)
        .eq("platillo_id", platillo.id)
        .maybeSingle(); // Usar maybeSingle() en lugar de single()

      if (itemExistente) {
        // Si ya existe, actualizar la cantidad
        const { error: updateError } = await supabase
          .from("carrito")
          .update({
            cantidad: itemExistente.cantidad + quantity,
            notas: notes || itemExistente.notas,
          })
          .eq("id", itemExistente.id);

        if (updateError) throw updateError;

        alert(
          `✅ Cantidad actualizada en el carrito (${
            itemExistente.cantidad + quantity
          })`
        );
        const irAlCarrito = window.confirm("¿Quieres ir al carrito?");
        if (irAlCarrito) {
          navigate("/carrito");
        }
        return;
      }

      // Verificar si hay items de otro restaurante en el carrito
      const { data: carritoActual } = await supabase
        .from("carrito")
        .select("restaurante_id")
        .eq("usuario_id", usuario.id)
        .limit(1)
        .maybeSingle(); // Usar maybeSingle() en lugar de single()

      if (
        carritoActual &&
        carritoActual.restaurante_id !== platillo.restaurante_id
      ) {
        const confirmar = window.confirm(
          "Ya tienes items de otro restaurante en tu carrito. ¿Deseas vaciar el carrito y agregar este item?"
        );
        if (!confirmar) {
          setAgregando(false);
          return;
        }

        // Limpiar carrito
        await supabase.from("carrito").delete().eq("usuario_id", usuario.id);
      }

      // Insertar nuevo item
      const { error } = await supabase.from("carrito").insert({
        usuario_id: usuario.id,
        platillo_id: platillo.id,
        restaurante_id: platillo.restaurante_id,
        cantidad: quantity,
        precio_unitario: platillo.precio || 0,
        notas: notes || null,
      });

      if (error) throw error;

      alert("✅ Agregado al carrito");
      const irAlCarrito = window.confirm("¿Quieres ir al carrito?");
      if (irAlCarrito) {
        navigate("/carrito");
      }
    } catch (error: any) {
      console.error("Error al agregar al carrito:", error);
      alert(error.message || "Error al agregar al carrito");
    } finally {
      setAgregando(false);
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "#fafafa", paddingBottom: 80 }}
    >
      <div
        style={{
          background: "#fff",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          maxWidth: 700,
          margin: "16px auto",
          borderRadius: 12,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 18,
            cursor: "pointer",
            padding: 0,
            marginBottom: 8,
          }}
        >
          ← Volver
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {platillo.nombre}
            </h1>
            {platillo.descripcion && (
              <p style={{ margin: "8px 0 0 0", color: "#6b7280" }}>
                {platillo.descripcion}
              </p>
            )}
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>
                ${(platillo.precio || 0).toFixed(2)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: "none",
                    background: "#f3f4f6",
                    cursor: "pointer",
                  }}
                >
                  −
                </button>
                <div
                  style={{ minWidth: 30, textAlign: "center", fontWeight: 700 }}
                >
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: "none",
                    background: "#f3f4f6",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: platillo.disponible ? "#374151" : "#dc2626",
                }}
              >
                {platillo.disponible ? "Disponible" : "No disponible"}
              </div>
            </div>
          </div>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 12,
              overflow: "hidden",
              flex: "0 0 120px",
            }}
          >
            <img
              src={platillo.imagen_url || "/placeholder.png"}
              alt={platillo.nombre}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
          {platillo.restaurante && (
            <button
              onClick={() =>
                navigate(`/restaurante/${platillo.restaurante?.id}`)
              }
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Ver restaurante
            </button>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flex: "1 1 auto",
            }}
          >
            <textarea
              placeholder="Instrucciones especiales (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                minHeight: 56,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                resize: "vertical",
              }}
            />
          </div>
        </div>
      </div>

      {/* Sticky add-to-cart bar above BottomNav */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 100,
          display: "flex",
          justifyContent: "center",
          zIndex: 120,
        }}
      >
        <div style={{ maxWidth: 700, width: "100%", padding: "10px 16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              background: "#fff",
              borderRadius: 12,
              padding: 12,
              boxShadow: "0 6px 20px rgba(2,6,23,0.06)",
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>Total</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                ${((platillo.precio || 0) * quantity).toFixed(2)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={agregarAlCarrito}
                disabled={!platillo.disponible || agregando}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    platillo.disponible && !agregando ? "#059669" : "#9ca3af",
                  color: "#fff",
                  cursor:
                    platillo.disponible && !agregando
                      ? "pointer"
                      : "not-allowed",
                  fontWeight: 700,
                }}
              >
                {agregando
                  ? "⏳ Agregando..."
                  : `🛒 Añadir ${quantity > 1 ? `(${quantity})` : ""}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
