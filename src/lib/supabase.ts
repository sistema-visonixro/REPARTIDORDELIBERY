import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jqhiubituqmwouaszjpc.supabase.co";
const supabaseAnonKey = "sb_publishable_yk9cpugGvHpx_0Ys8hKEsw_h8NH14CR";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  tipo_usuario: "cliente" | "repartidor" | "restaurante" | "operador" | "admin";
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export const loginUsuario = async (
  email: string,
  password: string
): Promise<Usuario | null> => {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .eq("activo", true)
      .single();

    if (error || !data) {
      console.error("Error al iniciar sesión:", error);
      return null;
    }

    return data as Usuario;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return null;
  }
};

export const loginRepartidor = async (
  codigo: string,
  clave: string
): Promise<Usuario | null> => {
  try {
    const { data, error } = await supabase
      .from("repartidores")
      .select("*")
      .eq("codigo", codigo)
      .eq("clave", clave)
      .single();

    if (error || !data) {
      console.error("Error al iniciar sesión repartidor:", error);
      return null;
    }

    const repartidor: any = data;

    const usuario: Usuario = {
      id: repartidor.id,
      email: "",
      nombre: repartidor.nombre_completo || "",
      telefono: repartidor.telefono || undefined,
      direccion: undefined,
      tipo_usuario: "repartidor",
      activo: repartidor.estado !== "inactivo",
      created_at: repartidor.creado_en || new Date().toISOString(),
      updated_at: repartidor.actualizado_en || new Date().toISOString(),
    };

    return usuario;
  } catch (error) {
    console.error("Error al iniciar sesión repartidor:", error);
    return null;
  }
};
