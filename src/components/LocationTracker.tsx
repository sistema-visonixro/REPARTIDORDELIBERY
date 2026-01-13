import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Envía la ubicación del repartidor a la tabla `ubicacion_real` cada 20 segundos
export default function LocationTracker() {
  const { usuario } = useAuth();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!usuario || usuario.tipo_usuario !== "repartidor") return;

    let mounted = true;

    const sendPosition = async (position: GeolocationPosition) => {
      try {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speed = position.coords.speed ?? null;
        const accuracy = position.coords.accuracy ?? null;
        const heading = position.coords.heading ?? null;

        // Usar upsert con onConflict para evitar error 409 cuando ya existe una fila por usuario
        const payload = {
          usuario_id: usuario.id,
          latitud: lat,
          longitud: lng,
          velocidad: speed,
          precision_metros: accuracy ? Math.round(accuracy) : null,
          heading: heading,
          actualizado_en: new Date().toISOString(),
        } as any;

        const { error } = await supabase
          .from("ubicacion_real")
          .upsert(payload as any, { onConflict: "usuario_id" });

        if (error) {
          console.error("Error enviando ubicación (upsert):", error);
        }
      } catch (err) {
        console.error("Error enviando ubicación:", err);
      }
    };

    const requestAndSend = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mounted) return;
          sendPosition(pos);
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    };

    // enviar inmediatamente y luego cada 20s
    requestAndSend();
    intervalRef.current = window.setInterval(requestAndSend, 20_000);

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current as number);
      }
    };
  }, [usuario]);

  return null;
}
