// =====================================================
// SERVICIOS PARA REPARTIDORES
// =====================================================

import { supabase } from "../lib/supabase";
import type {
  Repartidor,
  PedidoRepartidor,
  PedidoDisponible,
  PedidoRealizadoRepartidor,
  Aviso,
} from "../types/repartidor.types";

// =====================================================
// Gestión del Perfil de Repartidor
// =====================================================

export async function obtenerPerfilRepartidor(usuarioId: string) {
  const { data, error } = await supabase
    .from("repartidores")
    .select("*")
    .eq("id", usuarioId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as Repartidor;

  const { data: byUsuario, error: errorByUsuario } = await supabase
    .from("repartidores")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (errorByUsuario) throw errorByUsuario;
  if (!byUsuario) throw new Error("Repartidor no encontrado");
  return byUsuario as Repartidor;
}

export async function actualizarPerfilRepartidor(
  repartidorId: string,
  datos: Partial<Repartidor>,
) {
  const { data, error } = await supabase
    .from("repartidores")
    .update(datos)
    .eq("id", repartidorId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cambiarDisponibilidad(
  usuarioId: string,
  disponible: boolean,
) {
  const { data, error } = await supabase.rpc(
    "cambiar_disponibilidad_repartidor",
    {
      p_usuario_id: usuarioId,
      p_disponible: disponible,
    },
  );

  if (error) throw error;
  return data;
}

// =====================================================
// Gestión de Pedidos
// =====================================================

export async function obtenerPedidosDisponibles() {
  // Obtener pedidos con información del restaurante
  const { data: pedidos, error } = await supabase
    .from("pedidos")
    .select(`
      *,
      restaurantes(nombre, direccion, emoji)
    `)
    .in("estado", ["listo", "confirmado"])
    .is("repartidor_id", null)
    .order("creado_en", { ascending: true });

  if (error) throw error;
  if (!pedidos || pedidos.length === 0) return [];

  console.log("Pedidos disponibles obtenidos:", pedidos);

  // Obtener los IDs únicos de usuarios
  const usuarioIds = [...new Set(pedidos.map((p: any) => p.usuario_id).filter(Boolean))];
  
  console.log("IDs de usuarios a consultar:", usuarioIds);
  
  // Consultar información de usuarios
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre, telefono")
    .in("id", usuarioIds);

  console.log("Usuarios obtenidos:", usuarios);

  // Crear un mapa de usuarios para acceso rápido
  const usuariosMap = new Map();
  (usuarios || []).forEach((u: any) => {
    usuariosMap.set(u.id, u);
  });
  
  // Transformar los datos al formato esperado
  const pedidosDisponibles = pedidos.map((p: any) => {
    const usuario = usuariosMap.get(p.usuario_id);
    console.log(`Pedido ${p.id}: usuario_id=${p.usuario_id}, usuario encontrado:`, usuario);
    return {
      pedido_id: p.id,
      numero_pedido: p.numero_pedido,
      total: p.total,
      estado: p.estado,
      direccion_entrega: p.direccion_entrega,
      latitud: p.latitud,
      longitud: p.longitud,
      creado_en: p.creado_en,
      restaurante_nombre: p.restaurantes?.nombre || "",
      restaurante_direccion: p.restaurantes?.direccion || "",
      restaurante_emoji: p.restaurantes?.emoji || "",
      cliente_nombre: usuario?.nombre || "",
      cliente_telefono: usuario?.telefono || "",
      total_items: 0,
      minutos_desde_creacion: Math.floor((Date.now() - new Date(p.creado_en).getTime()) / 60000),
    };
  });

  console.log("Pedidos disponibles transformados:", pedidosDisponibles);
  return pedidosDisponibles as PedidoDisponible[];
}

export async function obtenerMisPedidos(usuarioId: string) {
  // Obtener pedidos con información del restaurante
  const { data: pedidos, error } = await supabase
    .from("pedidos")
    .select(`
      *,
      restaurantes(nombre, direccion, emoji, telefono)
    `)
    .eq("repartidor_id", usuarioId)
    .in("estado", ["en_camino", "listo"])
    .order("asignado_en", { ascending: true });

  if (error) throw error;
  if (!pedidos || pedidos.length === 0) return [];

  console.log("Mis pedidos obtenidos:", pedidos);

  // Obtener los IDs únicos de usuarios
  const usuarioIds = [...new Set(pedidos.map((p: any) => p.usuario_id).filter(Boolean))];
  
  console.log("IDs de usuarios clientes a consultar:", usuarioIds);
  
  // Consultar información de usuarios
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre, telefono")
    .in("id", usuarioIds);

  console.log("Usuarios clientes obtenidos:", usuarios);

  // Crear un mapa de usuarios para acceso rápido
  const usuariosMap = new Map();
  (usuarios || []).forEach((u: any) => {
    usuariosMap.set(u.id, u);
  });
  
  // Transformar los datos al formato esperado
  const misPedidos = pedidos.map((p: any) => {
    const usuario = usuariosMap.get(p.usuario_id);
    console.log(`Mi pedido ${p.id}: usuario_id=${p.usuario_id}, usuario encontrado:`, usuario);
    return {
      pedido_id: p.id,
      repartidor_id: p.repartidor_id,
      numero_pedido: p.numero_pedido,
      total: p.total,
      estado: p.estado,
      direccion_entrega: p.direccion_entrega,
      latitud: p.latitud,
      longitud: p.longitud,
      notas_cliente: p.notas_cliente,
      creado_en: p.creado_en,
      asignado_en: p.asignado_en,
      restaurante_nombre: p.restaurantes?.nombre || "",
      restaurante_direccion: p.restaurantes?.direccion || "",
      restaurante_emoji: p.restaurantes?.emoji || "",
      restaurante_telefono: p.restaurantes?.telefono || "",
      cliente_email: "",
      cliente_nombre: usuario?.nombre || "",
      cliente_telefono: usuario?.telefono || "",
      total_items: 0,
      minutos_desde_asignacion: p.asignado_en ? Math.floor((Date.now() - new Date(p.asignado_en).getTime()) / 60000) : 0,
    };
  });

  console.log("Mis pedidos transformados:", misPedidos);
  return misPedidos as PedidoRepartidor[];
}

export async function obtenerPedidosRealizadosRepartidor(repartidorId: string) {
  const { data, error } = await supabase
    .from("pedidos_realizados_de_repartidor")
    .select("*")
    .eq("repartidor_id", repartidorId)
    .order("entregado_en", { ascending: false });

  if (error) throw error;
  return data as PedidoRealizadoRepartidor[];
}

export async function tomarPedido(pedidoId: string, repartidorId: string) {
  const { data, error } = await supabase.rpc("asignar_repartidor_pedido", {
    p_pedido_id: pedidoId,
    p_repartidor_id: repartidorId,
  });

  if (error) throw error;
  return data;
}

export async function marcarPedidoEntregado(
  pedidoId: string,
  repartidorId: string,
  costoEnvio?: number,
) {
  try {
    console.log("marcarPedidoEntregado: llamando RPC", {
      pedidoId,
      repartidorId,
    });

    // La función SQL actualiza pedidos y registra en pedidos_realizados_de_repartidor
    // usando costo_envio como ganancia del repartidor (columna total)
    const { data, error } = await supabase.rpc("marcar_pedido_entregado", {
      p_pedido_id: pedidoId,
      p_repartidor_id: repartidorId,
    });

    if (error) {
      console.error("marcarPedidoEntregado: error RPC", error);
      throw error;
    }

    // Actualizar la columna total con el valor de costo_envio (ganancia del repartidor)
    if (costoEnvio !== undefined) {
      await supabase
        .from("pedidos_realizados_de_repartidor")
        .update({ total: costoEnvio })
        .eq("pedido_id", pedidoId);
    }

    console.log("marcarPedidoEntregado: resultado", data);
    return data;
  } catch (err) {
    console.error("marcarPedidoEntregado: excepción", err);
    throw err;
  }
}

// =====================================================
// Tracking de Ubicación
// =====================================================

export async function actualizarUbicacion(
  repartidorId: string,
  latitud: number,
  longitud: number,
  pedidoId?: string,
  velocidad?: number,
  precision?: number,
) {
  const { data, error } = await supabase.rpc(
    "actualizar_ubicacion_repartidor",
    {
      p_repartidor_id: repartidorId,
      p_latitud: latitud,
      p_longitud: longitud,
      p_pedido_id: pedidoId || null,
      p_velocidad: velocidad || null,
      p_precision: precision || null,
    },
  );

  if (error) throw error;
  return data;
}

export async function obtenerUbicacionPedido(pedidoId: string) {
  const { data, error } = await supabase
    .from("vista_ubicacion_actual_pedido")
    .select("*")
    .eq("pedido_id", pedidoId)
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// Hook para Tracking GPS Automático
// =====================================================

export function iniciarTrackingGPS(
  repartidorId: string,
  pedidoId: string,
  intervaloSegundos: number = 60,
): () => void {
  let watchId: number | null = null;
  let intervalId: number | null = null;

  // Usar watchPosition para actualizaciones automáticas del GPS
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await actualizarUbicacion(
            repartidorId,
            position.coords.latitude,
            position.coords.longitude,
            pedidoId,
            position.coords.speed || undefined,
            position.coords.accuracy,
          );
          console.log("Ubicación actualizada:", position.coords);
        } catch (error) {
          console.error("Error al actualizar ubicación:", error);
        }
      },
      (error) => {
        console.error("Error al obtener ubicación:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );

    // También enviar actualizaciones cada X segundos
    intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          await actualizarUbicacion(
            repartidorId,
            position.coords.latitude,
            position.coords.longitude,
            pedidoId,
            position.coords.speed || undefined,
            position.coords.accuracy,
          );
        } catch (error) {
          console.error("Error en actualización periódica:", error);
        }
      });
    }, intervaloSegundos * 1000);
  }

  // Retornar función para detener el tracking
  return () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  };
}

