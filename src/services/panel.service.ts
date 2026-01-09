import { supabase } from "../lib/supabase";
import type {
  PanelRepartidor,
  PanelRestaurante,
  PanelOperador,
  PanelAdmin,
} from "../types/panel.types";

// =====================================================
// OBTENER PANEL REPARTIDOR
// =====================================================
export const obtenerPanelRepartidor = async (
  usuarioId: string
): Promise<PanelRepartidor | null> => {
  try {
    const { data, error } = await supabase
      .from("vista_panel_repartidor")
      .select("*")
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener panel repartidor:", error);
      return null;
    }

    return data as PanelRepartidor;
  } catch (error) {
    console.error("Error al obtener panel repartidor:", error);
    return null;
  }
};

// =====================================================
// OBTENER PANEL RESTAURANTE
// =====================================================
export const obtenerPanelRestaurante = async (
  restauranteId: string
): Promise<PanelRestaurante | null> => {
  try {
    const { data, error } = await supabase
      .from("vista_panel_restaurante")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener panel restaurante:", error);
      return null;
    }

    return data as PanelRestaurante;
  } catch (error) {
    console.error("Error al obtener panel restaurante:", error);
    return null;
  }
};

// =====================================================
// OBTENER PANEL OPERADOR
// =====================================================
export const obtenerPanelOperador = async (): Promise<PanelOperador | null> => {
  try {
    const { data, error } = await supabase
      .from("vista_panel_operador")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error al obtener panel operador:", error);
      return null;
    }

    return data as PanelOperador;
  } catch (error) {
    console.error("Error al obtener panel operador:", error);
    return null;
  }
};

// =====================================================
// OBTENER PANEL ADMIN
// =====================================================
export const obtenerPanelAdmin = async (): Promise<PanelAdmin | null> => {
  try {
    const { data, error } = await supabase
      .from("vista_panel_admin")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error al obtener panel admin:", error);
      return null;
    }

    return data as PanelAdmin;
  } catch (error) {
    console.error("Error al obtener panel admin:", error);
    return null;
  }
};

// =====================================================
// SUSCRIPCIÓN TIEMPO REAL PANEL REPARTIDOR
// =====================================================
export const suscribirsePanelRepartidor = (
  usuarioId: string,
  callback: (data: PanelRepartidor | null) => void
) => {
  const channel = supabase
    .channel(`panel_repartidor_${usuarioId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pedidos",
        filter: `repartidor_id=eq.${usuarioId}`,
      },
      async () => {
        const panel = await obtenerPanelRepartidor(usuarioId);
        callback(panel);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "repartidores",
        filter: `usuario_id=eq.${usuarioId}`,
      },
      async () => {
        const panel = await obtenerPanelRepartidor(usuarioId);
        callback(panel);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// =====================================================
// SUSCRIPCIÓN TIEMPO REAL PANEL RESTAURANTE
// =====================================================
export const suscribirsePanelRestaurante = (
  restauranteId: string,
  callback: (data: PanelRestaurante | null) => void
) => {
  const channel = supabase
    .channel(`panel_restaurante_${restauranteId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pedidos",
        filter: `restaurante_id=eq.${restauranteId}`,
      },
      async () => {
        const panel = await obtenerPanelRestaurante(restauranteId);
        callback(panel);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// =====================================================
// SUSCRIPCIÓN TIEMPO REAL PANEL OPERADOR
// =====================================================
export const suscribirsePanelOperador = (
  callback: (data: PanelOperador | null) => void
) => {
  const channel = supabase
    .channel("panel_operador")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pedidos",
      },
      async () => {
        const panel = await obtenerPanelOperador();
        callback(panel);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "repartidores",
      },
      async () => {
        const panel = await obtenerPanelOperador();
        callback(panel);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// =====================================================
// SUSCRIPCIÓN TIEMPO REAL PANEL ADMIN
// =====================================================
export const suscribirsePanelAdmin = (
  callback: (data: PanelAdmin | null) => void
) => {
  const channel = supabase
    .channel("panel_admin")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pedidos",
      },
      async () => {
        const panel = await obtenerPanelAdmin();
        callback(panel);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
