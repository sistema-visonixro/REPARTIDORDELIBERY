import { supabase } from "../lib/supabase";
import type {
  Restaurante,
  CrearRestaurante,
  ActualizarRestaurante,
  Platillo,
  CrearPlatillo,
  ActualizarPlatillo,
  Bebida,
  CrearBebida,
  PedidoRestaurante,
} from "../types/restaurante.types";

// =====================================================
// GESTIÓN DE RESTAURANTES
// =====================================================

export const obtenerRestaurantePorId = async (
  id: string
): Promise<Restaurante | null> => {
  try {
    const { data, error } = await supabase
      .from("restaurantes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener restaurante:", error);
      return null;
    }

    return data as Restaurante;
  } catch (error) {
    console.error("Error al obtener restaurante:", error);
    return null;
  }
};

// Obtener restaurante por usuario_id (si el restaurante fue creado asociado al usuario)
export const obtenerRestaurantePorUsuario = async (
  usuarioId: string
): Promise<Restaurante | null> => {
  try {
    const { data, error } = await supabase
      .from("restaurantes")
      .select("*")
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener restaurante por usuario:", error);
      return null;
    }

    return data as Restaurante | null;
  } catch (error) {
    console.error("Error al obtener restaurante por usuario:", error);
    return null;
  }
};

export const crearRestaurante = async (
  restaurante: CrearRestaurante,
  usuarioId?: string
): Promise<Restaurante | null> => {
  try {
    const payload: any = { ...restaurante };
    if (usuarioId) payload.usuario_id = usuarioId;

    const { data, error } = await supabase
      .from("restaurantes")
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error al crear restaurante:", error);
      return null;
    }

    return data as Restaurante;
  } catch (error) {
    console.error("Error al crear restaurante:", error);
    return null;
  }
};

export const actualizarRestaurante = async (
  id: string,
  datos: ActualizarRestaurante
): Promise<Restaurante | null> => {
  try {
    const { data, error } = await supabase
      .from("restaurantes")
      .update({ ...datos, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar restaurante:", error);
      return null;
    }

    return data as Restaurante;
  } catch (error) {
    console.error("Error al actualizar restaurante:", error);
    return null;
  }
};

// =====================================================
// GESTIÓN DE PLATILLOS
// =====================================================

export const obtenerPlatillosPorRestaurante = async (
  restauranteId: string
): Promise<Platillo[]> => {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .order("nombre");

    if (error) {
      console.error("Error al obtener platillos:", error);
      return [];
    }

    return data as Platillo[];
  } catch (error) {
    console.error("Error al obtener platillos:", error);
    return [];
  }
};

export const crearPlatillo = async (
  platillo: CrearPlatillo
): Promise<Platillo | null> => {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .insert([platillo])
      .select()
      .single();

    if (error) {
      console.error("Error al crear platillo:", error);
      return null;
    }

    return data as Platillo;
  } catch (error) {
    console.error("Error al crear platillo:", error);
    return null;
  }
};

export const actualizarPlatillo = async (
  id: string,
  datos: ActualizarPlatillo
): Promise<Platillo | null> => {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .update({ ...datos, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar platillo:", error);
      return null;
    }

    return data as Platillo;
  } catch (error) {
    console.error("Error al actualizar platillo:", error);
    return null;
  }
};

export const eliminarPlatillo = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("platillos").delete().eq("id", id);

    if (error) {
      console.error("Error al eliminar platillo:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error al eliminar platillo:", error);
    return false;
  }
};

// =====================================================
// GESTIÓN DE BEBIDAS
// =====================================================

export const obtenerBebidasPorRestaurante = async (
  restauranteId: string
): Promise<Bebida[]> => {
  try {
    const { data, error } = await supabase
      .from("bebidas")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .order("nombre");

    if (error) {
      console.error("Error al obtener bebidas:", error);
      return [];
    }

    return data as Bebida[];
  } catch (error) {
    console.error("Error al obtener bebidas:", error);
    return [];
  }
};

export const crearBebida = async (
  bebida: CrearBebida
): Promise<Bebida | null> => {
  try {
    const { data, error } = await supabase
      .from("bebidas")
      .insert([bebida])
      .select()
      .single();

    if (error) {
      console.error("Error al crear bebida:", error);
      return null;
    }

    return data as Bebida;
  } catch (error) {
    console.error("Error al crear bebida:", error);
    return null;
  }
};

export const actualizarBebida = async (
  id: string,
  datos: Partial<CrearBebida>
): Promise<Bebida | null> => {
  try {
    const { data, error } = await supabase
      .from("bebidas")
      .update({ ...datos, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar bebida:", error);
      return null;
    }

    return data as Bebida;
  } catch (error) {
    console.error("Error al actualizar bebida:", error);
    return null;
  }
};

export const eliminarBebida = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("bebidas").delete().eq("id", id);

    if (error) {
      console.error("Error al eliminar bebida:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error al eliminar bebida:", error);
    return false;
  }
};

// =====================================================
// GESTIÓN DE PEDIDOS DEL RESTAURANTE
// =====================================================

export const obtenerPedidosRestaurante = async (
  restauranteId: string,
  estado?: string
): Promise<PedidoRestaurante[]> => {
  try {
    let query = supabase
      .from("pedidos")
      .select(`
        *,
        usuarios:usuario_id (
          nombre,
          telefono
        )
      `)
      .eq("restaurante_id", restauranteId)
      .order("creado_en", { ascending: false });

    if (estado) {
      query = query.eq("estado", estado);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener pedidos:", error);
      return [];
    }

    return data.map((pedido: any) => ({
      ...pedido,
      cliente_nombre: pedido.usuarios?.nombre,
      cliente_telefono: pedido.usuarios?.telefono,
    })) as PedidoRestaurante[];
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    return [];
  }
};

export const obtenerDetallePedido = async (pedidoId: string) => {
  try {
    const { data, error } = await supabase
      .from("detalle_pedidos")
      .select(`
        *,
        platillos (nombre),
        bebidas (nombre)
      `)
      .eq("pedido_id", pedidoId);

    if (error) {
      console.error("Error al obtener detalles del pedido:", error);
      return [];
    }

    return data.map((detalle: any) => ({
      ...detalle,
      platillo_nombre: detalle.platillos?.nombre,
      bebida_nombre: detalle.bebidas?.nombre,
    }));
  } catch (error) {
    console.error("Error al obtener detalles del pedido:", error);
    return [];
  }
};

export const actualizarEstadoPedido = async (
  pedidoId: string,
  nuevoEstado: string
): Promise<boolean> => {
  try {
    const updates: any = {
      estado: nuevoEstado,
      actualizado_en: new Date().toISOString(),
    };

    // Actualizar timestamps según el estado
    if (nuevoEstado === "confirmado") {
      updates.confirmado_en = new Date().toISOString();
    }

    const { error } = await supabase
      .from("pedidos")
      .update(updates)
      .eq("id", pedidoId);

    if (error) {
      console.error("Error al actualizar estado del pedido:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    return false;
  }
};

// =====================================================
// SUSCRIPCIÓN TIEMPO REAL PEDIDOS RESTAURANTE
// =====================================================

export const suscribirsePedidosRestaurante = (
  restauranteId: string,
  callback: (pedidos: PedidoRestaurante[]) => void
) => {
  const channel = supabase
    .channel(`pedidos_restaurante_${restauranteId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pedidos",
        filter: `restaurante_id=eq.${restauranteId}`,
      },
      async () => {
        const pedidos = await obtenerPedidosRestaurante(restauranteId);
        callback(pedidos);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