// =====================================================
// Estadísticas
// =====================================================

export async function obtenerEstadisticasRepartidor(usuarioId: string) {
  const { data, error } = await supabase
    .from("vista_estadisticas_repartidor")
    .select("*")
    .eq("usuario_id", usuarioId)
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// Notificaciones
// =====================================================

export async function obtenerNotificaciones(usuarioId: string) {
  const { data, error } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

export async function marcarNotificacionesLeidas(usuarioId: string) {
  const { data, error } = await supabase.rpc("marcar_notificaciones_leidas", {
    p_usuario_id: usuarioId,
  });

  if (error) throw error;
  return data;
}

// =====================================================
// Avisos
// =====================================================

export async function obtenerAvisos() {
  const { data, error } = await supabase
    .from("avisos")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) throw error;
  return data as Aviso[];
}

// =====================================================
// Suscripciones en Tiempo Real
// =====================================================

export function suscribirseAPedidosDisponibles(
  callback: (pedidos: PedidoDisponible[]) => void,
) {
  const channel = supabase
    .channel("pedidos-disponibles")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pedidos",
        filter: "estado=in.(listo,confirmado)",
      },
      async () => {
        const pedidos = await obtenerPedidosDisponibles();
        callback(pedidos);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function suscribirseAMisPedidos(
  usuarioId: string,
  callback: (pedidos: PedidoRepartidor[]) => void,
) {
  const channel = supabase
    .channel("mis-pedidos-repartidor")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pedidos",
        filter: `repartidor_id=eq.${usuarioId}`,
      },
      async () => {
        const pedidos = await obtenerMisPedidos(usuarioId);
        callback(pedidos);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
