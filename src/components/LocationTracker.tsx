import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Envía la ubicación del repartidor a la tabla `ubicacion_real` cada 5 segundos
export default function LocationTracker() {
  const { usuario } = useAuth();
  const intervalRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const lastGoodAccuracyRef = useRef<number | null>(null);

  useEffect(() => {
    if (!usuario || usuario.tipo_usuario !== "repartidor") return;

    let mounted = true;
    const SEND_INTERVAL_MS = 5_000;

    const sendPosition = async (
      position: GeolocationPosition,
      forceUpdate = false,
    ) => {
      try {
        const now = Date.now();

        // Solo verificar el intervalo si no es una actualización forzada
        if (!forceUpdate && now - lastSentAtRef.current < SEND_INTERVAL_MS) {
          return;
        }

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speed = position.coords.speed ?? null;
        const accuracy = position.coords.accuracy ?? null;
        const heading = position.coords.heading ?? null;

        // Evitar degradar la posición con lecturas extremadamente imprecisas
        if (
          accuracy &&
          accuracy > 120 &&
          lastGoodAccuracyRef.current !== null &&
          !forceUpdate
        ) {
          return;
        }

        if (accuracy && accuracy <= 50) {
          lastGoodAccuracyRef.current = accuracy;
        }

        // Usar upsert con onConflict para evitar error 409 cuando ya existe una fila por usuario
        const payload = {
          usuario_id: usuario.id,
          latitud: lat,
          longitud: lng,
          velocidad: speed,
          // La columna `precision_metros` es INTEGER en la BD; enviar entero
          precision_metros: accuracy != null ? Math.round(accuracy) : null,
          heading: heading,
          actualizado_en: new Date().toISOString(),
        } as any;

        const { error } = await supabase
          .from("ubicacion_real")
          .upsert(payload as any, { onConflict: "usuario_id" });

        if (error) {
          console.error("Error enviando ubicación (upsert):", error);
          return;
        }

        lastSentAtRef.current = now;
        console.log("✅ Ubicación actualizada correctamente");
      } catch (err) {
        console.error("Error enviando ubicación:", err);
      }
    };

    const requestAndSend = (forceUpdate = false) => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mounted) return;
          sendPosition(pos, forceUpdate);
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        },
      );
    };

    const startWatch = () => {
      if (!navigator.geolocation) return;

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (!mounted) return;
          sendPosition(pos);
        },
        (err) => {
          console.warn("Geolocation watch error:", err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        },
      );
    };

    // Enviar inmediatamente, escuchar cambios y reforzar envío cada 5s
    requestAndSend(true); // Forzar el primer envío
    startWatch();
    intervalRef.current = window.setInterval(() => {
      requestAndSend(true); // Forzar actualización cada 5 segundos
    }, SEND_INTERVAL_MS);

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current as number);
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [usuario]);

  return null;
}
